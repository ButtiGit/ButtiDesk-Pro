<?php

use App\Identity\DeskIdentity;

it('maps the compatible PitMetric roles to explicit write access', function (string $role, bool $expected) {
    expect((new DeskIdentity(1, 'Demo', 101, 'Demo', $role))->canWrite())->toBe($expected);
})->with([
    ['owner', true], ['manager', true], ['mechanic_engineer', true],
    ['viewer', false], ['driver', false], ['unknown', false],
]);
