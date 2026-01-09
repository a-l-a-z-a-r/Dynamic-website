# Requirements Evidence Guide

This document shows where each requirement is implemented and how to demonstrate it.

## REQ1: Project proposal
- Evidence: `prj-proposal`
- Demonstrate: open the proposal file and show approval notes if any.

## REQ2: Content adaptation
- Evidence: `backend/src/app.service.ts` (recommendations, shelf, feed)
- Demonstrate: call `GET /api/recommendations`, `GET /api/shelf`, `GET /api/feed` (JWT required).

## REQ3: Frontend
- Evidence: `frontend/`
- Demonstrate: run frontend container or deployment and load UI.

## REQ4: Backend API
- Evidence: `backend/src/app.controller.ts`
- Demonstrate: port-forward backend and call `/api/health`.

## REQ5: 50% backend coverage
- Evidence: `backend/jest.config.js` (coverageThreshold 50%) and tests in `backend/src/__tests__`
- Demonstrate:
  - Local: `cd backend && npm test`
  - CI: GitHub Actions `CI` → `backend-tests` job shows coverage and fails <50%.

## REQ6: CI pipeline + GitOps
- Evidence: `.github/workflows/ci.yml` and `gitops/`
- Demonstrate:
  - CI: GitHub Actions → `CI` workflow
  - GitOps: show `gitops/` repo structure and Argo configs.

## REQ7: Failure tests per service
- Evidence: `backend/src/__tests__/app.controller.failure.spec.ts`
- Demonstrate: run `npm test` and show failures covered for endpoints.

## REQ8: Database selection
- Evidence: `docs/database-schema.md`
- Demonstrate: open the doc and show MongoDB justification.

## REQ9: Database schema
- Evidence: `backend/schema/dbdiagram.dbml`, `docs/database-schema.md`
- Demonstrate: open DBML in dbdiagram.io.

## REQ10: Docker containerization
- Evidence: `backend/Dockerfile`, `docker-compose.yml`, frontend image
- Demonstrate: `docker compose up --build`.

## REQ11: Microservices architecture
- Evidence: `backend/architecture/README.md`
- Demonstrate: show diagram and service list.

## REQ12: Kubernetes with Helm
- Evidence: `k8s/`, `gitops/`
- Demonstrate: `kubectl get all -n socialbook` and Helm releases if used.

## REQ13: Observability (Prometheus & Grafana)
- Evidence: `promethus/`, `docs/monitoring/`
- Demonstrate commands:
  - `kubectl get pods -n monitoring`
  - `kubectl port-forward -n monitoring svc/prometheus-server 9090:80`
  - `kubectl port-forward -n monitoring svc/grafana 3000:80`
  - Open `http://localhost:9090` and `http://localhost:3000`.

## REQ14: RESTful API
- Evidence: `backend/src/app.controller.ts`
- Demonstrate: call endpoints with correct methods and status codes.

## REQ15: Event-driven (RabbitMQ)
- Evidence: `backend/src/queue/queue.service.ts`, `RabbitMQ/`
- Demonstrate:
  - `kubectl get pods -n rabbitmq`
  - `kubectl port-forward -n rabbitmq svc/rabbitmq 15672:15672`
  - Open `http://localhost:15672` and show queues/exchange.

## REQ16: OpenAPI/Swagger/AsyncAPI
- Evidence: `backend/src/main.ts`, `backend/docs/asyncapi.yaml`
- Demonstrate:
  - `kubectl -n socialbook port-forward svc/backend 5000:5000`
  - Open `http://localhost:5000/api/docs` and `http://localhost:5000/api/docs-json`
  - Open AsyncAPI in https://studio.asyncapi.com/.

## REQ17: C4 model diagram
- Evidence: `backend/architecture/c4-diagram.md`
- Demonstrate: open the doc.

## REQ18: Performance analysis
- Evidence: `docs/performance/`
- Demonstrate: open performance report files.

## REQ19: Load testing
- Evidence: `load-testing/` or `loadtesting/`
- Demonstrate: run k6 or provided scripts per `docs/performance/load-testing.md`.

## REQ20: JWT/OAuth2 (Keycloak)
- Evidence: `backend/src/auth/keycloak.guard.ts`, `keycloak/`
- Demonstrate: show JWT guard and Keycloak realm configs.

## REQ21: RBAC
- Evidence: `backend/src/auth/roles.guard.ts`, `backend/src/auth/roles.decorator.ts`, `backend/src/app.controller.ts`
- Demonstrate:
  - Ensure admin role is present in JWT (`realm_access.roles` or client roles).
  - Call admin endpoints:
    - `POST /api/admin/users/:username/enabled` with `{ "enabled": true }`
    - `DELETE /api/admin/users/:username`

## REQ22: SQLi/XSS protection
- Evidence: `docs/security-protections.md`, `backend/src/main.ts` validation/sanitization
- Demonstrate: show ValidationPipe + sanitize middleware.

## REQ23: HTTPS (TLS)
- Evidence: `tls.crt`, `tls.key`, `k8s/` ingress configs
- Demonstrate: show ingress TLS config.

## REQ24: Certificate management
- Evidence: `docs/certificate-management.md`
- Demonstrate: show cert-manager resources or documented process.

## REQ25: GDPR
- Evidence: `docs/gdpr-compliance.md`
- Demonstrate: open the doc.

## REQ26: Data minimization & consent
- Evidence: `docs/data-minimization-consent.md`
- Demonstrate: open the doc.

## REQ27: Ethical analysis
- Evidence: `docs/ethical-analysis.md`
- Demonstrate: open the doc.
