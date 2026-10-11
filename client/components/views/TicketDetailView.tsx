'use client';

import React, { useState } from 'react';
import { useHelpDesk } from '@/context/HelpDeskContext';
import { TicketPriority, TicketStatus, Attachment } from '@/types/helpdesk';
import {
  StatusBadge,
  PriorityBadge,
  SlaBadge,
  Avatar,
  Modal,
} from '@/components/ui/design-system';
import {
  ArrowLeft,
  Copy,
  History,
  CheckCircle2,
  RotateCcw,
  Lock,
  Send,
  Paperclip,
  FileText,
  Download,
  Building2,
  Mail,
  Clock,
  Tag,
  Plus,
  X,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

const CANNED_RESPONSES = [
  {
    label: 'Confirm SAML / SSO Fix',
    body: 'Hi there,\n\nWe have updated your SAML 2.0 X.509 signing certificate in the primary slot and purged our edge authentication cache. Please test signing in via an incognito browser window and let us know if all users are restored.',
  },
  {
    label: 'Request HAR & Console Logs',
    body: 'Hello,\n\nTo help our infrastructure team pinpoint the latency, could you capture a browser HAR network log while reproducing the request and attach it to this ticket?',
  },
  {
    label: 'Confirm Billing & Seat Unlock',
    body: 'Hello,\n\nWe have reconciled your payment settlement and manually provisioned your additional Enterprise seats. They are now immediately available under Team Members.',
  },
];

export function TicketDetailView() {
  const {
    currentUser,
    selectedTicket,
    tickets,
    setSelectedTicketId,
    navigateTo,
    teamMembers,
    categories,
    updateTicketStatus,
    updateTicketPriority,
    assignTicketAgent,
    updateTicketCategory,
    addTicketTag,
    removeTicketTag,
    addTicketMessage,
    addToast,
  } = useHelpDesk();

  const [replyBody, setReplyBody] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [replyAttachments, setReplyAttachments] = useState<Attachment[]>([]);
  const [newTagInput, setNewTagInput] = useState('');
  const [activityModalOpen, setActivityModalOpen] = useState(false);

  if (!selectedTicket) {
    return null;
  }

  const isCustomer = currentUser.role === 'CUSTOMER';
  const supportAgents = teamMembers.filter(
    (m) => m.role !== 'CUSTOMER' && m.role !== 'PLATFORM_ADMIN' && m.active
  );

  // Strictly filter out internal notes when viewed by a Customer
  const visibleMessages = selectedTicket.messages.filter(
    (msg) => !isCustomer || !msg.isInternalNote
  );

  const handleCopyTicketLink = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(
        `${window.location.origin}/?ticket=${selectedTicket.id}`
      );
    }
    addToast(
      'Ticket Link Copied',
      `Copied direct link to ${selectedTicket.id} to your clipboard.`,
      'info'
    );
  };

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyBody.trim() && replyAttachments.length === 0) return;
    addTicketMessage(
      selectedTicket.id,
      replyBody,
      isCustomer ? false : isInternalNote,
      replyAttachments
    );
    setReplyBody('');
    setReplyAttachments([]);
  };

  const handleAttachQuickFile = () => {
    setReplyAttachments((prev) => [
      ...prev,
      {
        id: `att-${Date.now()}`,
        fileName: `verification-output-${selectedTicket.id.toLowerCase()}.txt`,
        fileSize: '48 KB',
        fileType: 'log',
        uploadedAt: 'Just now',
        uploadedBy: currentUser.fullName,
      },
    ]);
  };

  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagInput.trim()) return;
    addTicketTag(selectedTicket.id, newTagInput);
    setNewTagInput('');
  };

  return (
    <div className="space-y-5">
      {/* Top Quick Ticket Switcher Bar & Back Link */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => navigateTo(isCustomer ? 'customer-portal' : 'tickets')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#64748B] hover:text-[#111827] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{isCustomer ? 'Back to My Support Portal' : 'Back to All Tickets'}</span>
        </button>

        {/* Quick switcher to jump between demo tickets HD-1001..HD-1005 */}
        {!isCustomer && (
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <span className="text-[11px] text-[#64748B] mr-1">Quick Jump:</span>
            {tickets.slice(0, 5).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setSelectedTicketId(t.id)}
                className={`px-2 py-1 text-[11px] font-mono rounded-md transition-colors ${
                  t.id === selectedTicket.id
                    ? 'bg-[#047857] text-white font-semibold'
                    : 'bg-white border border-[#E2E8F0] text-slate-600 hover:bg-[#F0FDF4]'
                }`}
              >
                {t.id}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Ticket Detail Header Card */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-2 min-w-0">
          <div className="flex items-center flex-wrap gap-2.5">
            <span className="font-mono text-sm font-bold text-[#047857]">
              {selectedTicket.id}
            </span>
            <span className="text-slate-300">·</span>
            <StatusBadge status={selectedTicket.status} />
            <span className="text-slate-300">·</span>
            <PriorityBadge priority={selectedTicket.priority} />
            <span className="text-slate-300">·</span>
            <span className="text-xs text-[#64748B]">{selectedTicket.categoryName}</span>
          </div>

          <h1 className="text-xl font-bold text-[#111827] tracking-tight">
            {selectedTicket.subject}
          </h1>
        </div>

        {/* Header Actions */}
        <div className="flex items-center flex-wrap gap-2 shrink-0">
          <button
            type="button"
            onClick={handleCopyTicketLink}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-[#E2E8F0] hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap"
          >
            <Copy className="w-3.5 h-3.5 text-slate-400" />
            <span>Copy Link</span>
          </button>

          {!isCustomer && (
            <button
              type="button"
              onClick={() => setActivityModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-[#E2E8F0] hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap"
            >
              <History className="w-3.5 h-3.5 text-slate-400" />
              <span>Activity History ({selectedTicket.activities.length})</span>
            </button>
          )}

          {selectedTicket.status === 'RESOLVED' || selectedTicket.status === 'CLOSED' ? (
            <button
              type="button"
              onClick={() => updateTicketStatus(selectedTicket.id, 'IN_PROGRESS')}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-[#047857] bg-[#ECFDF5] border border-[#10B981]/30 hover:bg-[#10B981]/20 rounded-lg transition-colors whitespace-nowrap"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reopen Ticket</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => updateTicketStatus(selectedTicket.id, 'RESOLVED')}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#047857] hover:bg-[#065F46] rounded-lg transition-colors whitespace-nowrap shadow-2xs"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Resolve Ticket</span>
            </button>
          )}
        </div>
      </div>

      {/* Two-Column Desktop Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Conversation Timeline & Reply Composer (8 cols) */}
        <div className="lg:col-span-8 space-y-5">
          {/* Initial Issue Summary Box */}
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between text-xs text-[#64748B]">
              <span className="font-semibold text-[#111827]">Original Problem Summary</span>
              <span className="font-mono">Logged {selectedTicket.createdAt}</span>
            </div>
            <p className="text-sm text-[#111827] leading-relaxed">
              {selectedTicket.description}
            </p>
          </div>

          {/* Conversation Timeline */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
                Conversation Timeline ({visibleMessages.length} messages)
              </h2>
              {isCustomer && (
                <span className="text-[11px] text-[#047857] font-medium">
                  Customer View · Internal staff notes are hidden
                </span>
              )}
            </div>

            {visibleMessages.length === 0 ? (
              <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 text-center text-xs text-[#64748B]">
                No conversation replies have been posted yet. Use the composer below to send the
                first update.
              </div>
            ) : (
              visibleMessages.map((msg) => {
                const isAgent = msg.authorRole !== 'CUSTOMER';
                if (msg.isInternalNote) {
                  // Internal Note — distinct amber visual treatment
                  return (
                    <div
                      key={msg.id}
                      className="bg-amber-50/70 border border-amber-200/90 rounded-xl p-5 space-y-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <Avatar initials={msg.authorInitials} size="sm" variant="amber" />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-amber-950">
                                {msg.authorName}
                              </span>
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800">
                                <Lock className="w-3 h-3" />
                                Internal Staff Note (Hidden from Customer)
                              </span>
                            </div>
                          </div>
                        </div>
                        <span className="text-[11px] font-mono text-amber-800/80">
                          {msg.createdAt}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-amber-950 whitespace-pre-line leading-relaxed">
                        {msg.body}
                      </p>
                    </div>
                  );
                }

                return (
                  <div
                    key={msg.id}
                    className={`bg-white border rounded-xl p-5 space-y-3 ${
                      isAgent ? 'border-[#10B981]/30' : 'border-[#E2E8F0]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <Avatar
                          initials={msg.authorInitials}
                          size="sm"
                          variant={isAgent ? 'emerald' : 'slate'}
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-[#111827]">
                              {msg.authorName}
                            </span>
                            <span className="text-[11px] text-[#64748B]">
                              · {isAgent ? 'Support Engineer' : selectedTicket.customerOrganization}
                            </span>
                          </div>
                        </div>
                      </div>
                      <span className="text-[11px] font-mono text-[#64748B]">{msg.createdAt}</span>
                    </div>

                    <p className="text-xs sm:text-sm text-[#111827] whitespace-pre-line leading-relaxed">
                      {msg.body}
                    </p>

                    {/* Attachment Previews */}
                    {msg.attachments && msg.attachments.length > 0 && (
                      <div className="pt-2 flex flex-wrap gap-2">
                        {msg.attachments.map((att) => (
                          <button
                            key={att.id}
                            type="button"
                            onClick={() =>
                              addToast(
                                `Downloaded ${att.fileName}`,
                                `Attachment (${att.fileSize}) saved to your device.`,
                                'info'
                              )
                            }
                            className="inline-flex items-center gap-2 px-3 py-2 bg-[#F8FAFC] hover:bg-[#ECFDF5] border border-[#E2E8F0] rounded-lg text-xs transition-colors"
                          >
                            <FileText className="w-3.5 h-3.5 text-[#047857]" />
                            <span className="font-mono font-medium text-[#111827]">
                              {att.fileName}
                            </span>
                            <span className="font-mono text-[11px] text-[#64748B]">
                              ({att.fileSize})
                            </span>
                            <Download className="w-3.5 h-3.5 text-slate-400 ml-1" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Reply Composer */}
          <div
            className={`border rounded-xl p-5 space-y-4 transition-colors ${
              !isCustomer && isInternalNote
                ? 'bg-amber-50/40 border-amber-300'
                : 'bg-white border-[#E2E8F0]'
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              {/* Public Reply vs Internal Note Toggle (Staff Only) */}
              {!isCustomer ? (
                <div className="inline-flex items-center gap-1 p-1 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg">
                  <button
                    type="button"
                    onClick={() => setIsInternalNote(false)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                      !isInternalNote
                        ? 'bg-[#047857] text-white font-semibold'
                        : 'text-[#64748B] hover:text-[#111827]'
                    }`}
                  >
                    Public Reply to Customer
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsInternalNote(true)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                      isInternalNote
                        ? 'bg-amber-600 text-white font-semibold'
                        : 'text-[#64748B] hover:text-[#111827]'
                    }`}
                  >
                    <Lock className="w-3 h-3" />
                    <span>Internal Note</span>
                  </button>
                </div>
              ) : (
                <span className="text-xs font-semibold text-[#111827]">
                  Reply to Support Team
                </span>
              )}

              {/* Canned Response Templates for Support Staff */}
              {!isCustomer && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <Sparkles className="w-3.5 h-3.5 text-[#047857]" />
                  {CANNED_RESPONSES.map((tpl) => (
                    <button
                      key={tpl.label}
                      type="button"
                      onClick={() => setReplyBody(tpl.body)}
                      className="px-2 py-1 text-[11px] font-medium text-[#047857] bg-[#ECFDF5] hover:bg-[#10B981]/20 rounded transition-colors"
                    >
                      {tpl.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <form onSubmit={handleSendReply} className="space-y-3">
              <textarea
                rows={4}
                value={replyBody}
                onChange={(e) => setReplyBody(e.target.value)}
                placeholder={
                  !isCustomer && isInternalNote
                    ? 'Write a private internal note for teammates (never visible to the customer)...'
                    : `Write a reply to ${
                        isCustomer ? 'HelpDesk Pro Support' : selectedTicket.customerName
                      }...`
                }
                className="w-full p-3.5 text-sm bg-white border border-[#E2E8F0] rounded-lg focus:outline-none focus:border-[#047857]"
              />

              {replyAttachments.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {replyAttachments.map((att) => (
                    <span
                      key={att.id}
                      className="inline-flex items-center gap-2 px-2.5 py-1 bg-[#F8FAFC] border border-[#E2E8F0] rounded text-xs font-mono"
                    >
                      <FileText className="w-3.5 h-3.5 text-[#047857]" />
                      {att.fileName}
                      <button
                        type="button"
                        onClick={() =>
                          setReplyAttachments((prev) => prev.filter((a) => a.id !== att.id))
                        }
                        className="text-slate-400 hover:text-red-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleAttachQuickFile}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-[#047857] bg-[#F8FAFC] hover:bg-[#ECFDF5] border border-[#E2E8F0] rounded-lg transition-colors"
                >
                  <Paperclip className="w-3.5 h-3.5" />
                  <span>Attach File</span>
                </button>

                <button
                  type="submit"
                  className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white rounded-lg transition-colors ${
                    !isCustomer && isInternalNote
                      ? 'bg-amber-600 hover:bg-amber-700'
                      : 'bg-[#047857] hover:bg-[#065F46]'
                  }`}
                >
                  {!isCustomer && isInternalNote ? (
                    <>
                      <Lock className="w-3.5 h-3.5" />
                      <span>Save Internal Note</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Send Reply</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* RIGHT COLUMN: Metadata, SLA Deadlines, Customer Info & Actions (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Customer Information Card */}
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
                Customer Details
              </h3>
              {!isCustomer && (
                <button
                  type="button"
                  onClick={() =>
                    navigateTo('customers', { customerId: selectedTicket.customerId })
                  }
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#047857] hover:underline"
                >
                  <span>Profile</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              <Avatar initials={selectedTicket.customerInitials} size="lg" variant="emerald" />
              <div className="min-w-0">
                <div className="text-sm font-bold text-[#111827] truncate">
                  {selectedTicket.customerName}
                </div>
                <div className="text-xs text-[#64748B] flex items-center gap-1.5 truncate">
                  <Building2 className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{selectedTicket.customerOrganization}</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-[#E2E8F0] space-y-2 text-xs">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[#64748B] flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" />
                  Email
                </span>
                <span className="font-mono text-[#111827] truncate">
                  {selectedTicket.customerEmail}
                </span>
              </div>
            </div>
          </div>

          {/* SLA Status & Deadlines Card */}
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 space-y-3.5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
                SLA Deadlines & Timers
              </h3>
              <SlaBadge
                slaStatus={selectedTicket.slaStatus}
                remainingMinutes={selectedTicket.resolutionRemainingMinutes}
              />
            </div>

            <div className="space-y-2.5 text-xs pt-1">
              <div className="flex items-center justify-between py-1.5 border-b border-[#E2E8F0]">
                <span className="text-[#64748B] flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  First-Response Deadline
                </span>
                <span className="font-mono tabular-nums font-medium text-[#111827]">
                  {selectedTicket.firstResponseDeadline}
                </span>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-[#E2E8F0]">
                <span className="text-[#64748B] flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  Resolution Deadline
                </span>
                <span className="font-mono tabular-nums font-semibold text-[#111827]">
                  {selectedTicket.resolutionDeadline}
                </span>
              </div>

              <div className="flex items-center justify-between py-1">
                <span className="text-[#64748B]">Created Date</span>
                <span className="font-mono tabular-nums text-[#64748B]">
                  {selectedTicket.createdAt}
                </span>
              </div>

              <div className="flex items-center justify-between py-1">
                <span className="text-[#64748B]">Last Updated</span>
                <span className="font-mono tabular-nums text-[#64748B]">
                  {selectedTicket.updatedAt}
                </span>
              </div>
            </div>
          </div>

          {/* Ticket Classification & Assignment Controls */}
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
              Ticket Properties
            </h3>

            {!isCustomer ? (
              <div className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-semibold text-[#111827] mb-1">
                    Ticket Status
                  </label>
                  <select
                    aria-label="Update Ticket Status"
                    value={selectedTicket.status}
                    onChange={(e) =>
                      updateTicketStatus(selectedTicket.id, e.target.value as TicketStatus)
                    }
                    className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-[#111827] focus:outline-none focus:border-[#047857]"
                  >
                    <option value="OPEN">Open</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="WAITING_FOR_CUSTOMER">Waiting for Customer</option>
                    <option value="RESOLVED">Resolved</option>
                    <option value="CLOSED">Closed</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-[#111827] mb-1">
                    Priority Level
                  </label>
                  <select
                    aria-label="Update Ticket Priority"
                    value={selectedTicket.priority}
                    onChange={(e) =>
                      updateTicketPriority(selectedTicket.id, e.target.value as TicketPriority)
                    }
                    className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-[#111827] focus:outline-none focus:border-[#047857]"
                  >
                    <option value="URGENT">Urgent</option>
                    <option value="HIGH">High</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="LOW">Low</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-[#111827] mb-1">
                    Assigned Support Agent
                  </label>
                  <select
                    aria-label="Assign Support Agent"
                    value={selectedTicket.assignedAgentId || ''}
                    onChange={(e) =>
                      assignTicketAgent(selectedTicket.id, e.target.value || null)
                    }
                    className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-[#111827] focus:outline-none focus:border-[#047857]"
                  >
                    <option value="">Unassigned</option>
                    {supportAgents.map((ag) => (
                      <option key={ag.id} value={ag.id}>
                        {ag.fullName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-[#111827] mb-1">
                    Support Category
                  </label>
                  <select
                    aria-label="Update Support Category"
                    value={selectedTicket.categoryId}
                    onChange={(e) => updateTicketCategory(selectedTicket.id, e.target.value)}
                    className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-[#111827] focus:outline-none focus:border-[#047857]"
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ) : (
              /* Read-only view for customers */
              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[#64748B]">Assigned Engineer</span>
                  <span className="font-medium text-[#111827]">
                    {selectedTicket.assignedAgentName || 'Triage Team'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#64748B]">Category</span>
                  <span className="font-medium text-[#111827]">
                    {selectedTicket.categoryName}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Ticket Tags Card */}
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#64748B] flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5" />
                <span>Ticket Tags</span>
              </h3>
            </div>

            <div className="flex flex-wrap gap-1.5 text-xs">
              {selectedTicket.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#F8FAFC] border border-[#E2E8F0] rounded-md font-mono text-[11px] text-slate-700"
                >
                  <span>#{tag}</span>
                  {!isCustomer && (
                    <button
                      type="button"
                      onClick={() => removeTicketTag(selectedTicket.id, tag)}
                      aria-label={`Remove tag ${tag}`}
                      className="text-slate-400 hover:text-red-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </span>
              ))}
            </div>

            {!isCustomer && (
              <form onSubmit={handleAddTag} className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value)}
                  placeholder="Add tag (e.g. sso-verified)..."
                  className="flex-1 px-2.5 py-1.5 text-xs bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg focus:outline-none focus:border-[#047857]"
                />
                <button
                  type="submit"
                  className="p-1.5 bg-[#ECFDF5] text-[#047857] hover:bg-[#10B981]/20 rounded-lg transition-colors"
                  aria-label="Add tag"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Activity History Modal */}
      <Modal
        isOpen={activityModalOpen}
        onClose={() => setActivityModalOpen(false)}
        title={`Audit & Activity Log — ${selectedTicket.id}`}
        description="Complete chronological history of automated routing, status transitions, and agent actions."
        maxWidth="max-w-lg"
      >
        <div className="divide-y divide-[#E2E8F0]">
          {selectedTicket.activities.length === 0 ? (
            <p className="text-xs text-[#64748B] py-4">
              Ticket created at {selectedTicket.createdAt}. No subsequent changes recorded.
            </p>
          ) : (
            selectedTicket.activities.map((act) => (
              <div key={act.id} className="py-3 flex items-start justify-between gap-4 text-xs">
                <div>
                  <span className="font-semibold text-[#111827]">{act.actorName}</span>{' '}
                  <span className="text-[#64748B]">{act.action}</span>
                </div>
                <span className="font-mono text-[11px] text-[#64748B] shrink-0">
                  {act.timestamp}
                </span>
              </div>
            ))
          )}
        </div>
      </Modal>
    </div>
  );
}
