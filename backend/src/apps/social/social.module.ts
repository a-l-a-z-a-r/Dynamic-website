import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { KeycloakAuthGuard } from '../../auth/keycloak.guard';
import { BooklistsModule } from '../../booklists/booklists.module';
import { DatabaseModule } from '../../database/database.module';
import { FriendsModule } from '../../friends/friends.module';
import { NotificationsModule } from '../../notifications/notifications.module';
import { SocialController } from './social.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    FriendsModule,
    BooklistsModule,
    NotificationsModule,
  ],
  controllers: [SocialController],
  providers: [KeycloakAuthGuard],
})
export class SocialApiModule {}
