import express from 'express';
import fetch from 'node-fetch';

const PORT = process.env.PORT || 4000;
const LARAVEL_URL = process.env.LARAVEL_URL || 'http://127.0.0.1:8000';

const app = express();

app.get('/health', (_req, res) => res.json({ ok: true }));

// Pulls /api/tickets and /api/tickets/stats from Laravel and returns
// a richer payload: aggregate counts, percentages, average age, and a
// "needs attention" list (open + high priority older than 24h).
app.get('/stats', async (_req, res) => {
    try {
        const [ticketsRes, statsRes] = await Promise.all([
            fetch(`${LARAVEL_URL}/api/tickets`),
            fetch(`${LARAVEL_URL}/api/tickets/stats`),
        ]);

        if (!ticketsRes.ok || !statsRes.ok) {
            return res.status(502).json({ error: 'Upstream Laravel API unavailable' });
        }

        const tickets = await ticketsRes.json();
        const stats = await statsRes.json();

        const total = tickets.length;
        const now = Date.now();
        const ageMs = (t) => now - new Date(t.created_at).getTime();
        const HOUR = 1000 * 60 * 60;

        const byStatus = tickets.reduce((acc, t) => {
            acc[t.status] = (acc[t.status] || 0) + 1;
            return acc;
        }, {});

        const byPriority = tickets.reduce((acc, t) => {
            acc[t.priority] = (acc[t.priority] || 0) + 1;
            return acc;
        }, {});

        const avgAgeHours = total === 0
            ? 0
            : +(tickets.reduce((sum, t) => sum + ageMs(t), 0) / total / HOUR).toFixed(2);

        const needsAttention = tickets
            .filter((t) => t.priority === 'high' && t.status === 'open' && ageMs(t) > 24 * HOUR)
            .map((t) => ({ id: t.id, title: t.title, age_hours: +(ageMs(t) / HOUR).toFixed(1) }));

        const pct = (n) => (total === 0 ? 0 : +((n / total) * 100).toFixed(1));

        res.json({
            generated_at: new Date().toISOString(),
            totals: {
                tickets: total,
                by_status: byStatus,
                by_priority: byPriority,
                pct_open: pct(byStatus.open || 0),
                pct_closed: pct(byStatus.closed || 0),
            },
            avg_age_hours: avgAgeHours,
            needs_attention: needsAttention,
            laravel_aggregates: stats,
        });
    } catch (err) {
        res.status(500).json({ error: 'Failed to compute stats', detail: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`Ticket stats service listening on http://127.0.0.1:${PORT}`);
    console.log(`Proxying Laravel API at ${LARAVEL_URL}`);
});
