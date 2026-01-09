# REQ11: Microservices Architecture Diagram

This diagram shows the logical services and infrastructure used in Socialbook,
including RabbitMQ and Prometheus.

```mermaid
flowchart LR
  subgraph Clients
    Web[Frontend Web]
    Mobile[Mobile/External Clients]
  end

  subgraph Edge
    API[Backend API (NestJS)]
    Auth[Keycloak]
  end

  subgraph Data
    Mongo[(MongoDB)]
  end

  subgraph Messaging
    MQ[RabbitMQ]
    Ex[Topic Exchange: socialbook.events]
  end

  subgraph Workers
    Notif[Notifications Worker]
    Recs[Recommendations Worker]
    Imports[Imports Worker]
    Feed[Feed Fanout Worker]
    Comments[Comments Worker]
    Email[Email Worker]
  end

  subgraph Observability
    Prom[Prometheus]
  end

  Web --> API
  Mobile --> API
  Web --> Auth
  Mobile --> Auth
  API --> Auth

  API --> Mongo
  API --> MQ
  MQ --> Ex
  Ex --> Notif
  Ex --> Recs
  Ex --> Imports
  Ex --> Feed
  Ex --> Comments

  Notif --> Mongo
  Recs --> Mongo
  Imports --> Mongo
  Feed --> Mongo
  Comments --> Mongo
  Email --> Mongo

  Prom --> API
  Prom --> Notif
  Prom --> Recs
  Prom --> Imports
  Prom --> Feed
  Prom --> Comments
  Prom --> Email
```

Notes:
- The API publishes domain events to RabbitMQ via a topic exchange.
- Workers consume their dedicated queues and persist results in MongoDB.
- Prometheus scrapes metrics from the API and worker services.
- Keycloak handles authentication for user-facing clients.
