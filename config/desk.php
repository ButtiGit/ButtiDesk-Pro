<?php

return [
    'demo_enabled' => (bool) env('DESK_DEMO_ENABLED', false),
    'timezone' => env('DESK_TIMEZONE', 'Europe/Rome'),
    // Synthetic identities only. No passwords, shared cookies or live endpoints.
    'workspaces' => [101 => 'Butti Studio', 202 => 'Officina Demo'],
    'profiles' => [
        'owner' => ['id' => 9001, 'name' => 'Alex Demo', 'role' => 'owner'],
        'viewer' => ['id' => 9002, 'name' => 'Jamie Demo', 'role' => 'viewer'],
    ],
];
