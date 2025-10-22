import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import axios from 'axios';

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
}
