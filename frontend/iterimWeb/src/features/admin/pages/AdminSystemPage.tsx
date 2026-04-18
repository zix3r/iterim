import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router';
import {
    Users, Building2, Package, UsersRound,
    ClipboardList, Repeat, RefreshCw,
    Heart, Database, Clock, Cpu, ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/features/auth/context/AuthContext';
import { AdminLayout } from '@/features/admin/components/AdminLayout';
import {
    adminGetStats,
    getHealthDetail,
    type AdminStats,
    type HealthReport,
} from '@/lib/api';

export function AdminSystemPage() {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [stats, setStats] = useState<AdminStats | null>(null);
    const [health, setHealth] = useState<HealthReport | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

    useEffect(() => {
        if (user && user.role !== 'Admin') {
            navigate('/dashboard', { replace: true });
        }
    }, [user, navigate]);

    const fetchData = useCallback(async () => {
        try {
            const [s, h] = await Promise.all([adminGetStats(), getHealthDetail()]);
            setStats(s);
            setHealth(h);
            setLastRefresh(new Date());
        } catch {
            // partial failure is ok
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Initial load
    useEffect(() => { fetchData(); }, [fetchData]);

    // Auto-refresh every 30s
    useEffect(() => {
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, [fetchData]);

    if (user?.role !== 'Admin') return null;

    function healthIcon(status: string) {
        if (status === 'Healthy') return <div className="h-3 w-3 rounded-full bg-emerald-500" />;
        if (status === 'Degraded') return <div className="h-3 w-3 rounded-full bg-amber-500" />;
        return <div className="h-3 w-3 rounded-full bg-red-500" />;
    }

    function healthBadge(status: string) {
        if (status === 'Healthy')
            return <Badge variant="outline" className="text-emerald-600 border-emerald-300">Healthy</Badge>;
        if (status === 'Degraded')
            return <Badge variant="outline" className="text-amber-600 border-amber-300">Degraded</Badge>;
        return <Badge variant="destructive">Unhealthy</Badge>;
    }

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    const healthDetailUrl = API_URL.replace(/\/api\/?$/, '') + '/health/detail';

    return (
        <AdminLayout>
            {isLoading ? (
                <div className="flex items-center justify-center py-20 text-zinc-400">Loading...</div>
            ) : (
                <>
                    {/* Stats cards */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
                        <StatCard icon={Users} label="Users" value={stats?.users.total ?? 0}
                            sub={`+${stats?.users.newThisWeek ?? 0} this week`} />
                        <StatCard icon={Building2} label="Organizations" value={stats?.organizations.total ?? 0} />
                        <StatCard icon={Package} label="Products" value={stats?.products.total ?? 0} />
                        <StatCard icon={UsersRound} label="Teams" value={stats?.teams.total ?? 0} />
                        <StatCard icon={ClipboardList} label="Work Items" value={stats?.workItems.total ?? 0} />
                        <StatCard icon={Repeat} label="Iterations" value={stats?.iterations.total ?? 0}
                            sub={`${stats?.iterations.active ?? 0} active`} />
                    </div>

                    {/* User breakdown */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                        <div className="bg-white rounded-lg border border-zinc-200 p-5">
                            <h3 className="text-sm font-medium text-zinc-500 mb-4">User breakdown</h3>
                            <div className="space-y-3">
                                <InfoRow label="Total" value={stats?.users.total ?? 0} />
                                <InfoRow label="New this week" value={stats?.users.newThisWeek ?? 0} />
                                <InfoRow label="New this month" value={stats?.users.newThisMonth ?? 0} />
                                <InfoRow label="Blocked" value={stats?.users.blocked ?? 0}
                                    highlight={stats?.users.blocked ? 'red' : undefined} />
                                <InfoRow label="Unconfirmed email" value={stats?.users.unconfirmed ?? 0}
                                    highlight={stats?.users.unconfirmed ? 'amber' : undefined} />
                            </div>
                        </div>

                        <div className="bg-white rounded-lg border border-zinc-200 p-5">
                            <h3 className="text-sm font-medium text-zinc-500 mb-4">Work items by status</h3>
                            <div className="space-y-3">
                                {stats?.workItems.byStatus.map((s) => (
                                    <InfoRow key={s.status} label={s.status} value={s.count} />
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Health checks */}
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-zinc-900 flex items-center gap-2">
                            <Heart className="h-5 w-5" />
                            System Health
                        </h2>
                        <div className="flex items-center gap-3">
                            <span className="text-xs text-zinc-400">
                                Last refresh: {lastRefresh.toLocaleTimeString()}
                            </span>
                            <Button variant="outline" size="sm" onClick={fetchData}>
                                <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                                Refresh
                            </Button>
                            <Button variant="outline" size="sm" asChild>
                                <a href={healthDetailUrl} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                                    Raw JSON
                                </a>
                            </Button>
                        </div>
                    </div>

                    {/* Overall status */}
                    {health && (
                        <div className="flex items-center gap-3 mb-4">
                            {healthIcon(health.status)}
                            <span className="font-medium text-zinc-900">Overall: {health.status}</span>
                            <span className="text-sm text-zinc-500">({formatDuration(health.totalDuration)})</span>
                        </div>
                    )}

                    {/* Individual checks */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                        {/* MySQL */}
                        {health?.checks.filter(c => c.name === 'mysql').map((check) => (
                            <div key={check.name} className="bg-white rounded-lg border border-zinc-200 p-5">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <Database className="h-4 w-4 text-zinc-500" />
                                        <span className="font-medium text-zinc-900">Database</span>
                                    </div>
                                    {healthBadge(check.status)}
                                </div>
                                <p className="text-sm text-zinc-600">
                                    {check.status === 'Healthy' ? 'Connected and responding' : 'Connection failed'}
                                </p>
                                <p className="text-xs text-zinc-400 mt-2">
                                    Response time: {formatDuration(check.duration)}
                                </p>
                            </div>
                        ))}

                        {/* Uptime */}
                        {health?.checks.filter(c => c.name === 'uptime').map((check) => (
                            <div key={check.name} className="bg-white rounded-lg border border-zinc-200 p-5">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <Clock className="h-4 w-4 text-zinc-500" />
                                        <span className="font-medium text-zinc-900">Uptime</span>
                                    </div>
                                    {healthBadge(check.status)}
                                </div>
                                <p className="text-2xl font-semibold text-zinc-900">
                                    {String(check.data?.uptime ?? '—')}
                                </p>
                                <p className="text-xs text-zinc-400 mt-2">
                                    Started: {check.data?.startedAt
                                        ? new Date(String(check.data.startedAt)).toLocaleString()
                                        : '—'}
                                </p>
                            </div>
                        ))}

                        {/* Memory */}
                        {health?.checks.filter(c => c.name === 'memory').map((check) => (
                            <div key={check.name} className="bg-white rounded-lg border border-zinc-200 p-5">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <Cpu className="h-4 w-4 text-zinc-500" />
                                        <span className="font-medium text-zinc-900">Memory</span>
                                    </div>
                                    {healthBadge(check.status)}
                                </div>
                                <p className="text-2xl font-semibold text-zinc-900">
                                    {String(check.data?.allocatedMB ?? '—')} MB
                                </p>
                                <p className="text-sm text-zinc-500 mt-1">
                                    {check.status === 'Degraded' ? 'High usage — consider restarting' : 'Normal usage'}
                                </p>
                                <p className="text-xs text-zinc-400 mt-2">
                                    GC cycles: {String(check.data?.gcGen0 ?? 0)} minor · {String(check.data?.gcGen1 ?? 0)} major · {String(check.data?.gcGen2 ?? 0)} full
                                </p>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </AdminLayout>
    );
}

function StatCard({ icon: Icon, label, value, sub }: {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    value: number;
    sub?: string;
}) {
    return (
        <div className="bg-white rounded-lg border border-zinc-200 p-4">
            <div className="flex items-center gap-2 mb-2">
                <Icon className="h-4 w-4 text-zinc-400" />
                <span className="text-sm text-zinc-500">{label}</span>
            </div>
            <div className="text-2xl font-semibold text-zinc-900">{value}</div>
            {sub && <div className="text-xs text-zinc-400 mt-1">{sub}</div>}
        </div>
    );
}

function InfoRow({ label, value, highlight }: {
    label: string;
    value: number;
    highlight?: 'red' | 'amber';
}) {
    const valueColor = highlight === 'red' ? 'text-red-600 font-medium'
        : highlight === 'amber' ? 'text-amber-600 font-medium'
            : 'text-zinc-900';

    return (
        <div className="flex justify-between items-center">
            <span className="text-sm text-zinc-600">{label}</span>
            <span className={`text-sm ${valueColor}`}>{value}</span>
        </div>
    );
}

function formatDuration(duration: string): string {
    // "00:00:00.0005652" → "0.57 ms"
    const match = duration.match(/(\d+):(\d+):(\d+)\.?(\d*)/);
    if (!match) return duration;

    const hours = parseInt(match[1]);
    const minutes = parseInt(match[2]);
    const seconds = parseInt(match[3]);
    const fraction = match[4] ? parseFloat(`0.${match[4]}`) : 0;

    const totalMs = (hours * 3600 + minutes * 60 + seconds) * 1000 + fraction * 1000;

    if (totalMs < 1) return `${(totalMs * 1000).toFixed(0)} µs`;
    if (totalMs < 1000) return `${totalMs.toFixed(1)} ms`;
    return `${(totalMs / 1000).toFixed(2)} s`;
}