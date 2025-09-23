import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';

import { PublishEventLogScheduler } from './scheduler/publish-event-log.scheduler';
import { SQSService } from './service/sqs.service';

@Module({
  imports: [ScheduleModule.forRoot()],
  providers: [SQSService, PublishEventLogScheduler],
})
export class EventLogOutboxModule {}
