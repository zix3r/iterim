import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/features/auth/context/AuthContext';
import { useToast } from '@/components/ui/toast';
import { AdminLayout } from '@/features/admin/components/AdminLayout';
import {
    adminGetUsers,
    adminGetOrganizations,
    adminBlockUser,
    adminUnblockUser,
    adminDeleteUser,
    adminResetPassword,
    type AdminUserListItem,
    type AdminOrgOption,
} from '@/lib/api';

const STATUS_OPTIONS = [
    { label: 'All', value: '' },
    { label: 'Active', value: 'active' },
    { label: 'Blocked', value: 'blocked' },
    { label: 'Unconfirmed', value: 'unconfirmed' },
];


export function AdminUsersPage() {
    const { user } = useAuth();
    const navigate = useNavigate();

    const { toast } = useToast();
    const [deleteTarget, setDeleteTarget] = useState<AdminUserListItem | null>(null);

    const [users, setUsers] = useState<AdminUserListItem[]>([]);
    const [sortBy, setSortBy] = useState('');
    const [sortOrder, setSortOrder] = useState('');
    const [totalCount, setTotalCount] = useState(0);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [orgs, setOrgs] = useState<AdminOrgOption[]>([]);
    const [orgFilter, setOrgFilter] = useState<number | undefined>(undefined);
    const pageSize = 15;

    // Redirect non-admins
    useEffect(() => {
        if (user && user.role !== 'Admin') {
            navigate('/dashboard', { replace: true });
        }
    }, [user, navigate]);

    // Fetch users
    useEffect(() => {
        let cancelled = false;
        setIsLoading(true);

        adminGetUsers({
            search: search || undefined,
            status: status || undefined,
            organizationId: orgFilter,
            page, pageSize,
            sortBy: sortBy || undefined,
            sortOrder: sortOrder || undefined
        })
            .then((data) => {
                if (cancelled) return;
                setUsers(data.users);
                setTotalCount(data.totalCount);
            })
            .catch(() => {
                if (!cancelled) setUsers([]);
            })
            .finally(() => {
                if (!cancelled) setIsLoading(false);
            });

        return () => { cancelled = true; };
    }, [search, status, orgFilter, sortBy, sortOrder, page]);

    useEffect(() => {
        adminGetOrganizations().then(setOrgs).catch(() => { });
    }, []);

    function refreshList() {
        adminGetUsers({
            search: search || undefined,
            status: status || undefined,
            organizationId: orgFilter,
            page,
            pageSize,
            sortBy: sortBy || undefined,
            sortOrder: sortOrder || undefined
        })
            .then((data) => { setUsers(data.users); setTotalCount(data.totalCount); })
            .catch(() => { });
    }

    async function handleToggleBlock(u: AdminUserListItem) {
        try {
            if (u.isBlocked) {
                await adminUnblockUser(u.id);
                toast({ title: `${u.name} unblocked`, variant: 'success' });
            } else {
                await adminBlockUser(u.id);
                toast({ title: `${u.name} blocked`, variant: 'success' });
            }
            refreshList();
        } catch (err) {
            toast({ title: err instanceof Error ? err.message : 'Action failed', variant: 'error' });
        }
    }

    async function handleResetPassword(u: AdminUserListItem) {
        try {
            await adminResetPassword(u.id);
            toast({ title: `Password reset email sent to ${u.email}`, variant: 'success' });
        } catch (err) {
            toast({ title: err instanceof Error ? err.message : 'Failed to reset password', variant: 'error' });
        }
    }

    async function handleDelete() {
        if (!deleteTarget) return;
        try {
            await adminDeleteUser(deleteTarget.id);
            toast({ title: `${deleteTarget.name} deleted`, variant: 'success' });
            setDeleteTarget(null);
            refreshList();
        } catch (err) {
            toast({ title: err instanceof Error ? err.message : 'Failed to delete user', variant: 'error' });
        }
    }

    function handleSort(field: string) {
        if (sortBy === field) {
            // Toggle: asc → desc → clear
            if (sortOrder === 'asc') setSortOrder('desc');
            else { setSortBy(''); setSortOrder(''); }
        } else {
            setSortBy(field);
            setSortOrder('asc');
        }
        setPage(1);
    }

    // Debounced search
    const [searchInput, setSearchInput] = useState('');
    useEffect(() => {
        const timer = setTimeout(() => {
            setSearch(searchInput);
            setPage(1);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchInput]);

    const totalPages = Math.ceil(totalCount / pageSize);

    function getUserStatus(u: AdminUserListItem) {
        if (u.isBlocked) return 'blocked';
        if (!u.isEmailConfirmed) return 'unconfirmed';
        return 'active';
    }

    function statusBadge(u: AdminUserListItem) {
        const s = getUserStatus(u);
        if (s === 'blocked')
            return <Badge variant="destructive">Blocked</Badge>;
        if (s === 'unconfirmed')
            return <Badge variant="outline" className="text-amber-600 border-amber-300">Unconfirmed</Badge>;
        return <Badge variant="outline" className="text-emerald-600 border-emerald-300">Active</Badge>;
    }

    function SortHeader({ field, label }: { field: string; label: string }) {
        const active = sortBy === field;
        return (
            <th
                className="text-left px-4 py-3 font-medium text-zinc-500 cursor-pointer select-none hover:text-zinc-900"
                onClick={() => handleSort(field)}
            >
                <span className="inline-flex items-center gap-1">
                    {label}
                    <span className="text-xs">
                        {active && sortOrder === 'asc' ? '▲' : active && sortOrder === 'desc' ? '▼' : '↕'}
                    </span>
                </span>
            </th>
        );
    }

    if (user?.role !== 'Admin') return null;

    return (
        <AdminLayout>
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                    <Input
                        placeholder="Search by name or email..."
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        className="pl-9"
                    />
                </div>

                <div className="flex gap-1">
                    {STATUS_OPTIONS.map((opt) => (
                        <Button
                            key={opt.value}
                            variant={status === opt.value ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => { setStatus(opt.value); setPage(1); }}
                        >
                            {opt.label}
                        </Button>
                    ))}
                    {/* Org filter */}
                    <select
                        value={orgFilter ?? ''}
                        onChange={(e) => {
                            setOrgFilter(e.target.value ? Number(e.target.value) : undefined);
                            setPage(1);
                        }}
                        className="h-8 rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-700"
                    >
                        <option value="">All organizations</option>
                        {orgs.map((o) => (
                            <option key={o.id} value={o.id}>{o.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Stats */}
            <p className="text-sm text-zinc-500 mb-4">
                {totalCount} user{totalCount !== 1 ? 's' : ''} found
            </p>

            {/* Table */}
            <div className="bg-white rounded-lg border border-zinc-200 overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-zinc-100 bg-zinc-50">
                            <SortHeader field="name" label="Name" />
                            <SortHeader field="email" label="Email" />
                            <SortHeader field="status" label="Status" />
                            <SortHeader field="role" label="Role" />
                            <SortHeader field="orgs" label="Orgs" />
                            <SortHeader field="registered" label="Registered" />
                            <th className="text-right px-4 py-3 font-medium text-zinc-500">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr><td colSpan={7} className="px-4 py-12 text-center text-zinc-400">Loading...</td></tr>
                        ) : users.length === 0 ? (
                            <tr><td colSpan={7} className="px-4 py-12 text-center text-zinc-400">No users found</td></tr>
                        ) : (
                            users.map((u) => (
                                <tr key={u.id} className="border-b border-zinc-50 hover:bg-zinc-50/50">
                                    <td className="px-4 py-3 font-medium text-zinc-900">{u.name}</td>
                                    <td className="px-4 py-3 text-zinc-600">{u.email}</td>
                                    <td className="px-4 py-3">{statusBadge(u)}</td>
                                    <td className="px-4 py-3">
                                        {u.role === 'Admin'
                                            ? <Badge className="bg-violet-100 text-violet-700 hover:bg-violet-100">Admin</Badge>
                                            : <span className="text-zinc-500">User</span>}
                                    </td>
                                    <td className="px-4 py-3 text-zinc-600">{u.organizationCount}</td>
                                    <td className="px-4 py-3 text-zinc-500">
                                        {new Date(u.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        {u.role !== 'Admin' && (
                                            <div className="flex items-center justify-end gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className={u.isBlocked
                                                        ? 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50'
                                                        : 'text-amber-600 hover:text-amber-700 hover:bg-amber-50'}
                                                    onClick={() => handleToggleBlock(u)}
                                                >
                                                    {u.isBlocked ? 'Unblock' : 'Block'}
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                    onClick={() => handleResetPassword(u)}
                                                >
                                                    Reset PW
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                    onClick={() => setDeleteTarget(u)}
                                                >
                                                    Delete
                                                </Button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                    <p className="text-sm text-zinc-500">
                        Page {page} of {totalPages}
                    </p>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={page <= 1}
                            onClick={() => setPage((p) => p - 1)}
                        >
                            Previous
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={page >= totalPages}
                            onClick={() => setPage((p) => p + 1)}
                        >
                            Next
                        </Button>
                    </div>
                </div>
            )}
            {/* Delete confirmation dialog */}
            {deleteTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setDeleteTarget(null)}>
                    <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-lg font-semibold text-zinc-900 mb-2">Delete user</h3>
                        <p className="text-sm text-zinc-600 mb-1">
                            Are you sure you want to delete <strong>{deleteTarget.name}</strong> ({deleteTarget.email})?
                        </p>
                        <p className="text-sm text-red-600 mb-6">
                            This will remove them from all organizations and teams. Their work items will be unassigned. This cannot be undone.
                        </p>
                        <div className="flex justify-end gap-3">
                            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
                            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}