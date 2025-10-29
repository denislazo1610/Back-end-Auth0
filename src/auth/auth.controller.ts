import { Controller, Post, Body, UseGuards, Req, BadRequestException, Get } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { CreateClientDto } from './dto/create-client.dto';
import { CreateTrainerDto } from './dto/create-trainer.dto';

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

  @Post('create-user')
  async createUser(@Body() body: { email: string; password: string }) {
    return this.authService.createUser(body.email, body.password);
  }

  @Get('login')
  async login(@Body() body: { email: string; password: string }) {
    return this.authService.loginUser(body.email, body.password);
  }

  @Post('create-client')
  @UseGuards(AuthGuard('jwt'))
  async registerClient(@Req() req, @Body() createClientDto: CreateClientDto) {
    const { sub: auth0Id } = req.user;
    const client =  await this.authService.createClient(auth0Id, createClientDto);
    return client;
  }

  @Post('create-trainer')
  @UseGuards(AuthGuard('jwt'))
  async registerTrainer(@Req() req, @Body() createTrainerDto: CreateTrainerDto) {
    const { sub: auth0Id } = req.user;
    const trainer =  await this.authService.createTrainer(auth0Id, createTrainerDto);
    return trainer;
  }


  // 6 code verification signup flow
  @Post('signup-request')
  async signupRequest(@Body() body: { email: string; password: string }) {
    return this.authService.signupRequest(body.email, body.password);
  }

  // 6 code verification signup flow
  @Post('signup-verify')
  async signupVerify(@Body() body: { email: string; code: string }) {
    const { email, code } = body;
    if (!email || !code) throw new BadRequestException('Email and code required');
    return this.authService.signupVerify(email, code);
  }



}