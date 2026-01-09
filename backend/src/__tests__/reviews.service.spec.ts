import { ReviewsService } from '../reviews/reviews.service';

type QueryResult<T> = {
  sort: jest.Mock;
  limit: jest.Mock;
  lean: jest.Mock;
  exec: jest.Mock<Promise<T>>;
};

const makeQuery = <T,>(result: T): QueryResult<T> => {
  const query: any = {
    sort: jest.fn(() => query),
    limit: jest.fn(() => query),
    lean: jest.fn(() => query),
    exec: jest.fn().mockResolvedValue(result),
  };
  return query;
};

describe('ReviewsService', () => {
  it('returns empty list for missing book', async () => {
    const model = { find: jest.fn() };
    const service = new ReviewsService(model as any);

    const result = await service.findByBook('');

    expect(result).toEqual([]);
    expect(model.find).not.toHaveBeenCalled();
  });

  it('does not delete by empty cover url', async () => {
    const model = { deleteMany: jest.fn() };
    const service = new ReviewsService(model as any);

    await service.deleteByCoverUrl('');

    expect(model.deleteMany).not.toHaveBeenCalled();
  });

  it('creates reviews with numeric ratings', async () => {
    const created = { toObject: jest.fn().mockReturnValue({ id: '1' }) };
    const model = { create: jest.fn().mockResolvedValue(created) };
    const service = new ReviewsService(model as any);

    await service.create({ rating: '4', user: 'mila', book: 'Dune' });

    expect(model.create).toHaveBeenCalledWith(
      expect.objectContaining({ rating: 4, user: 'mila', book: 'Dune' }),
    );
  });

  it('validates image content types', () => {
    const service = new ReviewsService({} as any);

    expect((service as any).isImageContentType('image/png')).toBe(true);
    expect((service as any).isImageContentType('image/gif')).toBe(false);
    expect((service as any).isImageContentType('text/plain')).toBe(false);
  });

  it('reads PNG dimensions', () => {
    const service = new ReviewsService({} as any);
    const data = new Uint8Array(24);
    data.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], 0);
    data[16] = 0x00;
    data[17] = 0x00;
    data[18] = 0x00;
    data[19] = 0x02;
    data[20] = 0x00;
    data[21] = 0x00;
    data[22] = 0x00;
    data[23] = 0x03;

    const dims = (service as any).getImageDimensions(data.buffer);

    expect(dims).toEqual({ width: 2, height: 3 });
  });

  it('checks minimum byte size', () => {
    const service = new ReviewsService({} as any);
    const buffer = new ArrayBuffer(4);

    expect((service as any).isMinBytes(buffer, '10', 5)).toBe(true);
    expect((service as any).isMinBytes(buffer, null, 8)).toBe(false);
  });

  it('reads big-endian integers', () => {
    const service = new ReviewsService({} as any);
    const data = new Uint8Array([0x00, 0x10, 0x00, 0x00, 0x01, 0x00]);

    expect((service as any).readUint16BE(data, 0)).toBe(0x0010);
    expect((service as any).readUint32BE(data, 1)).toBe(0x10000001);
  });

  it('rejects invalid cover urls', async () => {
    const service = new ReviewsService({} as any);

    await expect(service.isCoverValid('not-a-url', 10, 1)).resolves.toBe(false);
    await expect(service.isCoverValid('ftp://example.com/x.png', 10, 1)).resolves.toBe(false);
  });

  it('accepts covers when fetch is unavailable', async () => {
    const service = new ReviewsService({} as any);
    const originalFetch = (global as any).fetch;
    (global as any).fetch = undefined;

    await expect(service.isCoverValid('https://example.com/x.png', 10, 1)).resolves.toBe(true);

    (global as any).fetch = originalFetch;
  });

  it('queries reviews with mongoose chains', async () => {
    const findQuery = makeQuery([{ id: '1' }]);
    const model = {
      find: jest.fn(() => findQuery),
      findById: jest.fn(() => makeQuery({ id: '1' })),
      findByIdAndUpdate: jest.fn(() => makeQuery({ id: '1' })),
    };
    const service = new ReviewsService(model as any);

    await expect(service.findAll()).resolves.toEqual([{ id: '1' }]);
    await expect(service.findByBook('Dune')).resolves.toEqual([{ id: '1' }]);
    await expect(service.findById('id')).resolves.toEqual({ id: '1' });
    await expect(service.addComment('id', { user: 'mila', message: 'Hi' })).resolves.toEqual({
      id: '1',
    });
  });
});
