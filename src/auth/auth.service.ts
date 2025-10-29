import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import axios from 'axios';
import * as bcrypt from 'bcrypt';
import { Client } from './entities/client.entity';
import { CreateClientDto } from './dto/create-client.dto';
import { Trainer } from './entities/trainer.entity';
import { CreateTrainerDto } from './dto/create-trainer.dto';

interface PendingUser {
  email: string;
  passwordHash: string;
  code: string;
  expiresAt: Date;
}

const pendingUsers = new Map<string, PendingUser>();

@Injectable()
export class AuthService {
  private auth0Domain = process.env.AUTH0_DOMAIN; // e.g. "myapp.us.auth0.com"
  private clientId = process.env.AUTH0_CLIENT_ID;
  private clientSecret = process.env.AUTH0_CLIENT_SECRET;
  private audience = process.env.AUDIENCE;
  private accessToken = process.env.ACCESS_TOKEN;

  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,

    @InjectRepository(Client)
    private readonly clientsRepository: Repository<Client>,

    @InjectRepository(Trainer)
    private readonly trainersRepository: Repository<Trainer>,
  ) {}


  // this method syncs user info from Auth0 to our local DB
  async syncUser(auth0Id: string, accessToken: string) {
    let user = await this.usersRepository.findOne({ where: { auth0Id } });
    console.log('It was already in the DB', user);
    if (user) return user;

    // Fetch user info from Auth0
    const { data: userInfo } = await axios.get('https://dev-uhw9uwk0.us.auth0.com/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    console.log('It was not in the DB', userInfo);

    user = this.usersRepository.create({
      auth0Id,
      email: userInfo.email,
      createdAt: new Date(),
    });

    return await this.usersRepository.save(user);
  }

  // this method creates a new user both in Auth0 and locally
  async createUser(email: string, password: string) {
    try {
      const response = await axios.post(
        `https://${this.auth0Domain}/dbconnections/signup`,
        {
          client_id: this.clientId,
          email,
          password,
          connection: 'Username-Password-Authentication',
        },
        { headers: { 'Content-Type': 'application/json' } },
      );

      let auth0Id =
        response.data._id ||
        response.data.user_id ||
        response.data.sub;

      // If missing the prefix, add it
      if (auth0Id && !auth0Id.startsWith('auth0|')) {
        auth0Id = `auth0|${auth0Id}`;
      }

      const newUser = this.usersRepository.create({
        auth0Id,
        email,
        createdAt: new Date(),
      });
      await this.usersRepository.save(newUser);

      return newUser;
    } catch (error) {
      console.error('Auth0 signup error:', error.response?.data || error.message);
      throw new BadRequestException('Failed to create user');
    }
  }


  async loginUser(email: string, password: string) {
    try {
      const response = await axios.post(
        `https://${this.auth0Domain}/oauth/token`,
        {
          grant_type: 'http://auth0.com/oauth/grant-type/password-realm',
          username: email,
          password: password,
          audience: this.audience,
          client_id: this.clientId,
          client_secret: this.clientSecret,
          scope: 'openid profile email',
          realm: 'Username-Password-Authentication',
        },
        { headers: { 'Content-Type': 'application/json' } },
      );

      return response.data; // ✅ access_token, id_token, etc.
    } catch (error) {
      console.error('Auth0 login error:', error.response?.data || error.message);
      throw new BadRequestException(
        error.response?.data || 'Failed to log in user',
      );
    }
  }

  async updatePassword(auth0Id: string, newPassword: string) {
    try {
      // Step 1: Get Management API token
      const tokenResponse = await axios.post(
        `https://${this.auth0Domain}/oauth/token`,
        {
          client_id: this.clientId,
          client_secret: this.clientSecret,
          audience: `https://${this.auth0Domain}/api/v2/`,
          grant_type: 'client_credentials',
        },
        { headers: { 'Content-Type': 'application/json' } },
      );

      console.log('Management API token response:', tokenResponse.data);

      const managementToken = tokenResponse.data.access_token;

      // Step 2: Update user password in Auth0
      await axios.patch(
        `https://${this.auth0Domain}/api/v2/users/${auth0Id}`,
        { password: newPassword, connection: 'Username-Password-Authentication' },
        { headers: { Authorization: `Bearer ${managementToken}` } },
      );


      return { message: 'Password updated successfully' };
    } catch (error) {
      console.error('Update password error:', error.response?.data || error.message);
      throw new BadRequestException('Failed to update password');
    }
  }

  async createClient(auth0Id: string, createClientDto: CreateClientDto) {
    // Check if user already has a client profile
    let client = await this.clientsRepository.findOne({
      where: { user: { auth0Id } },
    });
    console.log('It was already in the DB', client);

    if (client) return client;

    // Create new client and link user by Auth0 ID
    client = this.clientsRepository.create({
      ...createClientDto,
      user: { auth0Id } as User,
    });

    return await this.clientsRepository.save(client);
  }

  async createTrainer(auth0Id: string, createTrainerDto: CreateTrainerDto) {
    // Check if user already has a client profile
    console.log('CreateTrainerDto:', createTrainerDto);
    let trainer = await this.trainersRepository.findOne({
      where: { user: { auth0Id } },
    });
    console.log('It was already in the DB', trainer);

    if (trainer) return trainer;

    // Create new client and link user by Auth0 ID
    trainer = this.trainersRepository.create({
      ...createTrainerDto,
      user: { auth0Id } as User,
    });

    return await this.trainersRepository.save(trainer);
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
