import { Controller, Post, Body, UseGuards, Req, BadRequestException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('sync')
  @UseGuards(AuthGuard('jwt'))
  async syncUser(@Req() req) {
    const { sub: auth0Id } = req.user;
    const accessToken = req.headers.authorization.split(' ')[1];
    const user = await this.authService.syncUser(auth0Id, accessToken);
    return user;
  }

  @Post('signup-request')
  async signupRequest(@Body() body: { email: string; password: string }) {
    return this.authService.signupRequest(body.email, body.password);
  }

  @Post('signup-verify')
  async signupVerify(@Body() body: { email: string; code: string }) {
    const { email, code } = body;
    if (!email || !code) throw new BadRequestException('Email and code required');
    return this.authService.signupVerify(email, code);
  }



}