# Socialbook

Simple Flask API with a static frontend.

## Run with Docker Compose

From the `Socialbook` directory:

```bash
docker compose up --build
```

- Frontend: http://localhost:8080
- API: http://localhost:5000/api/health
- MongoDB: mongodb://localhost:27017/socialbook

Stop with `docker compose down`. Use `docker compose up -d` to run detached.

### Environment

- `MONGODB_URI` (optional): override the default `mongodb://mongo:27017/socialbook` used by the backend.
- `VITE_API_BASE` (frontend, optional): defaults to `http://localhost:5000` for Docker Compose; set to your NodePort/ingress host for Kubernetes.

## Lint checks

- Backend: `cd backend && flake8`
- Frontend: `npm install` (once) then `npm run lint:frontend`
- All at once: `make lint`
