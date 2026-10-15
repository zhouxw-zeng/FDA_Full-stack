import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MobileAuthModule } from '../mobile-auth/mobile-auth.module';
import { CustomersController } from './customers.controller';
import { CustomersService } from './customers.service';
import { CustomerUser } from './entities/customer-user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CustomerUser]), MobileAuthModule],
  controllers: [CustomersController],
  providers: [CustomersService],
  exports: [CustomersService],
})
export class CustomersModule {}
