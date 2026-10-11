'use client';

import React, { useState } from 'react';
import { useHelpDesk } from '@/context/HelpDeskContext';
import { TicketPriority, Attachment } from '@/types/helpdesk';
import { Modal, PageHeader } from '@/components/ui/design-system';
import {
  UploadCloud,
  FileText,
  X,
  AlertCircle,
  CheckCircle2,
  Paperclip,
  ArrowLeft,
} from 'lucide-react';

export function CreateTicketForm({
  onSuccess,
  onCancel,
}: {
  onSuccess: (ticketId: string) => void;
  onCancel: () => void;
}) {
  const { currentUser, customers, categories, teamMembers, createTicket } = useHelpDesk();

  const isCustomerRole = currentUser.role === 'CUSTOMER';
  const activeCategories = categories.filter((c) => c.active);
  const supportAgents = teamMembers.filter(
    (m) => m.role !== 'CUSTOMER' && m.role !== 'PLATFORM_ADMIN' && m.active
  );

  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [customerId, setCustomerId] = useState(customers[0]?.id || 'cust-1');
  const [categoryId, setCategoryId] = useState(activeCategories[0]?.id || 'cat-1');
  const [priority, setPriority] = useState<TicketPriority>('MEDIUM');
  const [assignedAgentId, setAssignedAgentId] = useState<string>('');
  const [dueDate, setDueDate] = useState<string>('2026-10-12');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [errors, setErrors] = useState<{ subject?: string; description?: string; file?: string }>(
    {}
  );

  const MAX_DESC_CHARS = 2000;

  const handleFileChange = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setErrors((prev) => ({ ...prev, file: undefined }));

    const newAttachments: Attachment[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > 10 * 1024 * 1024) {
        setErrors((prev) => ({
          ...prev,
          file: `File "${file.name}" exceeds the 10 MB maximum file size limit.`,
        }));
        continue;
      }
      const kb = Math.max(1, Math.round(file.size / 1024));
      newAttachments.push({
        id: `att-${Date.now()}-${i}`,
        fileName: file.name,
        fileSize: kb > 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb} KB`,
        fileType: file.name.endsWith('.png') || file.name.endsWith('.jpg') ? 'image' : 'log',
        uploadedAt: 'Just now',
        uploadedBy: currentUser.fullName,
      });
    }
    setAttachments((prev) => [...prev, ...newAttachments]);
  };

  const handleAddSampleAttachment = () => {
    setAttachments((prev) => [
      ...prev,
      {
        id: `att-sample-${Date.now()}`,
        fileName: 'diagnostic-session-trace-2026.log',
        fileSize: '142 KB',
        fileType: 'log',
        uploadedAt: 'Just now',
        uploadedBy: currentUser.fullName,
      },
    ]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors: { subject?: string; description?: string } = {};

    if (subject.trim().length < 5) {
      nextErrors.subject = 'Please provide a descriptive subject (at least 5 characters).';
    }
    if (description.trim().length < 15) {
      nextErrors.description =
        'Please include enough detail to reproduce or investigate the issue (at least 15 characters).';
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    const created = createTicket({
      subject,
      description,
      customerId: isCustomerRole ? 'cust-1' : customerId,
      categoryId,
      priority,
      assignedAgentId: isCustomerRole ? null : assignedAgentId || null,
      dueDate: isCustomerRole ? undefined : dueDate,
      attachments,
    });

    onSuccess(created.id);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      {/* Subject */}
      <div>
        <label
          htmlFor="ticket-subject"
          className="block text-xs font-semibold text-[#111827] mb-1.5"
        >
          Ticket Subject <span className="text-red-600">*</span>
        </label>
        <input
          id="ticket-subject"
          type="text"
          required
          value={subject}
          onChange={(e) => {
            setSubject(e.target.value);
            if (errors.subject) setErrors((prev) => ({ ...prev, subject: undefined }));
          }}
          placeholder="e.g. Unable to authenticate via SAML 2.0 SSO after certificate update"
          className={`w-full px-3.5 py-2 text-sm bg-white border rounded-lg focus:outline-none ${
            errors.subject
              ? 'border-red-500 focus:border-red-600'
              : 'border-[#E2E8F0] focus:border-[#047857]'
          }`}
        />
        {errors.subject && (
          <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{errors.subject}</span>
          </p>
        )}
      </div>

      {/* Customer & Category Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {!isCustomerRole ? (
          <div>
            <label
              htmlFor="ticket-customer"
              className="block text-xs font-semibold text-[#111827] mb-1.5"
            >
              Customer <span className="text-red-600">*</span>
            </label>
            <select
              id="ticket-customer"
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white border border-[#E2E8F0] rounded-lg text-[#111827] focus:outline-none focus:border-[#047857]"
            >
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.fullName} — {c.organization}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div>
            <label className="block text-xs font-semibold text-[#111827] mb-1.5">
              Requester Account
            </label>
            <div className="px-3 py-2 text-xs bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-[#64748B]">
              {currentUser.fullName} ({currentUser.email})
            </div>
          </div>
        )}

        <div>
          <label
            htmlFor="ticket-category"
            className="block text-xs font-semibold text-[#111827] mb-1.5"
          >
            Support Category <span className="text-red-600">*</span>
          </label>
          <select
            id="ticket-category"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-white border border-[#E2E8F0] rounded-lg text-[#111827] focus:outline-none focus:border-[#047857]"
          >
            {activeCategories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Priority + Staff-Only Assignment & Due Date */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label
            htmlFor="ticket-priority"
            className="block text-xs font-semibold text-[#111827] mb-1.5"
          >
            Priority Level <span className="text-red-600">*</span>
          </label>
          <select
            id="ticket-priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value as TicketPriority)}
            className="w-full px-3 py-2 text-xs bg-white border border-[#E2E8F0] rounded-lg text-[#111827] focus:outline-none focus:border-[#047857]"
          >
            <option value="LOW">Low — General question</option>
            <option value="MEDIUM">Medium — Standard issue</option>
            <option value="HIGH">High — Feature degraded</option>
            <option value="URGENT">Urgent — Production outage</option>
          </select>
        </div>

        {/* Internal Assignment & Target Date strictly hidden for Customer Role */}
        {!isCustomerRole && (
          <>
            <div>
              <label
                htmlFor="ticket-agent"
                className="block text-xs font-semibold text-[#111827] mb-1.5"
              >
                Assign Support Agent (Staff Only)
              </label>
              <select
                id="ticket-agent"
                value={assignedAgentId}
                onChange={(e) => setAssignedAgentId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-[#E2E8F0] rounded-lg text-[#111827] focus:outline-none focus:border-[#047857]"
              >
                <option value="">Auto-route / Leave Unassigned</option>
                {supportAgents.map((ag) => (
                  <option key={ag.id} value={ag.id}>
                    {ag.fullName} ({ag.assignedTicketsCount} active)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="ticket-duedate"
                className="block text-xs font-semibold text-[#111827] mb-1.5"
              >
                Target Due Date (Optional)
              </label>
              <input
                id="ticket-duedate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-white border border-[#E2E8F0] rounded-lg text-[#111827] font-mono focus:outline-none focus:border-[#047857]"
              />
            </div>
          </>
        )}
      </div>

      {/* Detailed Description with Character Guidance */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label
            htmlFor="ticket-description"
            className="block text-xs font-semibold text-[#111827]"
          >
            Detailed Description <span className="text-red-600">*</span>
          </label>
          <span
            className={`text-[11px] font-mono tabular-nums ${
              description.length > MAX_DESC_CHARS
                ? 'text-red-600 font-semibold'
                : 'text-[#64748B]'
            }`}
          >
            {description.length} / {MAX_DESC_CHARS} chars (min 15)
          </span>
        </div>
        <textarea
          id="ticket-description"
          rows={5}
          required
          maxLength={MAX_DESC_CHARS}
          value={description}
          onChange={(e) => {
            setDescription(e.target.value);
            if (errors.description) setErrors((prev) => ({ ...prev, description: undefined }));
          }}
          placeholder="Describe the steps to reproduce, expected behavior, affected users, and any relevant request IDs or timestamps..."
          className={`w-full p-3.5 text-sm bg-white border rounded-lg focus:outline-none ${
            errors.description
              ? 'border-red-500 focus:border-red-600'
              : 'border-[#E2E8F0] focus:border-[#047857]'
          }`}
        />
        {errors.description && (
          <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{errors.description}</span>
          </p>
        )}
      </div>

      {/* Drag and Drop Attachments Area */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-semibold text-[#111827]">
            Attachments & Diagnostic Logs
          </span>
          <button
            type="button"
            onClick={handleAddSampleAttachment}
            className="text-xs font-medium text-[#047857] hover:underline inline-flex items-center gap-1"
          >
            <Paperclip className="w-3 h-3" />
            <span>+ Attach Sample Diagnostic Log</span>
          </button>
        </div>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragActive(false);
            handleFileChange(e.dataTransfer.files);
          }}
          className={`border-2 border-dashed rounded-xl p-5 text-center transition-colors ${
            dragActive
              ? 'border-[#047857] bg-[#ECFDF5]/60'
              : 'border-[#E2E8F0] bg-[#F8FAFC] hover:border-slate-300'
          }`}
        >
          <UploadCloud className="w-6 h-6 text-[#047857] mx-auto mb-2" />
          <p className="text-xs text-[#111827] font-medium">
            Drag and drop files here, or{' '}
            <label className="text-[#047857] font-semibold cursor-pointer hover:underline">
              browse your computer
              <input
                type="file"
                multiple
                onChange={(e) => handleFileChange(e.target.files)}
                className="sr-only"
                accept=".pdf,.png,.jpg,.jpeg,.log,.txt,.har,.xml,.json"
              />
            </label>
          </p>
          <p className="text-[11px] text-[#64748B] mt-1">
            Accepted formats: PDF, PNG, JPG, HAR, XML, LOG · Maximum file size: 10 MB per file
          </p>
        </div>

        {errors.file && (
          <p className="text-xs text-red-600 mt-1.5 flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{errors.file}</span>
          </p>
        )}

        {attachments.length > 0 && (
          <div className="mt-3 space-y-1.5">
            {attachments.map((att) => (
              <div
                key={att.id}
                className="flex items-center justify-between px-3 py-2 bg-white border border-[#E2E8F0] rounded-lg text-xs"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <FileText className="w-4 h-4 text-[#047857] shrink-0" />
                  <span className="font-mono font-medium text-[#111827] truncate">
                    {att.fileName}
                  </span>
                  <span className="text-[#64748B] font-mono shrink-0">({att.fileSize})</span>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setAttachments((prev) => prev.filter((item) => item.id !== att.id))
                  }
                  aria-label={`Remove ${att.fileName}`}
                  className="text-slate-400 hover:text-red-600 p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E2E8F0]">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-[#E2E8F0] rounded-lg hover:bg-slate-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-5 py-2 text-xs font-semibold text-white bg-[#047857] hover:bg-[#065F46] rounded-lg transition-colors inline-flex items-center gap-1.5 shadow-2xs"
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Create Ticket</span>
        </button>
      </div>
    </form>
  );
}

export function CreateTicketModal() {
  const { createTicketModalOpen, setCreateTicketModalOpen, navigateTo } = useHelpDesk();
  return (
    <Modal
      isOpen={createTicketModalOpen}
      onClose={() => setCreateTicketModalOpen(false)}
      title="Create Support Ticket"
      description="Log a new customer request. SLA timers begin automatically based on priority policy."
      maxWidth="max-w-2xl"
    >
      <CreateTicketForm
        onCancel={() => setCreateTicketModalOpen(false)}
        onSuccess={(newTicketId) => {
          setCreateTicketModalOpen(false);
          navigateTo('ticket-detail', { ticketId: newTicketId });
        }}
      />
    </Modal>
  );
}

export function CreateTicketPageView() {
  const { navigateTo, currentUser } = useHelpDesk();
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() =>
            navigateTo(currentUser.role === 'CUSTOMER' ? 'customer-portal' : 'tickets')
          }
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[#64748B] hover:text-[#111827]"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Tickets</span>
        </button>
      </div>

      <PageHeader
        title="Submit a Support Request"
        description="Provide detailed context so our support engineers can resolve your request within SLA targets."
      />

      <div className="bg-white border border-[#E2E8F0] rounded-xl p-6">
        <CreateTicketForm
          onCancel={() =>
            navigateTo(currentUser.role === 'CUSTOMER' ? 'customer-portal' : 'tickets')
          }
          onSuccess={(newTicketId) => navigateTo('ticket-detail', { ticketId: newTicketId })}
        />
      </div>
    </div>
  );
}
