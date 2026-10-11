'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useHelpDesk } from '@/context/HelpDeskContext';
import { HelpDeskApiService } from '@/services/api';
import { TicketPriority, TicketStatus } from '@/types/helpdesk';
import {
  StatusBadge,
  PriorityBadge,
  SlaBadge,
  Avatar,
  LoadingSkeleton,
  EmptyState,
  ErrorBanner,
  PageHeader,
} from '@/components/ui/design-system';
import {
  Search,
  Plus,
  Download,
  RotateCcw,
  ArrowUpDown,
  LayoutList,
  Table as TableIcon,
  CheckSquare,
  UserCheck,
  Flame,
  Clock,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';

type SavedTab = 'all' | 'my' | 'unassigned' | 'urgent' | 'awaiting' | 'resolved';
type SortField = 'id' | 'priority' | 'status' | 'createdAt';

export function TicketsView() {
  const {
    currentView,
    currentUser,
    tickets,
    categories,
    teamMembers,
    navigateTo,
    setCreateTicketModalOpen,
    bulkUpdateTickets,
    assignTicketAgent,
    updateTicketStatus,
    simulationState,
    setSimulationState,
    addToast,
  } = useHelpDesk();

  const [activeTab, setActiveTab] = useState<SavedTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [agentFilter, setAgentFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [dateFilter, setDateFilter] = useState<string>('ALL');

  const [sortField, setSortField] = useState<SortField>('id');
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  const [viewMode, setViewMode] = useState<'table' | 'compact'>('table');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkStatus, setBulkStatus] = useState<TicketStatus | ''>('');
  const [bulkAgentId, setBulkAgentId] = useState<string>('');

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Sync sidebar route to initial saved tab
  useEffect(() => {
    if (currentView === 'my-tickets') {
      setActiveTab('my');
    } else if (currentView === 'unassigned') {
      setActiveTab('unassigned');
    } else if (currentView === 'priority-queue') {
      setActiveTab('urgent');
    } else {
      setActiveTab('all');
    }
    setPage(1);
    setSelectedIds([]);
  }, [currentView]);

  const supportAgents = useMemo(
    () => teamMembers.filter((m) => m.role !== 'CUSTOMER' && m.role !== 'PLATFORM_ADMIN'),
    [teamMembers]
  );

  // Personalized My Tickets KPI stats
  const myAssignedTickets = useMemo(
    () => tickets.filter((t) => t.assignedAgentId === currentUser.id),
    [tickets, currentUser.id]
  );
  const myAwaitingTickets = useMemo(
    () =>
      myAssignedTickets.filter(
        (t) => t.status === 'OPEN' || t.status === 'IN_PROGRESS'
      ),
    [myAssignedTickets]
  );
  const myOverdueTickets = useMemo(
    () =>
      myAssignedTickets.filter(
        (t) =>
          (t.slaStatus === 'BREACHED' || t.slaStatus === 'AT_RISK') &&
          t.status !== 'RESOLVED' &&
          t.status !== 'CLOSED'
      ),
    [myAssignedTickets]
  );

  const filteredTickets = useMemo(() => {
    const priorityRank: Record<TicketPriority, number> = {
      URGENT: 4,
      HIGH: 3,
      MEDIUM: 2,
      LOW: 1,
    };

    return tickets
      .filter((t) => {
        // Saved Tab filter
        if (activeTab === 'my' && t.assignedAgentId !== currentUser.id) return false;
        if (activeTab === 'unassigned' && t.assignedAgentId !== null) return false;
        if (
          activeTab === 'urgent' &&
          t.priority !== 'URGENT' &&
          t.priority !== 'HIGH' &&
          t.slaStatus !== 'AT_RISK' &&
          t.slaStatus !== 'BREACHED'
        )
          return false;
        if (
          activeTab === 'awaiting' &&
          t.status !== 'OPEN' &&
          t.status !== 'WAITING_FOR_CUSTOMER'
        )
          return false;
        if (
          activeTab === 'resolved' &&
          t.status !== 'RESOLVED' &&
          t.status !== 'CLOSED'
        )
          return false;

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const match =
            t.id.toLowerCase().includes(q) ||
            t.subject.toLowerCase().includes(q) ||
            t.customerName.toLowerCase().includes(q) ||
            t.customerOrganization.toLowerCase().includes(q) ||
            t.customerEmail.toLowerCase().includes(q);
          if (!match) return false;
        }

        // Dropdown filters
        if (statusFilter !== 'ALL' && t.status !== statusFilter) return false;
        if (priorityFilter !== 'ALL' && t.priority !== priorityFilter) return false;
        if (agentFilter === 'UNASSIGNED' && t.assignedAgentId !== null) return false;
        if (
          agentFilter !== 'ALL' &&
          agentFilter !== 'UNASSIGNED' &&
          t.assignedAgentId !== agentFilter
        )
          return false;
        if (categoryFilter !== 'ALL' && t.categoryId !== categoryFilter) return false;
        if (dateFilter === 'TODAY' && !t.createdAt.startsWith('2026-10-11')) return false;
        if (dateFilter === 'RECENT' && t.createdAt.startsWith('2026-10-05')) return false;

        return true;
      })
      .sort((a, b) => {
        let cmp = 0;
        if (sortField === 'id') {
          cmp = a.id.localeCompare(b.id);
        } else if (sortField === 'priority') {
          cmp = priorityRank[a.priority] - priorityRank[b.priority];
        } else if (sortField === 'status') {
          cmp = a.status.localeCompare(b.status);
        } else if (sortField === 'createdAt') {
          cmp = a.createdAt.localeCompare(b.createdAt);
        }
        return sortAsc ? cmp : -cmp;
      });
  }, [
    tickets,
    activeTab,
    currentUser.id,
    searchQuery,
    statusFilter,
    priorityFilter,
    agentFilter,
    categoryFilter,
    dateFilter,
    sortField,
    sortAsc,
  ]);

  const totalPages = Math.max(1, Math.ceil(filteredTickets.length / pageSize));
  const paginatedTickets = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredTickets.slice(start, start + pageSize);
  }, [filteredTickets, page, pageSize]);

  const clearAllFilters = () => {
    setSearchQuery('');
    setStatusFilter('ALL');
    setPriorityFilter('ALL');
    setAgentFilter('ALL');
    setCategoryFilter('ALL');
    setDateFilter('ALL');
    setActiveTab('all');
    setPage(1);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === paginatedTickets.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedTickets.map((t) => t.id));
    }
  };

  const toggleSelectRow = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleApplyBulkActions = () => {
    if (selectedIds.length === 0) return;
    const updates: { status?: TicketStatus; assignedAgentId?: string | null } = {};
    if (bulkStatus) updates.status = bulkStatus;
    if (bulkAgentId === 'UNASSIGN') updates.assignedAgentId = null;
    else if (bulkAgentId) updates.assignedAgentId = bulkAgentId;

    if (Object.keys(updates).length === 0) {
      addToast('Select a Bulk Action', 'Choose an agent or status to apply.', 'info');
      return;
    }

    bulkUpdateTickets(selectedIds, updates);
    setSelectedIds([]);
    setBulkStatus('');
    setBulkAgentId('');
  };

  const headerMeta = {
    tickets: {
      title: 'All Tickets',
      description: 'Manage and track every support request across your organization.',
    },
    'my-tickets': {
      title: 'My Tickets Workspace',
      description: `Personalized support queue and SLA priorities assigned to ${currentUser.fullName}.`,
    },
    unassigned: {
      title: 'Unassigned Triage Queue',
      description: 'Incoming customer tickets awaiting agent ownership and initial triage.',
    },
    'priority-queue': {
      title: 'Priority & SLA Escalation Queue',
      description: 'Urgent P1/P2 requests and tickets approaching response or resolution deadlines.',
    },
  }[currentView as 'tickets' | 'my-tickets' | 'unassigned' | 'priority-queue'] || {
    title: 'All Tickets',
    description: 'Manage and track every support request.',
  };

  if (simulationState === 'LOADING') {
    return <LoadingSkeleton rows={8} />;
  }

  if (simulationState === 'ERROR') {
    return (
      <ErrorBanner
        message="Failed to execute paginated query on /api/v1/tickets. Check Spring Boot database connection pool."
        onRetry={() => setSimulationState('NORMAL')}
      />
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title={headerMeta.title}
        description={headerMeta.description}
        actions={
          <>
            {/* View Mode Toggle (Table vs Compact List) */}
            <div className="inline-flex items-center bg-white border border-[#E2E8F0] rounded-lg p-0.5">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  viewMode === 'table'
                    ? 'bg-[#ECFDF5] text-[#047857] font-semibold'
                    : 'text-[#64748B] hover:text-[#111827]'
                }`}
              >
                <TableIcon className="w-3.5 h-3.5" />
                <span>Table</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('compact')}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  viewMode === 'compact'
                    ? 'bg-[#ECFDF5] text-[#047857] font-semibold'
                    : 'text-[#64748B] hover:text-[#111827]'
                }`}
              >
                <LayoutList className="w-3.5 h-3.5" />
                <span>Compact List</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                HelpDeskApiService.tickets.exportToCsv(
                  filteredTickets,
                  `helpdesk-${activeTab}-tickets.csv`
                );
                addToast('Tickets Exported', `Exported ${filteredTickets.length} tickets to CSV.`);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-[#111827] bg-white hover:bg-slate-50 border border-[#E2E8F0] rounded-lg transition-colors whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export CSV</span>
            </button>

            <button
              type="button"
              onClick={() => setCreateTicketModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#047857] hover:bg-[#065F46] rounded-lg transition-colors whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Ticket</span>
            </button>
          </>
        }
      />

      {/* Personalized Workload Summary Cards when viewing My Tickets */}
      {(currentView === 'my-tickets' || activeTab === 'my') && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 flex items-center justify-between">
            <div>
              <div className="text-xs text-[#64748B]">Assigned to Me</div>
              <div className="text-2xl font-bold font-mono tabular-nums text-[#111827] mt-1">
                {myAssignedTickets.length}
              </div>
              <div className="text-[11px] text-[#047857] mt-0.5">Active workload capacity: 62%</div>
            </div>
            <div className="w-9 h-9 rounded-lg bg-[#ECFDF5] text-[#047857] flex items-center justify-center">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>

          <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 flex items-center justify-between">
            <div>
              <div className="text-xs text-[#64748B]">Awaiting My Reply</div>
              <div className="text-2xl font-bold font-mono tabular-nums text-[#111827] mt-1">
                {myAwaitingTickets.length}
              </div>
              <div className="text-[11px] text-[#64748B] mt-0.5">Avg response: 14 mins</div>
            </div>
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>

          <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 flex items-center justify-between">
            <div>
              <div className="text-xs text-[#64748B]">Overdue / SLA At-Risk</div>
              <div className="text-2xl font-bold font-mono tabular-nums text-amber-700 mt-1">
                {myOverdueTickets.length}
              </div>
              <div className="text-[11px] text-amber-700 mt-0.5">Prioritize HD-1001</div>
            </div>
            <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Flame className="w-4 h-4" />
            </div>
          </div>

          <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 flex items-center justify-between">
            <div>
              <div className="text-xs text-[#64748B]">My CSAT Score</div>
              <div className="text-2xl font-bold font-mono tabular-nums text-[#111827] mt-1">
                {currentUser.csatScore.toFixed(2)}
              </div>
              <div className="text-[11px] text-[#047857] mt-0.5">98% positive feedback</div>
            </div>
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
        </div>
      )}

      {/* Saved View Tabs */}
      <div className="flex items-center gap-1 p-1 bg-white border border-[#E2E8F0] rounded-xl overflow-x-auto">
        {(
          [
            { id: 'all', label: 'All Tickets', count: tickets.length },
            {
              id: 'my',
              label: 'My Tickets',
              count: tickets.filter((t) => t.assignedAgentId === currentUser.id).length,
            },
            {
              id: 'unassigned',
              label: 'Unassigned',
              count: tickets.filter((t) => !t.assignedAgentId).length,
            },
            {
              id: 'urgent',
              label: 'Urgent & High',
              count: tickets.filter((t) => t.priority === 'URGENT' || t.priority === 'HIGH').length,
            },
            {
              id: 'awaiting',
              label: 'Awaiting Response',
              count: tickets.filter(
                (t) => t.status === 'OPEN' || t.status === 'WAITING_FOR_CUSTOMER'
              ).length,
            },
            {
              id: 'resolved',
              label: 'Resolved',
              count: tickets.filter((t) => t.status === 'RESOLVED' || t.status === 'CLOSED').length,
            },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => {
              setActiveTab(tab.id);
              setPage(1);
            }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
              activeTab === tab.id
                ? 'bg-[#ECFDF5] text-[#047857] font-semibold'
                : 'text-[#64748B] hover:text-[#111827] hover:bg-slate-50'
            }`}
          >
            <span>{tab.label}</span>
            <span className="font-mono tabular-nums text-[11px] opacity-80">({tab.count})</span>
          </button>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          {/* Search Input */}
          <div className="sm:col-span-2 relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Search ID (HD-1001), subject, or customer..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg focus:outline-none focus:border-[#047857]"
            />
          </div>

          {/* Status Dropdown */}
          <select
            aria-label="Filter by Status"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-1.5 text-xs bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-[#111827] focus:outline-none focus:border-[#047857]"
          >
            <option value="ALL">All Statuses</option>
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="WAITING_FOR_CUSTOMER">Waiting for Customer</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
          </select>

          {/* Priority Dropdown */}
          <select
            aria-label="Filter by Priority"
            value={priorityFilter}
            onChange={(e) => {
              setPriorityFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-1.5 text-xs bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-[#111827] focus:outline-none focus:border-[#047857]"
          >
            <option value="ALL">All Priorities</option>
            <option value="URGENT">Urgent</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>

          {/* Assigned Agent Dropdown */}
          <select
            aria-label="Filter by Assigned Agent"
            value={agentFilter}
            onChange={(e) => {
              setAgentFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-1.5 text-xs bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-[#111827] focus:outline-none focus:border-[#047857]"
          >
            <option value="ALL">All Agents</option>
            <option value="UNASSIGNED">Unassigned Only</option>
            {supportAgents.map((ag) => (
              <option key={ag.id} value={ag.id}>
                {ag.fullName}
              </option>
            ))}
          </select>

          {/* Category Dropdown */}
          <select
            aria-label="Filter by Category"
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-1.5 text-xs bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-[#111827] focus:outline-none focus:border-[#047857]"
          >
            <option value="ALL">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#E2E8F0] text-xs">
          <div className="flex items-center gap-3">
            <span className="text-[#64748B]">Created Date:</span>
            {(
              [
                { id: 'ALL', label: 'Any Time' },
                { id: 'TODAY', label: 'Today (Oct 11)' },
                { id: 'RECENT', label: 'Last 7 Days' },
              ] as const
            ).map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => setDateFilter(d.id)}
                className={`px-2 py-0.5 rounded font-medium transition-colors ${
                  dateFilter === d.id
                    ? 'bg-[#ECFDF5] text-[#047857] font-semibold'
                    : 'text-[#64748B] hover:text-[#111827]'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <span className="font-mono text-[#64748B]">
              Showing {filteredTickets.length} matching ticket(s)
            </span>
            <button
              type="button"
              onClick={clearAllFilters}
              className="inline-flex items-center gap-1 text-[#047857] hover:underline font-medium"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Clear Filters</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bulk Action Bar when tickets are checked */}
      {selectedIds.length > 0 && currentUser.role !== 'CUSTOMER' && (
        <div className="bg-[#102A23] text-white rounded-xl px-4 py-3 flex flex-wrap items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-2 text-xs font-medium">
            <CheckSquare className="w-4 h-4 text-[#10B981]" />
            <span className="font-mono font-bold">{selectedIds.length}</span>
            <span>ticket(s) selected for bulk action</span>
          </div>

          <div className="flex items-center flex-wrap gap-2">
            <select
              aria-label="Bulk assign agent"
              value={bulkAgentId}
              onChange={(e) => setBulkAgentId(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-emerald-950 border border-emerald-700 rounded-lg text-white"
            >
              <option value="">Assign Agent...</option>
              <option value="UNASSIGN">Unassign</option>
              {supportAgents.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.fullName}
                </option>
              ))}
            </select>

            <select
              aria-label="Bulk update status"
              value={bulkStatus}
              onChange={(e) => setBulkStatus(e.target.value as TicketStatus | '')}
              className="px-2.5 py-1.5 text-xs bg-emerald-950 border border-emerald-700 rounded-lg text-white"
            >
              <option value="">Set Status...</option>
              <option value="OPEN">Open</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="WAITING_FOR_CUSTOMER">Waiting for Customer</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
            </select>

            <button
              type="button"
              onClick={handleApplyBulkActions}
              className="px-3.5 py-1.5 text-xs font-semibold bg-[#10B981] text-[#102A23] hover:bg-emerald-400 rounded-lg transition-colors"
            >
              Apply Bulk Update
            </button>

            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="px-2.5 py-1.5 text-xs text-emerald-200 hover:text-white"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Empty Results State */}
      {simulationState === 'EMPTY' || filteredTickets.length === 0 ? (
        <EmptyState
          title="No tickets match your current filters"
          description="Try clearing your search query or adjusting the status, priority, and agent dropdowns."
          actionLabel="Reset All Filters"
          onAction={() => {
            setSimulationState('NORMAL');
            clearAllFilters();
          }}
        />
      ) : viewMode === 'table' ? (
        /* Table View */
        <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
                  <th className="py-3 px-4 w-10">
                    <input
                      type="checkbox"
                      aria-label="Select all tickets on this page"
                      checked={
                        paginatedTickets.length > 0 &&
                        selectedIds.length === paginatedTickets.length
                      }
                      onChange={toggleSelectAll}
                      className="rounded border-slate-300 text-[#047857] focus:ring-[#047857]"
                    />
                  </th>
                  <th className="py-3 px-3">
                    <button
                      type="button"
                      onClick={() => handleSort('id')}
                      className="inline-flex items-center gap-1 hover:text-[#111827]"
                    >
                      <span>Ticket ID</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="py-3 px-4">Subject & Category</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">
                    <button
                      type="button"
                      onClick={() => handleSort('priority')}
                      className="inline-flex items-center gap-1 hover:text-[#111827]"
                    >
                      <span>Priority</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="py-3 px-4">
                    <button
                      type="button"
                      onClick={() => handleSort('status')}
                      className="inline-flex items-center gap-1 hover:text-[#111827]"
                    >
                      <span>Status</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="py-3 px-4">Assigned Agent</th>
                  <th className="py-3 px-4">
                    <button
                      type="button"
                      onClick={() => handleSort('createdAt')}
                      className="inline-flex items-center gap-1 hover:text-[#111827]"
                    >
                      <span>Created / SLA</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0] text-xs">
                {paginatedTickets.map((ticket) => {
                  const isSelected = selectedIds.includes(ticket.id);
                  return (
                    <tr
                      key={ticket.id}
                      className={`transition-colors ${
                        isSelected ? 'bg-[#ECFDF5]/60' : 'hover:bg-[#F0FDF4]/60'
                      }`}
                    >
                      <td className="py-3.5 px-4">
                        <input
                          type="checkbox"
                          aria-label={`Select ticket ${ticket.id}`}
                          checked={isSelected}
                          onChange={() => toggleSelectRow(ticket.id)}
                          className="rounded border-slate-300 text-[#047857] focus:ring-[#047857]"
                        />
                      </td>
                      <td
                        onClick={() => navigateTo('ticket-detail', { ticketId: ticket.id })}
                        className="py-3.5 px-3 font-mono font-semibold text-[#047857] whitespace-nowrap cursor-pointer hover:underline"
                      >
                        {ticket.id}
                      </td>
                      <td
                        onClick={() => navigateTo('ticket-detail', { ticketId: ticket.id })}
                        className="py-3.5 px-4 max-w-xs cursor-pointer"
                      >
                        <div className="font-semibold text-[#111827] truncate">
                          {ticket.subject}
                        </div>
                        <div className="text-[11px] text-[#64748B] truncate mt-0.5">
                          {ticket.categoryName} · Updated {ticket.updatedAt}
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
                          <button
                            type="button"
                            onClick={() => assignTicketAgent(ticket.id, currentUser.id)}
                            className="text-xs font-medium text-[#047857] hover:underline"
                          >
                            + Claim Ticket
                          </button>
                        )}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-mono tabular-nums text-[11px] text-[#64748B]">
                          {ticket.createdAt}
                        </div>
                        <div className="mt-0.5">
                          <SlaBadge
                            slaStatus={ticket.slaStatus}
                            remainingMinutes={ticket.resolutionRemainingMinutes}
                          />
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          {ticket.status !== 'RESOLVED' && ticket.status !== 'CLOSED' && (
                            <button
                              type="button"
                              onClick={() => updateTicketStatus(ticket.id, 'RESOLVED')}
                              className="px-2 py-1 text-[11px] font-medium text-[#047857] bg-[#ECFDF5] hover:bg-[#10B981]/20 rounded transition-colors"
                            >
                              Resolve
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => navigateTo('ticket-detail', { ticketId: ticket.id })}
                            className="p-1.5 text-slate-500 hover:text-[#047857] hover:bg-slate-100 rounded-lg transition-colors"
                            title="Open Ticket Details"
                            aria-label={`Open details for ${ticket.id}`}
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="px-6 py-3.5 bg-[#F8FAFC] border-t border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-[#64748B]">
              <span>Rows per page:</span>
              <select
                aria-label="Rows per page"
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                className="px-2 py-1 bg-white border border-[#E2E8F0] rounded text-[#111827] font-mono"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
              </select>
              <span className="ml-2 font-mono tabular-nums">
                Page {page} of {totalPages}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 bg-white border border-[#E2E8F0] rounded-lg font-medium text-slate-700 disabled:opacity-40 hover:bg-slate-50"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 bg-white border border-[#E2E8F0] rounded-lg font-medium text-slate-700 disabled:opacity-40 hover:bg-slate-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Compact List View (for My Tickets / Tablet / Dense Triage) */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {paginatedTickets.map((ticket) => (
            <div
              key={ticket.id}
              onClick={() => navigateTo('ticket-detail', { ticketId: ticket.id })}
              className="bg-white border border-[#E2E8F0] hover:border-[#047857] rounded-xl p-4 cursor-pointer transition-colors flex flex-col justify-between gap-3"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-[#047857]">{ticket.id}</span>
                    <span className="text-slate-300">·</span>
                    <PriorityBadge priority={ticket.priority} />
                    <span className="text-slate-300">·</span>
                    <StatusBadge status={ticket.status} />
                  </div>
                  <SlaBadge
                    slaStatus={ticket.slaStatus}
                    remainingMinutes={ticket.resolutionRemainingMinutes}
                  />
                </div>
                <h3 className="text-sm font-semibold text-[#111827]">{ticket.subject}</h3>
                <p className="text-xs text-[#64748B] line-clamp-2">{ticket.description}</p>
              </div>

              <div className="pt-2.5 border-t border-[#E2E8F0] flex items-center justify-between text-xs text-[#64748B]">
                <span>
                  {ticket.customerName} ({ticket.customerOrganization})
                </span>
                <span className="font-mono">
                  {ticket.assignedAgentName || 'Unassigned'} · {ticket.updatedAt}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
