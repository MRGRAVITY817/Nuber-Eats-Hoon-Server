import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
// import { JwtMiddleware } from './jwt/jwt.middleware';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe());
  // This will enable cross-origin-requests
  app.enableCors();
  // Only if you want to use middleware everywhere :D
  // app.use(JwtMiddleware);
  await app.listen(process.env.PORT || 4000);
}
bootstrap();
