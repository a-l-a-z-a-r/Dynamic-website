# Socialbook Email Worker

Consumes RabbitMQ events and sends an email for each message.

## Run locally

```bash
npm install
SMTP_HOST=smtp.example.com \
SMTP_PORT=587 \
SMTP_USER=user \
SMTP_PASS=pass \
EMAIL_FROM=no-reply@socialbook.local \
EMAIL_TO=you@example.com \
RABBITMQ_URL=amqp://admin:HelloWorld123@localhost:5672 \
npm start
```

## Environment variables

- `RABBITMQ_URL`: RabbitMQ connection string.
- `RABBITMQ_EXCHANGE`: Exchange name (default: `socialbook.events`).
- `RABBITMQ_QUEUE`: Queue name (default: `socialbook.comments`).
- `RABBITMQ_ROUTING_KEY`: Routing key (default: `review.commented`).
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`: SMTP settings.
- `EMAIL_FROM`, `EMAIL_TO`: Email sender and recipient.
