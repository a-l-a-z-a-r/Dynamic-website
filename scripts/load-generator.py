#!/usr/bin/env python3
"""
Socialbook load generator

Generates HTTP traffic and optional RabbitMQ events to exercise monitoring.

Env:
  SOCIALBOOK_BASE_URL (default: http://localhost:5000/api)
  RABBITMQ_URL (optional) e.g. amqp://admin:HelloWorld123@localhost:5672
  RABBITMQ_EXCHANGE (default: socialbook.events)
  RABBITMQ_ROUTING_KEY (default: review.commented)
"""

import json
import os
import random
import time
from threading import Thread

import requests

try:
    import pika
except Exception:
    pika = None


BASE_URL = os.getenv("SOCIALBOOK_BASE_URL", "http://localhost:5000/api").rstrip("/")
RABBITMQ_URL = os.getenv("RABBITMQ_URL", "")
RABBITMQ_EXCHANGE = os.getenv("RABBITMQ_EXCHANGE", "socialbook.events")
RABBITMQ_ROUTING_KEY = os.getenv("RABBITMQ_ROUTING_KEY", "review.commented")

BOOK_TITLES = [
    "The Phoenix and the Carpet",
    "The Devil's Dictionary",
    "Pride and Prejudice",
    "Moby-Dick",
    "Frankenstein",
]


def generate_http_traffic():
    print("[loadgen] HTTP traffic started")
    while True:
        try:
            choice = random.random()
            if choice < 0.6:
                response = requests.get(f"{BASE_URL}/health", timeout=5)
                print(f"[http] GET /health -> {response.status_code}")
            else:
                book = random.choice(BOOK_TITLES)
                response = requests.get(f"{BASE_URL}/books/{requests.utils.quote(book)}", timeout=8)
                print(f"[http] GET /books/{book} -> {response.status_code}")
            time.sleep(random.uniform(0.2, 1.5))
        except Exception as exc:
            print(f"[http] error: {exc}")
            time.sleep(2)


def generate_rabbitmq_traffic():
    if not RABBITMQ_URL or not pika:
        print("[loadgen] RabbitMQ disabled (missing RABBITMQ_URL or pika).")
        return

    print("[loadgen] RabbitMQ traffic started")
    try:
        params = pika.URLParameters(RABBITMQ_URL)
        connection = pika.BlockingConnection(params)
        channel = connection.channel()
        channel.exchange_declare(exchange=RABBITMQ_EXCHANGE, exchange_type="topic", durable=True)

        message_id = 1
        while True:
            payload = {
                "reviewId": "loadgen-review",
                "commentId": f"loadgen-{message_id}",
                "user": "loadgen",
                "message": "load test message",
                "targetUser": "loadgen-target",
            }
            channel.basic_publish(
                exchange=RABBITMQ_EXCHANGE,
                routing_key=RABBITMQ_ROUTING_KEY,
                body=json.dumps(payload),
                properties=pika.BasicProperties(delivery_mode=2),
            )
            print(f"[amqp] published message {message_id}")
            message_id += 1
            time.sleep(random.uniform(0.5, 2.5))
    except Exception as exc:
        print(f"[amqp] error: {exc}")


if __name__ == "__main__":
    print("Socialbook load generator running. Ctrl+C to stop.")
    Thread(target=generate_http_traffic, daemon=True).start()
    Thread(target=generate_rabbitmq_traffic, daemon=True).start()
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("[loadgen] stopping")
