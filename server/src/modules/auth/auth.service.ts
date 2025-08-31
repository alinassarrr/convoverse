import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { SignUpDTO } from './dto/signup.dto';
import { InjectModel } from '@nestjs/mongoose';
import { User } from '../../schemas/users.schema';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { LoginDTO } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';
import { RefreshToken } from 'src/schemas/refresh-token.schema';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private UserModel: Model<User>,
    @InjectModel(RefreshToken.name)
    private RefreshTokenModel: Model<RefreshToken>,
    private jwtService: JwtService,
  ) {} // we injected user service in auth module

  async signup(credentials: SignUpDTO) {
    const { fullname, email, password } = credentials;
    // Todo: check if email already used
    const usedEmail = await this.UserModel.findOne({
      email,
    });
    if (usedEmail) throw new BadRequestException('Email already in use');
    // Todo: hash password
    const hashPassword = await bcrypt.hash(password, 10);
    // Todo: create  user document and save in DB
    await this.UserModel.create({
      fullname,
      email,
      password: hashPassword,
    });
  }
}
