import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import amqplib, { Channel, Connection, ConsumeMessage } from 'amqplib';

type ReviewCreatedPayload = {
  user?: string;
  book?: string;
  rating?: number;
  review?: string;
  status?: string;
  created_at?: string;
  coverUrl?: string;
};

type ImportRequestedPayload = {
  query: string;
  source?: string;
  requestedBy?: string;
};

@Injectable()
export class QueueService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(QueueService.name);
  private connection: Connection | null = null;
  private channel: Channel | null = null;

  private readonly exchange = 'socialbook.events';
  private readonly queues = {
    notifications: 'socialbook.notifications',
    recommendations: 'socialbook.recommendations',
    imports: 'socialbook.imports',
    fanout: 'socialbook.feed-fanout',
  };
  private readonly routingKeys = {
    reviewCreated: 'review.created',
    importRequested: 'import.requested',
  };

  private getRabbitUrl() {
    return (
      process.env.RABBITMQ_URL ||
      'amqp://admin:HelloWorld123@rabbitmq-service-api.rabbitmq.svc.cluster.local:5672'
    );
  }

  async onModuleInit() {
    try {
      await this.connect();
      await this.startConsumers();
    } catch (err) {
      this.logger.warn(`RabbitMQ unavailable: ${(err as Error).message}`);
    }
  }

  async onModuleDestroy() {
    try {
      await this.channel?.close();
      await this.connection?.close();
    } catch (err) {
      this.logger.warn(`RabbitMQ shutdown issue: ${(err as Error).message}`);
    }
  }

  async publishReviewCreated(payload: ReviewCreatedPayload) {
    return this.publish(this.routingKeys.reviewCreated, payload);
  }

  async enqueueImport(payload: ImportRequestedPayload) {
    return this.publish(this.routingKeys.importRequested, payload);
  }

  private async connect() {
    if (this.connection) return;
    const url = this.getRabbitUrl();
    this.logger.log(`Connecting to RabbitMQ at ${url}`);
    this.connection = await amqplib.connect(url);
    this.channel = await this.connection.createChannel();
    await this.channel.assertExchange(this.exchange, 'topic', { durable: true });
    await this.channel.assertQueue(this.queues.notifications, { durable: true });
    await this.channel.assertQueue(this.queues.recommendations, { durable: true });
    await this.channel.assertQueue(this.queues.imports, { durable: true });
    await this.channel.assertQueue(this.queues.fanout, { durable: true });
    await this.channel.bindQueue(this.queues.notifications, this.exchange, this.routingKeys.reviewCreated);
    await this.channel.bindQueue(this.queues.recommendations, this.exchange, this.routingKeys.reviewCreated);
    await this.channel.bindQueue(this.queues.fanout, this.exchange, this.routingKeys.reviewCreated);
    await this.channel.bindQueue(this.queues.imports, this.exchange, this.routingKeys.importRequested);
  }

  private async publish(routingKey: string, payload: Record<string, unknown>) {
    if (!this.channel) {
      this.logger.warn('RabbitMQ channel not ready; skipping publish.');
      return;
    }
    const body = Buffer.from(JSON.stringify(payload));
    this.channel.publish(this.exchange, routingKey, body, { persistent: true });
  }

  private async startConsumers() {
    if (!this.channel) return;
    await this.channel.consume(this.queues.notifications, (msg) =>
      this.handleMessage(msg, 'notifications'),
    );
    await this.channel.consume(this.queues.recommendations, (msg) =>
      this.handleMessage(msg, 'recommendations'),
    );
    await this.channel.consume(this.queues.imports, (msg) => this.handleMessage(msg, 'imports'));
    await this.channel.consume(this.queues.fanout, (msg) => this.handleMessage(msg, 'fanout'));
  }

  private handleMessage(message: ConsumeMessage | null, queue: string) {
    if (!message || !this.channel) return;
    try {
      const payload = JSON.parse(message.content.toString());
      this.logger.log(`[${queue}] ${JSON.stringify(payload)}`);
      this.channel.ack(message);
    } catch (err) {
      this.logger.error(`[${queue}] failed to process message`, err as Error);
      this.channel.nack(message, false, false);
    }
  }
}
