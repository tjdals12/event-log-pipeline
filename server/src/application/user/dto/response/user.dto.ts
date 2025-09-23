export class UserDto {
  readonly id: string;
  readonly userId: string;

  constructor(args: UserDto) {
    const { id, userId } = args;
    this.id = id;
    this.userId = userId;
  }
}
