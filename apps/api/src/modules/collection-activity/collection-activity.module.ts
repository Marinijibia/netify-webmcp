import { Module } from '@nestjs/common';
import { CollectionActivityService } from './collection-activity.service';
import { CollectionActivityController } from './collection-activity.controller';

@Module({
  controllers: [CollectionActivityController],
  providers: [CollectionActivityService],
  exports: [CollectionActivityService],
})
export class CollectionActivityModule {}
