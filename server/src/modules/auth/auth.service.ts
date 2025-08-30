import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { LoginDTO } from './dto/login.dto';
import { SignUpDTO } from './dto/signup.dto';
import { InjectModel } from '@nestjs/mongoose';
import { User } from '../../schemas/users.schema';
import { Model } from 'mongoose';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    @InjectModel(User.name) private UserModel: Model<User>,
  ) {} // we injected user service in auth module

  async signup(credentials: SignUpDTO) {
    // Todo: check if email already used
    // Todo: hash password
    // Todo: create  user document and save in DB
  }
}
