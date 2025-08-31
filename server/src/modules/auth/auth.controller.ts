import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignUpDTO } from './dto/signup.dto';
import { LoginDTO } from './dto/login.dto';
import { RefreshTokenDTO } from './dto/refresh-token.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // Todo: Post Signup
  @Post('signup')
  async signUp(@Body() credentials: SignUpDTO) {
    return this.authService.signup(credentials);
  }
  // Todo: Post Login
  @Post('login')
  async login(@Body() credentials: LoginDTO) {
    return this.authService.login(credentials);
  }
}
