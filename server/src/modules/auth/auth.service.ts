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

  async login(credentials: LoginDTO) {
    // user Exist?
    const { email, password } = credentials;
    const userFound = await this.UserModel.findOne({ email });
    if (!userFound) {
      throw new UnauthorizedException('Wrong credentials');
    }
    // verify password
    const passwordVerified = await bcrypt.compare(password, userFound.password);

    if (!passwordVerified) {
      throw new UnauthorizedException('Wrong credentials');
    }
    // generate JWT Token
    const tokens = await this.generateUserToken(userFound._id);
    return {
      ...tokens,
      userId: userFound._id,
    };
  }

  async refreshToken(refreshToken: string) {
    // if refreshtoken exist in DB and not expired
    // get userId from refresh token to generate new one
    const token = await this.RefreshTokenModel.findOne({
      token: refreshToken,
      expiryDate: { $gte: new Date() }, // greater than
    });
    if (!token)
      throw new UnauthorizedException('Session expired need to login again');
    return this.generateUserToken(token.userId);
  }
}
