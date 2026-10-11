'use client';

import React, { useState, useMemo } from 'react';
import { useHelpDesk } from '@/context/HelpDeskContext';
import { Customer } from '@/types/helpdesk';
import {
  Avatar,
  StatusBadge,
  PriorityBadge,
  Modal,
  PageHeader,
  EmptyState,
  LoadingSkeleton,
  ErrorBanner,
} from '@/components/ui/design-system';
import {
  Search,
  UserPlus,
  Building2,
  Mail,
  Phone,
  MapPin,
  Clock,
  Star,
  ArrowLeft,
  ExternalLink,
  ShieldCheck,
  Ticket as TicketIcon,
} from 'lucide-react';

export function CustomersView() {
  const {
    customers,
    tickets,
    selectedCustomerId,
    setSelectedCustomerId,
    addCustomer,
    navigateTo,
    currentUser,
    simulationState,
    setSimulationState,
  } = useHelpDesk();

  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState<string>('ALL');
  const [addModalOpen, setAddModalOpen] = useState(false);

  // Add Customer form state
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newOrg, setNewOrg] = useState('');
  const [newTier, setNewTier] = useState<Customer['tier']>('Enterprise');
  const [newLocation, setNewLocation] = useState('London, UK');
  const [newNotes, setNewNotes] = useState('');

  const isManagerOrAdmin =
    currentUser.role === 'COMPANY_ADMIN' ||
    currentUser.role === 'SUPPORT_MANAGER' ||
    currentUser.role === 'PLATFORM_ADMIN';

  const selectedCustomer = useMemo(
    () => customers.find((c) => c.id === selectedCustomerId) || null,
    [customers, selectedCustomerId]
  );

  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      if (tierFilter !== 'ALL' && c.tier !== tierFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          c.fullName.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          c.organization.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [customers, tierFilter, searchQuery]);

  const handleAddCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim() || !newOrg.trim()) return;
    addCustomer({
      fullName: newName.trim(),
      email: newEmail.trim(),
      phone: newPhone.trim() || '+1 (555) 234-5678',
      organization: newOrg.trim(),
      tier: newTier,
      location: newLocation.trim() || 'Remote',
      timezone: 'UTC+0',
      notes: newNotes.trim() || 'Standard support SLA coverage.',
    });
    setAddModalOpen(false);
    setNewName('');
    setNewEmail('');
    setNewPhone('');
    setNewOrg('');
    setNewNotes('');
  };

  if (simulationState === 'LOADING') return <LoadingSkeleton rows={6} />;
  if (simulationState === 'ERROR') {
    return (
      <ErrorBanner
        message="GET /api/v1/customers failed with HTTP 503 Service Unavailable."
        onRetry={() => setSimulationState('NORMAL')}
      />
    );
  }

  // CUSTOMER DETAILS SUB-PAGE
  if (selectedCustomer) {
    const customerTickets = tickets.filter(
      (t) =>
        t.customerId === selectedCustomer.id ||
        t.customerEmail.toLowerCase() === selectedCustomer.email.toLowerCase()
    );

    return (
      <div className="space-y-6">
        <button
          type="button"
          onClick={() => setSelectedCustomerId(null)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#64748B] hover:text-[#111827]"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Customer Directory</span>
        </button>

        <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <Avatar initials={selectedCustomer.avatarInitials} size="lg" variant="emerald" />
            <div>
              <div className="flex items-center flex-wrap gap-2.5">
                <h1 className="text-xl font-bold text-[#111827]">{selectedCustomer.fullName}</h1>
                <span className="text-xs font-medium text-[#047857]">
                  · {selectedCustomer.tier} Account
                </span>
              </div>
              <p className="text-xs text-[#64748B] mt-1">
                {selectedCustomer.organization} · Customer since {selectedCustomer.createdAt}
              </p>
              <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-slate-600">
                <span className="inline-flex items-center gap-1.5 font-mono">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  {selectedCustomer.email}
                </span>
                {isManagerOrAdmin ? (
                  <span className="inline-flex items-center gap-1.5 font-mono">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    {selectedCustomer.phone}
                  </span>
                ) : (
                  <span
                    className="inline-flex items-center gap-1 text-slate-400"
                    title="Private phone contact restricted to Managers & Admins"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Phone hidden (RBAC policy)
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {selectedCustomer.location} ({selectedCustomer.timezone})
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 border-t lg:border-t-0 lg:border-l border-[#E2E8F0] pt-4 lg:pt-0 lg:pl-6 shrink-0">
            <div>
              <div className="text-[11px] text-[#64748B]">Total Tickets</div>
              <div className="text-2xl font-bold font-mono tabular-nums text-[#111827] mt-0.5">
                {selectedCustomer.totalTickets}
              </div>
            </div>
            <div>
              <div className="text-[11px] text-[#64748B]">Open Now</div>
              <div className="text-2xl font-bold font-mono tabular-nums text-[#047857] mt-0.5">
                {selectedCustomer.openTickets}
              </div>
            </div>
            <div>
              <div className="text-[11px] text-[#64748B]">CSAT Score</div>
              <div className="text-2xl font-bold font-mono tabular-nums text-[#111827] mt-0.5">
                {selectedCustomer.csatRating.toFixed(1)}
              </div>
            </div>
          </div>
        </div>

        {/* Account Notes & Ticket History */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 bg-white border border-[#E2E8F0] rounded-xl p-5 space-y-3">
            <h2 className="text-sm font-bold text-[#111827]">Account & SLA Context</h2>
            <p className="text-xs text-[#64748B] leading-relaxed">{selectedCustomer.notes}</p>
            <div className="pt-3 border-t border-[#E2E8F0] space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-[#64748B]">Last Interaction</span>
                <span className="font-mono text-[#111827]">
                  {selectedCustomer.lastInteraction}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748B]">Primary Organization</span>
                <span className="font-medium text-[#111827]">
                  {selectedCustomer.organization}
                </span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-8 bg-white border border-[#E2E8F0] rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-[#E2E8F0] flex items-center justify-between">
              <h2 className="text-sm font-bold text-[#111827]">
                Ticket History & Recent Conversations ({customerTickets.length})
              </h2>
            </div>

            {customerTickets.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#64748B]">
                No recent tickets found in the current workspace buffer for this customer.
              </div>
            ) : (
              <div className="divide-y divide-[#E2E8F0]">
                {customerTickets.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => navigateTo('ticket-detail', { ticketId: t.id })}
                    className="p-4 hover:bg-[#F0FDF4]/60 transition-colors cursor-pointer flex items-center justify-between gap-4"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-[#047857]">{t.id}</span>
                        <span className="text-xs font-semibold text-[#111827] truncate">
                          {t.subject}
                        </span>
                      </div>
                      <p className="text-xs text-[#64748B] line-clamp-1">{t.description}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <PriorityBadge priority={t.priority} />
                      <StatusBadge status={t.status} />
                      <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Customers"
        description="Directory of customer contacts, enterprise organizations, and lifetime support history."
        actions={
          <button
            type="button"
            onClick={() => setAddModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#047857] hover:bg-[#065F46] rounded-lg transition-colors whitespace-nowrap"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Add Customer</span>
          </button>
        }
      />

      {/* Search & Tier Filter */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search customer by name, email, or organization..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg focus:outline-none focus:border-[#047857]"
          />
        </div>

        <div className="flex items-center gap-1.5">
          {(['ALL', 'Enterprise', 'Mid-Market', 'Standard'] as const).map((tier) => (
            <button
              key={tier}
              type="button"
              onClick={() => setTierFilter(tier)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                tierFilter === tier
                  ? 'bg-[#ECFDF5] text-[#047857] font-semibold'
                  : 'text-[#64748B] hover:text-[#111827] hover:bg-slate-50'
              }`}
            >
              {tier === 'ALL' ? 'All Tiers' : tier}
            </button>
          ))}
        </div>
      </div>

      {filteredCustomers.length === 0 ? (
        <EmptyState
          title="No customers match your search"
          description="Try clearing the search query or adding a new customer contact."
          actionLabel="Clear Search"
          onAction={() => {
            setSearchQuery('');
            setTierFilter('ALL');
          }}
        />
      ) : (
        <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
                  <th className="py-3 px-4">Customer Name</th>
                  <th className="py-3 px-4">Email Address</th>
                  <th className="py-3 px-4">Organization</th>
                  <th className="py-3 px-4 text-right">Total Tickets</th>
                  <th className="py-3 px-4 text-right">Open Tickets</th>
                  <th className="py-3 px-4 text-right">CSAT</th>
                  <th className="py-3 px-4 text-right">Last Interaction</th>
                  <th className="py-3 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0] text-xs">
                {filteredCustomers.map((cust) => (
                  <tr
                    key={cust.id}
                    onClick={() => setSelectedCustomerId(cust.id)}
                    className="hover:bg-[#F0FDF4]/60 transition-colors cursor-pointer"
                  >
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2.5">
                        <Avatar initials={cust.avatarInitials} size="sm" variant="emerald" />
                        <div>
                          <div className="font-semibold text-[#111827]">{cust.fullName}</div>
                          <div className="text-[11px] text-[#64748B]">{cust.location}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-600 whitespace-nowrap">
                      {cust.email}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-medium text-[#111827]">{cust.organization}</div>
                      <div className="text-[11px] text-[#047857]">{cust.tier} Tier</div>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono tabular-nums font-semibold text-[#111827]">
                      {cust.totalTickets}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono tabular-nums">
                      <span
                        className={
                          cust.openTickets > 0
                            ? 'font-bold text-[#047857]'
                            : 'text-slate-400'
                        }
                      >
                        {cust.openTickets}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono tabular-nums text-[#111827]">
                      <span className="inline-flex items-center gap-1 justify-end">
                        <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                        {cust.csatRating.toFixed(1)}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono tabular-nums text-[#64748B] whitespace-nowrap">
                      {cust.lastInteraction}
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCustomerId(cust.id);
                        }}
                        className="text-xs font-semibold text-[#047857] hover:underline"
                      >
                        View Profile →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Customer Modal */}
      <Modal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Add Customer Contact"
        description="Register a new customer contact and associate them with an organization."
      >
        <form onSubmit={handleAddCustomer} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-[#111827] mb-1">Full Name *</label>
            <input
              type="text"
              required
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Henrik Lindqvist"
              className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg focus:outline-none focus:border-[#047857]"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#111827] mb-1">Email Address *</label>
              <input
                type="email"
                required
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="henrik@nordicbank.io"
                className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg focus:outline-none focus:border-[#047857]"
              />
            </div>
            <div>
              <label className="block font-semibold text-[#111827] mb-1">Phone Number</label>
              <input
                type="text"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                placeholder="+46 8 501 240 00"
                className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg focus:outline-none focus:border-[#047857]"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#111827] mb-1">Organization *</label>
              <input
                type="text"
                required
                value={newOrg}
                onChange={(e) => setNewOrg(e.target.value)}
                placeholder="NordicBank Financial"
                className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg focus:outline-none focus:border-[#047857]"
              />
            </div>
            <div>
              <label className="block font-semibold text-[#111827] mb-1">Support Tier</label>
              <select
                value={newTier}
                onChange={(e) => setNewTier(e.target.value as Customer['tier'])}
                className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg bg-white"
              >
                <option value="Enterprise">Enterprise</option>
                <option value="Mid-Market">Mid-Market</option>
                <option value="Standard">Standard</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block font-semibold text-[#111827] mb-1">Location</label>
            <input
              type="text"
              value={newLocation}
              onChange={(e) => setNewLocation(e.target.value)}
              className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg focus:outline-none focus:border-[#047857]"
            />
          </div>
          <div>
            <label className="block font-semibold text-[#111827] mb-1">Account Support Notes</label>
            <textarea
              rows={2}
              value={newNotes}
              onChange={(e) => setNewNotes(e.target.value)}
              placeholder="Dedicated Slack channel or special SLA terms..."
              className="w-full p-3 border border-[#E2E8F0] rounded-lg focus:outline-none focus:border-[#047857]"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setAddModalOpen(false)}
              className="px-4 py-2 border border-[#E2E8F0] rounded-lg text-slate-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#047857] hover:bg-[#065F46] text-white font-semibold rounded-lg"
            >
              Save Customer
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
