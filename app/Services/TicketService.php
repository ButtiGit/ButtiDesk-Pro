<?php

namespace App\Services;

use App\Models\Ticket;
use App\Models\Worklog;
use App\Support\WorkspaceContext;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

final class TicketService
{
    public function __construct(private WorkspaceContext $context) {}

    public function create(array $data): Ticket
    {
        return DB::transaction(function () use ($data) {
            $dueDate = $data['due_date'] ?? null;
            unset($data['due_date']);
            $ticket = Ticket::create([
                ...$data,
                'status' => 'open',
                'created_by' => $this->context->identity()->userId,
                'due_at' => $dueDate ? CarbonImmutable::parse($dueDate, config('desk.timezone'))->endOfDay()->utc() : null,
            ]);
            $this->audit('ticket.created', $ticket->id);

            return $ticket;
        });
    }

    public function changeStatus(Ticket $ticket, string $status): void
    {
        DB::transaction(function () use ($ticket, $status): void {
            $ticket->update(['status' => $status, 'closed_at' => $status === 'done' ? ($ticket->closed_at ?? now()) : null]);
            $this->audit('ticket.status_changed', $ticket->id);
        });
    }

    public function logWork(Ticket $ticket, array $data): Worklog
    {
        return DB::transaction(function () use ($ticket, $data) {
            $performedDate = $data['performed_date'];
            unset($data['performed_date']);
            $log = $ticket->worklogs()->create([
                ...$data,
                'user_id' => $this->context->identity()->userId,
                'performed_at' => CarbonImmutable::parse($performedDate, config('desk.timezone'))->startOfDay()->utc(),
            ]);
            $this->audit('worklog.created', $ticket->id);

            return $log;
        });
    }

    private function audit(string $event, int $ticketId): void
    {
        Log::info($event, ['workspace_id' => $this->context->id(), 'actor_id' => $this->context->identity()->userId, 'ticket_id' => $ticketId]);
    }
}
