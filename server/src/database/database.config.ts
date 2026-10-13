import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

function toBoolean(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) {
    return fallback;
  }

  return value.toLowerCase() === 'true';
}

export function createDatabaseConfig(configService: ConfigService): TypeOrmModuleOptions {
  return {
    type: 'mysql',
    host: configService.get<string>('DB_HOST', '127.0.0.1'),
    port: Number(configService.get<string>('DB_PORT', '3306')),
    username: configService.getOrThrow<string>('DB_USERNAME'),
    password: configService.getOrThrow<string>('DB_PASSWORD'),
    database: configService.getOrThrow<string>('DB_DATABASE'),
    charset: 'utf8mb4',
    timezone: configService.get<string>('DB_TIMEZONE', '+08:00'),
    autoLoadEntities: true,
    synchronize: toBoolean(configService.get<string>('DB_SYNCHRONIZE'), true),
    logging: toBoolean(configService.get<string>('DB_LOGGING'), false),
    retryAttempts: 3,
    retryDelay: 3000,
  };
}
