'use client';

import React, { useState, useMemo } from 'react';
import { useHelpDesk } from '@/context/HelpDeskContext';
import { HelpDeskApiService } from '@/services/api';
import {
  VOLUME_CHART_DATA,
  CATEGORY_VOLUME_DATA,
  RESOLUTION_DISTRIBUTION_DATA,
  SLA_BREACH_TREND_DATA,
} from '@/lib/mock-data';
import {
  StatusBadge,
  PriorityBadge,
  SlaBadge,
  Avatar,
  PageHeader,
  LoadingSkeleton,
  EmptyState,
  ErrorBanner,
} from '@/components/ui/design-system';
import {
  Download,
  Calendar,
  Smile,
  Clock,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Info,
  ArrowUpDown,
  ExternalLink,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

export function ReportsAnalyticsView() {
  const {
    tickets,
    teamMembers,
    categories,
    simulationState,
    setSimulationState,
    addToast,
  } = useHelpDesk();

  const [dateRange, setDateRange] = useState('30d');
  const [agentFilter, setAgentFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');

  const supportAgents = useMemo(
    () => teamMembers.filter((m) => m.role !== 'CUSTOMER' && m.role !== 'PLATFORM_ADMIN'),
    [teamMembers]
  );

  if (simulationState === 'LOADING') return <LoadingSkeleton rows={7} />;
  if (simulationState === 'ERROR') {
    return (
      <ErrorBanner
        message="GET /api/v1/reports/analytics failed to aggregate materialized view."
        onRetry={() => setSimulationState('NORMAL')}
      />
    );
  }
  if (simulationState === 'EMPTY') {
    return (
      <EmptyState
        title="No reporting data for selected window"
        description="Broaden your date range or clear filters to inspect historical support performance."
        actionLabel="Restore Sample Dataset"
        onAction={() => setSimulationState('NORMAL')}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Support Performance Overview"
        description="Analyze resolution velocity, SLA compliance, customer satisfaction, and agent workload."
        actions={
          <button
            type="button"
            onClick={() => {
              HelpDeskApiService.tickets.exportToCsv(
                tickets,
                `helpdesk-analytics-${dateRange}.csv`
              );
              addToast('Analytics CSV Exported', 'Downloaded performance report.');
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#047857] hover:bg-[#065F46] rounded-lg transition-colors whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV Report</span>
          </button>
        }
      />

      {/* Explicit Data Source Notice */}
      <div className="bg-[#ECFDF5] border border-[#10B981]/30 rounded-xl px-4 py-3 flex flex-wrap items-center justify-between gap-2 text-xs text-[#065F46]">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-[#047857] shrink-0" />
          <span>
            <strong>Labeled Demonstration Dataset:</strong> Displaying realistic benchmark series
            via the local API adapter. Connect your Java Spring Boot backend (
            <code className="font-mono bg-white/80 px-1.5 py-0.5 rounded">
              /api/v1/reports/analytics
            </code>
            ) for live warehouse queries.
          </span>
        </div>
      </div>

      {/* Analytics Filter Strip */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        <div>
          <label className="block text-[11px] font-semibold text-[#64748B] mb-1">
            Date Range
          </label>
          <div className="relative">
            <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-[#111827]"
            >
              <option value="7d">Last 7 Days</option>
              <option value="30d">This Month (30 Days)</option>
              <option value="90d">Last Quarter (90 Days)</option>
              <option value="365d">Year to Date (2026)</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-[#64748B] mb-1">
            Team Member
          </label>
          <select
            value={agentFilter}
            onChange={(e) => setAgentFilter(e.target.value)}
            className="w-full px-3 py-1.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-[#111827]"
          >
            <option value="ALL">All Support Staff</option>
            {supportAgents.map((a) => (
              <option key={a.id} value={a.id}>
                {a.fullName}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-[#64748B] mb-1">
            Support Category
          </label>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full px-3 py-1.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-[#111827]"
          >
            <option value="ALL">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-[#64748B] mb-1">
            Ticket Priority
          </label>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="w-full px-3 py-1.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-[#111827]"
          >
            <option value="ALL">All Priorities</option>
            <option value="URGENT">Urgent (P1)</option>
            <option value="HIGH">High (P2)</option>
            <option value="MEDIUM">Medium (P3)</option>
            <option value="LOW">Low (P4)</option>
          </select>
        </div>
      </div>

      {/* 7 Required Reporting KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
        {[
          { label: 'Total Tickets', value: '1,420', sub: '+6.2% MoM' },
          { label: 'Resolution Rate', value: '94.8%', sub: '1,346 solved' },
          { label: 'Avg First Reply', value: '16m 12s', sub: 'Target < 30m' },
          { label: 'Avg Resolution', value: '2h 14m', sub: '-18m vs Sep' },
          { label: 'SLA Compliance', value: '96.4%', sub: 'Enterprise SLA' },
          { label: 'Ticket Backlog', value: '19', sub: '-4 since Mon' },
          { label: 'CSAT Score', value: '4.89 / 5', sub: 'Top 5% tier' },
        ].map((kpi) => (
          <div
            key={kpi.label}
            className="bg-white border border-[#E2E8F0] rounded-xl p-4 flex flex-col justify-between"
          >
            <span className="text-[11px] font-medium text-[#64748B]">{kpi.label}</span>
            <span className="text-xl font-bold font-mono tabular-nums text-[#111827] mt-1.5">
              {kpi.value}
            </span>
            <span className="text-[11px] font-mono text-[#047857] mt-1">{kpi.sub}</span>
          </div>
        ))}
      </div>

      {/* Charts Row 1: Tickets Created vs Resolved + SLA Breaches Over Time */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-7 bg-white border border-[#E2E8F0] rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-[#111827]">
                Tickets Created vs. Resolved
              </h3>
              <p className="text-xs text-[#64748B]">Daily inflow and closure throughput</p>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={VOLUME_CHART_DATA} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: '#64748B' }}
                  axisLine={{ stroke: '#E2E8F0' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#64748B' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderColor: '#E2E8F0',
                    borderRadius: '10px',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="created" name="Created" fill="#047857" radius={[4, 4, 0, 0]} />
                <Bar dataKey="resolved" name="Resolved" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-5 bg-white border border-[#E2E8F0] rounded-xl p-5">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-[#111827]">SLA Breaches Over Time</h3>
            <p className="text-xs text-[#64748B]">Weekly SLA breach count across all queues</p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={SLA_BREACH_TREND_DATA}
                margin={{ top: 8, right: 12, left: -16, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis
                  dataKey="week"
                  tick={{ fontSize: 11, fill: '#64748B' }}
                  axisLine={{ stroke: '#E2E8F0' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#64748B' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderColor: '#E2E8F0',
                    borderRadius: '10px',
                    fontSize: '12px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="breaches"
                  name="SLA Breaches"
                  stroke="#DC2626"
                  strokeWidth={2}
                  dot={{ r: 3.5, fill: '#DC2626' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Charts Row 2: Ticket Volume by Category + Resolution Time Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-6 bg-white border border-[#E2E8F0] rounded-xl p-5 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-[#111827]">Ticket Volume by Category</h3>
            <p className="text-xs text-[#64748B]">
              Total requests, resolution count, and mean time to resolve
            </p>
          </div>
          <div className="space-y-3">
            {CATEGORY_VOLUME_DATA.map((c) => {
              const pct = Math.round((c.tickets / 420) * 100);
              return (
                <div key={c.category} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#111827]">{c.category}</span>
                    <span className="font-mono tabular-nums text-[#64748B]">
                      {c.tickets} tickets · {c.avgHours}h avg
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#047857] rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-6 bg-white border border-[#E2E8F0] rounded-xl p-5 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-[#111827]">Resolution Time Distribution</h3>
            <p className="text-xs text-[#64748B]">
              67% of all customer tickets are resolved in under 2 hours
            </p>
          </div>
          <div className="space-y-3">
            {RESOLUTION_DISTRIBUTION_DATA.map((b) => (
              <div key={b.bucket} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-[#111827] font-mono">{b.bucket}</span>
                  <span className="font-mono tabular-nums text-[#64748B]">
                    {b.count} tickets ({b.percentage}%)
                  </span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#10B981] rounded-full"
                    style={{ width: `${b.percentage * 2}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Agent Performance Leaderboard Table */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E2E8F0]">
          <h3 className="text-sm font-bold text-[#111827]">Support Agent Performance</h3>
          <p className="text-xs text-[#64748B]">
            Individual response speed, active resolution volume, and customer satisfaction ratings
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
                <th className="py-3 px-4">Agent</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4 text-right">Assigned</th>
                <th className="py-3 px-4 text-right">Avg First Response</th>
                <th className="py-3 px-4 text-right">Overdue</th>
                <th className="py-3 px-4 text-right">CSAT Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] text-xs">
              {supportAgents.map((agent) => (
                <tr key={agent.id} className="hover:bg-[#F0FDF4]/50">
                  <td className="py-3 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-2.5">
                      <Avatar initials={agent.avatarInitials} size="xs" variant="emerald" />
                      <span className="font-semibold text-[#111827]">{agent.fullName}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-[#64748B]">{agent.title}</td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold">
                    {agent.assignedTicketsCount}
                  </td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums text-[#047857] font-semibold">
                    {agent.avgResponseTimeMinutes}m
                  </td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums">
                    {agent.overdueTicketsCount}
                  </td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-[#111827]">
                    {agent.csatScore.toFixed(2)} / 5.0
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export function SlaMonitoringView() {
  const { slaPolicies, tickets, navigateTo, simulationState, setSimulationState } =
    useHelpDesk();

  const [sortByRemaining, setSortByRemaining] = useState(true);

  const monitoredTickets = useMemo(() => {
    const active = tickets.filter((t) => t.status !== 'CLOSED');
    return [...active].sort((a, b) =>
      sortByRemaining
        ? a.resolutionRemainingMinutes - b.resolutionRemainingMinutes
        : b.resolutionRemainingMinutes - a.resolutionRemainingMinutes
    );
  }, [tickets, sortByRemaining]);

  if (simulationState === 'LOADING') return <LoadingSkeleton rows={6} />;
  if (simulationState === 'ERROR') {
    return (
      <ErrorBanner
        message="SLA timer microservice (/api/v1/sla/monitors) returned HTTP 502."
        onRetry={() => setSimulationState('NORMAL')}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="SLA Monitoring & Escalations"
        description="Real-time visibility into response deadlines, resolution clocks, at-risk tickets, and historical SLA compliance."
      />

      {/* Active SLA Policies Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {slaPolicies.map((policy) => (
          <div
            key={policy.id}
            className="bg-white border border-[#E2E8F0] rounded-xl p-5 flex flex-col justify-between space-y-4"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <PriorityBadge priority={policy.priority} />
                <span className="font-mono tabular-nums text-xs font-bold text-[#047857]">
                  {policy.complianceRate}% Met
                </span>
              </div>
              <h3 className="text-sm font-bold text-[#111827]">{policy.name}</h3>
            </div>

            <div className="space-y-2 pt-3 border-t border-[#E2E8F0] text-xs">
              <div className="flex justify-between">
                <span className="text-[#64748B]">First Response Target</span>
                <span className="font-mono font-semibold text-[#111827]">
                  {policy.firstResponseTarget}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748B]">Resolution Target</span>
                <span className="font-mono font-semibold text-[#111827]">
                  {policy.resolutionTarget}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748B]">Operating Schedule</span>
                <span className="text-[#111827]">
                  {policy.businessHoursOnly ? 'Business Hours' : '24/7 Continuous'}
                </span>
              </div>
              <p className="text-[11px] text-[#64748B] pt-1">{policy.escalationRule}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Backend SLA Computation Architecture Banner */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-start gap-2.5">
          <ShieldAlert className="w-4 h-4 text-[#047857] shrink-0 mt-0.5" />
          <div className="text-[#64748B]">
            <strong className="text-[#111827]">Authoritative Backend Deadline Enforcement:</strong>{' '}
            Countdowns below are rendered for operator triage. Authoritative SLA timestamps,
            business-hour pauses, and regional holiday exclusions are computed server-side by the
            Java Spring Boot <code className="font-mono">SlaClockScheduler</code> service.
          </div>
        </div>
      </div>

      {/* Live SLA Countdown & Breach Queue Table */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-[#111827]">
              Active Ticket SLA Countdowns & Breach Queue
            </h3>
            <p className="text-xs text-[#64748B]">
              Sorted by most urgent resolution deadline first
            </p>
          </div>
          <button
            type="button"
            onClick={() => setSortByRemaining(!sortByRemaining)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg hover:bg-slate-100"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
            <span>
              Sort: {sortByRemaining ? 'Most Urgent First' : 'Longest Remaining First'}
            </span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
                <th className="py-3 px-4">Ticket</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">First-Response Target</th>
                <th className="py-3 px-4">Resolution Target</th>
                <th className="py-3 px-4">SLA Urgency</th>
                <th className="py-3 px-4 text-right">Owner</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] text-xs">
              {monitoredTickets.map((t) => (
                <tr
                  key={t.id}
                  onClick={() => navigateTo('ticket-detail', { ticketId: t.id })}
                  className="hover:bg-[#F0FDF4]/60 cursor-pointer transition-colors"
                >
                  <td className="py-3.5 px-4">
                    <div className="font-mono font-bold text-[#047857]">{t.id}</div>
                    <div className="font-medium text-[#111827] max-w-xs truncate">{t.subject}</div>
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="font-medium text-[#111827]">{t.customerName}</div>
                    <div className="text-[11px] text-[#64748B]">{t.customerOrganization}</div>
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <PriorityBadge priority={t.priority} />
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <StatusBadge status={t.status} />
                  </td>
                  <td className="py-3.5 px-4 font-mono tabular-nums text-[#64748B] whitespace-nowrap">
                    {t.firstResponseDeadline}
                  </td>
                  <td className="py-3.5 px-4 font-mono tabular-nums font-medium text-[#111827] whitespace-nowrap">
                    {t.resolutionDeadline}
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <SlaBadge
                      slaStatus={t.slaStatus}
                      remainingMinutes={t.resolutionRemainingMinutes}
                    />
                  </td>
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <span className="font-medium text-[#111827]">
                      {t.assignedAgentName || 'Unassigned'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
