import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { isDefined } from 'class-validator';

@Injectable()
export class SQSService {
  private readonly _client: SQSClient;
  private readonly _queueUrl: string;

  constructor(private readonly configService: ConfigService) {
    const region = this.configService.getOrThrow<string>('AWS_REGION');
    const queueUrl = this.configService.getOrThrow<string>('AWS_SQS_URL');

    this._client = new SQSClient({ region });
    this._queueUrl = queueUrl;
  }

  async send(body: {
    eventUuid: string;
    eventName: string;
    eventDate: Date;
    eventParams?: Record<string, any>;
  }): Promise<void> {
    const { eventUuid, eventName, eventDate, eventParams } = body;

    const command = new SendMessageCommand({
      QueueUrl: this._queueUrl,
      MessageBody: JSON.stringify({
        event_uuid: eventUuid,
        event_name: eventName,
        event_timestamp: eventDate,
        ...(isDefined(eventParams) ? { event_params: eventParams } : {}),
      }),
    });

    await this._client.send(command);
  }
}
