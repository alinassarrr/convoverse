import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignUpDTO } from './dto/signup.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // Todo: Post Signup
  @Post('signup')
  async signUp(@Body() credentials: SignUpDTO) {}
  // Todo: Post Login
  // Todo: Post Refresh Token
}
