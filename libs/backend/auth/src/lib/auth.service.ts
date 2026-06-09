import { Injectable } from '@nestjs/common';
import { PrismaService } from '@iranianoralhistory/database';
import { AuthDto } from '@iranianoralhistory/validation';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { jwtSecret } from './config/constants';
@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService, private readonly jwtService: JwtService) {}

  async signup(dto: AuthDto) {
    const { email, password } = dto;
    const foundUser = await this.prisma.user.findUnique({ where: { email } });
    if (foundUser) {
      throw new BadRequestException('Email is already in use');
    }
    const hashedPassword = await this.hashPassword(password);
    await this.prisma.user.create({
      data: {
        email,
        hashedPassword,
      },
    });
    return { message: 'signup was successful' };
  }
  
  async signin(dto: AuthDto) {
    const { email, password } = dto;
    const foundUser = await this.prisma.user.findUnique({ where: { email } });

    if (!foundUser) {
      throw new BadRequestException('Wrong credentials');
    }
    const isMatch = await this.comparePasswords({ 
      password,
      hashedPassword: foundUser.hashedPassword 
    });

    if (!isMatch) {
      throw new UnauthorizedException('Wrong credentials');
    }

    const token = await this.signToken({ 
      id: foundUser.id, 
      email: foundUser.email 
    });
    return { message: 'signin was successful', token };
  }

  async signout() {
    return { message: 'signout was successful' };
  }

  async hashPassword(password: string){
    const saltOrRounds = 10;
    return  await bcrypt.hash(password, saltOrRounds);
  }

  async comparePasswords(args: { password: string; hashedPassword: string }) {
    return await bcrypt.compare(args.password, args.hashedPassword);
  }  

  async signToken(args: { id: string; email: string }) {
    const payload = args;
    return await this.jwtService.signAsync(
      payload, 
      { secret: jwtSecret },
    );
  }
}
