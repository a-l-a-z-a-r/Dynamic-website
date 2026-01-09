# REQ26: Data Minimization and User Consent

## Data Minimization

Socialbook stores only data required to provide core features:

- Authentication and identity: handled by Keycloak.
- Profile image URL (optional).
- Reviews, ratings, comments, notifications, booklists, and friend links.

No sensitive personal data (e.g., government IDs, financial data) is required.

## Consent

- Users provide consent during account signup and use of the platform.
- Additional consent can be required for optional features such as email notifications.

## Implementation Notes

- Optional fields are not required by the API unless necessary for the feature.
- Deletion and updates are supported to honor user preferences.

## How to Demonstrate

- Show that optional fields are not required in API payloads.
- Show that account creation includes a consent step (UI or terms acceptance).
- Show feature toggles for optional notifications.
- Provide a consent log or record within Keycloak attributes (if enabled).
