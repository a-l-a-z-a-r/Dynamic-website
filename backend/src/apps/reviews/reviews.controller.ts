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
import { AppService } from '../../app.service';
import { KeycloakAuthGuard } from '../../auth/keycloak.guard';
import { QueueService } from '../../queue/queue.service';
import {
  BookReviewDto,
  CommentDto,
  CreateReviewDto,
  ImportDto,
  ReplyDto,
} from '../../dto/app.dto';

type AuthRequest = {
  user?: Record<string, unknown>;
};

@Controller()
export class ReviewsController {
  constructor(
    private readonly appService: AppService,
    private readonly queueService: QueueService,
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
    @Req() req: AuthRequest,
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
    @Req() req: AuthRequest,
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
    @Req() req: AuthRequest,
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

  @Get('health')
  health() {
    return { service: 'reviews', ...this.appService.health() };
  }

  @Get('reviews/health')
  serviceHealth() {
    return { service: 'reviews', ...this.appService.health() };
  }
}
