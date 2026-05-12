<?php

namespace Database\Seeders;

use App\Models\Ticket;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        $testUser = User::factory()->create([
            'name'  => 'Test User',
            'email' => 'test@example.com',
        ]);

        $otherUsers = User::factory(4)->create();
        $allUsers   = $otherUsers->push($testUser);

        // A spread of tickets across users, statuses, and priorities.
        Ticket::factory(20)
            ->recycle($allUsers)
            ->create();

        // A few explicitly unassigned ones (cannot be closed by rule).
        Ticket::factory(3)->unassigned()->open()->create();

        // A couple of high-priority open tickets.
        Ticket::factory(2)
            ->recycle($allUsers)
            ->open()
            ->highPriority()
            ->create();
    }
}
