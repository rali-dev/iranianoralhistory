import { Injectable } from '@nestjs/common';
import { PrismaService } from '@iranianoralhistory/database';
import { AuthDto } from '@iranianoralhistory/validation';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}
  async signup(dto: AuthDto) {
    const { email, password } = dto;
    return { message: 'signup was successful' };
  }
  async signin(dto: AuthDto) {
    const { email, password } = dto;
    return { message: 'signin was successful' };
  }
  async signout() {
    return { message: 'signout was successful' };
  }
}
