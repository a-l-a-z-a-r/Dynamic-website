import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppService } from '../../app.service';
import { CommentsModule } from '../../comments/comments.module';
import { DatabaseModule } from '../../database/database.module';
import { QueueModule } from '../../queue/queue.module';
import { ReviewsModule } from '../../reviews/reviews.module';
import { KeycloakAuthGuard } from '../../auth/keycloak.guard';
import { ReviewsController } from './reviews.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    ReviewsModule,
    CommentsModule,
    QueueModule,
  ],
  controllers: [ReviewsController],
  providers: [AppService, KeycloakAuthGuard],
})
export class ReviewsApiModule {}
