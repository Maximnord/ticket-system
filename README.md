# Ticket Management System

Full-stack ticket management system built with **Laravel 11 (API)** and **React + Vite (Frontend)**.
Includes a bonus **Node.js / Express** stats service.

---

## Requirements

- PHP 8.2+
- Composer
- Node.js 18+ & npm
- A SQL database (MySQL recommended; SQLite works out-of-the-box; SQL Server / PostgreSQL also supported by changing `DB_CONNECTION`)

---

## Installation & Run

```bash
# 1. Install dependencies
composer install
npm install

# 2. Environment
cp .env.example .env
php artisan key:generate
# edit .env to point at your DB (defaults: MySQL on 127.0.0.1, database "ticket_system")

# 3. Database
php artisan migrate --seed

# 4. Run dev servers (two terminals)
php artisan serve              # http://127.0.0.1:8000
npm run dev                    # Vite dev server

# 5. (Optional bonus) Node.js stats service
cd stats-service && npm install && npm start   # http://127.0.0.1:4000
```

Open **http://127.0.0.1:8000** in your browser.

To keep the high-priority reset rule active in production, run the Laravel scheduler:

```bash
php artisan schedule:work        # local dev
# or in production, run "php artisan schedule:run" every minute via cron
```

---

## Project Structure

```
ticket-system/
├── app/
│   ├── Console/Commands/
│   │   └── ResetStaleHighPriorityTickets.php     # 48h business rule
│   ├── Http/
│   │   ├── Controllers/Api/
│   │   │   ├── TicketController.php              # CRUD + status + assign + stats
│   │   │   └── UserController.php
│   │   └── Requests/                             # FormRequest validation
│   │       ├── ListTicketsRequest.php
│   │       ├── StoreTicketRequest.php
│   │       └── UpdateTicketRequest.php
│   └── Models/
│       ├── Ticket.php                            # scopes + business logic
│       └── User.php
├── database/
│   ├── factories/{User,Ticket}Factory.php
│   ├── migrations/...create_tickets_table.php
│   └── seeders/DatabaseSeeder.php                # seed users + tickets
├── resources/
│   ├── js/
│   │   ├── app.jsx
│   │   └── components/TicketSystem.jsx           # React UI
│   └── views/welcome.blade.php
├── routes/
│   ├── api.php                                   # /api/tickets, /api/users
│   └── console.php                               # Scheduler registration
└── stats-service/                                # Bonus Node.js service
    ├── server.js
    └── package.json
```

---

## API

| Method | Route                          | Description                                        |
|-------:|--------------------------------|----------------------------------------------------|
| GET    | `/api/users`                   | List users (for the assignment dropdown)           |
| GET    | `/api/tickets`                 | List tickets (filters: `status`, `priority`, `user_id`; sort: `sort_by`, `order`) |
| POST   | `/api/tickets`                 | Create a ticket                                    |
| PUT    | `/api/tickets/{ticket}`        | Update a ticket                                    |
| PATCH  | `/api/tickets/{ticket}/status` | Change status (enforces "cannot close unassigned") |
| PATCH  | `/api/tickets/{ticket}/assign` | Assign a user                                      |
| GET    | `/api/tickets/stats`           | Complex aggregate query (per-user workload)        |

### Example: list filtered + sorted

```
GET /api/tickets?status=open&priority=high&sort_by=created_at&order=desc
```

---

## Business Logic

1. **Cannot close without an assignee** — enforced in `TicketController@changeStatus` via `Ticket::canBeClosed()`. Returns HTTP 422 if violated.
2. **High-priority auto-reset** — the artisan command `tickets:reset-stale` finds high-priority tickets that have been stuck in `in_progress` for **more than 48 hours** and resets them back to `open`. Scheduled hourly in `routes/console.php`.

---

## Complex Query

`GET /api/tickets/stats` returns aggregated workload across all users in a single query:

```php
// app/Http/Controllers/Api/TicketController.php :: stats()
DB::table('users')
    ->leftJoin('tickets', 'tickets.assigned_user_id', '=', 'users.id')
    ->select([
        'users.id   as user_id',
        'users.name as user_name',
        DB::raw('COUNT(tickets.id) as total_tickets'),
        DB::raw("SUM(CASE WHEN tickets.status = 'open'        THEN 1 ELSE 0 END) as open_count"),
        DB::raw("SUM(CASE WHEN tickets.status = 'in_progress' THEN 1 ELSE 0 END) as in_progress_count"),
        DB::raw("SUM(CASE WHEN tickets.status = 'closed'      THEN 1 ELSE 0 END) as closed_count"),
        DB::raw("SUM(CASE WHEN tickets.priority = 'high' AND tickets.status != 'closed' THEN 1 ELSE 0 END) as open_high_priority"),
    ])
    ->groupBy('users.id', 'users.name')
    ->having('total_tickets', '>', 0)
    ->orderByDesc('open_high_priority')
    ->orderByDesc('total_tickets')
    ->get();
```

