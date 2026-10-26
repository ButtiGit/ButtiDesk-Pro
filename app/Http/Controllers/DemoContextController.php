<?php

namespace App\Http\Controllers;

use App\Support\WorkspaceContext;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

final class DemoContextController extends Controller
{
    public function __invoke(Request $request): RedirectResponse
    {
        abort_unless(app(WorkspaceContext::class)->identity()->isDemo, 403);
        $data = $request->validate([
            'workspace_id' => ['sometimes', 'required', 'integer', Rule::in(array_keys(config('desk.workspaces')))],
            'profile' => ['sometimes', 'required', Rule::in(array_keys(config('desk.profiles')))],
        ]);
        if (isset($data['workspace_id'])) {
            $request->session()->put('desk.workspace_id', (int) $data['workspace_id']);
        }
        if (isset($data['profile'])) {
            $request->session()->put('desk.profile', $data['profile']);
        }
        $request->session()->regenerate();

        return to_route('dashboard')->with('success', 'Contesto demo aggiornato.');
    }
}
