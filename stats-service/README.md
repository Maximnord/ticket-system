# Ticket Stats Service (Bonus)

A small Node.js (Express) service that augments the Laravel API with derived metrics.

## Endpoints

- `GET /health` — liveness check.
- `GET /stats` — aggregate counts, percentages, average ticket age in hours, and a "needs attention" list (high-priority open tickets older than 24h).

## Running

```bash
cd stats-service
npm install
LARAVEL_URL=http://127.0.0.1:8000 npm start
```

By default it listens on port `4000`. Override with `PORT=...`.
