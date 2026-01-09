import { NotificationsService } from '../notifications/notifications.service';

const makeQuery = <T,>(result: T) => {
  const query: any = {
    sort: jest.fn(() => query),
    limit: jest.fn(() => query),
    lean: jest.fn(() => query),
    exec: jest.fn().mockResolvedValue(result),
  };
  return query;
};

describe('NotificationsService', () => {
  it('creates notifications with read=false', async () => {
    const created = { toObject: jest.fn().mockReturnValue({ id: '1' }) };
    const model = { create: jest.fn().mockResolvedValue(created) };
    const service = new NotificationsService(model as any);

    await service.create({ user: 'mila', message: 'hi' });

    expect(model.create).toHaveBeenCalledWith(
      expect.objectContaining({ user: 'mila', message: 'hi', read: false }),
    );
  });

  it('returns empty list for missing user', async () => {
    const service = new NotificationsService({} as any);

    await expect(service.listByUser('')).resolves.toEqual([]);
  });

  it('lists notifications with limit', async () => {
    const model = { find: jest.fn(() => makeQuery([{ id: '1' }])) };
    const service = new NotificationsService(model as any);

    await expect(service.listByUser('mila', 10)).resolves.toEqual([{ id: '1' }]);
  });

  it('marks notifications read when ids exist', async () => {
    const model = {
      findOneAndUpdate: jest.fn(() => makeQuery({ id: '1', read: true })),
    };
    const service = new NotificationsService(model as any);

    await expect(service.markRead('', 'user')).resolves.toBeNull();
    await expect(service.markRead('notif', 'user')).resolves.toEqual({ id: '1', read: true });
  });
});
