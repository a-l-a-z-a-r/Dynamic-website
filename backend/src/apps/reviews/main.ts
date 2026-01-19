import { NestFactory } from '@nestjs/core';
import { applyCommonAppMiddleware, getPort } from '../app-bootstrap';
import { ReviewsApiModule } from './reviews.module';

async function bootstrap() {
  const app = await NestFactory.create(ReviewsApiModule);
  applyCommonAppMiddleware(app, {
    title: 'Socialbook Reviews API',
    description: 'Reviews, feed, and imports service',
    path: 'api/docs/reviews',
  }, 'reviews');

  await app.listen(getPort(), '0.0.0.0');
}

bootstrap();
