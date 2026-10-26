<?php

use App\Http\Middleware\HandleInertiaRequests;
use App\Services\PitMetricBridge;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    config(['desk.identity_provider' => 'pitmetric', 'desk.demo_enabled' => false,
        'pitmetric.url' => 'https://pitmetric.example.test', 'pitmetric.bridge_secret' => str_repeat('s', 64)]);
});

function pitmetricPayload(string $role = 'owner'): array
{
    return ['protocol_version' => 1, 'session_token' => str_repeat('b', 64), 'expires_at' => time() + 3600,
        'context' => ['user' => ['id' => 77, 'name' => 'Utente Reale'], 'workspace' => ['id' => 401, 'name' => 'Team Autorizzato'], 'role' => $role]];
}

function connectedSession(): array
{
    return ['pitmetric.session_token' => str_repeat('b', 64), 'pitmetric.expires_at' => time() + 3600];
}

it('starts a browser-bound PKCE flow without copying identity claims into the URL', function () {
    $response = $this->get('/auth/pitmetric/start')->assertRedirect()->assertHeader('Referrer-Policy', 'no-referrer');
    $url = $response->headers->get('Location');
    parse_str(parse_url($url, PHP_URL_QUERY), $query);
    expect($url)->toStartWith('https://pitmetric.example.test/apps/buttidesk/authorize?')->not->toContain('session_token')->not->toContain('user_id');
    $response->assertSessionHas('pitmetric.pending.'.$query['state']);
    $flow = session('pitmetric.pending.'.$query['state']);
    expect($query['code_challenge'])->toBe(rtrim(strtr(base64_encode(hash('sha256', $flow['verifier'], true)), '+/', '-_'), '='));
    Http::assertNothingSent();
});

it('requires matching unexpired state and consumes the callback once', function () {
    Http::fake(['https://pitmetric.example.test/api/buttidesk/v1/token' => Http::response(pitmetricPayload())]);
    $state = str_repeat('a', 64);
    $code = str_repeat('c', 64);
    $this->get('/auth/pitmetric/callback?state='.$state.'&code='.$code)->assertForbidden();
    Http::assertNothingSent();
    $session = ['pitmetric.pending' => [$state => ['verifier' => str_repeat('v', 64), 'created_at' => time()]]];
    $this->withSession($session)->get('/auth/pitmetric/callback?state='.$state.'&code='.$code)->assertRedirect('/')
        ->assertSessionHas('pitmetric.session_token', str_repeat('b', 64))->assertSessionMissing('pitmetric.pending.'.$state);
    $this->get('/auth/pitmetric/callback?state='.$state.'&code='.$code)->assertForbidden();
    Http::assertSentCount(1);
    Http::assertSent(function ($request) use ($code) {
        $timestamp = $request->header('X-ButtiDesk-Timestamp')[0];
        $nonce = $request->header('X-ButtiDesk-Nonce')[0];
        $canonical = "v1\n{$timestamp}\n{$nonce}\nPOST\n/api/buttidesk/v1/token\n".hash('sha256', $request->body());

        return $request['code'] === $code && $request['code_verifier'] === str_repeat('v', 64)
            && hash_equals(hash_hmac('sha256', $canonical, str_repeat('s', 64)), $request->header('X-ButtiDesk-Signature')[0]);
    });
});

it('does not exchange expired callbacks or accept arbitrary identity claims', function () {
    $state = str_repeat('a', 64);
    $this->withSession(['pitmetric.pending' => [$state => ['verifier' => str_repeat('v', 64), 'created_at' => time() - 301]]])
        ->get('/auth/pitmetric/callback?state='.$state.'&code='.str_repeat('c', 64))->assertForbidden();
    Http::assertNothingSent();
    $this->get('/?user_id=77&workspace_id=401')->assertRedirect(route('pitmetric.start'));
});

