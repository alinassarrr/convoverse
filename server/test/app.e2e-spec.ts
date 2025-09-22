import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  });

  it('/users (GET) - should return users list', () => {
    return request(app.getHttpServer())
      .get('/users')
      .expect(200); // Users endpoint is accessible
  });

  it('/conversations (GET) - should return conversations', () => {
    return request(app.getHttpServer())
      .get('/conversations')
      .expect(200); // Should return empty array or conversations
  });
});
