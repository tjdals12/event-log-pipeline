import { Body, Controller, Post } from '@nestjs/common';

import { SignUpDto } from '../dto/request/sign-up.dto';
import { UserService } from '../service/user.service';

@Controller({
  path: '/users',
  version: '1',
})
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('/sign-up')
  async signUp(@Body() signUpDto: SignUpDto) {
    return this.userService.signUp(signUpDto);
  }
}
