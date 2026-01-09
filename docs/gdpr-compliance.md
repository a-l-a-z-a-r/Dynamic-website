# REQ25: GDPR Compliance Documentation

## Scope

Socialbook processes personal data (user identifiers, profiles, reviews). The system must comply
with GDPR principles: lawful basis, transparency, purpose limitation, data minimization, accuracy,
storage limitation, integrity/confidentiality, and accountability.

## Data Categories

- Account data: username, email, names (Keycloak).
- Profile data: profile image URL.
- Content data: reviews, comments, notifications, friends, booklists.
- Technical data: timestamps, IP logs (if enabled at ingress).

## Lawful Basis

- Consent for account creation and use of the service.
- Legitimate interest for service security and fraud prevention.

## User Rights

- Right to access: export user data on request.
- Right to rectification: update profile and content.
- Right to erasure: delete account and personal content.
- Right to restriction: temporary content removal.
- Right to portability: export JSON data.

## Security Measures

- HTTPS/TLS for data in transit.
- Access controls via Keycloak (JWT verification).
- Database access restricted to internal services.

## Data Retention

- Retain logs for operational and security monitoring (configurable).
- Remove user content and profile data when account is deleted.

## How to Demonstrate

- Provide a data export endpoint or procedure (admin tooling).
- Show deletion procedures for user data.
- Show TLS is enabled for all public endpoints.
- Document access controls (JWT guard) and internal network policies.
