# REQ24: Certificate Management and Auto-Renewal

## Overview

Socialbook uses TLS certificates for HTTPS ingress. Certificates are stored as Kubernetes secrets and
are managed either by cert-manager (recommended) or by periodic manual rotation.

## Current State in This Repo

- TLS certificate and key files exist at `tls.crt` and `tls.key`.
- Ingress configuration references TLS settings under `k8s/`.

## Recommended Implementation (cert-manager)

1) Install cert-manager in the cluster.
2) Create a ClusterIssuer or Issuer (e.g., Let's Encrypt).
3) Annotate the ingress with the issuer name.
4) cert-manager obtains and renews certificates automatically before expiry.

Example issuer (ClusterIssuer):
```yaml
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: admin@example.com
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
      - http01:
          ingress:
            class: nginx
```

Example ingress annotation:
```yaml
metadata:
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  tls:
    - hosts:
        - socialbook.example.com
      secretName: socialbook-tls
```

## Auto-Renewal Process

- cert-manager checks certificate validity and renews before expiry.
- The renewed certificate is stored in the same secret referenced by the ingress.
- The ingress controller reloads the secret automatically.

## How to Demonstrate

- Show cert-manager CRDs in the cluster:
  - `kubectl get clusterissuer`
  - `kubectl get certificate`
- Show certificate expiry date:
  - `kubectl get certificate socialbook-tls -o yaml`
- Show the ingress uses the TLS secret:
  - `kubectl get ingress socialbook -o yaml`
- Trigger a renewal test in a staging environment by shortening validity
  (cert-manager supports this via testing issuers).
