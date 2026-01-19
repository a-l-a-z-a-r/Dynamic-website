import { NestFactory } from '@nestjs/core';
import { applyCommonAppMiddleware, getPort } from '../app-bootstrap';
import { SocialApiModule } from './social.module';

async function bootstrap() {
  const app = await NestFactory.create(SocialApiModule);
  applyCommonAppMiddleware(app, {
    title: 'Socialbook Social API',
    description: 'Friends and notifications service',
    path: 'api/docs/social',
  });

  await app.listen(getPort(), '0.0.0.0');
}

bootstrap();
