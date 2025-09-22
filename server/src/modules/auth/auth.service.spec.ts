import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { getModelToken } from '@nestjs/mongoose';
import { AuthService } from './auth.service';
import { User } from '../../schemas/users.schema';
import { RefreshToken } from '../../schemas/refresh-token.schema';

// Mock Mongoose models
const mockUserModel = {
  findOne: jest.fn(),
  create: jest.fn(),
  findById: jest.fn(),
  updateOne: jest.fn(),
};

const mockRefreshTokenModel = {
  findOne: jest.fn(),
  updateOne: jest.fn(),
  create: jest.fn(),
};

// Mock JwtService
const mockJwtService = {
  sign: jest.fn(),
  verify: jest.fn(),
};

describe('AuthService', () => {
  let service: AuthService;
  let userModel: typeof mockUserModel;
  let refreshTokenModel: typeof mockRefreshTokenModel;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getModelToken(User.name),
          useValue: mockUserModel,
        },
        {
          provide: getModelToken(RefreshToken.name),
          useValue: mockRefreshTokenModel,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userModel = module.get(getModelToken(User.name));
    refreshTokenModel = module.get(getModelToken(RefreshToken.name));
    jwtService = module.get<JwtService>(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should have userModel injected', () => {
    expect(userModel).toBeDefined();
  });

  it('should have refreshTokenModel injected', () => {
    expect(refreshTokenModel).toBeDefined();
  });

  it('should have jwtService injected', () => {
    expect(jwtService).toBeDefined();
  });
});
