import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import axios from 'axios';
import * as bcrypt from 'bcrypt';

interface PendingUser {
  email: string;
  passwordHash: string;
  code: string;
  expiresAt: Date;
}

const pendingUsers = new Map<string, PendingUser>();

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async syncUser(auth0Id: string, accessToken: string) {
    let user = await this.usersRepository.findOne({ where: { auth0Id } });
    // console.log(user);
    if (user) return user;

    // Fetch user info from Auth0
    const { data: userInfo } = await axios.get('https://dev-uhw9uwk0.us.auth0.com/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    console.log('Fetched user info from Auth0:', userInfo);

    user = this.usersRepository.create({
      auth0Id,
      email: userInfo.email,
      createdAt: new Date(),
    });

    return await this.usersRepository.save(user);
  }

  async signupRequest(email: string, password: string) {
    const code = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit code
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // expires in 5 minutes

    pendingUsers.set(email, {
      email,
      passwordHash: password, // ideally hash this
      code,
      expiresAt,
    });

    console.log(`Verification code for ${email}:`, code); // for testing

    return { message: 'Verification code generated' };
  }

  async signupVerify(email: string, code: string) {
    const pending = pendingUsers.get(email);

    if (!pending) throw new BadRequestException('No pending signup found');
    if (pending.expiresAt < new Date()) {
      pendingUsers.delete(email);
      throw new BadRequestException('Code expired');
    }

    console.log('Pending code:', pending.code, 'Received code:', code);

    if (pending.code !== code.toString()) throw new BadRequestException('Invalid code');

    pendingUsers.delete(email);
    return { message: 'User created successfully' };
  }

}
