import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { setupSwagger } from './config/swagger.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // take away fields that should not be sent in body
      forbidNonWhitelisted: true, // will through an error
    }),
  ); // pipe for validation

  setupSwagger(app);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
