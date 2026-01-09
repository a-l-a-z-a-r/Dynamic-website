import { AppService } from '../app.service';

const makeReview = (overrides: Record<string, unknown> = {}) => ({
  _id: 'review-id',
  user: 'mila',
  book: 'Dune',
  rating: 5,
  review: 'Great',
  genre: 'Sci-Fi',
  status: 'finished',
  created_at: new Date('2024-01-01T00:00:00.000Z'),
  coverUrl: 'https://example.com/cover.png',
  ...overrides,
});

describe('AppService', () => {
  const createService = () => {
    const reviewsService = {
      findAll: jest.fn(),
      findByBook: jest.fn(),
      create: jest.fn(),
      findById: jest.fn(),
    };
    const queueService = {
      publishReviewCreated: jest.fn(),
      publishReviewCommented: jest.fn(),
    };
    const commentsService = {
      listByReviewIds: jest.fn(),
      create: jest.fn(),
      findById: jest.fn(),
    };

    return {
      service: new AppService(reviewsService as any, queueService as any, commentsService as any),
      reviewsService,
      queueService,
      commentsService,
    };
  };

  it('builds the feed from reviews', async () => {
    const { service, reviewsService } = createService();
    reviewsService.findAll.mockResolvedValue([makeReview()]);

    const result = await service.getFeed();

    expect(result.feed).toHaveLength(1);
    expect(result.feed[0].book).toBe('Dune');
    expect(typeof result.lastRefreshed).toBe('string');
  });

  it('returns recommendations sorted by score', () => {
    const { service } = createService();

    const result = service.getRecommendations();
    const scores = result.recommendations.map((rec) => rec.score);

    expect(result.recommendations).toHaveLength(5);
    expect(scores).toEqual([...scores].sort((a, b) => b - a));
  });

  it('adds finished reviews to the shelf history', async () => {
    const { service, reviewsService } = createService();
    reviewsService.create.mockResolvedValue(makeReview({ book: 'New Book' }));

    await service.addReview({
      user: 'mila',
      book: 'New Book',
      rating: 4,
      review: 'Nice',
      genre: 'Novel',
      status: 'finished',
    });

    const shelf = service.getShelf().shelf;
    expect(shelf.finished).toContain('New Book');
    expect(shelf.history[0].label).toBe('Recent');
  });

  it('returns null when adding a comment to a missing review', async () => {
    const { service, reviewsService } = createService();
    reviewsService.findById.mockResolvedValue(null);

    const result = await service.addReviewComment('missing', 'mila', 'hi');

    expect(result).toBeNull();
  });

  it('adds comments to an existing review', async () => {
    const { service, reviewsService, commentsService, queueService } = createService();
    reviewsService.findById.mockResolvedValue(makeReview());
    commentsService.create.mockResolvedValue({ _id: 'comment-id' });

    const result = await service.addReviewComment('review-id', 'mila', 'Nice!');

    expect(result?.book).toBe('Dune');
    expect(queueService.publishReviewCommented).toHaveBeenCalled();
  });

  it('builds comment threads with replies', () => {
    const { service } = createService();
    const comments = [
      {
        _id: '1',
        reviewId: 'r1',
        user: 'mila',
        message: 'first',
        created_at: new Date('2024-01-01T00:00:00.000Z'),
      },
      {
        _id: '2',
        reviewId: 'r1',
        user: 'alex',
        message: 'reply',
        parentCommentId: '1',
        created_at: '2024-01-02T00:00:00.000Z',
      },
    ];

    const threads = (service as any).buildCommentThreads(comments);

    expect(threads.r1).toHaveLength(1);
    expect(threads.r1[0].replies).toHaveLength(1);
  });

  it('validates required review fields', () => {
    const { service } = createService();

    expect(
      service.hasRequiredReviewFields({
        user: 'mila',
        book: 'Dune',
        rating: 5,
        review: 'Great',
        genre: 'Sci-Fi',
      }),
    ).toBe(true);
    expect(service.hasRequiredReviewFields({ user: 'mila' })).toBe(false);
  });

  it('formats created_at values', () => {
    const { service } = createService();
    const iso = (service as any).formatCreatedAt(new Date('2024-01-03T00:00:00.000Z'));
    const literal = (service as any).formatCreatedAt('already');

    expect(iso).toBe('2024-01-03T00:00:00.000Z');
    expect(literal).toBe('already');
  });
});
