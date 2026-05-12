<?php

namespace App\Providers;

use Illuminate\Support\Facades\URL;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        // Behind Railway / any TLS-terminating proxy, request->isSecure()
        // can be false even when the public URL is HTTPS. Force https
        // schemes in production so @vite generates correct asset URLs.
        if ($this->app->environment('production')) {
            URL::forceScheme('https');
        }
    }
}
