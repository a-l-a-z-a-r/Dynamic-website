create with help from ai

# Load Testing (REQ18)

## Scenario
Tool: k6  
Script: `load-testing/k6-load.js`  
Target: `https://auth.192.168.49.2.nip.io`  
Paths: `/`  
TLS: self-signed (k6 run with `K6_INSECURE_SKIP_TLS_VERIFY=true`)

Stages:
- 1m ramp to 5 VUs
- 3m ramp to 15 VUs
- 3m hold 15 VUs
- 1m ramp down

## Results (k6 summary)
From latest run (also exported to `docs/performance/k6-load-summary.json`):

- http_reqs: **118449**
- http_req_failed: **0.00%**
- http_req_duration:
  - p(95): **76.04ms**
  - max: **752.37ms**
  - avg: **8.93ms**

## Observations (Grafana)
Screenshots:
- `docs/performance/screenshots/grafana-cpu-mem-under-load.png`
- `docs/performance/screenshots/grafana-restarts-under-load.png`

Notes:
- CPU increased during load / remained stable (describe what you saw).
- Memory remained stable / changed slightly (describe what you saw).
- Pod restarts stayed at 0 / increased (describe what you saw).

## Bottleneck (one sentence)
No clear bottleneck observed up to 15 VUs (p95 ~76ms, 0% failed requests). System did not appear saturated at this load.

## One improvement idea (not implemented)
Increase test intensity (e.g., higher VUs or longer hold) to identify saturation point, then consider HPA/replicas or CPU limits based on observed CPU behavior.
