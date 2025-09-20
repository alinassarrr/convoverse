import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { SignUpDTO } from './dto/signup.dto';
import { InjectModel } from '@nestjs/mongoose';
import { User } from '../../schemas/users.schema';
import mongoose, { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { LoginDTO } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';
import { RefreshToken } from 'src/schemas/refresh-token.schema';
import { v4 as uuidv4 } from 'uuid';

import { Types } from 'mongoose';

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
    // Todo: create user document and save in DB
    const newUser = await this.UserModel.create({
      fullname,
      email,
      password: hashPassword,
    });

    // Generate tokens for automatic login after signup
    const tokens = await this.generateUserToken(newUser._id as Types.ObjectId);

    return {
      ...tokens,
      userId: newUser._id,
      message: 'Account created successfully',
    };
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
    const tokens = await this.generateUserToken(
      userFound._id as Types.ObjectId,
    );
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

  async generateUserToken(userId: mongoose.Types.ObjectId) {
    const access_token = this.jwtService.sign(
      { userId },
      { expiresIn: '30 days' },
    );
    const refreshToken = uuidv4();
    await this.storeRefreshToken(refreshToken, userId);
    return { access_token, refreshToken };
  }
  async storeRefreshToken(token: string, userId: mongoose.Types.ObjectId) {
    // exp will be 3 days from moment created
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 3);
    await this.RefreshTokenModel.updateOne(
      { userId }, // search on
      { $set: { token, expiryDate } }, // set values
      { upsert: true }, // if not found create new one
    );
  }
}
