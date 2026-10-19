import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomerUser } from '../customers/entities/customer-user.entity';
import { AuthModule } from '../auth/auth.module';
import { MobileAuthModule } from '../mobile-auth/mobile-auth.module';
import { ForumChangeLog } from './entities/forum-change-log.entity';
import { ForumActivityNotification } from './entities/forum-activity-notification.entity';
import { ForumComment } from './entities/forum-comment.entity';
import { ForumDynamicFavorite } from './entities/forum-dynamic-favorite.entity';
import { ForumDynamicLike } from './entities/forum-dynamic-like.entity';
import { ForumDynamicShareEvent } from './entities/forum-dynamic-share-event.entity';
import { ForumDynamicType } from './entities/forum-dynamic-type.entity';
import { ForumDynamic } from './entities/forum-dynamic.entity';
import { ForumInteractionEvent } from './entities/forum-interaction-event.entity';
import { ForumCommentsService } from './forum-comments.service';
import { ForumInteractionsService } from './forum-interactions.service';
import { ForumChangeLogsController } from './forum-change-logs.controller';
import { ForumChangeLogsService } from './forum-change-logs.service';
import { ForumAdminController } from './forum-admin.controller';
import { ForumDynamicTypesController } from './forum-dynamic-types.controller';
import { ForumDynamicTypesService } from './forum-dynamic-types.service';
import { ForumController } from './forum.controller';
import { ForumNotificationsController } from './forum-notifications.controller';
import { ForumNotificationsGateway } from './forum-notifications.gateway';
import { ForumNotificationsService } from './forum-notifications.service';
import { ForumService } from './forum.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ForumDynamic,
      ForumDynamicType,
      ForumDynamicLike,
      ForumDynamicFavorite,
      ForumDynamicShareEvent,
      ForumComment,
      ForumInteractionEvent,
      ForumActivityNotification,
      ForumChangeLog,
      CustomerUser,
    ]),
    AuthModule,
    MobileAuthModule,
  ],
  controllers: [
    ForumController,
    ForumAdminController,
    ForumDynamicTypesController,
    ForumChangeLogsController,
    ForumNotificationsController,
  ],
  providers: [
    ForumService,
    ForumDynamicTypesService,
    ForumChangeLogsService,
    ForumInteractionsService,
    ForumCommentsService,
    ForumNotificationsGateway,
    ForumNotificationsService,
  ],
  exports: [
    ForumService,
    ForumDynamicTypesService,
    ForumChangeLogsService,
    ForumInteractionsService,
    ForumCommentsService,
    ForumNotificationsService,
  ],
})
export class ForumModule {}
