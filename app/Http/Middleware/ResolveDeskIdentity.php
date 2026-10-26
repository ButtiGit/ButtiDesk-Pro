<?php

namespace App\Http\Middleware;

use App\Contracts\IdentityProvider;
use App\Support\WorkspaceContext;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

final class ResolveDeskIdentity
{
    public function __construct(private IdentityProvider $provider, private WorkspaceContext $context) {}

    public function handle(Request $request, Closure $next): Response
    {
        $this->context->set($this->provider->resolve($request));

        return $next($request);
    }
}
