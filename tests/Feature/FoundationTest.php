<?php

use App\Models\Ticket;
use App\Support\WorkspaceContext;
use Database\Seeders\DemoSeeder;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->seed();
});

it('renders all standalone areas without external services', function (string $uri, string $component) {
    $this->get($uri)->assertOk()->assertInertia(fn (Assert $page) => $page->component($component)->where('desk.demo', true)->where('desk.workspace.id', 101));
})->with([
    ['/', 'Dashboard'], ['/tickets', 'Tickets'], ['/contacts', 'Contacts'],
    ['/calendar', 'Calendar'], ['/reports', 'Reports'], ['/settings', 'Settings'],
    ['/tickets/create', 'TicketCreate'],
]);

it('fails closed when demo access is disabled or environment is production', function () {
    config(['desk.demo_enabled' => false]);
    $this->get('/')->assertForbidden();
    config(['desk.demo_enabled' => true]);
    app()->instance('env', 'production');
    $this->get('/')->assertForbidden();
    $this->withSession(['_token' => 'demo-test-token'])->post('/demo/context', ['workspace_id' => 101, '_token' => 'demo-test-token'])->assertForbidden();
});

it('refuses to seed outside local or testing environments', function () {
    app()->instance('env', 'production');
    expect(fn () => app(DemoSeeder::class)->run())->toThrow(RuntimeException::class);
});

it('seeds repeatedly without duplicating or overwriting demo data', function () {
    $counts = DB::table('desk_tickets')->count();
    DB::table('desk_tickets')->where('id', 1)->update(['title' => 'Accesso al gestionale da ripristinare', 'status' => 'waiting']);
    $this->seed();
    expect(DB::table('desk_tickets')->count())->toBe($counts);
    expect(DB::table('desk_tickets')->where('id', 1)->value('status'))->toBe('waiting');
});

it('never accepts a workspace supplied as a query parameter', function () {
    $this->get('/?workspace_id=202')->assertInertia(fn (Assert $page) => $page->where('desk.workspace.id', 101)->where('stats.contacts', 6));
    $this->post('/demo/context', ['workspace_id' => 9999])->assertSessionHasErrors('workspace_id');
    $this->withSession(['desk.workspace_id' => 9999])->get('/')->assertForbidden();
});

it('isolates reads, nested relationships, calendars and reports between workspaces', function () {
    $foreignId = DB::table('desk_tickets')->where('workspace_id', 202)->value('id');
    $this->get('/tickets')->assertInertia(fn (Assert $page) => $page->where('tickets.total', 12)->where('tickets.data.0.workspace_id', 101));
    $this->get('/contacts')->assertInertia(fn (Assert $page) => $page->where('contacts.total', 6)->where('contacts.data.0.workspace_id', 101));
    $this->get('/calendar')->assertInertia(fn (Assert $page) => $page->has('appointments', 3)->where('appointments.0.workspace_id', 101)->where('appointments.0.contact.workspace_id', 101));
    $this->get('/reports')->assertInertia(fn (Assert $page) => $page->where('logs.data.0.workspace_id', 101)->where('logs.data.0.ticket.workspace_id', 101));
    $this->get('/tickets/'.$foreignId)->assertNotFound();
    $this->patch('/tickets/'.$foreignId.'/status', ['status' => 'done'])->assertNotFound();
    $this->post('/tickets/'.$foreignId.'/worklogs', ['summary' => 'No'])->assertNotFound();
    $this->post('/demo/context', ['workspace_id' => 202])->assertRedirect('/');
    $this->get('/tickets/'.$foreignId)->assertOk()->assertInertia(fn (Assert $page) => $page->where('ticket.workspace_id', 202)->where('ticket.client.workspace_id', 202));
});

it('requires an explicit context even for command and job queries', function () {
    app()->forgetInstance(WorkspaceContext::class);
    expect(fn () => Ticket::count())->toThrow(LogicException::class);
});

it('keeps the health endpoint available independently of demo identity', function () {
    config(['desk.demo_enabled' => false]);
    $this->get('/up')->assertOk();
});
