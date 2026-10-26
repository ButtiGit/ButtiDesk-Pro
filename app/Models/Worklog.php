<?php

namespace App\Models;

use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property CarbonImmutable $performed_at
 * @property int $duration_minutes
 */
class Worklog extends WorkspaceModel
{
    protected $table = 'desk_worklogs';

    protected function casts(): array
    {
        return ['performed_at' => 'immutable_datetime', 'duration_minutes' => 'integer'];
    }

    /** @return BelongsTo<Ticket, $this> */
    public function ticket(): BelongsTo
    {
        return $this->belongsTo(Ticket::class);
    }
}
