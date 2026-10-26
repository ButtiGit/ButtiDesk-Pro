<?php

use Carbon\CarbonImmutable;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->seed();
});

function ticketPayload(array $overrides = []): array
{
    return array_replace(['title' => 'Nuova richiesta demo', 'category' => 'Sviluppo', 'priority' => 'high', 'due_date' => '2026-12-01'], $overrides);
}

it('creates a ticket with trusted actor and tenant, regardless of forged fields', function () {
    $client = DB::table('desk_contacts')->where('workspace_id', 101)->where('type', 'client')->value('id');
    $response = $this->post('/tickets', ticketPayload(['client_id' => $client, 'workspace_id' => 202, 'created_by' => 111, 'status' => 'done']));
    $ticket = DB::table('desk_tickets')->where('title', 'Nuova richiesta demo')->first();
    $response->assertRedirect('/tickets/'.$ticket->id);
    expect((int) $ticket->workspace_id)->toBe(101)->and((int) $ticket->created_by)->toBe(9001)->and($ticket->status)->toBe('open');
    expect(CarbonImmutable::parse($ticket->due_at)->utc()->format('Y-m-d H:i'))->toBe('2026-12-01 22:59');
});

it('rejects cross-workspace and incompatible contact references', function (string $field, int $workspace, string $type) {
    $id = DB::table('desk_contacts')->where('workspace_id', $workspace)->where('type', $type)->value('id');
    $this->post('/tickets', ticketPayload([$field => $id]))->assertSessionHasErrors($field);
    $this->assertDatabaseMissing('desk_tickets', ['title' => 'Nuova richiesta demo']);
})->with([
    ['client_id', 202, 'client'], ['supplier_id', 202, 'supplier'],
    ['client_id', 101, 'supplier'], ['supplier_id', 101, 'client'],
]);

it('enforces composite tenant foreign keys in the database', function () {
    $foreignId = DB::table('desk_contacts')->where('workspace_id', 202)->value('id');
    expect(fn () => DB::table('desk_tickets')->insert([
        'workspace_id' => 101, 'client_id' => $foreignId, 'created_by' => 9001,
        'title' => 'Invalid reference', 'status' => 'open', 'priority' => 'normal', 'category' => 'Assistenza',
    ]))->toThrow(QueryException::class);
});

it('prevents viewers from all write operations', function () {
    $id = DB::table('desk_tickets')->where('workspace_id', 101)->value('id');
    $this->post('/demo/context', ['profile' => 'viewer'])->assertRedirect('/');
    $this->get('/')->assertInertia(fn (Assert $page) => $page->where('desk.canWrite', false));
    $this->get('/tickets/create')->assertForbidden();
    $this->post('/tickets', ticketPayload())->assertForbidden();
    $this->patch('/tickets/'.$id.'/status', ['status' => 'done'])->assertForbidden();
    $this->post('/tickets/'.$id.'/worklogs', ['summary' => 'No'])->assertForbidden();
    $this->get('/tickets/'.$id)->assertOk();
});

it('closes and reopens tickets while keeping timestamps consistent', function () {
    $id = DB::table('desk_tickets')->where('workspace_id', 101)->value('id');
    $this->patch('/tickets/'.$id.'/status', ['status' => 'invalid'])->assertSessionHasErrors('status');
    $this->patch('/tickets/'.$id.'/status', ['status' => 'done'])->assertRedirect();
    expect(DB::table('desk_tickets')->where('id', $id)->value('closed_at'))->not->toBeNull();
    $this->patch('/tickets/'.$id.'/status', ['status' => 'progress'])->assertRedirect();
    $this->assertDatabaseHas('desk_tickets', ['id' => $id, 'status' => 'progress', 'closed_at' => null]);
});

it('registers work in integer minutes and reflects it in reports', function () {
    $id = DB::table('desk_tickets')->where('workspace_id', 101)->value('id');
    $this->post('/tickets/'.$id.'/worklogs', [
        'summary' => 'Test isolato completato', 'duration_minutes' => 35,
        'performed_date' => now('Europe/Rome')->toDateString(), 'workspace_id' => 202, 'user_id' => 1,
    ])->assertRedirect();
    $this->assertDatabaseHas('desk_worklogs', ['ticket_id' => $id, 'workspace_id' => 101, 'user_id' => 9001, 'duration_minutes' => 35]);
    $this->get('/tickets/'.$id)->assertInertia(fn (Assert $page) => $page->has('ticket.worklogs', 3));
    $this->get('/reports')->assertOk();
});

it('validates worklog duration and dates', function (array $changes, string $error) {
    $id = DB::table('desk_tickets')->where('workspace_id', 101)->value('id');
    $this->post('/tickets/'.$id.'/worklogs', array_replace([
        'summary' => 'Test', 'duration_minutes' => 30, 'performed_date' => now('Europe/Rome')->toDateString(),
    ], $changes))->assertSessionHasErrors($error);
})->with([
    [['duration_minutes' => -10], 'duration_minutes'],
    [['duration_minutes' => 0], 'duration_minutes'],
    [['duration_minutes' => 1.5], 'duration_minutes'],
    [['performed_date' => 'bad-date'], 'performed_date'],
    [['performed_date' => '2099-01-01'], 'performed_date'],
]);

it('filters tickets without escaping the tenant condition through an OR search', function () {
    $this->get('/tickets?q=sviluppo')->assertInertia(fn (Assert $page) => $page->where('tickets.total', 3)->where('tickets.data.0.workspace_id', 101));
    $this->get('/contacts?q=aurora')->assertInertia(fn (Assert $page) => $page->where('contacts.total', 1)->where('contacts.data.0.workspace_id', 101));
    $this->get('/tickets?status=done')->assertInertia(fn (Assert $page) => $page->where('tickets.total', 4));
    $this->get('/tickets?status=nonsense')->assertSessionHasErrors('status');
});
