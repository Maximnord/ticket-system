import React, { useEffect, useState } from 'react';
import axios from 'axios';

const emptyDraft = { title: '', description: '', priority: 'medium', assigned_user_id: '' };

const TicketSystem = () => {
    const [tickets, setTickets] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({ status: '', priority: '', user_id: '', sort_by: 'created_at', order: 'desc' });
    const [draft, setDraft] = useState(emptyDraft);
    const [error, setError] = useState(null);

    useEffect(() => { fetchUsers(); }, []);
    useEffect(() => { fetchTickets(); }, [filters]);

    const fetchUsers = async () => {
        try {
            const { data } = await axios.get('/api/users');
            setUsers(data);
        } catch {
            setError('Failed to load users');
        }
    };

    const fetchTickets = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            Object.entries(filters).forEach(([k, v]) => v && params.append(k, v));
            const { data } = await axios.get(`/api/tickets?${params.toString()}`);
            setTickets(data);
            setError(null);
        } catch {
            setError('Failed to fetch tickets');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            const payload = { ...draft };
            if (!payload.assigned_user_id) delete payload.assigned_user_id;
            await axios.post('/api/tickets', payload);
            setDraft(emptyDraft);
            setError(null);
            fetchTickets();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to create ticket');
        }
    };

    const handleStatus = async (id, status) => {
        try {
            await axios.patch(`/api/tickets/${id}/status`, { status });
            setError(null);
            fetchTickets();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to update status');
        }
    };

    const handleAssign = async (id, userId) => {
        if (!userId) return;
        try {
            await axios.patch(`/api/tickets/${id}/assign`, { assigned_user_id: Number(userId) });
            setError(null);
            fetchTickets();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to assign ticket');
        }
    };

    const priorityBadge = (p) =>
        p === 'high' ? 'bg-red-100 text-red-700'
        : p === 'medium' ? 'bg-yellow-100 text-yellow-700'
        : 'bg-green-100 text-green-700';

    const statusDot = (s) =>
        s === 'open' ? 'bg-blue-500'
        : s === 'in_progress' ? 'bg-orange-500'
        : 'bg-gray-500';

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-6xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">Internal Ticket System</h1>

                {error && (
                    <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6 text-sm text-red-700">{error}</div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Create Ticket Form */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h2 className="text-xl font-semibold mb-4">Create New Ticket</h2>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Title</label>
                                <input
                                    type="text"
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                                    value={draft.title}
                                    onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Description</label>
                                <textarea
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                                    rows="3"
                                    value={draft.description}
                                    onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Priority</label>
                                <select
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                                    value={draft.priority}
                                    onChange={(e) => setDraft({ ...draft, priority: e.target.value })}
                                >
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Assign To</label>
                                <select
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                                    value={draft.assigned_user_id}
                                    onChange={(e) => setDraft({ ...draft, assigned_user_id: e.target.value })}
                                >
                                    <option value="">Unassigned</option>
                                    {users.map((u) => (
                                        <option key={u.id} value={u.id}>{u.name}</option>
                                    ))}
                                </select>
                            </div>
                            <button
                                type="submit"
                                className="w-full bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition"
                            >
                                Create Ticket
                            </button>
                        </form>
                    </div>

                    {/* Ticket List */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Filters */}
                        <div className="flex flex-wrap gap-3 mb-2">
                            <select
                                className="rounded-md border-gray-300 shadow-sm p-2 border text-sm"
                                value={filters.status}
                                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                            >
                                <option value="">All Statuses</option>
                                <option value="open">Open</option>
                                <option value="in_progress">In Progress</option>
                                <option value="closed">Closed</option>
                            </select>
                            <select
                                className="rounded-md border-gray-300 shadow-sm p-2 border text-sm"
                                value={filters.priority}
                                onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
                            >
                                <option value="">All Priorities</option>
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                            </select>
                            <select
                                className="rounded-md border-gray-300 shadow-sm p-2 border text-sm"
                                value={filters.user_id}
                                onChange={(e) => setFilters({ ...filters, user_id: e.target.value })}
                            >
                                <option value="">All Users</option>
                                {users.map((u) => (
                                    <option key={u.id} value={u.id}>{u.name}</option>
                                ))}
                            </select>
                            <select
                                className="rounded-md border-gray-300 shadow-sm p-2 border text-sm"
                                value={filters.sort_by}
                                onChange={(e) => setFilters({ ...filters, sort_by: e.target.value })}
                            >
                                <option value="created_at">Sort: Created</option>
                                <option value="updated_at">Sort: Updated</option>
                                <option value="priority">Sort: Priority</option>
                                <option value="status">Sort: Status</option>
                            </select>
                            <select
                                className="rounded-md border-gray-300 shadow-sm p-2 border text-sm"
                                value={filters.order}
                                onChange={(e) => setFilters({ ...filters, order: e.target.value })}
                            >
                                <option value="desc">Desc</option>
                                <option value="asc">Asc</option>
                            </select>
                        </div>

                        {loading ? (
                            <div className="text-center py-12">Loading tickets...</div>
                        ) : tickets.length === 0 ? (
                            <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
                                No tickets found.
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {tickets.map((ticket) => (
                                    <div key={ticket.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex justify-between items-start gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-2 mb-1">
                                                <span className={`px-2 py-0.5 rounded text-xs font-semibold uppercase ${priorityBadge(ticket.priority)}`}>
                                                    {ticket.priority}
                                                </span>
                                                <span className="text-xs text-gray-500">#{ticket.id}</span>
                                            </div>
                                            <h3 className="text-lg font-bold text-gray-900">{ticket.title}</h3>
                                            <p className="text-gray-600 mt-1">{ticket.description}</p>
                                            <div className="mt-4 flex items-center flex-wrap gap-4 text-sm text-gray-500">
                                                <div className="flex items-center">
                                                    <span className={`h-2 w-2 rounded-full mr-2 ${statusDot(ticket.status)}`} />
                                                    {ticket.status.replace('_', ' ')}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span>Assigned to:</span>
                                                    <select
                                                        className="rounded border-gray-300 text-xs p-1 border"
                                                        value={ticket.assigned_user?.id || ''}
                                                        onChange={(e) => handleAssign(ticket.id, e.target.value)}
                                                    >
                                                        <option value="" disabled>Unassigned</option>
                                                        {users.map((u) => (
                                                            <option key={u.id} value={u.id}>{u.name}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex flex-col space-y-2 shrink-0">
                                            {ticket.status !== 'in_progress' && ticket.status !== 'closed' && (
                                                <button
                                                    onClick={() => handleStatus(ticket.id, 'in_progress')}
                                                    className="text-xs bg-orange-50 text-orange-700 px-3 py-1.5 rounded hover:bg-orange-100 transition"
                                                >
                                                    Start Handling
                                                </button>
                                            )}
                                            {ticket.status !== 'closed' && (
                                                <button
                                                    onClick={() => handleStatus(ticket.id, 'closed')}
                                                    className="text-xs bg-green-50 text-green-700 px-3 py-1.5 rounded hover:bg-green-100 transition"
                                                >
                                                    Close Ticket
                                                </button>
                                            )}
                                            {ticket.status !== 'open' && (
                                                <button
                                                    onClick={() => handleStatus(ticket.id, 'open')}
                                                    className="text-xs bg-blue-50 text-blue-700 px-3 py-1.5 rounded hover:bg-blue-100 transition"
                                                >
                                                    Reopen
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TicketSystem;
