<?php

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

pest()->extend(TestCase::class)->use(RefreshDatabase::class)->in('Feature');
pest()->beforeEach(function () {
    Http::preventStrayRequests();
    config(['desk.demo_enabled' => true]);
    $this->withoutVite();
})->in('Feature');
