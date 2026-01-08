import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  stages: [
    { duration: "1m", target: 5 },
    { duration: "3m", target: 15 },
    { duration: "3m", target: 15 },
    { duration: "1m", target: 0 },
  ],
  thresholds: {
    http_req_failed: ["rate<0.02"],
    http_req_duration: ["p(95)<3000"],
  },
};

const BASE_URL = __ENV.BASE_URL || "https://auth.192.168.49.2.nip.io";
const PATHS = (__ENV.PATHS || "/").split(",");

export default function () {
  const p = PATHS[Math.floor(Math.random() * PATHS.length)];
  const res = http.get(`${BASE_URL}${p}`, { tags: { name: p } });

  // allow 4xx (auth pages, redirects) but fail on 5xx
  check(res, { "status < 500": (r) => r.status >= 200 && r.status < 500 });

  sleep(0.1);
}
