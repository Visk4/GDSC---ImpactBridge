# H1 Database Foundation

The first hour is reserved for the schema that powers the full demo flow.

## Tables

- `ngos`: NGO profile, registration details, seed/demo data, AI-generated proposal payload.
- `corporates`: CSR organization profile and budget context.
- `projects`: structured proposal records generated from NGO descriptions.
- `mandates`: corporate CSR focus and eligibility constraints.
- `matches`: scored NGO-to-corporate results with score breakdown.
- `audits`: lightweight activity log for traceability.
- `district_metrics`: heatmap source for need vs funding visuals.

## Design Choices

- UUID primary keys keep the schema simple and safe for distributed services.
- JSONB stores AI output without forcing premature normalization.
- Array columns cover states, SDG tags, and Schedule VII categories without extra join tables.
- Seed data is built in from the start so the demo can run instantly.

## Demo Expectations

- 10 seeded NGOs.
- 3 seeded corporates.
- 3 seeded CSR mandates.
- 10 seeded district metrics rows for the first heatmap pass.