it('resolves a live identity without exposing tokens or demo controls to the frontend', function () {
    Http::fake(['https://pitmetric.example.test/api/buttidesk/v1/context' => Http::response(pitmetricPayload())]);
    $this->withSession(connectedSession())->get('/')->assertOk()->assertInertia(fn (Assert $page) => $page
        ->where('desk.demo', false)->where('desk.user.name', 'Utente Reale')->where('desk.workspace.id', 401)
        ->where('desk.links.pitmetric', 'https://pitmetric.example.test/apps/buttidesk/return')->where('desk.canWrite', true)->missing('desk.session_token'))
        ->assertDontSee(str_repeat('b', 64))->assertDontSee(str_repeat('s', 64))->assertHeader('Cache-Control', 'no-store, private');
    Http::assertSentCount(1);
    $this->post('/demo/context', ['profile' => 'owner', 'workspace_id' => 101])->assertForbidden();
});

it('applies the current workspace role before every write', function () {
    Http::fake(['https://pitmetric.example.test/api/buttidesk/v1/context' => Http::response(pitmetricPayload('viewer'))]);
    $this->withSession(connectedSession())->get('/')->assertInertia(fn (Assert $page) => $page->where('desk.canWrite', false));
    $this->get('/tickets/create')->assertForbidden();
    $this->post('/tickets', ['title' => 'Forged', 'category' => 'Assistenza', 'priority' => 'normal'])->assertForbidden();
    $this->assertDatabaseMissing('desk_tickets', ['title' => 'Forged']);
});

it('fails closed on revocation outage malformed responses or redirects', function (int $status, string $reason) {
    Http::fake(['https://pitmetric.example.test/api/buttidesk/v1/context' => Http::response([], $status)]);
    $this->withSession(connectedSession())->get('/')->assertRedirect(route('pitmetric.problem', ['reason' => $reason]));
    $this->assertDatabaseCount('desk_tickets', 0);
})->with([[403, 'denied'], [401, 'denied'], [503, 'unavailable'], [302, 'unavailable'], [200, 'unavailable']]);

it('does not fall back to demo identities when the source connection fails', function () {
    Http::fake(['https://pitmetric.example.test/api/buttidesk/v1/context' => Http::failedConnection()]);
    $this->withSession([...connectedSession(), 'desk.profile' => 'owner', 'desk.workspace_id' => 101])->get('/')
        ->assertRedirect(route('pitmetric.problem', ['reason' => 'unavailable']));
});

it('forces a full navigation for expired Inertia sessions rather than submitting an unauthenticated write', function () {
    $this->withSession(['pitmetric.expires_at' => time() - 1])->get('/', ['X-Inertia' => 'true', 'X-Inertia-Version' => (string) app(HandleInertiaRequests::class)->version(Request::create('/'))])->assertStatus(409)->assertHeader('X-Inertia-Location', route('pitmetric.start'));
    $this->post('/tickets', ['title' => 'Blocked'])->assertRedirect(route('pitmetric.problem', ['reason' => 'expired']));
    $this->assertDatabaseCount('desk_tickets', 0);
    Http::assertNothingSent();
});

it('clears the local session even when remote logout is unavailable', function () {
    Http::fake(['https://pitmetric.example.test/api/buttidesk/v1/revoke' => Http::response([], 503)]);
    $this->withSession(connectedSession())->post('/auth/pitmetric/logout')->assertRedirect(route('pitmetric.problem', ['reason' => 'signed-out']))
        ->assertSessionMissing('pitmetric.session_token');
});

it('refuses unsafe configuration and production demo access', function () {
    config(['pitmetric.url' => 'https://attacker@pitmetric.example.test']);
    expect(PitMetricBridge::configured())->toBeFalse();
    $this->get('/')->assertServiceUnavailable();
    config(['pitmetric.url' => 'https://pitmetric.example.test', 'desk.demo_enabled' => true]);
    $this->get('/')->assertServiceUnavailable();
});
