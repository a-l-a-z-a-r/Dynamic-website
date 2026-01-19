import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { KeycloakAuthGuard } from '../../auth/keycloak.guard';
import { BooklistsController } from '../../booklists/booklists.controller';
import { BooklistsModule } from '../../booklists/booklists.module';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), DatabaseModule, BooklistsModule],
  controllers: [BooklistsController],
  providers: [KeycloakAuthGuard],
})
export class BooklistsApiModule {}
