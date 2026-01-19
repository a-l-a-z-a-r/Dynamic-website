import { NestFactory } from '@nestjs/core';
import { applyCommonAppMiddleware, getPort } from '../app-bootstrap';
import { UsersApiModule } from './users.module';

async function bootstrap() {
  const app = await NestFactory.create(UsersApiModule);
  applyCommonAppMiddleware(app, {
    title: 'Socialbook Users API',
    description: 'Authentication and profile service',
    path: 'api/docs/users',
  });

  await app.listen(getPort(), '0.0.0.0');
}

bootstrap();
