import * as moment from 'moment-timezone';
import { randomUUID } from 'crypto';

import { Injectable } from '@nestjs/common';

import { PrismaService } from '@infra/prisma/prisma.service';

import { SignUpDto } from '../dto/request/sign-up.dto';
import { UserDto } from '../dto/response/user.dto';

@Injectable()
export class UserService {
  constructor(private readonly prismaService: PrismaService) {}

  async signUp(signUpDto: SignUpDto): Promise<SignUpDto> {
    const { userId } = signUpDto;

    const now = moment.utc().toDate();

    const userModel = await this.prismaService.$transaction(async (tx) => {
      const userModel = await tx.user.create({
        data: {
          userId,
        },
      });

      await tx.eventLogOutbox.create({
        data: {
          id: randomUUID(),
          name: 'signup',
          params: {
            userId: userModel.id,
          },
          occurredAt: now,
        },
      });

      return userModel;
    });

    const userDto = new UserDto({
      id: userModel.id.toString(),
      userId: userModel.userId,
    });

    return userDto;
  }
}
