import { QueueService } from '../queue/queue.service';

describe('QueueService', () => {
  it('warns when publishing without a channel', async () => {
    const service = new QueueService();
    const warn = jest.spyOn((service as any).logger, 'warn').mockImplementation(() => undefined);

    await service.publishReviewCreated({ user: 'mila' });

    expect(warn).toHaveBeenCalledWith('RabbitMQ channel not ready; skipping publish.');
  });

  it('acks messages with valid payloads', () => {
    const service = new QueueService();
    const ack = jest.fn();
    (service as any).channel = { ack, nack: jest.fn() };
    const message = { content: Buffer.from('{"ok":true}') } as any;

    (service as any).handleMessage(message, 'notifications');

    expect(ack).toHaveBeenCalledWith(message);
  });

  it('nacks messages with invalid payloads', () => {
    const service = new QueueService();
    const nack = jest.fn();
    (service as any).channel = { ack: jest.fn(), nack };
    const message = { content: Buffer.from('not-json') } as any;

    (service as any).handleMessage(message, 'notifications');

    expect(nack).toHaveBeenCalledWith(message, false, false);
  });
});
