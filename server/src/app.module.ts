import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { PrismaModule } from '@infra/prisma/prisma.module';
import { UserModule } from '@application/user/user.module';
import { EventLogOutboxModule } from '@application/event-log-outbox/event-log-outbox.module';

import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    UserModule,
    EventLogOutboxModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
