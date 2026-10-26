<?php

namespace App\Identity;

final readonly class DeskIdentity
{
    public function __construct(
        public int $userId,
        public string $name,
        public int $workspaceId,
        public string $workspaceName,
        public string $role,
        public bool $isDemo = true,
    ) {}

    public function canWrite(): bool
    {
        return in_array($this->role, ['owner', 'manager', 'mechanic_engineer'], true);
    }
}
