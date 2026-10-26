<?php

namespace App\Providers;

use App\Contracts\IdentityProvider;
use App\Identity\DemoIdentityProvider;
use App\Support\WorkspaceContext;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->scoped(WorkspaceContext::class);
        $this->app->bind(IdentityProvider::class, DemoIdentityProvider::class);
    }

    public function boot(): void
    {
        Model::preventLazyLoading(! $this->app->isProduction());
    }
}
