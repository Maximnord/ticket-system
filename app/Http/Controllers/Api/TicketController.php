<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ListTicketsRequest;
use App\Http\Requests\StoreTicketRequest;
use App\Http\Requests\UpdateTicketRequest;
use App\Models\Ticket;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class TicketController extends Controller
{
    /**
     * List tickets with optional filters and sorting.
     *
     * Supported query params: status, priority, user_id, sort_by, order.
     */
    public function index(ListTicketsRequest $request): JsonResponse
    {
        $sortBy = $request->input('sort_by', 'created_at');
        $order  = $request->input('order', 'desc');

        $tickets = Ticket::query()
            ->with('assignedUser:id,name,email')
            ->when($request->filled('status'),   fn ($q) => $q->ofStatus($request->string('status')))
            ->when($request->filled('priority'), fn ($q) => $q->ofPriority($request->string('priority')))
            ->when($request->filled('user_id'),  fn ($q) => $q->ofUser((int) $request->input('user_id')))
            ->orderBy($sortBy, $order)
            ->get();

        return response()->json($tickets);
    }

    public function store(StoreTicketRequest $request): JsonResponse
    {
        $ticket = Ticket::create($request->validated());

        return response()->json($ticket->load('assignedUser:id,name,email'), 201);
    }

    public function update(UpdateTicketRequest $request, Ticket $ticket): JsonResponse
    {
        $ticket->update($request->validated());

        return response()->json($ticket->load('assignedUser:id,name,email'));
    }

    /**
     * Change ticket status. Enforces the rule that a ticket cannot
     * be closed without an assigned user.
     */
    public function changeStatus(Request $request, Ticket $ticket): JsonResponse
    {
        $data = $request->validate([
            'status' => ['required', 'in:open,in_progress,closed'],
        ]);

        if ($data['status'] === 'closed' && ! $ticket->canBeClosed()) {
            return response()->json([
                'error' => 'Cannot close a ticket without an assigned user.',
            ], 422);
        }

        $ticket->update(['status' => $data['status']]);

        return response()->json($ticket->load('assignedUser:id,name,email'));
    }

    public function assign(Request $request, Ticket $ticket): JsonResponse
    {
        $data = $request->validate([
            'assigned_user_id' => ['required', 'integer', 'exists:users,id'],
        ]);

        $ticket->update($data);

        return response()->json($ticket->load('assignedUser:id,name,email'));
    }

    /**
     * Complex query example — aggregated workload per user.
     *
     * Joins tickets with users, groups by user, and computes counts per
     * status and per priority in a single round-trip. Filters out users
     * with zero tickets via HAVING. Returns the busiest users first.
     */
    public function stats(): JsonResponse
    {
        $workload = DB::table('users')
            ->leftJoin('tickets', 'tickets.assigned_user_id', '=', 'users.id')
            ->select([
                'users.id   as user_id',
                'users.name as user_name',
                DB::raw('COUNT(tickets.id) as total_tickets'),
                DB::raw("SUM(CASE WHEN tickets.status = 'open'        THEN 1 ELSE 0 END) as open_count"),
                DB::raw("SUM(CASE WHEN tickets.status = 'in_progress' THEN 1 ELSE 0 END) as in_progress_count"),
                DB::raw("SUM(CASE WHEN tickets.status = 'closed'      THEN 1 ELSE 0 END) as closed_count"),
                DB::raw("SUM(CASE WHEN tickets.priority = 'high'   AND tickets.status != 'closed' THEN 1 ELSE 0 END) as open_high_priority"),
            ])
            ->groupBy('users.id', 'users.name')
            ->having('total_tickets', '>', 0)
            ->orderByDesc('open_high_priority')
            ->orderByDesc('total_tickets')
            ->get();

        $totals = Ticket::query()
            ->selectRaw('status, priority, COUNT(*) as count')
            ->groupBy('status', 'priority')
            ->get();

        return response()->json([
            'by_user'              => $workload,
            'by_status_priority' => $totals,
        ]);
    }
}
