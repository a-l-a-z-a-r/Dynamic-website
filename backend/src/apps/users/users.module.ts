import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { KeycloakAdminService } from '../../auth/keycloak-admin.service';
import { KeycloakAuthService } from '../../auth/keycloak-auth.service';
import { KeycloakAuthGuard } from '../../auth/keycloak.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { DatabaseModule } from '../../database/database.module';
import { ProfilesModule } from '../../profiles/profiles.module';
import { UsersController } from './users.controller';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), DatabaseModule, ProfilesModule],
  controllers: [UsersController],
  providers: [
    KeycloakAdminService,
    KeycloakAuthService,
    RolesGuard,
    KeycloakAuthGuard,
  ],
})
export class UsersApiModule {}
