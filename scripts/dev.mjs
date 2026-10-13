/**
 * 启动前端管理后台。
 *
 * 后端由 admin/webpack.config.cjs 中的 BackendDevServerPlugin 在端口检查后启动，
 * 避免根脚本和 Webpack 同时启动后端产生端口竞争。
 */
import { spawn } from 'node:child_process';
import process from 'node:process';

const isWindows = process.platform === 'win32';

const TARGETS = [
  {
    name: 'admin',
    color: '\u001b[36m',
    command: 'pnpm -C admin dev',
  },
];

const children = [];
const buffers = Object.fromEntries(TARGETS.map((target) => [target.name, '']));

let exiting = false;

function writeLines(target, chunk) {
  buffers[target.name] += chunk.toString();
  const lines = buffers[target.name].split(/\r?\n/);
  buffers[target.name] = lines.pop() ?? '';

  for (const line of lines) {
    if (line.trim().length > 0) {
      process.stdout.write(`${target.color}[${target.name}]\u001b[0m ${line}\n`);
    }
  }
}

/** Windows 下子进程往往还会再派生进程，需要连同进程树一起结束 */
function killTree(child) {
  if (child.exitCode !== null || child.signalCode !== null) {
    return;
  }
  if (isWindows) {
    spawn('taskkill', ['/pid', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
    return;
  }
  child.kill('SIGTERM');
}

function shutdown(code) {
  if (exiting) {
    return;
  }
  exiting = true;
  for (const child of children) {
    killTree(child);
  }
  setTimeout(() => process.exit(code), 300);
}

for (const target of TARGETS) {
  const child = spawn(target.command, {
    shell: true,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  children.push(child);
  child.stdout.on('data', (chunk) => writeLines(target, chunk));
  child.stderr.on('data', (chunk) => writeLines(target, chunk));

  child.on('error', (error) => {
    process.stderr.write(`\n[${target.name}] 启动失败：${error.message}\n`);
    shutdown(1);
  });

  child.on('exit', (code) => {
    if (exiting) {
      return;
    }
    process.stderr.write(`\n[${target.name}] 进程已退出（code ${code ?? 'null'}），停止另一个进程\n`);
    shutdown(code ?? 1);
  });
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));

