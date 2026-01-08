import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  vus: 1,
  duration: "30s",
  thresholds: {
    http_req_failed: ["rate<0.05"],
    http_req_duration: ["p(95)<2000"],
  },
};

const BASE_URL = __ENV.BASE_URL || "https://auth.192.168.49.2.nip.io";
const PATHS = (__ENV.PATHS || "/").split(",");

export default function () {
  for (const p of PATHS) {
    const res = http.get(`${BASE_URL}${p}`, { tags: { name: p } });
    check(res, { "status is 2xx/3xx": (r) => r.status >= 200 && r.status < 400 });
    sleep(0.2);
  }
}
