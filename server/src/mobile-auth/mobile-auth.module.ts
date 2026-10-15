import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomerUser } from '../customers/entities/customer-user.entity';
import { FilesModule } from '../files/files.module';
import { CustomerAuthToken } from './entities/customer-auth-token.entity';
import { MobileAuthGuard } from './guards/mobile-auth.guard';
import { MobileAuthController } from './mobile-auth.controller';
import { MobileAuthService } from './mobile-auth.service';
import { MobileFilesController } from './mobile-files.controller';
import { MobileTokenService } from './mobile-token.service';

@Module({
  imports: [TypeOrmModule.forFeature([CustomerUser, CustomerAuthToken]), FilesModule],
  controllers: [MobileAuthController, MobileFilesController],
  providers: [MobileAuthService, MobileTokenService, MobileAuthGuard],
  exports: [MobileTokenService, MobileAuthGuard],
})
export class MobileAuthModule {}
