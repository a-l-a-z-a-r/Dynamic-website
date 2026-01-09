# REQ23 & REQ24 – HTTPS and Certificate Management

## HTTPS Access (REQ23)
The Socialbook application is available to users over HTTPS at:

- https://socialbook.ltu-m7011e-11.se (for example /dashboard)

All communication with the application uses HTTPS. If a user tries to access
the application using HTTP, the request is automatically redirected to HTTPS.
This means that unencrypted connections are not allowed.

The TLS certificate used by the application is issued by Let’s Encrypt. (Check screenshots in req23 folder)

## Certificate Management (REQ24)
TLS certificates are handled automatically using cert-manager in Kubernetes. 

cert-manager uses the ACME protocol to request certificates from Let’s Encrypt. (Check screenshots in req23 folder)
When an Ingress resource is deployed with the correct cert-manager annotations,
cert-manager automatically requests a certificate and stores it as a Kubernetes
Secret. This Secret is then used by the Ingress to enable HTTPS.

## Automatic Certificate Renewal (REQ24)
cert-manager also handles certificate renewal automatically. It keeps track of
when certificates will expire and renews them before they become invalid.
This process does not require any manual action from the developers.

## Local Development Note
For local development, a different Kubernetes setup (such as minikube) may be
used and does not always include cert-manager. The production deployment used
for grading runs in the course Kubernetes cluster where cert-manager and
Let’s Encrypt are configured.
