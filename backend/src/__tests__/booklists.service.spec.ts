import { BooklistsService } from '../booklists/booklists.service';

const makeQuery = <T,>(result: T) => {
  const query: any = {
    sort: jest.fn(() => query),
    limit: jest.fn(() => query),
    lean: jest.fn(() => query),
  };
  if (result !== undefined) {
    query.exec = jest.fn().mockResolvedValue(result);
  }
  return query;
};

describe('BooklistsService', () => {
  it('creates booklists with defaults', async () => {
    const model = { create: jest.fn().mockResolvedValue({ id: '1' }) };
    const service = new BooklistsService(model as any, {} as any);

    await service.create('owner', { name: 'Favorites' });

    expect(model.create).toHaveBeenCalledWith(
      expect.objectContaining({ ownerId: 'owner', name: 'Favorites', visibility: 'public' }),
    );
  });

  it('returns empty lists for missing owner', async () => {
    const model = { find: jest.fn() };
    const service = new BooklistsService(model as any, {} as any);

    await expect(service.findPublicByOwner('')).resolves.toEqual([]);
    expect(model.find).not.toHaveBeenCalled();
  });

  it('searches public lists with sanitized query', async () => {
    const model = { find: jest.fn(() => makeQuery([{ id: '1' }])) };
    const service = new BooklistsService(model as any, {} as any);

    await expect(service.searchPublicLists('   ')).resolves.toEqual([]);
    await expect(service.searchPublicLists('romance?')).resolves.toEqual([{ id: '1' }]);
  });

  it('adds items and increments totals', async () => {
    const itemModel = { create: jest.fn().mockResolvedValue({ id: 'item' }) };
    const booklistModel = { updateOne: jest.fn() };
    const service = new BooklistsService(booklistModel as any, itemModel as any);

    await service.addItem('list', 'owner', { bookId: 'book-1' });

    expect(itemModel.create).toHaveBeenCalledWith(
      expect.objectContaining({ booklistId: 'list', bookId: 'book-1', addedById: 'owner' }),
    );
    expect(booklistModel.updateOne).toHaveBeenCalled();
  });

  it('deletes lists only for owners', async () => {
    const list = { ownerId: 'owner' };
    const booklistModel = {
      findById: jest.fn().mockResolvedValue(list),
      deleteOne: jest.fn().mockResolvedValue({}),
    };
    const itemModel = { deleteMany: jest.fn().mockResolvedValue({}) };
    const service = new BooklistsService(booklistModel as any, itemModel as any);

    await expect(service.deleteList('list', 'owner')).resolves.toBe(true);
    await expect(service.deleteList('list', 'other')).resolves.toBe(false);
  });
});
