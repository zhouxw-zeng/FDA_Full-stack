import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.useWebSocketAdapter(new IoAdapter(app));
  const configService = app.get(ConfigService);

  app.setGlobalPrefix('api');
  const localFileRoot = configService.get<string>('LOCAL_FILE_ROOT', 'E:\\ZXW\\local_file');
  const localFileUrlPrefix =
    configService.get<string>('LOCAL_FILE_URL_PREFIX', '/local-files').replace(/\/+$/, '') ||
    '/local-files';
  app.useStaticAssets(localFileRoot, {
    prefix: `${localFileUrlPrefix}/`,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  const corsOrigin = configService.get<string>('CORS_ORIGIN', 'http://localhost:5173');
  app.enableCors({
    origin: corsOrigin
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
    credentials: true,
  });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Full-stack FDE API')
    .setDescription('NestJS + MySQL API。成功响应统一为 { code: 0, message: "ok", data: ... }。')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('public / system', '公共接口 / 系统')
    .addTag('public / auth', '公共接口 / 认证')
    .addTag('admin / users', '管理后台 / 用户管理')
    .addTag('admin / roles', '管理后台 / 角色管理')
    .addTag('admin / routes', '管理后台 / 路由管理')
    .addTag('admin / ads', '管理后台 / 广告管理')
    .addTag('admin / ai-models', '管理后台 / AI 模型')
    .addTag('admin / ai-skills', '管理后台 / AI Skills')
    .addTag('admin / ai-usage', '管理后台 / AI 用量')
    .addTag('admin / ai-quota', '管理后台 / AI 额度')
    .addTag('admin / files', '管理后台 / 文件管理')
    .addTag('admin / forum-dynamic-types', '管理后台 / 动态类型')
    .addTag('admin / forum-change-logs', '管理后台 / 变更记录')
    .addTag('mobile / customers', '移动端 / C 端用户')
    .addTag('mobile / auth', '移动端 / 认证')
    .addTag('mobile / forum', '移动端 / 论坛动态')
    .addTag('mobile / ai-chat', '移动端 / AI 问答')
    .build();
  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  (swaggerDocument as unknown as Record<string, unknown>)['x-tagGroups'] = [
    {
      name: '公共接口（public）',
      tags: ['public / system', 'public / auth'],
    },
    {
      name: '管理后台（admin）',
      tags: [
        'admin / users',
        'admin / roles',
        'admin / routes',
        'admin / ads',
        'admin / ai-models',
        'admin / ai-skills',
        'admin / ai-usage',
        'admin / ai-quota',
        'admin / files',
        'admin / forum-dynamic-types',
        'admin / forum-change-logs',
      ],
    },
    {
      name: '移动端（mobile）',
      tags: ['mobile / auth', 'mobile / customers', 'mobile / forum', 'mobile / ai-chat'],
    },
  ];
  SwaggerModule.setup('swagger/docs', app, swaggerDocument);

  const port = configService.get<number>('PORT', 3000);
  await app.listen(port);
  console.log(`API is running at http://localhost:${port}`);
  console.log(`Swagger is running at http://localhost:${port}/swagger/docs`);
}

void bootstrap();
