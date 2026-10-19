import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomerUser } from '../customers/entities/customer-user.entity';
import { ForumDynamic } from '../forum/entities/forum-dynamic.entity';
import { ForumModule } from '../forum/forum.module';
import { MobileAuthModule } from '../mobile-auth/mobile-auth.module';
import { CustomerImGateway } from './customer-im.gateway';
import { CustomerFollow } from './entities/customer-follow.entity';
import { CustomerMessage } from './entities/customer-message.entity';
import { SocialController } from './social.controller';
import { SocialService } from './social.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([CustomerUser, CustomerFollow, CustomerMessage, ForumDynamic]),
    ForumModule,
    MobileAuthModule,
  ],
  controllers: [SocialController],
  providers: [SocialService, CustomerImGateway],
  exports: [SocialService],
})
export class SocialModule {}
