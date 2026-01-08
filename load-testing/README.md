# Load Testing (k6) — REQ19

## Prereqs
Install k6 locally.

## Defaults
These scripts target the Socialbook ingress by default.

## Run smoke test
```bash
K6_INSECURE_SKIP_TLS_VERIFY=true \
BASE_URL="https://auth.192.168.49.2.nip.io" \
PATHS="/" \
k6 run load-testing/k6-smoke.js
