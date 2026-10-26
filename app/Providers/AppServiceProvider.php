<?php

namespace App\Providers;

use App\Contracts\IdentityProvider;
use App\Identity\DemoIdentityProvider;
use App\Identity\PitMetricIdentityProvider;
use App\Support\WorkspaceContext;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->scoped(WorkspaceContext::class);
        $this->app->bind(IdentityProvider::class, fn ($app) => match (config('desk.identity_provider')) {
            'demo' => $app->make(DemoIdentityProvider::class),
            'pitmetric' => $app->make(PitMetricIdentityProvider::class),
            default => throw new \LogicException('Unknown identity provider.'),
        });
    }

    public function boot(): void
    {
        Model::preventLazyLoading(! $this->app->isProduction());
    }
}
