import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomerUser } from '../customers/entities/customer-user.entity';
import { ForumChangeLog } from './entities/forum-change-log.entity';
import { ForumDynamicType } from './entities/forum-dynamic-type.entity';
import { ForumDynamic } from './entities/forum-dynamic.entity';
import { ForumChangeLogsController } from './forum-change-logs.controller';
import { ForumChangeLogsService } from './forum-change-logs.service';
import { ForumDynamicTypesController } from './forum-dynamic-types.controller';
import { ForumDynamicTypesService } from './forum-dynamic-types.service';
import { ForumController } from './forum.controller';
import { ForumService } from './forum.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([ForumDynamic, ForumDynamicType, ForumChangeLog, CustomerUser]),
  ],
  controllers: [ForumController, ForumDynamicTypesController, ForumChangeLogsController],
  providers: [ForumService, ForumDynamicTypesService, ForumChangeLogsService],
  exports: [ForumService, ForumDynamicTypesService, ForumChangeLogsService],
})
export class ForumModule {}
