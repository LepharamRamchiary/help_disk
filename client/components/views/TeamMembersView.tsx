'use client';

import React, { useState, useMemo } from 'react';
import { useHelpDesk } from '@/context/HelpDeskContext';
import { User, UserRole } from '@/types/helpdesk';
import {
  Avatar,
  Modal,
  ConfirmDialog,
  PageHeader,
  LoadingSkeleton,
  ErrorBanner,
} from '@/components/ui/design-system';
import {
  Search,
  UserPlus,
  Shield,
  CheckCircle2,
  XCircle,
  Clock,
  Star,
} from 'lucide-react';

export function TeamMembersView() {
  const {
    teamMembers,
    inviteTeamMember,
    updateTeamMemberRole,
    toggleTeamMemberActive,
    simulationState,
    setSimulationState,
  } = useHelpDesk();

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [confirmToggleUser, setConfirmToggleUser] = useState<User | null>(null);

  // Invite form state
  const [invName, setInvName] = useState('');
  const [invEmail, setInvEmail] = useState('');
  const [invTitle, setInvTitle] = useState('Technical Support Engineer');
  const [invRole, setInvRole] = useState<UserRole>('SUPPORT_AGENT');

  const staffList = useMemo(
    () =>
      teamMembers
        .filter((m) => m.role !== 'CUSTOMER')
        .filter((m) => {
          if (roleFilter !== 'ALL' && m.role !== roleFilter) return false;
          if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            return (
              m.fullName.toLowerCase().includes(q) ||
              m.email.toLowerCase().includes(q) ||
              m.title.toLowerCase().includes(q)
            );
          }
          return true;
        }),
    [teamMembers, roleFilter, searchQuery]
  );

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!invName.trim() || !invEmail.trim()) return;
    inviteTeamMember({
      fullName: invName.trim(),
      email: invEmail.trim(),
      role: invRole,
      title: invTitle.trim() || 'Support Specialist',
    });
    setInviteModalOpen(false);
    setInvName('');
    setInvEmail('');
  };

  if (simulationState === 'LOADING') return <LoadingSkeleton rows={6} />;
  if (simulationState === 'ERROR') {
    return (
      <ErrorBanner
        message="Unable to load staff roster from /api/v1/users."
        onRetry={() => setSimulationState('NORMAL')}
      />
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Team Members"
        description="Manage support staff, assign role permissions, monitor workload capacity, and invite teammates."
        actions={
          <button
            type="button"
            onClick={() => setInviteModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#047857] hover:bg-[#065F46] rounded-lg transition-colors whitespace-nowrap"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Invite Team Member</span>
          </button>
        }
      />

      {/* Filter Bar */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter by agent name, email, or title..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg focus:outline-none focus:border-[#047857]"
          />
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {(
            [
              { id: 'ALL', label: 'All Staff' },
              { id: 'COMPANY_ADMIN', label: 'Admins' },
              { id: 'SUPPORT_MANAGER', label: 'Managers' },
              { id: 'SUPPORT_AGENT', label: 'Support Agents' },
            ] as const
          ).map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setRoleFilter(r.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                roleFilter === r.id
                  ? 'bg-[#ECFDF5] text-[#047857] font-semibold'
                  : 'text-[#64748B] hover:text-[#111827] hover:bg-slate-50'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Team Members Table */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
                <th className="py-3 px-4">Support Member</th>
                <th className="py-3 px-4">Role & Permissions</th>
                <th className="py-3 px-4">Availability</th>
                <th className="py-3 px-4 text-right">Assigned</th>
                <th className="py-3 px-4 text-right">Open</th>
                <th className="py-3 px-4 text-right">Overdue</th>
                <th className="py-3 px-4">Workload Capacity</th>
                <th className="py-3 px-4 text-right">Account Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] text-xs">
              {staffList.map((member) => {
                const loadPct = Math.min(
                  100,
                  Math.round((member.assignedTicketsCount / 16) * 100)
                );
                return (
                  <tr
                    key={member.id}
                    className={`transition-colors ${
                      member.active ? 'hover:bg-[#F0FDF4]/50' : 'bg-slate-50/70 opacity-75'
                    }`}
                  >
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <Avatar
                          initials={member.avatarInitials}
                          size="sm"
                          variant={member.active ? 'emerald' : 'slate'}
                        />
                        <div>
                          <div className="font-semibold text-[#111827]">{member.fullName}</div>
                          <div className="text-[11px] text-[#64748B]">
                            {member.email} · {member.title}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <select
                        aria-label={`Change role for ${member.fullName}`}
                        value={member.role}
                        onChange={(e) =>
                          updateTeamMemberRole(member.id, e.target.value as UserRole)
                        }
                        className="px-2.5 py-1 text-xs bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-[#111827] font-medium focus:outline-none focus:border-[#047857]"
                      >
                        <option value="COMPANY_ADMIN">Company Admin</option>
                        <option value="SUPPORT_MANAGER">Support Manager</option>
                        <option value="SUPPORT_AGENT">Support Agent</option>
                        <option value="PLATFORM_ADMIN">Platform Admin</option>
                      </select>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {member.availability === 'ONLINE' && (
                        <span className="inline-flex items-center gap-1.5 text-emerald-700 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          Online
                        </span>
                      )}
                      {member.availability === 'BUSY' && (
                        <span className="inline-flex items-center gap-1.5 text-amber-700 font-medium">
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                          In Triage / Busy
                        </span>
                      )}
                      {member.availability === 'OFFLINE' && (
                        <span className="inline-flex items-center gap-1.5 text-slate-500">
                          <XCircle className="w-3.5 h-3.5 text-slate-400" />
                          Offline
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono tabular-nums font-semibold text-[#111827]">
                      {member.assignedTicketsCount}
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono tabular-nums text-[#047857] font-semibold">
                      {member.openTicketsCount}
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono tabular-nums">
                      <span
                        className={
                          member.overdueTicketsCount > 0
                            ? 'text-red-600 font-bold'
                            : 'text-slate-400'
                        }
                      >
                        {member.overdueTicketsCount}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 w-44">
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px] font-mono text-[#64748B]">
                          <span>{loadPct}% load</span>
                          <span className="inline-flex items-center gap-0.5 text-[#111827]">
                            <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                            {member.csatScore.toFixed(2)}
                          </span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              loadPct > 80 ? 'bg-amber-500' : 'bg-[#047857]'
                            }`}
                            style={{ width: `${loadPct}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => setConfirmToggleUser(member)}
                        className={`px-3 py-1 text-xs font-medium rounded-lg border transition-colors ${
                          member.active
                            ? 'border-[#E2E8F0] text-slate-700 hover:bg-red-50 hover:text-red-700 hover:border-red-200'
                            : 'border-[#10B981]/40 bg-[#ECFDF5] text-[#047857] hover:bg-[#10B981]/20'
                        }`}
                      >
                        {member.active ? 'Deactivate' : 'Activate Seat'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invite Team Member Modal */}
      <Modal
        isOpen={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        title="Invite Support Team Member"
        description="Send a workspace invitation email with pre-configured RBAC permissions."
      >
        <form onSubmit={handleInviteSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-[#111827] mb-1">Full Name *</label>
            <input
              type="text"
              required
              value={invName}
              onChange={(e) => setInvName(e.target.value)}
              placeholder="e.g. Sophia Lindholm"
              className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg focus:outline-none focus:border-[#047857]"
            />
          </div>
          <div>
            <label className="block font-semibold text-[#111827] mb-1">Work Email *</label>
            <input
              type="email"
              required
              value={invEmail}
              onChange={(e) => setInvEmail(e.target.value)}
              placeholder="sophia.lindholm@acmecloud.io"
              className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg focus:outline-none focus:border-[#047857]"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#111827] mb-1">Job Title</label>
              <input
                type="text"
                value={invTitle}
                onChange={(e) => setInvTitle(e.target.value)}
                className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg focus:outline-none focus:border-[#047857]"
              />
            </div>
            <div>
              <label className="block font-semibold text-[#111827] mb-1">Assigned Role *</label>
              <select
                value={invRole}
                onChange={(e) => setInvRole(e.target.value as UserRole)}
                className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg bg-white"
              >
                <option value="SUPPORT_AGENT">Support Agent</option>
                <option value="SUPPORT_MANAGER">Support Manager</option>
                <option value="COMPANY_ADMIN">Company Administrator</option>
              </select>
            </div>
          </div>

          <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg flex items-start gap-2.5 text-[11px] text-[#64748B]">
            <Shield className="w-4 h-4 text-[#047857] shrink-0 mt-0.5" />
            <span>
              Invited members authenticate via SAML 2.0 SSO or password + 2FA according to your
              organization’s security policy.
            </span>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setInviteModalOpen(false)}
              className="px-4 py-2 border border-[#E2E8F0] rounded-lg text-slate-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#047857] hover:bg-[#065F46] text-white font-semibold rounded-lg"
            >
              Send Invitation
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirmation Dialog for Activating/Deactivating Account */}
      <ConfirmDialog
        isOpen={!!confirmToggleUser}
        onClose={() => setConfirmToggleUser(null)}
        onConfirm={() => {
          if (confirmToggleUser) toggleTeamMemberActive(confirmToggleUser.id);
        }}
        title={
          confirmToggleUser?.active
            ? `Deactivate ${confirmToggleUser.fullName}?`
            : `Reactivate ${confirmToggleUser?.fullName}?`
        }
        description={
          confirmToggleUser?.active
            ? `Deactivating ${confirmToggleUser.fullName} will immediately revoke active sessions and prevent new tickets from being routed to their queue. Existing assigned tickets will remain intact for reassignment.`
            : `Reactivating ${confirmToggleUser?.fullName} will restore their support seat and allow ticket assignments.`
        }
        confirmLabel={confirmToggleUser?.active ? 'Deactivate Account' : 'Activate Account'}
        destructive={!!confirmToggleUser?.active}
      />
    </div>
  );
}
