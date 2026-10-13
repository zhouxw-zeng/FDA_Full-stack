import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminUser } from '../users/entities/admin-user.entity';
import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthToken } from './entities/auth-token.entity';
import { TokenAuthGuard } from './guards/token-auth.guard';
import { TokenService } from './services/token.service';

@Module({
  imports: [TypeOrmModule.forFeature([AuthToken, AdminUser]), UsersModule],
  controllers: [AuthController],
  providers: [AuthService, TokenService, TokenAuthGuard],
  exports: [TokenService, TokenAuthGuard],
})
export class AuthModule {}
