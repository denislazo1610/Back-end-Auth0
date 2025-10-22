import { Controller, Post, UseGuards, Req } from '@nestjs/common';
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
}