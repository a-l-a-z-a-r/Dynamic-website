import { HttpException, HttpStatus } from '@nestjs/common';
import { AppController } from '../app.controller';

const expectHttpStatus = async (promise: Promise<unknown>, status: number) => {
  try {
    await promise;
  } catch (err) {
    expect(err).toBeInstanceOf(HttpException);
    expect((err as HttpException).getStatus()).toBe(status);
    return;
  }
  throw new Error('Expected HttpException');
};

describe('AppController failure cases', () => {
  const buildController = () => {
    const appService = {
      hasRequiredReviewFields: jest.fn(),
      addReview: jest.fn(),
      addBookReview: jest.fn(),
      getBookDetails: jest.fn(),
      addReviewComment: jest.fn(),
      addReplyToComment: jest.fn(),
    };
    const keycloakAdminService = {
      createUser: jest.fn(),
      findUserByUsername: jest.fn(),
      searchUsers: jest.fn(),
    };
    const keycloakAuthService = { loginWithPassword: jest.fn() };
    const queueService = { enqueueImport: jest.fn() };
    const profilesService = { upsertImage: jest.fn(), findByUsername: jest.fn() };
    const friendsService = { listFriends: jest.fn(), addFriend: jest.fn() };
    const booklistsService = { findPublicByOwner: jest.fn() };
    const notificationsService = { listByUser: jest.fn(), markRead: jest.fn() };

    const controller = new AppController(
      appService as any,
      keycloakAdminService as any,
      keycloakAuthService as any,
      queueService as any,
      profilesService as any,
      friendsService as any,
      booklistsService as any,
      notificationsService as any,
    );

    return {
      controller,
      appService,
      keycloakAdminService,
      keycloakAuthService,
      queueService,
      profilesService,
      friendsService,
      booklistsService,
      notificationsService,
    };
  };

  describe('reviews endpoints', () => {
    it('rejects missing owner for book review', async () => {
      const { controller } = buildController();

      await expectHttpStatus(
        controller.addBookReview('Dune', { review: 'Great', genre: 'Sci-Fi', rating: 5 }, {}),
        HttpStatus.FORBIDDEN,
      );
    });

    it('rejects invalid rating for book review', async () => {
      const { controller } = buildController();

      await expectHttpStatus(
        controller.addBookReview(
          'Dune',
          { review: 'Great', genre: 'Sci-Fi', rating: 7 },
          { user: { preferred_username: 'mila' } },
        ),
        HttpStatus.BAD_REQUEST,
      );
    });

    it('rejects missing fields for review creation', async () => {
      const { controller, appService } = buildController();
      appService.hasRequiredReviewFields.mockReturnValue(false);

      await expectHttpStatus(controller.createReview({ user: 'mila' } as any), HttpStatus.BAD_REQUEST);
    });
  });

  describe('comments endpoints', () => {
    it('rejects missing owner for review comment', async () => {
      const { controller } = buildController();

      await expectHttpStatus(
        controller.addReviewComment('review', { message: 'Hi' }, {}),
        HttpStatus.FORBIDDEN,
      );
    });

    it('rejects missing message for review comment', async () => {
      const { controller } = buildController();

      await expectHttpStatus(
        controller.addReviewComment(
          'review',
          { message: '' },
          { user: { preferred_username: 'mila' } },
        ),
        HttpStatus.BAD_REQUEST,
      );
    });

    it('rejects missing review on comment create', async () => {
      const { controller, appService } = buildController();
      appService.addReviewComment.mockResolvedValue(null);

      await expectHttpStatus(
        controller.addReviewComment(
          'review',
          { message: 'Hi' },
          { user: { preferred_username: 'mila' } },
        ),
        HttpStatus.NOT_FOUND,
      );
    });

    it('rejects missing reply fields', async () => {
      const { controller } = buildController();

      await expectHttpStatus(
        controller.addCommentReply(
          'comment',
          { message: '', reviewId: '' },
          { user: { preferred_username: 'mila' } },
        ),
        HttpStatus.BAD_REQUEST,
      );
    });

    it('rejects missing parent comment', async () => {
      const { controller, appService } = buildController();
      appService.addReplyToComment.mockResolvedValue(null);

      await expectHttpStatus(
        controller.addCommentReply(
          'comment',
          { message: 'Hi', reviewId: 'review' },
          { user: { preferred_username: 'mila' } },
        ),
        HttpStatus.NOT_FOUND,
      );
    });
  });

  describe('notifications endpoints', () => {
    it('rejects missing owner for list', async () => {
      const { controller } = buildController();

      await expectHttpStatus(controller.listNotifications({}), HttpStatus.FORBIDDEN);
    });

    it('rejects missing notification id', async () => {
      const { controller } = buildController();

      await expectHttpStatus(
        controller.markNotificationRead('', { user: { preferred_username: 'mila' } }),
        HttpStatus.BAD_REQUEST,
      );
    });

    it('rejects unknown notification id', async () => {
      const { controller, notificationsService } = buildController();
      notificationsService.markRead.mockResolvedValue(null);

      await expectHttpStatus(
        controller.markNotificationRead('notif', { user: { preferred_username: 'mila' } }),
        HttpStatus.NOT_FOUND,
      );
    });
  });

  describe('friends endpoints', () => {
    it('rejects missing owner for list', async () => {
      const { controller } = buildController();

      await expectHttpStatus(controller.listFriends({}), HttpStatus.FORBIDDEN);
    });

    it('rejects missing friend id', async () => {
      const { controller } = buildController();

      await expectHttpStatus(
        controller.addFriend({ friendId: '' }, { user: { preferred_username: 'mila' } }),
        HttpStatus.BAD_REQUEST,
      );
    });

    it('rejects adding yourself', async () => {
      const { controller } = buildController();

      await expectHttpStatus(
        controller.addFriend({ friendId: 'mila' }, { user: { preferred_username: 'mila' } }),
        HttpStatus.BAD_REQUEST,
      );
    });
  });

  describe('booklists endpoints', () => {
    it('rejects missing friend id', async () => {
      const { controller } = buildController();

      await expectHttpStatus(controller.getFriendBooklists(''), HttpStatus.BAD_REQUEST);
    });

    it('rejects undefined friend id', async () => {
      const { controller } = buildController();

      await expectHttpStatus(controller.getFriendBooklists(undefined as any), HttpStatus.BAD_REQUEST);
    });
  });

  describe('auth endpoints', () => {
    it('rejects missing signup fields', async () => {
      const { controller } = buildController();

      await expectHttpStatus(controller.signup({ username: 'mila', password: 'pass' }), HttpStatus.BAD_REQUEST);
    });

    it('rejects missing login fields', async () => {
      const { controller } = buildController();

      await expectHttpStatus(controller.login({ username: '', password: '' }), HttpStatus.BAD_REQUEST);
    });

    it('maps login errors to http exceptions', async () => {
      const { controller, keycloakAuthService } = buildController();
      const error = new Error('bad login') as Error & { status?: number };
      error.status = 401;
      keycloakAuthService.loginWithPassword.mockRejectedValue(error);

      await expectHttpStatus(controller.login({ username: 'mila', password: 'pass' }), HttpStatus.UNAUTHORIZED);
    });
  });

  describe('profiles endpoints', () => {
    it('rejects missing username for profile', async () => {
      const { controller } = buildController();

      await expectHttpStatus(controller.profile(''), HttpStatus.BAD_REQUEST);
    });

    it('rejects missing user profile', async () => {
      const { controller, keycloakAdminService } = buildController();
      keycloakAdminService.findUserByUsername.mockResolvedValue(null);

      await expectHttpStatus(controller.profile('mila'), HttpStatus.NOT_FOUND);
    });

    it('rejects missing owner for profile image', async () => {
      const { controller } = buildController();

      await expectHttpStatus(
        controller.updateProfileImage({ imageUrl: 'url' }, {}),
        HttpStatus.FORBIDDEN,
      );
    });

    it('rejects missing image url', async () => {
      const { controller } = buildController();

      await expectHttpStatus(
        controller.updateProfileImage({ imageUrl: '' }, { user: { preferred_username: 'mila' } }),
        HttpStatus.BAD_REQUEST,
      );
    });
  });

  describe('imports endpoint', () => {
    it('rejects missing query', async () => {
      const { controller } = buildController();

      await expectHttpStatus(controller.requestImport({ query: '' }), HttpStatus.BAD_REQUEST);
    });
  });

  describe('books endpoint', () => {
    it('rejects missing book', async () => {
      const { controller } = buildController();

      await expectHttpStatus(controller.getBook(''), HttpStatus.BAD_REQUEST);
    });
  });
});
