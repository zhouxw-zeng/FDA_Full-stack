import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { AdsModule } from './ads/ads.module';
import { AiModule } from './ai/ai.module';
import { AuthModule } from './auth/auth.module';
import { TokenAuthGuard } from './auth/guards/token-auth.guard';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { CustomersModule } from './customers/customers.module';
import { ForumModule } from './forum/forum.module';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { DatabaseModule } from './database/database.module';
import { FilesModule } from './files/files.module';
import { RolesModule } from './roles/roles.module';
import { RoutesModule } from './routes/routes.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [`.env.${process.env.NODE_ENV ?? 'development'}`, '.env'],
    }),
    DatabaseModule,
    AdsModule,
    AiModule,
    AuthModule,
    CustomersModule,
    ForumModule,
    FilesModule,
    RolesModule,
    RoutesModule,
    UsersModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    {
      provide: APP_GUARD,
      useExisting: TokenAuthGuard,
    },
  ],
})
export class AppModule {}
