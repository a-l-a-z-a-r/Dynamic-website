import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { ReviewsModule } from './reviews/reviews.module';
import { BooklistsModule } from './booklists/booklists.module';
import { QueueModule } from './queue/queue.module';
import { ProfilesModule } from './profiles/profiles.module';
import { FriendsModule } from './friends/friends.module';
import { CommentsModule } from './comments/comments.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { KeycloakAdminService } from './auth/keycloak-admin.service';
import { KeycloakAuthService } from './auth/keycloak-auth.service';
import { RolesGuard } from './auth/roles.guard';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    ReviewsModule,
    BooklistsModule,
    QueueModule,
    ProfilesModule,
    FriendsModule,
    CommentsModule,
    NotificationsModule,
  ],
  controllers: [AppController],
  providers: [AppService, KeycloakAdminService, KeycloakAuthService, RolesGuard],
})
export class AppModule {}
