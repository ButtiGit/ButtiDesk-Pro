<?php

namespace App\Services;

use App\Identity\DeskIdentity;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

final class PitMetricBridge
{
    public static function configured(): bool
    {
        $parts = parse_url((string) config('pitmetric.url'));

        return config('desk.identity_provider') === 'pitmetric' && ! config('desk.demo_enabled')
            && strlen((string) config('pitmetric.bridge_secret')) >= 32
            && is_array($parts) && isset($parts['host'], $parts['scheme'])
            && ($parts['scheme'] === 'https' || (app()->environment(['local', 'testing']) && $parts['scheme'] === 'http'))
            && ! isset($parts['user']) && ! isset($parts['pass']) && ! isset($parts['query']) && ! isset($parts['fragment'])
            && in_array($parts['path'] ?? '', ['', '/'], true);
    }

    public static function url(string $path): string
    {
        abort_unless(self::configured(), 503, 'Configura il collegamento PitMetric e disattiva la demo.');

        return rtrim((string) config('pitmetric.url'), '/').$path;
    }

    /** @param array<string, mixed> $data
     * @return array<string, mixed>
     */
    public function call(string $action, array $data): array
    {
        abort_unless(in_array($action, ['token', 'context', 'revoke'], true), 500);
        $path = '/api/buttidesk/v1/'.$action;
        $url = self::url($path);
        $body = json_encode($data, JSON_THROW_ON_ERROR | JSON_UNESCAPED_SLASHES);
        $timestamp = (string) time();
        $nonce = bin2hex(random_bytes(16));
        $canonical = "v1\n{$timestamp}\n{$nonce}\nPOST\n{$path}\n".hash('sha256', $body);
        try {
            $response = Http::acceptJson()->connectTimeout(1)->timeout(3)->withoutRedirecting()
                ->withHeaders([
                    'X-ButtiDesk-Timestamp' => $timestamp, 'X-ButtiDesk-Nonce' => $nonce,
                    'X-ButtiDesk-Signature' => hash_hmac('sha256', $canonical, (string) config('pitmetric.bridge_secret')),
                ])->withBody($body, 'application/json')->post($url);
        } catch (ConnectionException) {
            abort(503, 'PitMetric non è momentaneamente raggiungibile.');
        }
        abort_if(in_array($response->status(), [401, 403, 404], true), 403, 'Accesso PitMetric non autorizzato.');
        abort_unless($response->successful() && is_array($response->json()), 503, 'Risposta PitMetric non disponibile.');

        return $response->json();
    }

    /** @param array<string, mixed> $payload */
    public function identity(array $payload): DeskIdentity
    {
        $validator = Validator::make($payload, [
            'protocol_version' => ['required', 'integer', Rule::in([1])],
            'expires_at' => ['required', 'integer', 'min:'.(time() + 1)],
            'context.user.id' => ['required', 'integer', 'min:1'],
            'context.user.name' => ['required', 'string', 'max:255'],
            'context.workspace.id' => ['required', 'integer', 'min:1'],
            'context.workspace.name' => ['required', 'string', 'max:255'],
            'context.role' => ['required', Rule::in(['owner', 'manager', 'mechanic_engineer', 'driver', 'viewer'])],
        ]);
        abort_if($validator->fails(), 503, 'Contesto PitMetric non valido.');
        $data = $validator->validated();

        return new DeskIdentity((int) $data['context']['user']['id'], $data['context']['user']['name'],
            (int) $data['context']['workspace']['id'], $data['context']['workspace']['name'], $data['context']['role'], false);
    }
}
