<?php

namespace App\Identity;

use App\Contracts\IdentityProvider;
use Illuminate\Http\Request;

final class DemoIdentityProvider implements IdentityProvider
{
    public function resolve(Request $request): DeskIdentity
    {
        abort_unless(app()->environment(['local', 'testing']) && config('desk.demo_enabled'), 403, 'Demo locale non disponibile.');
        $workspaces = config('desk.workspaces');
        $profiles = config('desk.profiles');
        $workspaceId = (int) $request->session()->get('desk.workspace_id', 101);
        $profile = $request->session()->get('desk.profile', 'owner');
        abort_unless(isset($workspaces[$workspaceId], $profiles[$profile]), 403);

        return new DeskIdentity(
            $profiles[$profile]['id'], $profiles[$profile]['name'],
            $workspaceId, $workspaces[$workspaceId], $profiles[$profile]['role'],
        );
    }
}
