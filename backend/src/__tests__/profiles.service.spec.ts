import { ProfilesService } from '../profiles/profiles.service';

const makeQuery = <T,>(result: T) => {
  const query: any = {
    lean: jest.fn(() => query),
    exec: jest.fn().mockResolvedValue(result),
  };
  return query;
};

describe('ProfilesService', () => {
  it('returns null for missing username', async () => {
    const service = new ProfilesService({} as any);

    await expect(service.findByUsername('')).resolves.toBeNull();
    await expect(service.upsertImage('', 'url')).resolves.toBeNull();
  });

  it('finds profile by username', async () => {
    const model = { findOne: jest.fn(() => makeQuery({ username: 'mila' })) };
    const service = new ProfilesService(model as any);

    await expect(service.findByUsername('mila')).resolves.toEqual({ username: 'mila' });
  });

  it('upserts profile image', async () => {
    const model = { findOneAndUpdate: jest.fn(() => makeQuery({ imageUrl: 'url' })) };
    const service = new ProfilesService(model as any);

    await expect(service.upsertImage('mila', 'url')).resolves.toEqual({ imageUrl: 'url' });
  });
});
