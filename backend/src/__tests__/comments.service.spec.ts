import { CommentsService } from '../comments/comments.service';

const makeQuery = <T,>(result: T) => {
  const query: any = {
    sort: jest.fn(() => query),
    lean: jest.fn(() => query),
    exec: jest.fn().mockResolvedValue(result),
  };
  return query;
};

describe('CommentsService', () => {
  it('creates comments', async () => {
    const created = { toObject: jest.fn().mockReturnValue({ id: '1' }) };
    const model = { create: jest.fn().mockResolvedValue(created) };
    const service = new CommentsService(model as any);

    const result = await service.create({ reviewId: 'r1', user: 'mila', message: 'Hi' });

    expect(model.create).toHaveBeenCalledWith(
      expect.objectContaining({ reviewId: 'r1', user: 'mila', message: 'Hi' }),
    );
    expect(result).toEqual({ id: '1' });
  });

  it('returns null when comment id is missing', async () => {
    const service = new CommentsService({} as any);

    await expect(service.findById('')).resolves.toBeNull();
  });

  it('lists by review ids with sorting', async () => {
    const model = { find: jest.fn(() => makeQuery([{ id: '1' }])) };
    const service = new CommentsService(model as any);

    await expect(service.listByReviewIds(['r1'])).resolves.toEqual([{ id: '1' }]);
    await expect(service.listByReviewIds([])).resolves.toEqual([]);
  });
});
