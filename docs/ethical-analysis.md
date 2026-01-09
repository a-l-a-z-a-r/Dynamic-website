# REQ27: Ethical Analysis (Privacy and Societal Impact)

## Privacy Implications

- User-generated reviews and comments may reveal reading habits or preferences.
- Social graph data (friends) can infer relationships.
- Notification data can expose interaction patterns.

Mitigations:
- Use TLS for transit security.
- Restrict access to data via JWT-based authentication.
- Minimize stored data to only what is required.
- Allow deletion of user content and accounts.

## Societal Impact

Positive:
- Encourages reading and community discovery.
- Supports shared recommendations and social interaction.

Risks:
- Potential echo chambers or bias in recommendations.
- Harassment risk through comments or friend requests.

Mitigations:
- Moderation tooling (planned).
- Rate limiting and abuse reporting (planned).
- Clear community guidelines and reporting flows.

## Transparency

- Provide clear privacy and data usage statements.
- Explain recommendation logic at a high level.

## How to Demonstrate

- Provide a privacy policy and community guidelines.
- Show account deletion and data export workflows.
- Document recommendation logic and limitations.
