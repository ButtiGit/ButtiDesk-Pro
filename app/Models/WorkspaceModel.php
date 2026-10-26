<?php

namespace App\Models;

use App\Support\WorkspaceContext;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

/**
 * All domain reads and writes require an explicit, server-resolved workspace.
 *
 * @property int $workspace_id
 */
abstract class WorkspaceModel extends Model
{
    protected $guarded = ['id', 'workspace_id'];

    protected static function booted(): void
    {
        static::addGlobalScope('workspace', function (Builder $query): void {
            $query->where($query->qualifyColumn('workspace_id'), app(WorkspaceContext::class)->id());
        });
        static::creating(function (WorkspaceModel $model): void {
            $model->workspace_id = app(WorkspaceContext::class)->id();
        });
        static::updating(function (WorkspaceModel $model): void {
            abort_unless((int) $model->getOriginal('workspace_id') === app(WorkspaceContext::class)->id(), 403);
            $model->workspace_id = app(WorkspaceContext::class)->id();
        });
        static::deleting(function (WorkspaceModel $model): void {
            abort_unless((int) $model->workspace_id === app(WorkspaceContext::class)->id(), 403);
        });
    }
}
