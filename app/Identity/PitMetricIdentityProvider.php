<?php

namespace App\Identity;

use App\Contracts\IdentityProvider;
use App\Services\PitMetricBridge;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;

final class PitMetricIdentityProvider implements IdentityProvider
{
    public function __construct(private PitMetricBridge $bridge) {}

    public function resolve(Request $request): DeskIdentity
    {
        abort_unless(PitMetricBridge::configured(), 503, 'Il collegamento PitMetric non è configurato.');
        $token = $request->session()->get('pitmetric.session_token');
        $expires = $request->session()->get('pitmetric.expires_at', 0);
        if (! is_string($token) || ! preg_match('/^[a-f0-9]{64}$/D', $token) || (int) $expires <= time()) {
            $request->session()->forget(['pitmetric.session_token', 'pitmetric.expires_at']);
            $this->redirect($request, route($request->isMethod('GET') ? 'pitmetric.start' : 'pitmetric.problem', $request->isMethod('GET') ? [] : ['reason' => 'expired']));
        }
        try {
            return $this->bridge->identity($this->bridge->call('context', ['session_token' => $token]));
        } catch (HttpExceptionInterface $exception) {
            if ($exception->getStatusCode() !== 503) {
                $request->session()->forget(['pitmetric.session_token', 'pitmetric.expires_at']);
            }
            $this->redirect($request, route('pitmetric.problem', ['reason' => $exception->getStatusCode() === 503 ? 'unavailable' : 'denied']));
        }
    }

    private function redirect(Request $request, string $url): never
    {
        throw new HttpResponseException($request->header('X-Inertia') ? Inertia::location($url) : redirect()->to($url));
    }
}
