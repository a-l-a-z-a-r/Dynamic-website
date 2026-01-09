Socialbook Load Testing (REQ18/REQ19)

Purpose
- Generate traffic to validate monitoring and identify bottlenecks.

How to run
1) Install deps:
   - `python3 -m venv .venv && . .venv/bin/activate`
   - `pip install -r scripts/requirements.txt`
2) Port-forward backend (if running in cluster):
   - `kubectl port-forward -n socialbook svc/backend 5000:5000`
3) Optional RabbitMQ traffic:
   - `kubectl port-forward -n rabbitmq svc/rabbitmq-service-api 5672:5672`
4) Run the generator:
   - `SOCIALBOOK_BASE_URL=http://localhost:5000/api \`
     `RABBITMQ_URL=amqp://admin:HelloWorld123@localhost:5672 \`
     `python scripts/load-generator.py`

What to record
- Prometheus/Grafana graphs:
  - `probe_success` (availability)
  - `increase(rabbitmq_queue_messages_published_total{job="rabbitmq-socialbook"}[1m])`
  - `probe_duration_seconds` (latency)
- Note any bottlenecks (high latency, queue depth, pod CPU).

Example bottleneck notes
- "p95 latency spikes on /api/books/:book during load."
- "RabbitMQ queue depth grows faster than consumer rate."
