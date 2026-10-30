'use client';

import React, { useState, useMemo } from 'react';
import { useHelpDesk } from '@/context/HelpDeskContext';
import { HelpDeskApiService } from '@/services/api';
import { VOLUME_CHART_DATA, TOP_USED_TAGS } from '@/lib/mock-data';
import {
  StatusBadge,
  PriorityBadge,
  SlaBadge,
  Avatar,
  LoadingSkeleton,
  EmptyState,
  ErrorBanner,
} from '@/components/ui/design-system';
import {
  Ticket as TicketIcon,
  Inbox,
  Clock,
  CheckCircle2,
  Calendar,
  Download,
  Plus,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  Smile,
  ShieldCheck,
  Timer,
  Users,
  MessageSquare,
  UserCheck,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

export function DashboardView() {
  const {
    currentUser,
    tickets,
    teamMembers,
    navigateTo,
    setCreateTicketModalOpen,
    simulationState,
    setSimulationState,
    addToast,
  } = useHelpDesk();

  const [dateRange, setDateRange] = useState<'today' | '7d' | '30d' | '90d'>('30d');

  const firstName = currentUser.fullName.split(' ')[0];

  // Computed summary metrics
  const openTicketsCount = useMemo(
    () => tickets.filter((t) => t.status === 'OPEN' || t.status === 'IN_PROGRESS').length,
    [tickets]
  );
  const unassignedCount = useMemo(
    () => tickets.filter((t) => !t.assignedAgentId && t.status !== 'CLOSED').length,
    [tickets]
  );
  const awaitingResponseCount = useMemo(
    () =>
      tickets.filter(
        (t) => t.status === 'OPEN' || t.status === 'WAITING_FOR_CUSTOMER'
      ).length,
    [tickets]
  );
  const resolvedCount = useMemo(
    () => tickets.filter((t) => t.status === 'RESOLVED' || t.status === 'CLOSED').length,
    [tickets]
  );

  const statusDistribution = useMemo(() => {
    const counts = {
      Open: tickets.filter((t) => t.status === 'OPEN').length,
      'In Progress': tickets.filter((t) => t.status === 'IN_PROGRESS').length,
      'Waiting for Customer': tickets.filter((t) => t.status === 'WAITING_FOR_CUSTOMER').length,
      Resolved: tickets.filter((t) => t.status === 'RESOLVED').length,
      Closed: tickets.filter((t) => t.status === 'CLOSED').length,
    };
    return [
      { name: 'Open', value: counts.Open, color: '#2563EB' },
      { name: 'In Progress', value: counts['In Progress'], color: '#047857' },
      { name: 'Waiting', value: counts['Waiting for Customer'], color: '#D97706' },
      { name: 'Resolved', value: counts.Resolved, color: '#10B981' },
      { name: 'Closed', value: counts.Closed, color: '#64748B' },
    ];
  }, [tickets]);

  const priorityDistribution = useMemo(() => {
    const total = Math.max(1, tickets.length);
    const items = [
      {
        label: 'Urgent',
        count: tickets.filter((t) => t.priority === 'URGENT').length,
        barColor: 'bg-red-600',
      },
      {
        label: 'High',
        count: tickets.filter((t) => t.priority === 'HIGH').length,
        barColor: 'bg-orange-500',
      },
      {
        label: 'Medium',
        count: tickets.filter((t) => t.priority === 'MEDIUM').length,
        barColor: 'bg-amber-500',
      },
      {
        label: 'Low',
        count: tickets.filter((t) => t.priority === 'LOW').length,
        barColor: 'bg-slate-400',
      },
    ];
    return items.map((i) => ({
      ...i,
      pct: Math.round((i.count / total) * 100),
    }));
  }, [tickets]);

  const activeAgents = useMemo(
    () =>
      teamMembers.filter(
        (m) => m.role !== 'CUSTOMER' && m.role !== 'PLATFORM_ADMIN' && m.active
      ),
    [teamMembers]
  );

  if (simulationState === 'LOADING') {
    return (
      <div className="space-y-6">
        <LoadingSkeleton rows={4} />
        <LoadingSkeleton rows={6} />
      </div>
    );
  }

  if (simulationState === 'ERROR') {
    return (
      <ErrorBanner
        message="GET /api/v1/dashboard/summary timed out after 5000ms. Verify that the Spring Boot service is running, then retry."
        onRetry={() => setSimulationState('NORMAL')}
      />
    );
  }

  if (simulationState === 'EMPTY' || tickets.length === 0) {
    return (
      <EmptyState
        title="No support tickets recorded yet"
        description="Your organization queue is completely clear. Create your first customer support ticket or configure incoming email routing to start tracking requests."
        actionLabel="Create First Ticket"
        onAction={() => {
          setSimulationState('NORMAL');
          setCreateTicketModalOpen(true);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Dashboard Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#111827]">
            Good morning, {firstName}
          </h1>
          <p className="text-sm text-[#64748B] mt-1">
            Here’s what’s happening with your support team today.
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          {/* Date Range Selector */}
          <div className="inline-flex items-center bg-white border border-[#E2E8F0] rounded-lg p-1">
            <Calendar className="w-3.5 h-3.5 text-slate-400 ml-2 mr-1.5" />
            {(
              [
                { id: 'today', label: 'Today' },
                { id: '7d', label: '7 Days' },
                { id: '30d', label: 'This Month' },
                { id: '90d', label: 'Quarter' },
              ] as const
            ).map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setDateRange(r.id)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  dateRange === r.id
                    ? 'bg-[#ECFDF5] text-[#047857] font-semibold'
                    : 'text-[#64748B] hover:text-[#111827]'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => {
              HelpDeskApiService.tickets.exportToCsv(
                tickets,
                `helpdesk-dashboard-${dateRange}.csv`
              );
              addToast('Report Exported', 'Downloaded dashboard ticket summary as CSV.');
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-[#111827] bg-white hover:bg-slate-50 border border-[#E2E8F0] rounded-lg transition-colors whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export Report</span>
          </button>

          <button
            type="button"
            onClick={() => setCreateTicketModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#047857] hover:bg-[#065F46] rounded-lg transition-colors whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Ticket</span>
          </button>
        </div>
      </div>

      {/* 4 Primary Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div
          onClick={() => navigateTo('tickets')}
          className="bg-white border border-[#E2E8F0] rounded-xl p-5 hover:border-[#10B981]/50 transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#64748B]">Open & Active Tickets</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <TicketIcon className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-bold font-mono tabular-nums text-[#111827]">
              {openTicketsCount}
            </span>
            <span className="inline-flex items-center gap-1 text-xs font-medium text-[#047857] font-mono tabular-nums">
              <TrendingDown className="w-3.5 h-3.5" />
              -8.4% vs last wk
            </span>
          </div>
          <p className="text-[11px] text-[#64748B] mt-2">
            Across 5 active support categories
          </p>
        </div>

        <div
          onClick={() => navigateTo('unassigned')}
          className="bg-white border border-[#E2E8F0] rounded-xl p-5 hover:border-[#10B981]/50 transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#64748B]">Unassigned Tickets</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Inbox className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-bold font-mono tabular-nums text-[#111827]">
              {unassignedCount}
            </span>
            <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 font-mono tabular-nums">
              Needs triage
            </span>
          </div>
          <p className="text-[11px] text-[#64748B] mt-2">
            1 High-priority webhook ticket waiting
          </p>
        </div>

        <div
          onClick={() => navigateTo('priority-queue')}
          className="bg-white border border-[#E2E8F0] rounded-xl p-5 hover:border-[#10B981]/50 transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#64748B]">Awaiting Response</span>
            <div className="w-8 h-8 rounded-lg bg-[#ECFDF5] text-[#047857] flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-bold font-mono tabular-nums text-[#111827]">
              {awaitingResponseCount}
            </span>
            <span className="inline-flex items-center gap-1 text-xs font-medium text-[#047857] font-mono tabular-nums">
              Avg 16m 04s
            </span>
          </div>
          <p className="text-[11px] text-[#64748B] mt-2">
            First-response target met on 96.4%
          </p>
        </div>

        <div
          onClick={() => navigateTo('reports')}
          className="bg-white border border-[#E2E8F0] rounded-xl p-5 hover:border-[#10B981]/50 transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#64748B]">Resolved (Period)</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-bold font-mono tabular-nums text-[#111827]">
              {resolvedCount + 58}
            </span>
            <span className="inline-flex items-center gap-1 text-xs font-medium text-[#047857] font-mono tabular-nums">
              <TrendingUp className="w-3.5 h-3.5" />
              +14.2% velocity
            </span>
          </div>
          <p className="text-[11px] text-[#64748B] mt-2">
            94.1% first-contact resolution rate
          </p>
        </div>
      </div>

      {/* Customer Experience & SLA Benchmark Strip (Inspired by Reference Design) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-[#111827]">
            Customer Experience & Operational Benchmarks
          </h2>
          <button
            type="button"
            onClick={() => navigateTo('reports')}
            className="text-xs font-semibold text-[#047857] hover:underline inline-flex items-center gap-1"
          >
            <span>Full Performance Analytics</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Card 1: Average CSAT */}
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs text-[#64748B]">
                <span className="font-medium text-[#111827]">Average CSAT</span>
                <span className="font-mono">Sample: 340 ratings</span>
              </div>
              <div className="mt-2 flex items-baseline gap-2.5">
                <span className="text-3xl font-bold font-mono tabular-nums text-[#111827]">
                  4.89
                </span>
                <span className="text-xs text-[#047857] font-mono font-medium">+2.4%</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-[#E2E8F0] space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#64748B]">Industry Avg: 4.56</span>
                <span className="font-semibold text-[#111827] font-mono">Top 5%: 4.89</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-medium text-[#047857]">
                <Smile className="w-4 h-4 shrink-0" />
                <span>You are doing great — top decile satisfaction</span>
              </div>
              <p className="text-[11px] text-[#64748B]">
                Enterprise customers rated authentication & billing support highest this month.
              </p>
            </div>
          </div>

          {/* Card 2: Resolution Time */}
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs text-[#64748B]">
                <span className="font-medium text-[#111827]">Median Resolution Time</span>
                <span className="font-mono">First reply: 16m</span>
              </div>
              <div className="mt-2 flex items-baseline gap-2.5">
                <span className="text-3xl font-bold font-mono tabular-nums text-[#111827]">
                  2h 14m
                </span>
                <span className="text-xs text-[#047857] font-mono font-medium">-18m faster</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-[#E2E8F0] space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#64748B]">B2B Benchmark: 1d 17h</span>
                <span className="font-semibold text-[#111827] font-mono">Top 5%: 2h 11m</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-medium text-blue-700">
                <Timer className="w-4 h-4 shrink-0" />
                <span>Automated triage saved ~34 mins per P1 ticket</span>
              </div>
              <p className="text-[11px] text-[#64748B]">
                Direct urgent SAML and webhook alerts to specialized engineering queues.
              </p>
            </div>
          </div>

          {/* Card 3: SLA Compliance */}
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs text-[#64748B]">
                <span className="font-medium text-[#111827]">SLA Compliance Percentage</span>
                <span className="font-mono">4 active policies</span>
              </div>
              <div className="mt-2 flex items-baseline gap-2.5">
                <span className="text-3xl font-bold font-mono tabular-nums text-[#111827]">
                  96.4%
                </span>
                <span className="text-xs text-[#047857] font-mono font-medium">Target ≥ 95.0%</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-[#E2E8F0] space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#64748B]">At-Risk Queue: 2 tickets</span>
                <span className="font-semibold text-red-700 font-mono">Breached: 2</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-medium text-[#047857]">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>P2 & P3 queues operating above 97% compliance</span>
              </div>
              <p className="text-[11px] text-[#64748B]">
                Review SLA Monitoring to inspect countdowns on HD-1001 and HD-1002.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Row: Ticket Volume Line Chart + Ticket Status Donut Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Ticket Volume Over Time (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-[#E2E8F0] rounded-xl p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <h3 className="text-sm font-bold text-[#111827]">Ticket Volume Over Time</h3>
              <p className="text-xs text-[#64748B]">
                Daily comparison of incoming requests vs. resolved tickets
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="inline-flex items-center gap-1.5 text-slate-700">
                <span className="w-2.5 h-2.5 rounded-xs bg-[#047857]" />
                Created
              </span>
              <span className="inline-flex items-center gap-1.5 text-slate-700">
                <span className="w-2.5 h-2.5 rounded-xs bg-[#10B981]" />
                Resolved
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={VOLUME_CHART_DATA} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id="emeraldCreated" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#047857" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="#047857" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="mintResolved" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
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
                <Area
                  type="monotone"
                  dataKey="created"
                  name="Created Tickets"
                  stroke="#047857"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#emeraldCreated)"
                />
                <Area
                  type="monotone"
                  dataKey="resolved"
                  name="Resolved Tickets"
                  stroke="#10B981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#mintResolved)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tickets by Status Donut + Priority Distribution (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-[#E2E8F0] rounded-xl p-5 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-[#111827]">Tickets by Status & Priority</h3>
            <p className="text-xs text-[#64748B]">
              Current queue composition across {tickets.length} tracked records
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center my-2">
            <div className="h-44 w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={46}
                    outerRadius={68}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {statusDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      borderColor: '#E2E8F0',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xl font-bold font-mono tabular-nums text-[#111827]">
                  {tickets.length}
                </span>
                <span className="text-[10px] text-[#64748B]">Total</span>
              </div>
            </div>

            <div className="space-y-2">
              {statusDistribution.map((item) => (
                <div key={item.name} className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2 text-slate-700">
                    <span
                      className="w-2.5 h-2.5 rounded-xs shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <span>{item.name}</span>
                  </span>
                  <span className="font-mono font-semibold tabular-nums text-[#111827]">
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Priority Breakdown Bars */}
          <div className="pt-3 border-t border-[#E2E8F0] space-y-2">
            <div className="text-xs font-semibold text-[#111827]">Distribution by Priority</div>
            <div className="grid grid-cols-2 gap-2.5">
              {priorityDistribution.map((p) => (
                <div key={p.label} className="space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[#64748B]">{p.label}</span>
                    <span className="font-mono tabular-nums font-medium text-[#111827]">
                      {p.count} ({p.pct}%)
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${p.barColor} rounded-full`}
                      style={{ width: `${Math.max(8, p.pct)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Second Row: Top Used Tags (Reference UI Style) + Team Workload + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Top Used Tags (4 cols) */}
        <div className="lg:col-span-4 bg-white border border-[#E2E8F0] rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-[#111827]">Top Used Ticket Tags</h3>
              <p className="text-xs text-[#64748B]">Most frequent classification labels</p>
            </div>
          </div>
          <div className="space-y-2.5">
            {TOP_USED_TAGS.map((item) => (
              <div key={item.tag} className="relative">
                <div
                  className="bg-[#ECFDF5] border border-[#10B981]/20 rounded-lg px-3 py-2 flex items-center justify-between text-xs"
                  style={{ width: `${Math.max(48, item.percentage)}%` }}
                >
                  <span className="font-mono font-medium text-[#065F46] truncate">
                    {item.tag}
                  </span>
                  <span className="font-mono tabular-nums text-[11px] text-[#047857] font-semibold ml-2">
                    {item.count}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Team Workload Overview (4 cols) */}
        <div className="lg:col-span-4 bg-white border border-[#E2E8F0] rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-bold text-[#111827]">Team Workload Overview</h3>
                <p className="text-xs text-[#64748B]">Active agent capacity & response speed</p>
              </div>
              <button
                type="button"
                onClick={() => navigateTo('team')}
                className="text-xs font-semibold text-[#047857] hover:underline"
              >
                Manage
              </button>
            </div>

            <div className="space-y-3">
              {activeAgents.slice(0, 4).map((agent) => {
                const utilPct = Math.min(100, Math.round((agent.assignedTicketsCount / 16) * 100));
                return (
                  <div key={agent.id} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <Avatar initials={agent.avatarInitials} size="xs" variant="emerald" />
                        <span className="font-medium text-[#111827] truncate">
                          {agent.fullName}
                        </span>
                      </div>
                      <span className="font-mono tabular-nums text-[11px] text-[#64748B] shrink-0">
                        {agent.assignedTicketsCount} assigned · {agent.avgResponseTimeMinutes}m avg
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          utilPct > 80 ? 'bg-amber-500' : 'bg-[#047857]'
                        }`}
                        style={{ width: `${utilPct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-3 mt-3 border-t border-[#E2E8F0] flex items-center justify-between text-xs text-[#64748B]">
            <span className="inline-flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-[#047857]" />
              {activeAgents.length} agents online
            </span>
            <span className="font-mono tabular-nums">Avg CSAT: 4.90</span>
          </div>
        </div>

        {/* Recent Activity Feed (4 cols) */}
        <div className="lg:col-span-4 bg-white border border-[#E2E8F0] rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-[#111827]">Recent Activity</h3>
              <p className="text-xs text-[#64748B]">Live audit events across queues</p>
            </div>
            <button
              type="button"
              onClick={() => navigateTo('notifications')}
              className="text-xs font-semibold text-[#047857] hover:underline"
            >
              All alerts
            </button>
          </div>

          <div className="divide-y divide-[#E2E8F0]">
            {[
              {
                id: 'ev-1',
                icon: MessageSquare,
                title: 'Sarah Jenkins replied on HD-1001',
                meta: 'Promoted SHA-256 SAML cert · 18m ago',
                ticketId: 'HD-1001',
              },
              {
                id: 'ev-2',
                icon: TicketIcon,
                title: 'Elena Rostova created HD-1006',
                meta: 'Webhook HMAC signature mismatch · 31m ago',
                ticketId: 'HD-1006',
              },
              {
                id: 'ev-3',
                icon: UserCheck,
                title: 'David Chen assigned to HD-1002',
                meta: 'Stripe seat expansion receipt · 42m ago',
                ticketId: 'HD-1002',
              },
              {
                id: 'ev-4',
                icon: CheckCircle2,
                title: 'Ticket HD-1005 marked Resolved',
                meta: 'Solaris Clean Energy VAT PDF · 5h ago',
                ticketId: 'HD-1005',
              },
            ].map((ev) => {
              const Icon = ev.icon;
              return (
                <button
                  key={ev.id}
                  type="button"
                  onClick={() => navigateTo('ticket-detail', { ticketId: ev.ticketId })}
                  className="w-full py-2.5 flex items-start gap-3 text-left hover:bg-[#F0FDF4]/60 rounded-lg px-1.5 transition-colors"
                >
                  <div className="w-7 h-7 rounded-lg bg-[#ECFDF5] text-[#047857] flex items-center justify-center shrink-0 mt-0.5">
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold text-[#111827] truncate">{ev.title}</div>
                    <div className="text-[11px] text-[#64748B] truncate mt-0.5">{ev.meta}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Tickets Table */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-[#111827]">Recent Support Tickets</h3>
            <p className="text-xs text-[#64748B]">
              Click any ticket row to inspect the conversation timeline, internal notes, and SLA
              timers.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigateTo('tickets')}
            className="text-xs font-semibold text-[#047857] hover:underline whitespace-nowrap"
          >
            View All Tickets ({tickets.length}) →
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
                <th className="py-3 px-4">Ticket ID</th>
                <th className="py-3 px-4">Subject</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Assigned Agent</th>
                <th className="py-3 px-4">SLA</th>
                <th className="py-3 px-4 text-right">Last Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] text-xs">
              {tickets.slice(0, 6).map((ticket) => (
                <tr
                  key={ticket.id}
                  onClick={() => navigateTo('ticket-detail', { ticketId: ticket.id })}
                  className="hover:bg-[#F0FDF4]/70 transition-colors cursor-pointer"
                >
                  <td className="py-3.5 px-4 font-mono font-semibold text-[#047857] whitespace-nowrap">
                    {ticket.id}
                  </td>
                  <td className="py-3.5 px-4 max-w-xs">
                    <div className="font-semibold text-[#111827] truncate">{ticket.subject}</div>
                    <div className="text-[11px] text-[#64748B] truncate mt-0.5">
                      {ticket.categoryName}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Avatar initials={ticket.customerInitials} size="xs" variant="slate" />
                      <div>
                        <div className="font-medium text-[#111827]">{ticket.customerName}</div>
                        <div className="text-[11px] text-[#64748B]">
                          {ticket.customerOrganization}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <PriorityBadge priority={ticket.priority} />
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <StatusBadge status={ticket.status} />
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    {ticket.assignedAgentName ? (
                      <div className="flex items-center gap-2">
                        <Avatar
                          initials={ticket.assignedAgentInitials || 'AG'}
                          size="xs"
                          variant="emerald"
                        />
                        <span className="text-[#111827] font-medium">
                          {ticket.assignedAgentName}
                        </span>
                      </div>
                    ) : (
                      <span className="text-amber-700 font-medium">Unassigned</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <SlaBadge
                      slaStatus={ticket.slaStatus}
                      remainingMinutes={ticket.resolutionRemainingMinutes}
                    />
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono tabular-nums text-[#64748B] whitespace-nowrap">
                    {ticket.updatedAt}
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
