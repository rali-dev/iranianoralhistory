import { Controller, Get, Post, Body, Req, Res} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthDto } from '@iranianoralhistory/validation';
import { Request, Response } from 'express';


@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

 @Post('signup')
  async signup(@Body() dto : AuthDto) {
    return this.authService.signup(dto);
  }
  @Post('signin')
  async signin(@Body() dto : AuthDto, @Req() req: Request, @Res() res: Response) {
    return this.authService.signin(dto, req, res);
  }

  @Get('signout')
  async signout(@Req() req: Request, @Res() res: Response) {
    return this.authService.signout(req, res);
  } 
}