import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { KeycloakAuthGuard } from '../../auth/keycloak.guard';
import { BooklistsService } from '../../booklists/booklists.service';
import { FriendsService } from '../../friends/friends.service';
import { NotificationsService } from '../../notifications/notifications.service';
import { FriendDto } from '../../dto/app.dto';

type AuthRequest = {
  user?: Record<string, unknown>;
};

@Controller()
export class SocialController {
  constructor(
    private readonly friendsService: FriendsService,
    private readonly booklistsService: BooklistsService,
    private readonly notificationsService: NotificationsService,
  ) {}

  @UseGuards(KeycloakAuthGuard)
  @Get('friends')
  async listFriends(@Req() req: AuthRequest) {
    const ownerId =
      (req.user?.preferred_username as string) || (req.user?.username as string);
    if (!ownerId) {
      throw new HttpException({ error: 'Missing owner' }, HttpStatus.FORBIDDEN);
    }
    const friends = await this.friendsService.listFriends(ownerId);
    return { friends };
  }

  @UseGuards(KeycloakAuthGuard)
  @Post('friends')
  async addFriend(@Body() body: FriendDto, @Req() req: AuthRequest) {
    const ownerId =
      (req.user?.preferred_username as string) || (req.user?.username as string);
    if (!ownerId) {
      throw new HttpException({ error: 'Missing owner' }, HttpStatus.FORBIDDEN);
    }
    if (!body?.friendId) {
      throw new HttpException({ error: 'Missing friend' }, HttpStatus.BAD_REQUEST);
    }
    if (body.friendId === ownerId) {
      throw new HttpException({ error: 'Cannot add yourself' }, HttpStatus.BAD_REQUEST);
    }
    const friend = await this.friendsService.addFriend(ownerId, body.friendId);
    return { ok: true, friend };
  }

  @UseGuards(KeycloakAuthGuard)
  @Get('friends/:friendId/booklists')
  async getFriendBooklists(@Param('friendId') friendId: string) {
    if (!friendId) {
      throw new HttpException({ error: 'Missing friend' }, HttpStatus.BAD_REQUEST);
    }
    const lists = await this.booklistsService.findPublicByOwner(friendId);
    return { booklists: lists };
  }

  @UseGuards(KeycloakAuthGuard)
  @Get('notifications')
  async listNotifications(@Req() req: AuthRequest) {
    const ownerId =
      (req.user?.preferred_username as string) || (req.user?.username as string);
    if (!ownerId) {
      throw new HttpException({ error: 'Missing owner' }, HttpStatus.FORBIDDEN);
    }
    const notifications = await this.notificationsService.listByUser(ownerId);
    return { notifications };
  }

  @UseGuards(KeycloakAuthGuard)
  @Post('notifications/:notificationId/read')
  async markNotificationRead(
    @Param('notificationId') notificationId: string,
    @Req() req: AuthRequest,
  ) {
    const ownerId =
      (req.user?.preferred_username as string) || (req.user?.username as string);
    if (!ownerId) {
      throw new HttpException({ error: 'Missing owner' }, HttpStatus.FORBIDDEN);
    }
    if (!notificationId) {
      throw new HttpException({ error: 'Missing notification' }, HttpStatus.BAD_REQUEST);
    }
    const updated = await this.notificationsService.markRead(notificationId, ownerId);
    if (!updated) {
      throw new HttpException({ error: 'Notification not found' }, HttpStatus.NOT_FOUND);
    }
    return updated;
  }

  @Get('health')
  health() {
    return { status: 'ok', service: 'social', time: new Date().toISOString() };
  }
}
