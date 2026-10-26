<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/** @property int $id */
class Ticket extends WorkspaceModel
{
    protected $table = 'desk_tickets';

    public const STATUSES = ['open', 'progress', 'waiting', 'done', 'cancelled'];

    public const PRIORITIES = ['low', 'normal', 'high', 'urgent'];

    protected function casts(): array
    {
        return ['due_at' => 'immutable_datetime', 'closed_at' => 'immutable_datetime'];
    }

    /** @return BelongsTo<Contact, $this> */
    public function client(): BelongsTo
    {
        return $this->belongsTo(Contact::class, 'client_id');
    }

    /** @return BelongsTo<Contact, $this> */
    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Contact::class, 'supplier_id');
    }

    /** @return HasMany<Worklog, $this> */
    public function worklogs(): HasMany
    {
        return $this->hasMany(Worklog::class);
    }
}
