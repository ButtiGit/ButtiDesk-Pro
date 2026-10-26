<?php

namespace App\Http\Controllers;

use App\Services\PitMetricBridge;
use Illuminate\Contracts\View\View;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;

final class PitMetricConnectionController extends Controller
{
    public function start(Request $request): RedirectResponse
    {
        abort_unless(PitMetricBridge::configured(), 404);
        $state = bin2hex(random_bytes(32));
        $verifier = bin2hex(random_bytes(32));
        $pending = $request->session()->get('pitmetric.pending', []);
        $pending = is_array($pending) ? array_filter($pending, fn ($flow) => is_array($flow) && ($flow['created_at'] ?? 0) > time() - 300) : [];
        $pending = array_slice($pending, -4, null, true);
        $pending[$state] = ['verifier' => $verifier, 'created_at' => time()];
        $request->session()->put('pitmetric.pending', $pending);
        $challenge = rtrim(strtr(base64_encode(hash('sha256', $verifier, true)), '+/', '-_'), '=');

        return redirect()->away(PitMetricBridge::url('/apps/buttidesk/authorize').'?'.http_build_query(['state' => $state, 'code_challenge' => $challenge]))
            ->withHeaders(['Cache-Control' => 'no-store, private', 'Referrer-Policy' => 'no-referrer']);
    }

    public function callback(Request $request, PitMetricBridge $bridge): RedirectResponse
    {
        abort_unless(PitMetricBridge::configured(), 404);
        $data = $request->validate(['state' => ['required', 'regex:/^[a-f0-9]{64}$/D'], 'code' => ['required', 'regex:/^[a-f0-9]{64}$/D']]);
        $pending = $request->session()->get('pitmetric.pending', []);
        $flow = $pending[$data['state']] ?? null;
        abort_unless(is_array($flow) && ($flow['created_at'] ?? 0) > time() - 300 && is_string($flow['verifier'] ?? null), 403);
        unset($pending[$data['state']]);
        $request->session()->put('pitmetric.pending', $pending);
        try {
            $payload = $bridge->call('token', ['code' => $data['code'], 'code_verifier' => $flow['verifier']]);
            $bridge->identity($payload);
            abort_if(Validator::make($payload, ['session_token' => ['required', 'regex:/^[a-f0-9]{64}$/D']])->fails(), 503);
        } catch (HttpExceptionInterface $exception) {
            return to_route('pitmetric.problem', ['reason' => $exception->getStatusCode() === 503 ? 'unavailable' : 'denied']);
        }
        $request->session()->regenerate();
        $request->session()->forget(['desk.workspace_id', 'desk.profile']);
        $request->session()->put(['pitmetric.session_token' => $payload['session_token'], 'pitmetric.expires_at' => $payload['expires_at']]);

        return redirect('/')->withHeaders(['Cache-Control' => 'no-store, private', 'Referrer-Policy' => 'no-referrer']);
    }

    public function logout(Request $request, PitMetricBridge $bridge): Response
    {
        if (PitMetricBridge::configured() && is_string($token = $request->session()->get('pitmetric.session_token'))) {
            try {
                $bridge->call('revoke', ['session_token' => $token]);
            } catch (HttpExceptionInterface) {
                // Local logout must complete even while the identity service is unavailable.
            }
        }
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return $request->header('X-Inertia') ? Inertia::location(route('pitmetric.problem', ['reason' => 'signed-out'])) : to_route('pitmetric.problem', ['reason' => 'signed-out']);
    }

    public function problem(Request $request): View
    {
        $reason = $request->query('reason');
        $messages = [
            'denied' => 'Il tuo account o il workspace non sono più abilitati a ButtiDesk-Pro.',
            'expired' => 'La sessione è scaduta. Accedi di nuovo prima di continuare.',
            'unavailable' => 'PitMetric non è momentaneamente raggiungibile. Nessuna operazione è stata autorizzata.',
            'signed-out' => 'Hai chiuso la sessione di ButtiDesk-Pro.',
        ];

        return view('pitmetric-connection', [
            'message' => $messages[is_string($reason) ? $reason : 'denied'] ?? $messages['denied'],
            'pitmetricUrl' => PitMetricBridge::configured() ? PitMetricBridge::url('/apps/buttidesk/return') : null,
        ]);
    }
}
