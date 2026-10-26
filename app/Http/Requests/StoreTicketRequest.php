<?php

namespace App\Http\Requests;

use App\Models\Ticket;
use App\Support\WorkspaceContext;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreTicketRequest extends FormRequest
{
    public function authorize(): bool
    {
        return app(WorkspaceContext::class)->identity()->canWrite();
    }

    public function rules(): array
    {
        $workspaceId = app(WorkspaceContext::class)->id();

        return [
            'title' => ['required', 'string', 'max:180'],
            'description' => ['nullable', 'string', 'max:10000'],
            'category' => ['required', 'string', Rule::in(['Assistenza', 'Sviluppo', 'Manutenzione', 'Consulenza'])],
            'priority' => ['required', Rule::in(Ticket::PRIORITIES)],
            'client_id' => ['nullable', 'integer', Rule::exists('desk_contacts', 'id')->where(fn ($query) => $query->where('workspace_id', $workspaceId)->whereIn('type', ['client', 'both']))],
            'supplier_id' => ['nullable', 'integer', Rule::exists('desk_contacts', 'id')->where(fn ($query) => $query->where('workspace_id', $workspaceId)->whereIn('type', ['supplier', 'both']))],
            'due_date' => ['nullable', 'date_format:Y-m-d'],
        ];
    }

    public function messages(): array
    {
        return [
            'title.required' => 'Inserisci un titolo per il ticket.',
            'title.max' => 'Il titolo può contenere al massimo 180 caratteri.',
            'client_id.exists' => 'Seleziona un cliente di questo workspace.',
            'supplier_id.exists' => 'Seleziona un fornitore di questo workspace.',
            'due_date.date_format' => 'Inserisci una data valida.',
        ];
    }
}
