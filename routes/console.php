<?php

use Database\Seeders\DemoSeeder;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\File;

Artisan::command('desk:prepare', function () {
    if (! app()->environment(['local', 'testing']) || ! config('desk.demo_enabled')) {
        $this->error('Preparazione riservata alla demo locale esplicitamente abilitata.');

        return 1;
    }
    if (! config('app.key')) {
        $this->call('key:generate');
    }
    if (config('database.default') === 'sqlite') {
        $database = config('database.connections.sqlite.database');
        if ($database !== ':memory:' && ! File::exists($database)) {
            File::ensureDirectoryExists(dirname($database));
            File::put($database, '');
        }
    }
    if ($this->call('migrate', ['--no-interaction' => true]) !== 0) {
        return 1;
    }

    return $this->call('db:seed', ['--class' => DemoSeeder::class, '--no-interaction' => true]);
})->purpose('Prepara esclusivamente il database demo locale, senza cancellare i dati esistenti');
