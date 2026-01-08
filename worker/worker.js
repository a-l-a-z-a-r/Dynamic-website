import amqplib from 'amqplib';

const RABBITMQ_URL =
  process.env.RABBITMQ_URL ||
  'amqp://admin:HelloWorld123@rabbitmq-service-api.rabbitmq.svc.cluster.local:5672';
const EXCHANGE = process.env.RABBITMQ_EXCHANGE || 'socialbook.events';
const QUEUE = process.env.RABBITMQ_QUEUE || 'socialbook.comments';
const ROUTING_KEY = process.env.RABBITMQ_ROUTING_KEY || 'review.commented';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const run = async () => {
  // Simple reconnect loop for a demo worker.
  while (true) {
    try {
      const connection = await amqplib.connect(RABBITMQ_URL);
      const channel = await connection.createChannel();
      await channel.assertExchange(EXCHANGE, 'topic', { durable: true });
      await channel.assertQueue(QUEUE, { durable: true });
      await channel.bindQueue(QUEUE, EXCHANGE, ROUTING_KEY);

      console.log(`[worker] connected. queue=${QUEUE} routing=${ROUTING_KEY}`);

      await channel.consume(
        QUEUE,
        (msg) => {
          if (!msg) return;
          const body = msg.content.toString();
          console.log(`[worker] message: ${body}`);
          channel.ack(msg);
        },
        { noAck: false },
      );

      return;
    } catch (err) {
      console.error('[worker] connection failed, retrying in 5s:', err.message || err);
      await sleep(5000);
    }
  }
};

run();
