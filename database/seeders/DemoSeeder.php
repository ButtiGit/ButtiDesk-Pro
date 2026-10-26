<?php

namespace Database\Seeders;

use App\Identity\DeskIdentity;
use App\Models\Appointment;
use App\Models\Contact;
use App\Models\Ticket;
use App\Models\Worklog;
use App\Support\WorkspaceContext;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class DemoSeeder extends Seeder
{
    public function run(): void
    {
        if (! app()->environment(['local', 'testing']) || (! config('desk.demo_enabled') || config('desk.identity_provider') !== 'demo')) {
            throw new RuntimeException('Demo fixtures are allowed only in an explicitly enabled local/test environment.');
        }
        DB::transaction(function (): void {
            foreach (config('desk.workspaces') as $workspaceId => $name) {
                app(WorkspaceContext::class)->set(new DeskIdentity(9001, 'Alex Demo', $workspaceId, $name, 'owner'));
                $this->seedWorkspace($workspaceId);
            }
        });
    }

    private function seedWorkspace(int $workspaceId): void
    {
        $names = $workspaceId === 101
            ? ['Aurora Digital', 'Nordline Studio', 'Forma Lab', 'Cloudway Services', 'Punto Verde', 'Linea Tech']
            : ['Officina Delta', 'Motori Demo', 'Service Esempio', 'Ricambi Fittizi', 'Team Campione', 'Garage Test'];
        $contacts = [];
        foreach ($names as $index => $name) {
            $contacts[] = Contact::firstOrCreate(['name' => $name], [
                'company' => $name.' S.r.l.', 'type' => $index === 3 ? 'supplier' : ($index === 5 ? 'both' : 'client'),
                'email' => 'contatto'.($index + 1).'@example.test', 'phone' => null,
                'notes' => 'Contatto sintetico, creato per esplorare ButtiDesk-Pro.',
            ]);
        }
        $titles = [
            'Accesso al gestionale da ripristinare', 'Nuova area clienti del portale',
            'Aggiornamento ambiente di test', 'Revisione flusso ordini',
            'Configurazione backup automatico', 'Esportazione catalogo prodotti',
            'Verifica rallentamenti dashboard', 'Aggiornamento contatti aziendali',
            'Ottimizzazione ricerca documenti', 'Manutenzione programmata',
            'Report attività mensile', 'Integrazione rimandata dal cliente',
        ];
        $statuses = ['progress', 'open', 'waiting', 'progress', 'open', 'waiting', 'open', 'done', 'done', 'done', 'done', 'cancelled'];
        $priorities = ['urgent', 'high', 'normal', 'high', 'normal', 'low', 'normal', 'low', 'normal', 'normal', 'normal', 'low'];
        $today = now(config('desk.timezone'))->startOfDay();
        $week = $today->copy()->startOfWeek();
        foreach ($titles as $index => $title) {
            $client = $contacts[$index % 3];
            $ticket = Ticket::firstOrCreate(['title' => $title], [
                'client_id' => $client->id, 'supplier_id' => $index === 2 ? $contacts[3]->id : null,
                'created_by' => 9001, 'description' => 'Richiesta dimostrativa: verificare il comportamento nell’ambiente di test, documentare le attività svolte e condividere il risultato con il cliente. Nessun sistema reale è coinvolto.',
                'category' => ['Assistenza', 'Sviluppo', 'Manutenzione', 'Consulenza'][$index % 4],
                'status' => $statuses[$index], 'priority' => $priorities[$index],
                'due_at' => $today->copy()->addDays($index - 1)->setTime(17, 0)->utc(),
                'closed_at' => $statuses[$index] === 'done' ? $today->copy()->subDay()->utc() : null,
            ]);
            if ($index < 10) {
                Worklog::firstOrCreate(['ticket_id' => $ticket->id, 'summary' => 'Analisi e verifica iniziale'], [
                    'user_id' => 9001, 'details' => 'Ambiente di test verificato. Raccolti i requisiti e preparati i prossimi passi.',
                    'duration_minutes' => [45, 120, 30, 90, 60, 40, 75, 25, 110, 50][$index],
                    'performed_at' => $week->copy()->subWeek()->addDays($index % 5)->setTime(10, 0)->utc(),
                ]);
            }
            if ($index < 3) {
                Worklog::firstOrCreate(['ticket_id' => $ticket->id, 'summary' => 'Verifica di avanzamento'], [
                    'user_id' => 9001, 'duration_minutes' => [55, 95, 35][$index],
                    'performed_at' => $today->copy()->setTime(9 + $index, 0)->utc(),
                ]);
                Appointment::firstOrCreate(['title' => ['Punto sul portale clienti', 'Revisione con Nordline', 'Verifica ambiente di test'][$index]], [
                    'ticket_id' => $ticket->id, 'contact_id' => $client->id, 'created_by' => 9001,
                    'location' => $index === 1 ? 'In studio' : 'Videochiamata',
                    'starts_at' => $today->copy()->addDays($index)->setTime(15, 0)->utc(),
                    'ends_at' => $today->copy()->addDays($index)->setTime(15, 45)->utc(),
                ]);
            }
        }
    }
}
