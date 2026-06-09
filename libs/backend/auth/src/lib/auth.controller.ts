import { Controller, Get, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthDto } from '@iranianoralhistory/validation';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

 @Post('signup')
  async signup(@Body() dto : AuthDto) {
    return this.authService.signup(dto);
  }
  @Post('signin')
  async signin(@Body() dto : AuthDto) {
    return this.authService.signin(dto);
  }

  @Get('signout')
  async signout() {
    return this.authService.signout();
  } 
}