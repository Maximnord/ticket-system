<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Ticket extends Model
{
    use HasFactory;

    public const STATUSES   = ['open', 'in_progress', 'closed'];
    public const PRIORITIES = ['low', 'medium', 'high'];

    protected $fillable = [
        'title',
        'description',
        'status',
        'priority',
        'assigned_user_id',
    ];

    public function assignedUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_user_id');
    }

    public function scopeOfStatus(Builder $query, string $status): Builder
    {
        return $query->where('status', $status);
    }

    public function scopeOpen(Builder $query): Builder
    {
        return $query->where('status', 'open');
    }

    public function scopeOfPriority(Builder $query, string $priority): Builder
    {
        return $query->where('priority', $priority);
    }

    public function scopeOfUser(Builder $query, int $userId): Builder
    {
        return $query->where('assigned_user_id', $userId);
    }

    public function canBeClosed(): bool
    {
        return ! is_null($this->assigned_user_id);
    }
}
