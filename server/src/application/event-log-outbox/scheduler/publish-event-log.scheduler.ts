import * as moment from 'moment-timezone';
import { Prisma } from 'generated/prisma';

import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

import { PrismaService } from 'src/infra/prisma/prisma.service';
import { SQSService } from '../service/sqs.service';

@Injectable()
export class PublishEventLogScheduler {
  private readonly MAX_ATTEMPTS = 3;

  constructor(
    private readonly prismaService: PrismaService,
    private readonly sqsService: SQSService,
  ) {}

  @Cron('*/5 * * * *')
  async publishBatch() {
    console.log('starting publishBatch');

    const eventLogs = await this.prismaService.$queryRaw<
      {
        id: string;
        name: string;
        params: Record<string, any>;
        occurredAt: Date;
        attempts: number;
      }[]
    >(
      Prisma.sql`
        WITH to_claim AS (
            SELECT id
            FROM event_log_outbox
            WHERE status = 'Pending'
            AND attempts < ${this.MAX_ATTEMPTS}
            AND next_attempt_at <= now()
            ORDER BY occurred_at ASC
            FOR UPDATE SKIP LOCKED
        )
        UPDATE event_log_outbox o
        SET status = 'Processing',
            attempts = o.attempts + 1,
            last_attempt_at = now()
        FROM to_claim c
        WHERE o.id = c.id
        RETURNING o.id, o.name, o.params, o.occurred_at AS "occurredAt", o.attempts
      `,
    );

    if (eventLogs.length === 0) return;

    const now = moment.utc().toDate();

    for (const eventLog of eventLogs) {
      const { id, name, params, occurredAt, attempts } = eventLog;
      try {
        await this.sqsService.send({
          eventUuid: id,
          eventName: name,
          eventParams: params,
          eventDate: occurredAt,
        });

        await this.prismaService.eventLogOutbox.update({
          where: {
            id,
          },
          data: {
            status: 'Published',
            lastAttemptAt: now,
            publishedAt: now,
          },
        });
      } catch {
        const nextAttemptAt = moment
          .utc()
          .add(60 * Math.pow(2, attempts - 1), 'seconds')
          .toDate();
        await this.prismaService.eventLogOutbox.update({
          where: {
            id,
          },
          data: {
            status: attempts >= this.MAX_ATTEMPTS ? 'Failed' : 'Pending',
            lastAttemptAt: now,
            nextAttemptAt,
          },
        });
      }
    }

    console.log('finished publishBatch');
  }
}
