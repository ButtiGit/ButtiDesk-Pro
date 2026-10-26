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

        $response = $next($request);
        $response->headers->set('Cache-Control', 'no-store, private');
        $response->headers->set('Referrer-Policy', 'no-referrer');

        return $response;
    }
}
