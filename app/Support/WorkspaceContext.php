<?php

namespace App\Support;

use App\Identity\DeskIdentity;
use LogicException;

final class WorkspaceContext
{
    private ?DeskIdentity $identity = null;

    public function set(DeskIdentity $identity): void
    {
        $this->identity = $identity;
    }

    public function identity(): DeskIdentity
    {
        return $this->identity ?? throw new LogicException('An explicit workspace identity is required.');
    }

    public function id(): int
    {
        return $this->identity()->workspaceId;
    }
}
