import { FriendsService } from '../friends/friends.service';

const makeQuery = <T,>(result: T) => {
  const query: any = {
    sort: jest.fn(() => query),
    lean: jest.fn(() => query),
    exec: jest.fn().mockResolvedValue(result),
  };
  return query;
};

describe('FriendsService', () => {
  it('returns empty list for missing owner', async () => {
    const service = new FriendsService({} as any);

    await expect(service.listFriends('')).resolves.toEqual([]);
  });

  it('lists friends with sorting', async () => {
    const model = { find: jest.fn(() => makeQuery([{ id: '1' }])) };
    const service = new FriendsService(model as any);

    await expect(service.listFriends('owner')).resolves.toEqual([{ id: '1' }]);
  });

  it('adds friends when ids are present', async () => {
    const created = { toObject: jest.fn().mockReturnValue({ id: '1' }) };
    const model = { create: jest.fn().mockResolvedValue(created) };
    const service = new FriendsService(model as any);

    await expect(service.addFriend('', 'friend')).resolves.toBeNull();
    await expect(service.addFriend('owner', 'friend')).resolves.toEqual({ id: '1' });
  });
});
