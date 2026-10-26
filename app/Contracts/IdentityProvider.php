<?php

namespace App\Contracts;

use App\Identity\DeskIdentity;
use Illuminate\Http\Request;

interface IdentityProvider
{
    public function resolve(Request $request): DeskIdentity;
}
