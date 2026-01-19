import { NestFactory } from '@nestjs/core';
import { applyCommonAppMiddleware, getPort } from '../app-bootstrap';
import { BooklistsApiModule } from './booklists.module';

async function bootstrap() {
  const app = await NestFactory.create(BooklistsApiModule);
  applyCommonAppMiddleware(app, {
    title: 'Socialbook Booklists API',
    description: 'Booklists service',
    path: 'api/docs/booklists',
  }, 'booklists');

  await app.listen(getPort(), '0.0.0.0');
}

bootstrap();
