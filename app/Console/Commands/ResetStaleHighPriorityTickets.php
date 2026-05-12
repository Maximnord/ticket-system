<?php

namespace App\Console\Commands;

use App\Models\Ticket;
use Carbon\Carbon;
use Illuminate\Console\Command;

class ResetStaleHighPriorityTickets extends Command
{
    protected $signature = 'tickets:reset-stale';

    protected $description = 'Reset stuck high-priority tickets (in_progress > 48h) back to "open"';

    public function handle(): int
    {
        $threshold = Carbon::now()->subHours(48);

        $affected = Ticket::query()
            ->where('priority', 'high')
            ->where('status', 'in_progress')
            ->where('updated_at', '<=', $threshold)
            ->update(['status' => 'open']);

        $this->info("Reset {$affected} stale high-priority ticket(s) to open.");

        return Command::SUCCESS;
    }
}
