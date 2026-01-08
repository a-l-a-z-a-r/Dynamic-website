# Socialbook RabbitMQ Worker

Minimal worker that consumes `review.commented` events and logs them.

## Run locally

```bash
npm install
RABBITMQ_URL=amqp://admin:HelloWorld123@localhost:5672 npm start
```

## Environment variables

- `RABBITMQ_URL`: RabbitMQ connection string.
- `RABBITMQ_EXCHANGE`: Exchange name (default: `socialbook.events`).
- `RABBITMQ_QUEUE`: Queue name (default: `socialbook.comments`).
- `RABBITMQ_ROUTING_KEY`: Routing key (default: `review.commented`).
