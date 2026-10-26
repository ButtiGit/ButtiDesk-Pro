<?php

namespace Tests;

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use RuntimeException;

abstract class TestCase extends BaseTestCase
{
    public function createApplication(): Application
    {
        $app = parent::createApplication();
        $connection = config('database.default');
        $database = (string) config("database.connections.{$connection}.database");
        $safe = $connection === 'sqlite'
            ? ($database === ':memory:' || str_ends_with($database, '_test.sqlite'))
            : ($connection === 'pgsql' && str_ends_with($database, '_test'));
        // Runs before RefreshDatabase: never recreate a demo/shared/production schema.
        if (! $app->environment('testing') || ! $safe) {
            throw new RuntimeException('Tests require SQLite :memory: / *_test.sqlite or a dedicated PostgreSQL database ending in _test. Refusing to migrate.');
        }

        return $app;
    }
}
