import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
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
    .build();
  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, swaggerDocument);

  const port = configService.get<number>('PORT', 3000);
  await app.listen(port);
  console.log(`API is running at http://localhost:${port}/api`);
  console.log(`Swagger is running at http://localhost:${port}/api/docs`);
}

void bootstrap();