This demonstrates: `JOIN` across two tables, conditional aggregation (`SUM(CASE WHEN ...)`), `GROUP BY`, `HAVING`, and multi-key ordering — all in a single round-trip.

---

## Part B — Code Improvement

### Original code

```php
public function getOpenTickets()
{
    $tickets = DB::select("SELECT * FROM tickets WHERE status = 'open'");
    return $tickets;
}
```

### Problems

1. **Raw SQL is fragile.** It hard-codes table and column names, bypasses the schema layer, and is not portable across MySQL / SQL Server / PostgreSQL.
2. **No model — no benefits.** `DB::select` returns plain `stdClass` rows, so you lose Eloquent casts, accessors, mutators, and relationships (e.g. `$ticket->assignedUser`).
3. **Not composable.** The query is locked behind one function; you can't chain another filter (e.g. by priority) without writing a brand-new SQL string.
4. **Injection footgun.** This specific call is safe (literal string), but the pattern teaches dangerous habits — the moment any caller starts concatenating user input into the `WHERE`, it becomes vulnerable.
5. **No eager loading.** The N+1 problem is unavoidable with raw arrays.
6. **No return type / no testability.** Returning `array<stdClass>` is hard to type-hint or mock cleanly.

### Improved code

A local Eloquent scope makes the filter a reusable, composable building block:

```php
// app/Models/Ticket.php
public function scopeOpen(Builder $query): Builder
{
    return $query->where('status', 'open');
}
```

Usage:

```php
// Single filter
Ticket::open()->get();

// Composed with other scopes + eager loading
Ticket::open()->ofPriority('high')->with('assignedUser')->get();
```

### Improvements gained

- **Composable** — chains with `ofStatus`, `ofPriority`, `ofUser`, `orderBy`, etc.
- **Safe** — PDO parameter binding under the hood.
- **Rich return** — collection of `Ticket` models with relationships and casts.
- **Portable** — Eloquent compiles to the right dialect per driver.
- **Eager-loadable** — `with('assignedUser')` prevents N+1 queries.
- **Testable** — easy to assert against typed models.

---

## Part C — Frontend

Built with React + Vite + Tailwind. The UI supports the three required actions:

- View the ticket list with filters (status, priority, user) and sorting.
- Create a new ticket (with optional assignment).
- Change a ticket's status (Start Handling / Close / Reopen).
- Bonus: reassign a ticket inline via dropdown.

> The spec allows plain JS / jQuery for Part C; React is used here both to satisfy Part C and as the **Part D bonus**.

---

## Part D — Bonus

### 1. React Frontend
Implemented — see `resources/js/components/TicketSystem.jsx`.

### 2. Node.js Stats Service
Implemented under [`stats-service/`](stats-service/). It calls the Laravel API and exposes a richer `/stats` endpoint with derived metrics (percentages, average ticket age, "needs attention" list).

### 3. AWS Deployment Outline

| Concern        | Service                                                       |
|----------------|---------------------------------------------------------------|
| Compute        | **ECS Fargate** (or **App Runner**) running the Laravel app   |
| Database       | **RDS for MySQL** (Multi-AZ in prod)                          |
| Static assets  | **S3** + **CloudFront** for `npm run build` output            |
| Secrets        | **AWS Secrets Manager** for `.env` values, fetched at boot    |
| TLS            | **ACM** certificate fronting an **ALB**                       |
| Scheduler      | **EventBridge** rule → ECS task running `php artisan schedule:run` every minute |
| Logs / metrics | **CloudWatch Logs** + **CloudWatch Container Insights**       |
| CI/CD          | **GitHub Actions** → ECR push → ECS rolling deploy            |
| Node stats svc | Separate ECS task (or Lambda behind API Gateway) at `/stats`  |

A typical request path: Route 53 → CloudFront (static) → ALB (API) → ECS Fargate → RDS.

---

## Useful Commands

```bash
php artisan migrate:fresh --seed     # rebuild DB with sample data
php artisan tickets:reset-stale      # run the 48h rule manually
php artisan schedule:work            # run scheduler locally
php artisan test                     # run tests
npm run build                        # production bundle
```

---

## Environment

See [.env.example](.env.example) for the full list. Required variables:

- `APP_KEY` (generated by `php artisan key:generate`)
- `DB_CONNECTION`, `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD`

For SQL Server, set `DB_CONNECTION=sqlsrv`. For SQLite, set `DB_CONNECTION=sqlite` and create `database/database.sqlite`.
