# ImpactBridge 24-Hour Execution Plan

Solo build. Strong React. Gemini-ready. Railway deploy.

## Day 1: Backend, AI Pipeline, Data Foundation

### H1-H2: Project Setup + DB Schema

- Create the backend scaffold.
- Define the core tables: `ngos`, `corporates`, `projects`, `mandates`, `matches`, `audits`, `district_metrics`.
- Add the first migration and seed 10 NGOs plus 3 corporates.

### H3-H4: Spring Boot REST API

- Build CRUD endpoints for NGOs and corporates.
- Add match retrieval and heatmap endpoints.
- Enable CORS for the frontend.

### H5-H6: Gemini Proposal Generation

- Build the Node/Express AI service.
- Implement proposal generation with structured JSON output.
- Test against multiple NGO descriptions.

### H7: CSR Compliance Tooling

- Add compliance lookup logic.
- Map activity descriptions to Schedule VII categories.
- Return short legal notes for matches.

### H8-H9: Matching Engine

- Score geographic fit, thematic fit, budget fit, compliance, and impact density.
- Store ranked matches with breakdown fields.

### H10: Heatmap Data Pipeline

- Load district need data.
- Serve heatmap-friendly district metrics.

### H11-H12: End-to-End Integration

- Run the complete NGO-to-proposal-to-match flow.
- Seed demo data through the pipeline.
- Deploy the backend.

## Day 2: Frontend, Polish, Deploy, Submit

### H13-H14: React Scaffold + Routing

- Set up Vite, React, and routing.
- Add shared UI primitives.

### H15-H16: NGO Onboarding + Proposal Reveal

- Build the onboarding form.
- Show AI generation loading state.
- Animate the proposal reveal.

### H17-H18: Corporate Dashboard + Match Cards

- Add corporate inputs and ranked match cards.
- Display score, compliance, and filters.

### H19-H20: Need vs Funding Heatmap

- Render the India map.
- Visualize high-need zones and NGO markers.

### H21: Landing Page + Impact Numbers

- Ship the hero, stats, and primary CTAs.
- Add a short three-step explanation.

### H22: Full Deployment + Smoke Test

- Deploy frontend and backend.
- Verify all environment variables.
- Test the live demo flow end to end.

### H23: Demo Video Recording

- Record a sub-2-minute walkthrough.
- Keep the script focused on problem, solution, matching, and map.

### H24: Submission Form

- Fill the submission form carefully.
- Add links, metrics, architecture, and user feedback.
- Submit early.
