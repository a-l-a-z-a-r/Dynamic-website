import amqplib from 'amqplib';
import { MongoClient } from 'mongodb';

const RABBITMQ_URL =
  process.env.RABBITMQ_URL ||
  'amqp://admin:HelloWorld123@rabbitmq-service-api.rabbitmq.svc.cluster.local:5672';
const EXCHANGE = process.env.RABBITMQ_EXCHANGE || 'socialbook.events';
const QUEUE = process.env.RABBITMQ_QUEUE || 'socialbook.notifications';
const ROUTING_KEY = process.env.RABBITMQ_ROUTING_KEY || 'review.commented';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://mongo:27017/socialbook';
const NOTIFICATIONS_COLLECTION = process.env.NOTIFICATIONS_COLLECTION || 'notifications';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

let mongoClient;
let mongoReady = false;

const getNotificationsCollection = async () => {
  if (!mongoClient) {
    mongoClient = new MongoClient(MONGODB_URI);
  }
  if (!mongoReady) {
    await mongoClient.connect();
    mongoReady = true;
  }
  return mongoClient.db().collection(NOTIFICATIONS_COLLECTION);
};

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
        async (msg) => {
          if (!msg) return;
          const body = msg.content.toString();
          try {
            const payload = JSON.parse(body);
            const targetUser = payload?.targetUser;
            if (!targetUser) {
              console.log('[worker] missing targetUser; skipping');
              channel.ack(msg);
              return;
            }
            const collection = await getNotificationsCollection();
            await collection.insertOne({
              user: targetUser,
              actor: payload?.user,
              message: payload?.message,
              reviewId: payload?.reviewId,
              commentId: payload?.commentId,
              read: false,
              created_at: new Date(),
            });
            console.log('[worker] notification saved');
            channel.ack(msg);
          } catch (err) {
            console.error('[worker] failed to handle message', err.message || err);
            channel.nack(msg, false, true);
          }
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
