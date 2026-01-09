import { NestFactory } from '@nestjs/core';
import type { NextFunction, Request, Response } from 'express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.use((req: Request, res: Response, next: NextFunction) => {
    res.setHeader('X-Neon', new Date().toISOString());
    next();
  });
  app.enableCors({
    origin: [
      'http://localhost:8080',
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://46.62.130.16:30090',
      'http://socialbook.ltu-m7011e-11.se',
      'https://socialbook.ltu-m7011e-11.se',
    ],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['X-Neon'],
  });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Socialbook API')
    .setDescription('Socialbook backend API documentation')
    .setVersion('1.0.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' })
    .build();
  const swaggerDoc = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, swaggerDoc);

  const port = process.env.PORT || 5000;
  await app.listen(port, '0.0.0.0');
}

bootstrap();
