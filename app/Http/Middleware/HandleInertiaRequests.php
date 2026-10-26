<?php

namespace App\Http\Middleware;

use App\Support\WorkspaceContext;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'desk' => function () {
                $identity = app(WorkspaceContext::class)->identity();

                return [
                    'user' => ['name' => $identity->name, 'role' => $identity->role],
                    'workspace' => ['id' => $identity->workspaceId, 'name' => $identity->workspaceName],
                    'workspaces' => collect(config('desk.workspaces'))->map(fn ($name, $id) => ['id' => $id, 'name' => $name])->values(),
                    'canWrite' => $identity->canWrite(),
                    'demo' => true,
                    'timezone' => config('desk.timezone'),
                ];
            },
            'flash' => ['success' => fn () => $request->session()->get('success')],
        ];
    }
}
