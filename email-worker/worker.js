import amqplib from 'amqplib';
import nodemailer from 'nodemailer';

const RABBITMQ_URL =
  process.env.RABBITMQ_URL ||
  'amqp://admin:HelloWorld123@rabbitmq-service-api.rabbitmq.svc.cluster.local:5672';
const EXCHANGE = process.env.RABBITMQ_EXCHANGE || 'socialbook.events';
const QUEUE = process.env.RABBITMQ_QUEUE || 'socialbook.comments';
const ROUTING_KEY = process.env.RABBITMQ_ROUTING_KEY || 'review.commented';

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = Number(process.env.SMTP_PORT || '587');
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const EMAIL_FROM = process.env.EMAIL_FROM || 'no-reply@socialbook.local';
const EMAIL_TO = process.env.EMAIL_TO;
const KEYCLOAK_URL = process.env.KEYCLOAK_URL;
const KEYCLOAK_REALM = process.env.KEYCLOAK_REALM || 'myapp';
const KEYCLOAK_ADMIN_CLIENT_ID = process.env.KEYCLOAK_ADMIN_CLIENT_ID;
const KEYCLOAK_ADMIN_CLIENT_SECRET = process.env.KEYCLOAK_ADMIN_CLIENT_SECRET;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const createTransport = () => {
  if (!SMTP_HOST || !EMAIL_TO) {
    return null;
  }
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: SMTP_USER && SMTP_PASS ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
  });
};

const fetchKeycloakToken = async () => {
  if (!KEYCLOAK_URL || !KEYCLOAK_ADMIN_CLIENT_ID || !KEYCLOAK_ADMIN_CLIENT_SECRET) {
    return null;
  }
  const tokenUrl = `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/token`;
  const params = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: KEYCLOAK_ADMIN_CLIENT_ID,
    client_secret: KEYCLOAK_ADMIN_CLIENT_SECRET,
  });
  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });
  if (!response.ok) {
    return null;
  }
  const data = await response.json();
  return data.access_token || null;
};

const fetchUserEmail = async (username) => {
  const token = await fetchKeycloakToken();
  if (!token) return null;
  const url = new URL(`${KEYCLOAK_URL}/admin/realms/${KEYCLOAK_REALM}/users`);
  url.searchParams.set('username', username);
  url.searchParams.set('exact', 'true');
  const response = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) return null;
  const data = await response.json();
  if (!Array.isArray(data) || data.length === 0) return null;
  return data[0].email || null;
};

const run = async () => {
  while (true) {
    try {
      const connection = await amqplib.connect(RABBITMQ_URL);
      const channel = await connection.createChannel();
      await channel.assertExchange(EXCHANGE, 'topic', { durable: true });
      await channel.assertQueue(QUEUE, { durable: true });
      await channel.bindQueue(QUEUE, EXCHANGE, ROUTING_KEY);

      console.log(`[email-worker] connected. queue=${QUEUE} routing=${ROUTING_KEY}`);

      await channel.consume(
        QUEUE,
        async (msg) => {
          if (!msg) return;
          const payload = msg.content.toString();
          const transport = createTransport();
          if (!transport) {
            console.log('[email-worker] missing SMTP config; message:', payload);
            channel.ack(msg);
            return;
          }

          try {
            const parsed = JSON.parse(payload);
            const targetUser = parsed?.targetUser;
            const email = targetUser ? await fetchUserEmail(targetUser) : null;
            await transport.sendMail({
              from: EMAIL_FROM,
              to: email || EMAIL_TO,
              subject: 'New reply on your comment',
              text: payload,
            });
            console.log('[email-worker] email sent');
            channel.ack(msg);
          } catch (err) {
            console.error('[email-worker] send failed', err.message || err);
            channel.nack(msg, false, true);
          }
        },
        { noAck: false },
      );

      return;
    } catch (err) {
      console.error('[email-worker] connection failed, retrying in 5s:', err.message || err);
      await sleep(5000);
    }
  }
};

run();
