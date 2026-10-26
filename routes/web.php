<?php

use App\Http\Controllers\DemoContextController;
use App\Http\Controllers\DeskController;
use App\Http\Controllers\PitMetricConnectionController;
use App\Http\Controllers\TicketController;
use App\Http\Middleware\ResolveDeskIdentity;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::middleware(ResolveDeskIdentity::class)->group(function () {
    Route::get('/', [DeskController::class, 'dashboard'])->name('dashboard');
    Route::get('/tickets', [DeskController::class, 'tickets'])->name('tickets.index');
    Route::get('/tickets/create', [TicketController::class, 'create'])->name('tickets.create');
    Route::post('/tickets', [TicketController::class, 'store'])->middleware('throttle:30,1')->name('tickets.store');
    Route::get('/tickets/{ticket}', [TicketController::class, 'show'])->whereNumber('ticket')->name('tickets.show');
    Route::patch('/tickets/{ticket}/status', [TicketController::class, 'status'])->whereNumber('ticket')->name('tickets.status');
    Route::post('/tickets/{ticket}/worklogs', [TicketController::class, 'worklog'])->whereNumber('ticket')->middleware('throttle:30,1')->name('tickets.worklogs.store');
    Route::get('/contacts', [DeskController::class, 'contacts'])->name('contacts.index');
    Route::get('/calendar', [DeskController::class, 'calendar'])->name('calendar');
    Route::get('/reports', [DeskController::class, 'reports'])->name('reports');
    Route::get('/settings', fn () => Inertia::render('Settings'))->name('settings');
    Route::post('/demo/context', DemoContextController::class)->middleware('throttle:30,1')->name('demo.context');
});

Route::get('/auth/pitmetric/start', [PitMetricConnectionController::class, 'start'])->middleware('throttle:30,1')->name('pitmetric.start');
Route::get('/auth/pitmetric/callback', [PitMetricConnectionController::class, 'callback'])->middleware('throttle:30,1')->name('pitmetric.callback');
Route::post('/auth/pitmetric/logout', [PitMetricConnectionController::class, 'logout'])->middleware('throttle:30,1')->name('pitmetric.logout');
Route::get('/auth/pitmetric/problem', [PitMetricConnectionController::class, 'problem'])->name('pitmetric.problem');
