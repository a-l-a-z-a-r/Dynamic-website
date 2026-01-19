# Socialbook

[![Coverage](https://codecov.io/gh/a-l-a-z-a-r/Socialbook/branch/Dev/graph/badge.svg)](https://codecov.io/gh/a-l-a-z-a-r/Socialbook)
[![Tests](https://github.com/a-l-a-z-a-r/Socialbook/actions/workflows/ci.yml/badge.svg?branch=Dev)](https://github.com/a-l-a-z-a-r/Socialbook/actions/workflows/ci.yml)

Spotify but for books; ENJOY!!

## Microservices and Helm Charts

The backend has been split into dedicated microservices (reviews, users, social, booklists) and each deployment now has its own Helm chart under `helm/`. See `helm/README.md` for chart locations and install order.

Argo CD Application manifests for the microservices live at `k8s/argocd/socialbook-apps.yaml`.

## Viewing Coverage Reports

Generate HTML coverage report:
```
pytest --cov=examples --cov-report=html
```

Open in browser:
```
open htmlcov/index.html
```
