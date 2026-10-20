const fs = require('node:fs');
const path = require('node:path');
const mysql = require('mysql2/promise');

const serverRoot = path.resolve(__dirname, '..');
const schemaPath = path.join(serverRoot, 'sql', 'schema.sql');

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex <= 0) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`缺少数据库环境变量 ${name}`);
  }
  return value;
}

function validateSchema(sql) {
  const forbidden = /(?:^|;)\s*(ALTER|CREATE\s+DATABASE|DELETE|DROP|INSERT|REPLACE|TRUNCATE|UPDATE)\b/i;
  if (forbidden.test(sql)) {
    throw new Error('schema.sql 包含非建表语句，已拒绝执行');
  }

  if (!/\bCREATE\s+TABLE\b/i.test(sql)) {
    throw new Error('schema.sql 未找到 CREATE TABLE 语句');
  }
}

async function main() {
  const nodeEnv = process.env.NODE_ENV || 'development';
  loadEnvFile(path.join(serverRoot, `.env.${nodeEnv}`));
  loadEnvFile(path.join(serverRoot, '.env'));

  const database = requireEnv('DB_DATABASE');
  if (!/^[A-Za-z0-9_]+$/.test(database)) {
    throw new Error('DB_DATABASE 只能包含字母、数字和下划线');
  }

  if (!fs.existsSync(schemaPath)) {
    throw new Error(`未找到 schema 文件：${schemaPath}`);
  }

  const schema = fs.readFileSync(schemaPath, 'utf8');
  validateSchema(schema);
  const createOnlySchema = schema.replace(
    /\bCREATE\s+TABLE\s+`/gi,
    'CREATE TABLE IF NOT EXISTS `',
  );
  if (!/\bCREATE TABLE IF NOT EXISTS\b/i.test(createOnlySchema)) {
    throw new Error('schema.sql 未能转换为安全的 IF NOT EXISTS 建表语句');
  }

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    user: requireEnv('DB_USERNAME'),
    password: requireEnv('DB_PASSWORD'),
    charset: 'utf8mb4',
    multipleStatements: true,
  });

  try {
    await connection.query(
      `CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci`,
    );
    await connection.query(`USE \`${database}\``);

    const [beforeRows] = await connection.query('SHOW TABLES');
    const beforeTables = new Set(
      beforeRows.map((row) => Object.values(row)[0]),
    );

    await connection.query(`
      SET NAMES utf8mb4;
      SET FOREIGN_KEY_CHECKS = 0;
      ${createOnlySchema}
      SET FOREIGN_KEY_CHECKS = 1;
    `);

    const [afterRows] = await connection.query('SHOW TABLES');
    const afterTables = new Set(
      afterRows.map((row) => Object.values(row)[0]),
    );
    const createdTables = [...afterTables].filter((table) => !beforeTables.has(table));
    const existingTables = [...afterTables].filter((table) => beforeTables.has(table));

    console.log(`MySQL database: ${database}`);
    console.log(`Existing tables kept: ${existingTables.length}`);
    console.log(`Created tables: ${createdTables.length}`);
    if (createdTables.length > 0) {
      console.log(`New tables: ${createdTables.join(', ')}`);
    }
    console.log('Schema initialization completed. No existing table was altered or deleted.');
  } finally {
    await connection.query('SET FOREIGN_KEY_CHECKS = 1').catch(() => undefined);
    await connection.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
