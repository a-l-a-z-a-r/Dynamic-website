# Socialbook Helm Charts

This directory contains a Helm chart per deployment, split into microservices.

## Argo CD Applications

Argo CD Application manifests are in `k8s/argocd/socialbook-apps.yaml`.

## Charts

- `helm/socialbook-reviews` - reviews/feed/imports API
- `helm/socialbook-users` - signup/login/profile/admin API
- `helm/socialbook-social` - friends and notifications API
- `helm/socialbook-booklists` - booklists API
- `helm/socialbook-frontend` - frontend web app
- `helm/socialbook-mongo` - MongoDB
- `helm/socialbook-notifications-worker` - notifications worker
- `helm/socialbook-ingress` - ingress routing for all services

## Install Order (example)

```bash
helm install socialbook-mongo helm/socialbook-mongo
helm install socialbook-reviews helm/socialbook-reviews
helm install socialbook-users helm/socialbook-users
helm install socialbook-social helm/socialbook-social
helm install socialbook-booklists helm/socialbook-booklists
helm install socialbook-frontend helm/socialbook-frontend
helm install socialbook-notifications-worker helm/socialbook-notifications-worker
helm install socialbook-ingress helm/socialbook-ingress
```

Override values per environment with `-f` as needed.
