<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\Contact;
use App\Models\Ticket;
use App\Models\Worklog;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

final class DeskController extends Controller
{
    public function dashboard(): Response
    {
        $active = Ticket::whereNotIn('status', ['done', 'cancelled']);
        $monthStart = now(config('desk.timezone'))->startOfMonth()->utc();
        $weekStart = now(config('desk.timezone'))->startOfWeek()->utc();
        $activity = Worklog::where('performed_at', '>=', $weekStart)->get(['performed_at', 'duration_minutes']);

        return Inertia::render('Dashboard', [
            'stats' => [
                'active' => (clone $active)->count(),
                'urgent' => (clone $active)->where('priority', 'urgent')->count(),
                'minutes' => (int) Worklog::where('performed_at', '>=', $monthStart)->sum('duration_minutes'),
                'contacts' => Contact::count(),
                'done' => Ticket::where('status', 'done')->count(),
                'total' => Ticket::count(),
            ],
            'tickets' => (clone $active)->with('client')->withSum('worklogs', 'duration_minutes')->orderByRaw("CASE priority WHEN 'urgent' THEN 0 WHEN 'high' THEN 1 ELSE 2 END")->orderBy('due_at')->limit(5)->get(),
            'appointments' => Appointment::with('contact')->where('ends_at', '>=', now())->orderBy('starts_at')->limit(3)->get(),
            'activity' => collect(range(0, 6))->map(function ($day) use ($weekStart, $activity) {
                $date = $weekStart->copy()->timezone(config('desk.timezone'))->addDays($day);

                return ['date' => $date->toDateString(), 'minutes' => $activity->filter(fn ($log) => $log->performed_at->timezone(config('desk.timezone'))->toDateString() === $date->toDateString())->sum('duration_minutes')];
            }),
        ]);
    }

    public function tickets(Request $request): Response
    {
        $filters = $request->validate([
            'q' => ['nullable', 'string', 'max:120'],
            'status' => ['nullable', Rule::in(Ticket::STATUSES)],
            'priority' => ['nullable', Rule::in(Ticket::PRIORITIES)],
        ]);
        $query = Ticket::with(['client', 'supplier'])->withSum('worklogs', 'duration_minutes');
        if ($search = $filters['q'] ?? null) {
            $query->where(function (Builder $query) use ($search): void {
                $query->whereLike('title', '%'.$search.'%')->orWhereLike('category', '%'.$search.'%');
            });
        }
        foreach (['status', 'priority'] as $key) {
            if ($value = $filters[$key] ?? null) {
                $query->where($key, $value);
            }
        }

        return Inertia::render('Tickets', [
            'tickets' => $query->latest('id')->paginate(10)->withQueryString(),
            'filters' => $filters,
            'counts' => Ticket::selectRaw('status, count(*) as count')->groupBy('status')->pluck('count', 'status'),
        ]);
    }

    public function contacts(Request $request): Response
    {
        $filters = $request->validate(['q' => ['nullable', 'string', 'max:120'], 'type' => ['nullable', Rule::in(['client', 'supplier', 'both'])]]);
        $query = Contact::query();
        if ($search = $filters['q'] ?? null) {
            $query->where(fn (Builder $q) => $q->whereLike('name', '%'.$search.'%')->orWhereLike('company', '%'.$search.'%'));
        }
        if ($type = $filters['type'] ?? null) {
            $query->whereIn('type', [$type, 'both']);
        }

        return Inertia::render('Contacts', ['contacts' => $query->orderBy('name')->paginate(12)->withQueryString(), 'filters' => $filters]);
    }

    public function calendar(Request $request): Response
    {
        $data = $request->validate(['week' => ['nullable', 'date_format:Y-m-d']]);
        $start = CarbonImmutable::parse($data['week'] ?? 'now', config('desk.timezone'))->startOfWeek();

        return Inertia::render('Calendar', [
            'weekStart' => $start->toDateString(),
            'appointments' => Appointment::with(['contact', 'ticket'])->where('starts_at', '<', $start->addWeek()->utc())->where('ends_at', '>', $start->utc())->orderBy('starts_at')->get(),
        ]);
    }

    public function reports(Request $request): Response
    {
        $filters = $request->validate([
            'from' => ['nullable', 'date_format:Y-m-d'],
            'to' => ['nullable', 'date_format:Y-m-d', 'after_or_equal:from'],
        ]);
        $from = CarbonImmutable::parse($filters['from'] ?? now(config('desk.timezone'))->startOfMonth()->toDateString(), config('desk.timezone'))->startOfDay();
        $to = CarbonImmutable::parse($filters['to'] ?? now(config('desk.timezone'))->toDateString(), config('desk.timezone'))->endOfDay();
        abort_if($to->lessThan($from), 422, 'Il periodo non è valido.');
        $logs = Worklog::with('ticket.client')->whereBetween('performed_at', [$from->utc(), $to->utc()])->orderByDesc('performed_at')->paginate(20)->withQueryString();

        return Inertia::render('Reports', [
            'logs' => $logs,
            'minutes' => (int) Worklog::whereBetween('performed_at', [$from->utc(), $to->utc()])->sum('duration_minutes'),
            'filters' => ['from' => $from->toDateString(), 'to' => $to->toDateString()],
        ]);
    }
}
