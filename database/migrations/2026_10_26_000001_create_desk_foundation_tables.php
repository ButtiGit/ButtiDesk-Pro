<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('desk_contacts', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('workspace_id');
            $table->string('type', 16);
            $table->string('name');
            $table->string('company')->nullable();
            $table->string('email')->nullable();
            $table->string('phone', 40)->nullable();
            $table->string('vat_number', 32)->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->unique(['workspace_id', 'id']);
            $table->index(['workspace_id', 'type']);
        });
        Schema::create('desk_tickets', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('workspace_id');
            $table->unsignedBigInteger('client_id')->nullable();
            $table->unsignedBigInteger('supplier_id')->nullable();
            $table->unsignedBigInteger('created_by'); // External identity reference, not a local user FK.
            $table->string('title', 180);
            $table->text('description')->nullable();
            $table->string('category', 60)->default('Assistenza');
            $table->string('status', 16)->default('open');
            $table->string('priority', 16)->default('normal');
            $table->timestampTz('due_at')->nullable();
            $table->timestampTz('closed_at')->nullable();
            $table->timestamps();
            $table->unique(['workspace_id', 'id']);
            $table->index(['workspace_id', 'status', 'due_at']);
            $table->index(['workspace_id', 'priority']);
            $table->foreign(['workspace_id', 'client_id'])->references(['workspace_id', 'id'])->on('desk_contacts')->restrictOnDelete();
            $table->foreign(['workspace_id', 'supplier_id'])->references(['workspace_id', 'id'])->on('desk_contacts')->restrictOnDelete();
        });
        Schema::create('desk_worklogs', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('workspace_id');
            $table->unsignedBigInteger('ticket_id');
            $table->unsignedBigInteger('user_id');
            $table->string('summary', 180);
            $table->text('details')->nullable();
            $table->unsignedInteger('duration_minutes');
            $table->timestampTz('performed_at');
            $table->timestamps();
            $table->index(['workspace_id', 'performed_at']);
            $table->foreign(['workspace_id', 'ticket_id'])->references(['workspace_id', 'id'])->on('desk_tickets')->restrictOnDelete();
        });
        Schema::create('desk_appointments', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('workspace_id');
            $table->unsignedBigInteger('ticket_id')->nullable();
            $table->unsignedBigInteger('contact_id')->nullable();
            $table->unsignedBigInteger('created_by');
            $table->string('title', 180);
            $table->string('location')->nullable();
            $table->text('description')->nullable();
            $table->timestampTz('starts_at');
            $table->timestampTz('ends_at');
            $table->timestamps();
            $table->index(['workspace_id', 'starts_at']);
            $table->foreign(['workspace_id', 'ticket_id'])->references(['workspace_id', 'id'])->on('desk_tickets')->restrictOnDelete();
            $table->foreign(['workspace_id', 'contact_id'])->references(['workspace_id', 'id'])->on('desk_contacts')->restrictOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('desk_appointments');
        Schema::dropIfExists('desk_worklogs');
        Schema::dropIfExists('desk_tickets');
        Schema::dropIfExists('desk_contacts');
    }
};
