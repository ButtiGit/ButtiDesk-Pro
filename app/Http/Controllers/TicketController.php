<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreTicketRequest;
use App\Models\Contact;
use App\Models\Ticket;
use App\Services\TicketService;
use App\Support\WorkspaceContext;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

final class TicketController extends Controller
{
    public function create(WorkspaceContext $context): Response
    {
        abort_unless($context->identity()->canWrite(), 403);

        return Inertia::render('TicketCreate', ['contacts' => Contact::orderBy('name')->get(['id', 'name', 'company', 'type'])]);
    }

    public function store(StoreTicketRequest $request, TicketService $service): RedirectResponse
    {
        $ticket = $service->create($request->validated());

        return to_route('tickets.show', $ticket->id)->with('success', 'Ticket creato. Tutto è pronto per iniziare.');
    }

    // Explicit scoped lookups after identity middleware; never bind a model before tenant resolution.
    public function show(string $ticket): Response
    {
        return Inertia::render('TicketShow', ['ticket' => Ticket::with(['client', 'supplier', 'worklogs' => fn ($q) => $q->orderByDesc('performed_at')])->withSum('worklogs', 'duration_minutes')->findOrFail($ticket)]);
    }

    public function status(Request $request, string $ticket, WorkspaceContext $context, TicketService $service): RedirectResponse
    {
        abort_unless($context->identity()->canWrite(), 403);
        $record = Ticket::findOrFail($ticket);
        $data = $request->validate(['status' => ['required', Rule::in(Ticket::STATUSES)]]);
        $service->changeStatus($record, $data['status']);

        return back()->with('success', 'Stato del ticket aggiornato.');
    }

    public function worklog(Request $request, string $ticket, WorkspaceContext $context, TicketService $service): RedirectResponse
    {
        abort_unless($context->identity()->canWrite(), 403);
        $record = Ticket::findOrFail($ticket);
        $data = $request->validate([
            'summary' => ['required', 'string', 'max:180'],
            'details' => ['nullable', 'string', 'max:10000'],
            'duration_minutes' => ['required', 'integer', 'min:1', 'max:1440'],
            'performed_date' => ['required', 'date_format:Y-m-d', 'before_or_equal:'.now(config('desk.timezone'))->toDateString()],
        ]);
        $service->logWork($record, $data);

        return back()->with('success', 'Intervento registrato. Il tempo conta.');
    }
}
