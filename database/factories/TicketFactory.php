<?php

namespace Database\Factories;

use App\Models\Ticket;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Ticket>
 */
class TicketFactory extends Factory
{
    protected $model = Ticket::class;

    public function definition(): array
    {
        return [
            'title'            => fake()->sentence(6),
            'description'     => fake()->paragraph(),
            'status'           => fake()->randomElement(Ticket::STATUSES),
            'priority'         => fake()->randomElement(Ticket::PRIORITIES),
            'assigned_user_id' => User::factory(),
            'created_at'       => fake()->dateTimeBetween('-10 days', 'now'),
            'updated_at'       => fn (array $attrs) => $attrs['created_at'],
        ];
    }

    public function unassigned(): static
    {
        return $this->state(fn () => ['assigned_user_id' => null]);
    }

    public function open(): static
    {
        return $this->state(fn () => ['status' => 'open']);
    }

    public function highPriority(): static
    {
        return $this->state(fn () => ['priority' => 'high']);
    }
}
