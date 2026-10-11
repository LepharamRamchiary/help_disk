'use client';

import React, { useState, useMemo } from 'react';
import { useHelpDesk } from '@/context/HelpDeskContext';
import { Organization, Attachment } from '@/types/helpdesk';
import {
  StatusBadge,
  PriorityBadge,
  Avatar,
  ConfirmDialog,
  PageHeader,
  EmptyState,
} from '@/components/ui/design-system';
import {
  Bell,
  CheckCheck,
  Flame,
  MessageSquare,
  UserCheck,
  RefreshCw,
  Plus,
  Send,
  Paperclip,
  FileText,
  ShieldCheck,
  Building2,
  Server,
  Activity,
  CreditCard,
  Users,
  ExternalLink,
  CheckCircle2,
  Ban,
} from 'lucide-react';

// ============================================================================
// PAGE 14: NOTIFICATIONS CENTER
// ============================================================================
export function NotificationsView() {
  const {
    notifications,
    unreadNotificationsCount,
    markNotificationRead,
    markAllNotificationsRead,
    navigateTo,
  } = useHelpDesk();

  const [filter, setFilter] = useState<'ALL' | 'UNREAD' | 'SLA_ALERT' | 'CUSTOMER_REPLY'>('ALL');

  const filteredList = useMemo(() => {
    return notifications.filter((n) => {
      if (filter === 'UNREAD') return !n.read;
      if (filter === 'SLA_ALERT') return n.type === 'SLA_ALERT';
      if (filter === 'CUSTOMER_REPLY') return n.type === 'CUSTOMER_REPLY';
      return true;
    });
  }, [notifications, filter]);

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <PageHeader
        title={`Notification Center (${unreadNotificationsCount} Unread)`}
        description="Stay updated on ticket assignments, customer replies, status changes, and SLA warnings."
        actions={
          <button
            type="button"
            onClick={markAllNotificationsRead}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-[#047857] bg-[#ECFDF5] border border-[#10B981]/30 hover:bg-[#10B981]/20 rounded-lg transition-colors"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            <span>Mark All as Read</span>
          </button>
        }
      />

      <div className="flex items-center gap-1.5 bg-white border border-[#E2E8F0] rounded-xl p-1.5 w-fit">
        {(
          [
            { id: 'ALL', label: 'All Activity' },
            { id: 'UNREAD', label: `Unread (${unreadNotificationsCount})` },
            { id: 'SLA_ALERT', label: 'SLA Alerts' },
            { id: 'CUSTOMER_REPLY', label: 'Customer Replies' },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilter(tab.id)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              filter === tab.id
                ? 'bg-[#047857] text-white font-semibold'
                : 'text-[#64748B] hover:text-[#111827]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {filteredList.length === 0 ? (
        <EmptyState
          title="You’re all caught up"
          description="No notifications match the selected filter."
          actionLabel="Show All Notifications"
          onAction={() => setFilter('ALL')}
        />
      ) : (
        <div className="bg-white border border-[#E2E8F0] rounded-xl divide-y divide-[#E2E8F0] overflow-hidden">
          {filteredList.map((n) => {
            const iconMap = {
              SLA_ALERT: <Flame className="w-4 h-4 text-red-600" />,
              CUSTOMER_REPLY: <MessageSquare className="w-4 h-4 text-blue-600" />,
              ASSIGNMENT: <UserCheck className="w-4 h-4 text-[#047857]" />,
              STATUS_CHANGE: <RefreshCw className="w-4 h-4 text-emerald-600" />,
              MENTION: <Bell className="w-4 h-4 text-amber-600" />,
            };

            return (
              <div
                key={n.id}
                className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
                  !n.read ? 'bg-[#ECFDF5]/40' : 'bg-white hover:bg-slate-50/70'
                }`}
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-white border border-[#E2E8F0] flex items-center justify-center shrink-0 mt-0.5">
                    {iconMap[n.type]}
                  </div>
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold text-[#047857]">
                        {n.ticketId}
                      </span>
                      <h3 className="text-xs sm:text-sm font-bold text-[#111827]">{n.title}</h3>
                      {!n.read && (
                        <span className="text-[11px] font-semibold text-[#047857]">
                          · Unread
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#64748B] leading-relaxed">{n.description}</p>
                    <div className="text-[11px] font-mono text-slate-400">{n.createdAt}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {!n.read && (
                    <button
                      type="button"
                      onClick={() => markNotificationRead(n.id)}
                      className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-[#E2E8F0] hover:bg-slate-50 rounded-lg"
                    >
                      Mark Read
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      markNotificationRead(n.id);
                      navigateTo('ticket-detail', { ticketId: n.ticketId });
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-[#047857] hover:bg-[#065F46] rounded-lg"
                  >
                    <span>Open {n.ticketId}</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// PAGE 15: CUSTOMER PORTAL (SIMPLIFIED CUSTOMER-FACING EXPERIENCE)
// ============================================================================
export function CustomerPortalView() {
  const {
    tickets,
    setCreateTicketModalOpen,
    addTicketMessage,
    addToast,
  } = useHelpDesk();

  const [portalTab, setPortalTab] = useState<'tickets' | 'settings'>('tickets');
  const [selectedPortalTicketId, setSelectedPortalTicketId] = useState<string>('HD-1001');
  const [replyText, setReplyText] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);

  // Customer Profile Settings State
  const [custName, setCustName] = useState('Elena Rostova');
  const [custEmail, setCustEmail] = useState('elena.rostova@nordicbank.io');
  const [custTimezone, setCustTimezone] = useState('CET (UTC+1 — Stockholm)');
  const [emailUpdates, setEmailUpdates] = useState(true);

  // Only show tickets belonging to Elena Rostova (cust-1) or created during this session
  const myCustomerTickets = useMemo(
    () =>
      tickets.filter(
        (t) =>
          t.customerId === 'cust-1' ||
          t.customerEmail === 'elena.rostova@nordicbank.io' ||
          t.id.startsWith('HD-101')
      ),
    [tickets]
  );

  const activeTicket = useMemo(
    () =>
      myCustomerTickets.find((t) => t.id === selectedPortalTicketId) ||
      myCustomerTickets[0],
    [myCustomerTickets, selectedPortalTicketId]
  );

  // CRITICAL SECURITY REQUIREMENT: Never expose internal agent notes in Customer Portal!
  const publicMessagesOnly = useMemo(
    () => (activeTicket ? activeTicket.messages.filter((m) => !m.isInternalNote) : []),
    [activeTicket]
  );

  const handleCustomerReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTicket || (!replyText.trim() && attachments.length === 0)) return;
    addTicketMessage(activeTicket.id, replyText, false, attachments);
    setReplyText('');
    setAttachments([]);
  };

  return (
    <div className="space-y-6">
      {/* Customer Welcome Banner */}
      <div className="bg-[#102A23] text-white rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-2 text-xs font-medium text-[#10B981]">
            <ShieldCheck className="w-4 h-4" />
            <span>NordicBank Financial · Enterprise Customer Support Portal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Welcome back, {custName.split(' ')[0]}
          </h1>
          <p className="text-xs sm:text-sm text-emerald-100/80">
            Track your active support requests, collaborate directly with assigned engineers, and
            upload diagnostic attachments.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setPortalTab(portalTab === 'tickets' ? 'settings' : 'tickets')}
            className="px-4 py-2.5 text-xs font-semibold text-emerald-100 bg-emerald-950/80 border border-emerald-700/70 hover:bg-emerald-900 rounded-xl transition-colors"
          >
            {portalTab === 'tickets' ? 'Account Settings' : 'Back to My Tickets'}
          </button>
          <button
            type="button"
            onClick={() => setCreateTicketModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-[#047857] hover:bg-[#065F46] border border-[#10B981]/40 rounded-xl transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Ticket</span>
          </button>
        </div>
      </div>

      {/* My Tickets Summary KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4">
          <div className="text-xs text-[#64748B]">My Total Requests</div>
          <div className="text-2xl font-bold font-mono tabular-nums text-[#111827] mt-1">
            {myCustomerTickets.length}
          </div>
          <div className="text-[11px] text-[#047857] mt-0.5">Enterprise 15m P1 SLA Active</div>
        </div>
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4">
          <div className="text-xs text-[#64748B]">Open / In Progress</div>
          <div className="text-2xl font-bold font-mono tabular-nums text-[#047857] mt-1">
            {
              myCustomerTickets.filter(
                (t) => t.status === 'OPEN' || t.status === 'IN_PROGRESS'
              ).length
            }
          </div>
          <div className="text-[11px] text-[#64748B] mt-0.5">Engineers actively investigating</div>
        </div>
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4">
          <div className="text-xs text-[#64748B]">Resolved Requests</div>
          <div className="text-2xl font-bold font-mono tabular-nums text-[#111827] mt-1">
            {
              myCustomerTickets.filter(
                (t) => t.status === 'RESOLVED' || t.status === 'CLOSED'
              ).length
            }
          </div>
          <div className="text-[11px] text-[#64748B] mt-0.5">Full transcript archive available</div>
        </div>
      </div>

      {portalTab === 'settings' ? (
        /* Customer Account Settings */
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 max-w-2xl space-y-4">
          <h2 className="text-base font-bold text-[#111827]">My Portal Account Settings</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-[#111827] mb-1">Full Name</label>
              <input
                type="text"
                value={custName}
                onChange={(e) => setCustName(e.target.value)}
                className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg"
              />
            </div>
            <div>
              <label className="block font-semibold text-[#111827] mb-1">Email Address</label>
              <input
                type="email"
                value={custEmail}
                onChange={(e) => setCustEmail(e.target.value)}
                className="w-full px-3 py-2 font-mono border border-[#E2E8F0] rounded-lg"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block font-semibold text-[#111827] mb-1">Time Zone</label>
              <input
                type="text"
                value={custTimezone}
                onChange={(e) => setCustTimezone(e.target.value)}
                className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg"
              />
            </div>
          </div>
          <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer pt-2">
            <input
              type="checkbox"
              checked={emailUpdates}
              onChange={(e) => setEmailUpdates(e.target.checked)}
              className="rounded border-slate-300 text-[#047857]"
            />
            <span>Receive email notifications when a support engineer replies to my ticket</span>
          </label>
          <div className="pt-3">
            <button
              type="button"
              onClick={() => {
                addToast('Customer Profile Updated', 'Your portal preferences have been saved.');
                setPortalTab('tickets');
              }}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#047857] hover:bg-[#065F46] rounded-lg"
            >
              Save Preferences
            </button>
          </div>
        </div>
      ) : (
        /* Split Customer Ticket List + Conversation View */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left List: My Tickets */}
          <div className="lg:col-span-5 bg-white border border-[#E2E8F0] rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-between">
              <h2 className="text-sm font-bold text-[#111827]">My Support Requests</h2>
              <span className="text-xs font-mono text-[#64748B]">
                {myCustomerTickets.length} total
              </span>
            </div>
            <div className="divide-y divide-[#E2E8F0]">
              {myCustomerTickets.map((t) => {
                const isSelected = activeTicket?.id === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setSelectedPortalTicketId(t.id)}
                    className={`w-full text-left p-4 transition-colors ${
                      isSelected ? 'bg-[#ECFDF5]/70' : 'hover:bg-[#F0FDF4]/50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-mono text-xs font-bold text-[#047857]">{t.id}</span>
                      <StatusBadge status={t.status} />
                    </div>
                    <div className="text-xs font-bold text-[#111827]">{t.subject}</div>
                    <div className="flex items-center justify-between gap-2 mt-2 text-[11px] text-[#64748B]">
                      <PriorityBadge priority={t.priority} />
                      <span className="font-mono">Updated {t.updatedAt}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Column: Selected Ticket Conversation (Zero Internal Notes!) */}
          {activeTicket && (
            <div className="lg:col-span-7 bg-white border border-[#E2E8F0] rounded-xl p-6 space-y-5">
              <div className="border-b border-[#E2E8F0] pb-4 space-y-2">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-[#047857]">
                      {activeTicket.id}
                    </span>
                    <span>·</span>
                    <StatusBadge status={activeTicket.status} />
                    <span>·</span>
                    <PriorityBadge priority={activeTicket.priority} />
                  </div>
                  <span className="text-xs text-[#64748B]">
                    Category: {activeTicket.categoryName}
                  </span>
                </div>
                <h2 className="text-lg font-bold text-[#111827]">{activeTicket.subject}</h2>
                <p className="text-xs text-[#64748B] leading-relaxed">
                  {activeTicket.description}
                </p>
              </div>

              {/* Public Conversation Thread */}
              <div className="space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
                  Messages ({publicMessagesOnly.length})
                </div>

                {publicMessagesOnly.map((msg) => {
                  const isStaff = msg.authorRole !== 'CUSTOMER';
                  return (
                    <div
                      key={msg.id}
                      className={`p-4 rounded-xl border space-y-2 ${
                        isStaff
                          ? 'bg-[#F0FDF4]/60 border-[#10B981]/30'
                          : 'bg-[#F8FAFC] border-[#E2E8F0]'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <Avatar
                            initials={msg.authorInitials}
                            size="xs"
                            variant={isStaff ? 'emerald' : 'slate'}
                          />
                          <span className="font-bold text-[#111827]">{msg.authorName}</span>
                          <span className="text-[11px] text-[#64748B]">
                            {isStaff ? '· HelpDesk Pro Support' : '· You'}
                          </span>
                        </div>
                        <span className="font-mono text-[11px] text-[#64748B]">
                          {msg.createdAt}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-[#111827] whitespace-pre-line leading-relaxed">
                        {msg.body}
                      </p>
                      {msg.attachments.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-1">
                          {msg.attachments.map((att) => (
                            <span
                              key={att.id}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-[#E2E8F0] rounded text-xs font-mono"
                            >
                              <FileText className="w-3.5 h-3.5 text-[#047857]" />
                              {att.fileName} ({att.fileSize})
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Customer Reply Box */}
              <form onSubmit={handleCustomerReply} className="space-y-3 pt-3 border-t border-[#E2E8F0]">
                <textarea
                  rows={3}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Write a message or provide additional details for your support engineer..."
                  className="w-full p-3 text-xs sm:text-sm border border-[#E2E8F0] rounded-lg focus:outline-none focus:border-[#047857]"
                />
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      setAttachments((prev) => [
                        ...prev,
                        {
                          id: `cust-att-${Date.now()}`,
                          fileName: 'customer-screenshot.png',
                          fileSize: '215 KB',
                          fileType: 'image',
                          uploadedAt: 'Just now',
                          uploadedBy: custName,
                        },
                      ]);
                      addToast('File Attached', 'Attached customer-screenshot.png to reply.', 'info');
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg hover:bg-slate-100"
                  >
                    <Paperclip className="w-3.5 h-3.5" />
                    <span>Attach File ({attachments.length})</span>
                  </button>

                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#047857] hover:bg-[#065F46] rounded-lg"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Reply</span>
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// PAGE 16: PLATFORM ADMINISTRATION (MULTI-TENANT SAAS OPERATIONS)
// ============================================================================
export function PlatformAdminView() {
  const {
    organizations,
    toggleOrganizationStatus,
    updateOrganizationPlan,
    switchOrganization,
    navigateTo,
  } = useHelpDesk();

  const [confirmSuspendOrg, setConfirmSuspendOrg] = useState<Organization | null>(null);

  const totalMrr = useMemo(
    () => organizations.reduce((acc, o) => acc + o.mrr, 0),
    [organizations]
  );
  const totalPlatformTickets = useMemo(
    () => organizations.reduce((acc, o) => acc + o.monthlyTickets, 0),
    [organizations]
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Platform Administration — Multi-Tenant Operations"
        description="Supervise tenant organizations, subscription plans, seat utilization, and platform-wide infrastructure health."
      />

      {/* Platform-Level Health & SaaS Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-5">
          <div className="flex items-center justify-between text-xs text-[#64748B]">
            <span>Tenant Organizations</span>
            <Building2 className="w-4 h-4 text-[#047857]" />
          </div>
          <div className="text-3xl font-bold font-mono tabular-nums text-[#111827] mt-2">
            {organizations.length}
          </div>
          <div className="text-[11px] text-[#047857] mt-1">
            {organizations.filter((o) => o.status === 'Active').length} Active · 1 Trial · 1
            Suspended
          </div>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-xl p-5">
          <div className="flex items-center justify-between text-xs text-[#64748B]">
            <span>Platform Monthly Recurring Revenue</span>
            <CreditCard className="w-4 h-4 text-[#047857]" />
          </div>
          <div className="text-3xl font-bold font-mono tabular-nums text-[#111827] mt-2">
            ${totalMrr.toLocaleString('en-US')}
          </div>
          <div className="text-[11px] text-[#047857] mt-1">+18.4% net dollar retention</div>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-xl p-5">
          <div className="flex items-center justify-between text-xs text-[#64748B]">
            <span>30-Day Platform Ticket Volume</span>
            <Activity className="w-4 h-4 text-[#047857]" />
          </div>
          <div className="text-3xl font-bold font-mono tabular-nums text-[#111827] mt-2">
            {totalPlatformTickets.toLocaleString('en-US')}
          </div>
          <div className="text-[11px] text-[#64748B] mt-1">Across 70 provisioned agent seats</div>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-xl p-5">
          <div className="flex items-center justify-between text-xs text-[#64748B]">
            <span>Platform API & SLA Scheduler Health</span>
            <Server className="w-4 h-4 text-[#047857]" />
          </div>
          <div className="text-3xl font-bold font-mono tabular-nums text-[#047857] mt-2">
            99.98%
          </div>
          <div className="text-[11px] text-[#64748B] mt-1">
            EU-North & US-East clusters nominal
          </div>
        </div>
      </div>

      {/* Organization Directory Table */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E2E8F0]">
          <h2 className="text-base font-bold text-[#111827]">Tenant Organization Directory</h2>
          <p className="text-xs text-[#64748B]">
            Manage subscription plans, inspect seat utilization, or activate/suspend tenant access.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
                <th className="py-3 px-4">Organization & Domain</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Subscription Plan</th>
                <th className="py-3 px-4">Created Date</th>
                <th className="py-3 px-4 text-right">Seat Usage</th>
                <th className="py-3 px-4 text-right">30d Tickets</th>
                <th className="py-3 px-4 text-right">MRR</th>
                <th className="py-3 px-4 text-right">Tenant Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] text-xs">
              {organizations.map((org) => (
                <tr key={org.id} className="hover:bg-[#F0FDF4]/50 transition-colors">
                  <td className="py-4 px-4 whitespace-nowrap">
                    <div className="font-bold text-[#111827]">{org.name}</div>
                    <div className="text-[11px] text-[#64748B] font-mono">
                      {org.domain} · {org.primaryContact}
                    </div>
                  </td>

                  <td className="py-4 px-4 whitespace-nowrap">
                    {org.status === 'Active' && (
                      <span className="inline-flex items-center gap-1.5 font-semibold text-[#047857]">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Active
                      </span>
                    )}
                    {org.status === 'Trial' && (
                      <span className="inline-flex items-center gap-1.5 font-semibold text-blue-700">
                        <Users className="w-3.5 h-3.5" />
                        14-Day Trial
                      </span>
                    )}
                    {org.status === 'Suspended' && (
                      <span className="inline-flex items-center gap-1.5 font-semibold text-red-700">
                        <Ban className="w-3.5 h-3.5" />
                        Suspended
                      </span>
                    )}
                  </td>

                  <td className="py-4 px-4 whitespace-nowrap">
                    <select
                      aria-label={`Subscription plan for ${org.name}`}
                      value={org.plan}
                      onChange={(e) =>
                        updateOrganizationPlan(org.id, e.target.value as Organization['plan'])
                      }
                      className="px-2.5 py-1 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg font-medium text-[#111827]"
                    >
                      <option value="Enterprise">Enterprise</option>
                      <option value="Growth">Growth</option>
                      <option value="Starter">Starter</option>
                    </select>
                  </td>

                  <td className="py-4 px-4 font-mono tabular-nums text-[#64748B] whitespace-nowrap">
                    {org.createdAt}
                  </td>

                  <td className="py-4 px-4 text-right font-mono tabular-nums text-[#111827]">
                    {org.agentCount} / {org.seatLimit} seats
                  </td>

                  <td className="py-4 px-4 text-right font-mono tabular-nums font-semibold text-[#111827]">
                    {org.monthlyTickets.toLocaleString()}
                  </td>

                  <td className="py-4 px-4 text-right font-mono tabular-nums font-semibold text-[#047857]">
                    ${org.mrr.toLocaleString()}
                  </td>

                  <td className="py-4 px-4 text-right whitespace-nowrap">
                    <div className="inline-flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          switchOrganization(org.id);
                          navigateTo('overview');
                        }}
                        className="px-2.5 py-1 text-xs font-medium text-[#047857] bg-[#ECFDF5] hover:bg-[#10B981]/20 rounded-lg"
                      >
                        Inspect Tenant
                      </button>

                      <button
                        type="button"
                        onClick={() => setConfirmSuspendOrg(org)}
                        className={`px-2.5 py-1 text-xs font-medium rounded-lg border transition-colors ${
                          org.status === 'Suspended'
                            ? 'border-[#10B981]/40 bg-[#ECFDF5] text-[#047857]'
                            : 'border-[#E2E8F0] text-slate-700 hover:bg-red-50 hover:text-red-700 hover:border-red-200'
                        }`}
                      >
                        {org.status === 'Suspended' ? 'Activate' : 'Suspend'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmDialog
        isOpen={!!confirmSuspendOrg}
        onClose={() => setConfirmSuspendOrg(null)}
        onConfirm={() => {
          if (confirmSuspendOrg) toggleOrganizationStatus(confirmSuspendOrg.id);
        }}
        title={
          confirmSuspendOrg?.status === 'Suspended'
            ? `Reactivate ${confirmSuspendOrg.name}?`
            : `Suspend tenant ${confirmSuspendOrg?.name}?`
        }
        description={
          confirmSuspendOrg?.status === 'Suspended'
            ? `Reactivating ${confirmSuspendOrg.name} will restore agent workspace login and resume SLA webhook processing.`
            : `Suspending ${confirmSuspendOrg?.name} will temporarily block agent sign-ins while preserving all customer ticket data.`
        }
        confirmLabel={
          confirmSuspendOrg?.status === 'Suspended' ? 'Activate Organization' : 'Suspend Tenant'
        }
        destructive={confirmSuspendOrg?.status !== 'Suspended'}
      />
    </div>
  );
}
