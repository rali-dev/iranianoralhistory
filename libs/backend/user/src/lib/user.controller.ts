import { Controller, Get, Param } from '@nestjs/common';
import { UserService } from './user.service';


@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}


  @Get()
  async getAllUsers() {
    return this.userService.getAllUsers();
  }

  @Get(':id')
  async getUserById(@Param('id') params: { id: string }) {
    return this.userService.getUserById(params.id);
  }
}
