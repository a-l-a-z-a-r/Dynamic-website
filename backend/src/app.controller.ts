import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AppService } from './app.service';
import { KeycloakAuthGuard } from './auth/keycloak.guard';
import { KeycloakAdminService } from './auth/keycloak-admin.service';
import { KeycloakAuthService } from './auth/keycloak-auth.service';
import { QueueService } from './queue/queue.service';
import { ProfilesService } from './profiles/profiles.service';
import { FriendsService } from './friends/friends.service';
import { BooklistsService } from './booklists/booklists.service';
import { NotificationsService } from './notifications/notifications.service';
import {
  AdminUserStatusDto,
  BookReviewDto,
  CommentDto,
  CreateReviewDto,
  FriendDto,
  ImportDto,
  LoginDto,
  ProfileImageDto,
  ReplyDto,
  SignupDto,
} from './dto/app.dto';
import { Roles } from './auth/roles.decorator';
import { RolesGuard } from './auth/roles.guard';

const ADMIN_ROLE = 'admin';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly keycloakAdminService: KeycloakAdminService,
    private readonly keycloakAuthService: KeycloakAuthService,
    private readonly queueService: QueueService,
    private readonly profilesService: ProfilesService,
    private readonly friendsService: FriendsService,
    private readonly booklistsService: BooklistsService,
    private readonly notificationsService: NotificationsService,
  ) {}

  @UseGuards(KeycloakAuthGuard)
  @Get('feed')
  async getFeed() {
    return this.appService.getFeed();
  }

  @UseGuards(KeycloakAuthGuard)
  @Get('shelf')
  getShelf() {
    return this.appService.getShelf();
  }

  @UseGuards(KeycloakAuthGuard)
  @Get('recommendations')
  getRecommendations() {
    return this.appService.getRecommendations();
  }

  @UseGuards(KeycloakAuthGuard)
  @Get('reviews')
  async getReviews() {
    return this.appService.getReviews();
  }

  @Get('books/:book')
  async getBook(@Param('book') book: string) {
    if (!book) {
      throw new HttpException({ error: 'Missing book' }, HttpStatus.BAD_REQUEST);
    }
    const decoded = decodeURIComponent(book);
    return this.appService.getBookDetails(decoded);
  }

  @UseGuards(KeycloakAuthGuard)
  @Post('books/:book/reviews')
  async addBookReview(
    @Param('book') book: string,
    @Body() body: BookReviewDto,
    @Req() req: { user?: Record<string, unknown> },
  ) {
    const ownerId =
      (req.user?.preferred_username as string) || (req.user?.username as string);
    if (!ownerId) {
      throw new HttpException({ error: 'Missing owner' }, HttpStatus.FORBIDDEN);
    }
    if (!book || !body?.review || !body?.genre) {
      throw new HttpException({ error: 'Missing required fields' }, HttpStatus.BAD_REQUEST);
    }
    const rating = Number(body.rating);
    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
      throw new HttpException({ error: 'Invalid rating' }, HttpStatus.BAD_REQUEST);
    }
    const decoded = decodeURIComponent(book);
    return this.appService.addBookReview(decoded, ownerId, {
      rating,
      review: body.review,
      genre: body.genre,
      status: body.status,
      coverUrl: body.coverUrl,
    });
  }

  @UseGuards(KeycloakAuthGuard)
  @Post('reviews')
  async createReview(@Body() body: CreateReviewDto) {
    if (!this.appService.hasRequiredReviewFields(body)) {
      throw new HttpException({ error: 'Missing required fields' }, HttpStatus.BAD_REQUEST);
    }

    return this.appService.addReview(body);
  }

  @UseGuards(KeycloakAuthGuard)
  @Post('reviews/:reviewId/comments')
  async addReviewComment(
    @Param('reviewId') reviewId: string,
    @Body() body: CommentDto,
    @Req() req: { user?: Record<string, unknown> },
  ) {
    const ownerId =
      (req.user?.preferred_username as string) || (req.user?.username as string);
    if (!ownerId) {
      throw new HttpException({ error: 'Missing owner' }, HttpStatus.FORBIDDEN);
    }
    if (!reviewId || !body?.message) {
      throw new HttpException({ error: 'Missing comment' }, HttpStatus.BAD_REQUEST);
    }
    const updated = await this.appService.addReviewComment(reviewId, ownerId, body.message);
    if (!updated) {
      throw new HttpException({ error: 'Review not found' }, HttpStatus.NOT_FOUND);
    }
    return updated;
  }

  @UseGuards(KeycloakAuthGuard)
  @Post('comments/:commentId/replies')
  async addCommentReply(
    @Param('commentId') commentId: string,
    @Body() body: ReplyDto,
    @Req() req: { user?: Record<string, unknown> },
  ) {
    const ownerId =
      (req.user?.preferred_username as string) || (req.user?.username as string);
    if (!ownerId) {
      throw new HttpException({ error: 'Missing owner' }, HttpStatus.FORBIDDEN);
    }
    if (!commentId || !body?.message || !body?.reviewId) {
      throw new HttpException({ error: 'Missing reply' }, HttpStatus.BAD_REQUEST);
    }
    const created = await this.appService.addReplyToComment(
      body.reviewId,
      commentId,
      ownerId,
      body.message,
    );
    if (!created) {
      throw new HttpException({ error: 'Comment not found' }, HttpStatus.NOT_FOUND);
    }
    return created;
  }

  @UseGuards(KeycloakAuthGuard)
  @Get('notifications')
  async listNotifications(@Req() req: { user?: Record<string, unknown> }) {
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
    @Req() req: { user?: Record<string, unknown> },
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

  @UseGuards(KeycloakAuthGuard)
  @Post('imports')
  async requestImport(@Body() body: ImportDto) {
    if (!body?.query) {
      throw new HttpException({ error: 'Missing import query' }, HttpStatus.BAD_REQUEST);
    }
    await this.queueService.enqueueImport({
      query: body.query,
      source: body.source,
    });
    return { ok: true };
  }

  @Post('signup')
  async signup(@Body() body: SignupDto) {
    const { username, password, firstName, lastName, age, email } = body || {};
    if (!username || !password || !firstName || !lastName || !age || !email) {
      throw new HttpException({ error: 'Missing required fields' }, HttpStatus.BAD_REQUEST);
    }

    try {
      await this.keycloakAdminService.createUser(body);
      return { ok: true };
    } catch (err) {
      const status = (err as any)?.status || HttpStatus.BAD_GATEWAY;
      const message = (err as Error)?.message || 'Failed to create user';
      throw new HttpException({ error: message }, status);
    }
  }

  @Get('profile/:username')
  async profile(@Param('username') username: string) {
    if (!username) {
      throw new HttpException({ error: 'Missing username' }, HttpStatus.BAD_REQUEST);
    }

    try {
      const user = await this.keycloakAdminService.findUserByUsername(username);
      if (!user) {
        throw new HttpException({ error: 'User not found' }, HttpStatus.NOT_FOUND);
      }

      const profile = await this.profilesService.findByUsername(username);
      return {
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        attributes: user.attributes || {},
        imageUrl: profile?.imageUrl,
      };
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      }
      const status = (err as any)?.status || HttpStatus.BAD_GATEWAY;
      const message = (err as Error)?.message || 'Failed to load profile';
      throw new HttpException({ error: message }, status);
    }
  }

  @UseGuards(KeycloakAuthGuard)
  @Post('profile/image')
  async updateProfileImage(
    @Body() body: ProfileImageDto,
    @Req() req: { user?: Record<string, unknown> },
  ) {
    const ownerId =
      (req.user?.preferred_username as string) || (req.user?.username as string);
    if (!ownerId) {
      throw new HttpException({ error: 'Missing owner' }, HttpStatus.FORBIDDEN);
    }
    if (!body?.imageUrl) {
      throw new HttpException({ error: 'Missing image url' }, HttpStatus.BAD_REQUEST);
    }
    const updated = await this.profilesService.upsertImage(ownerId, body.imageUrl);
    return { ok: true, profile: updated };
  }

  @UseGuards(KeycloakAuthGuard)
  @Get('users')
  async searchUsers(@Query('search') search?: string) {
    if (!search) {
      return { users: [] };
    }
    const users = await this.keycloakAdminService.searchUsers(search);
    return { users };
  }

  @UseGuards(KeycloakAuthGuard)
  @Get('friends')
  async listFriends(@Req() req: { user?: Record<string, unknown> }) {
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
  async addFriend(
    @Body() body: FriendDto,
    @Req() req: { user?: Record<string, unknown> },
  ) {
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

  @Post('login')
  async login(@Body() body: LoginDto) {
    const { username, password } = body || {};
    if (!username || !password) {
      throw new HttpException({ error: 'Missing required fields' }, HttpStatus.BAD_REQUEST);
    }

    try {
      const token = await this.keycloakAuthService.loginWithPassword(username, password);
      return token;
    } catch (err) {
      const status = (err as any)?.status || HttpStatus.BAD_GATEWAY;
      const message = (err as Error)?.message || 'Login failed';
      throw new HttpException({ error: message }, status);
    }
  }

  @UseGuards(KeycloakAuthGuard, RolesGuard)
  @Roles(ADMIN_ROLE)
  @Post('admin/users/:username/enabled')
  async setUserEnabled(
    @Param('username') username: string,
    @Body() body: AdminUserStatusDto,
  ) {
    if (!username) {
      throw new HttpException({ error: 'Missing username' }, HttpStatus.BAD_REQUEST);
    }
    const updated = await this.keycloakAdminService.setUserEnabled(username, body.enabled);
    if (!updated) {
      throw new HttpException({ error: 'User not found' }, HttpStatus.NOT_FOUND);
    }
    return { ok: true };
  }

  @UseGuards(KeycloakAuthGuard, RolesGuard)
  @Roles(ADMIN_ROLE)
  @Delete('admin/users/:username')
  async deleteUser(@Param('username') username: string) {
    if (!username) {
      throw new HttpException({ error: 'Missing username' }, HttpStatus.BAD_REQUEST);
    }
    const deleted = await this.keycloakAdminService.deleteUserByUsername(username);
    if (!deleted) {
      throw new HttpException({ error: 'User not found' }, HttpStatus.NOT_FOUND);
    }
    return { ok: true };
  }

  @Get('health')
  health() {
    return this.appService.health();
  }
}
