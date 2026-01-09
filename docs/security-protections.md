# REQ22: Protection Against SQL Injection and XSS

## SQL Injection Protection

Socialbook backend uses MongoDB via Mongoose, not SQL. Mongoose uses parameterized queries
and query builders rather than string-concatenated SQL, which mitigates traditional SQL injection.

Additional controls:
- Inputs are validated in controllers before reaching the database.
- Queries use explicit fields and filters (no raw query strings from users).
- Global validation and whitelisting via NestJS `ValidationPipe`.
- Request sanitization removes `$` and `.` keys from incoming payloads.

## XSS Protection

XSS is primarily a frontend concern. The backend reduces risk by:
- Returning JSON responses only; no HTML templating.
- Avoiding unsafe string concatenation for HTML on the server.

Frontend protections should include:
- Escaping all user-generated content before rendering.
- Using framework-safe rendering (React default escaping).
- Setting Content Security Policy (CSP) headers at the ingress or frontend server.

## How to Demonstrate

- Show MongoDB/Mongoose usage in `backend/src/**` with query builders.
- Show controller-level validation (e.g., required fields and numeric checks).
- Show `ValidationPipe` and sanitize middleware in `backend/src/main.ts`.
- Show frontend rendering of user content uses default React escaping.
- Show CSP headers at ingress or frontend server (if configured).
