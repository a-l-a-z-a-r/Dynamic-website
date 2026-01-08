# RabbitMQ + Dashboard Changes

This document describes the recent Socialbook changes: RabbitMQ integration and the new Spotify-style dashboard/library layout.

## Backend changes

### RabbitMQ integration
fjgugutigutgtgtigit0u0958t57
- Added a RabbitMQ client module/service that:
  - Publishes `review.created` events when a review is created.
  - Publishes `import.requested` jobs from a new API endpoint.
  - Consumes four queues for background processing (currently logs payloads):
    - `socialbook.notifications`
    - `socialbook.recommendations`
    - `socialbook.imports`
    - `socialbook.feed-fanout`  
- RabbitMQ connection is controlled by `RABBITMQ_URL` and defaults to the in-cluster service.

### New API endpoint

- `POST /api/imports`
  - Enqueues an import job.
  - Payload: `{ "query": "...", "source": "optional" }`

## UI changes

### Spotify-style dashboard

- New library sidebar and main content area.
- Booklists are loaded for the signed-in user.
- Selecting a list shows its items.
- Feed items can be added to the active list.
- Booklists can be deleted from the sidebar or the active list panel.
- The dashboard URL is now `/dashboard` (root `/` redirects to it).
- “Last refreshed” timestamp appears in the dashboard header.

## How to see the UI changes

1. Deploy the updated frontend build.
2. Go to: `https://socialbook.ltu-m7011e-11.se/dashboard`
3. Sign in (Keycloak or username/password).
4. You should see:
   - Left sidebar with “Your Library”.
   - Main content header with “Last refreshed …”.
   - Booklist panel and feed cards with “Add to …” buttons.

## How to verify RabbitMQ integration

1. Ensure RabbitMQ is running and reachable by the backend service.
2. Create a review in the UI or via `POST /api/reviews`.
3. Check backend logs for RabbitMQ events (queue service logs the payloads).
4. Optional import test:
   - `POST /api/imports` with a `query` value.
   - Verify the queue service logs the import payload.

## Deployment notes

- Backend expects `RABBITMQ_URL` to be set; a default in-cluster URL is used if not provided.
- If you deploy with `:latest` tags, force a rollout to pick up changes.

