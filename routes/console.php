<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Every hour, return stale high-priority tickets to "open" so they are
// re-surfaced for handling (business rule: > 48h untouched).
Schedule::command('tickets:reset-stale')->hourly();
