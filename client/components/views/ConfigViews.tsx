'use client';

import React, { useState } from 'react';
import { useHelpDesk } from '@/context/HelpDeskContext';
import { Category, TicketPriority } from '@/types/helpdesk';
import {
  PriorityBadge,
  Modal,
  ConfirmDialog,
  PageHeader,
} from '@/components/ui/design-system';
import {
  Plus,
  Edit3,
  Trash2,
  CheckCircle2,
  XCircle,
  Workflow,
  Zap,
  Save,
  Building2,
  Clock,
  Bell,
  ShieldCheck,
  Calendar,
} from 'lucide-react';

export function CategoriesView() {
  const { categories, saveCategory, toggleCategoryActive, deleteCategory } = useHelpDesk();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [confirmDeleteCat, setConfirmDeleteCat] = useState<Category | null>(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [defaultPriority, setDefaultPriority] = useState<TicketPriority>('MEDIUM');
  const [routingTeam, setRoutingTeam] = useState('Customer Success');
  const [active, setActive] = useState(true);

  const openCreateModal = () => {
    setEditingCat(null);
    setName('');
    setDescription('');
    setDefaultPriority('MEDIUM');
    setRoutingTeam('Technical Support');
    setActive(true);
    setModalOpen(true);
  };

  const openEditModal = (cat: Category) => {
    setEditingCat(cat);
    setName(cat.name);
    setDescription(cat.description);
    setDefaultPriority(cat.defaultPriority);
    setRoutingTeam(cat.routingTeam);
    setActive(cat.active);
    setModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    saveCategory({
      id: editingCat?.id,
      name: name.trim(),
      description: description.trim() || 'Support routing category.',
      defaultPriority,
      routingTeam: routingTeam.trim() || 'General Triage',
      active,
    });
    setModalOpen(false);
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Ticket Categories"
        description="Configure issue classifications, default SLA priorities, and specialized team routing."
        actions={
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#047857] hover:bg-[#065F46] rounded-lg transition-colors whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Category</span>
          </button>
        }
      />

      <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
                <th className="py-3 px-4">Category Name & Description</th>
                <th className="py-3 px-4">Routing Team</th>
                <th className="py-3 px-4">Default Priority</th>
                <th className="py-3 px-4 text-right">Historical Volume</th>
                <th className="py-3 px-4">State</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] text-xs">
              {categories.map((cat) => (
                <tr key={cat.id} className="hover:bg-[#F0FDF4]/50 transition-colors">
                  <td className="py-4 px-4 max-w-md">
                    <div className="font-bold text-[#111827]">{cat.name}</div>
                    <p className="text-[#64748B] mt-0.5 leading-relaxed">{cat.description}</p>
                  </td>
                  <td className="py-4 px-4 whitespace-nowrap font-medium text-[#111827]">
                    {cat.routingTeam}
                  </td>
                  <td className="py-4 px-4 whitespace-nowrap">
                    <PriorityBadge priority={cat.defaultPriority} />
                  </td>
                  <td className="py-4 px-4 text-right font-mono tabular-nums font-semibold text-[#111827]">
                    {cat.ticketCount}
                  </td>
                  <td className="py-4 px-4 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => toggleCategoryActive(cat.id)}
                      className={`inline-flex items-center gap-1.5 font-medium ${
                        cat.active ? 'text-[#047857]' : 'text-slate-400'
                      }`}
                    >
                      {cat.active ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Active</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Inactive</span>
                        </>
                      )}
                    </button>
                  </td>
                  <td className="py-4 px-4 text-right whitespace-nowrap">
                    <div className="inline-flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openEditModal(cat)}
                        className="p-1.5 text-slate-500 hover:text-[#047857] hover:bg-slate-100 rounded-lg"
                        title="Edit Category"
                        aria-label={`Edit ${cat.name}`}
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteCat(cat)}
                        className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
                        title="Delete Category"
                        aria-label={`Delete ${cat.name}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Category Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingCat ? `Edit Category — ${editingCat.name}` : 'Create Support Category'}
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-[#111827] mb-1">Category Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Security & Compliance"
              className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg focus:outline-none focus:border-[#047857]"
            />
          </div>
          <div>
            <label className="block font-semibold text-[#111827] mb-1">Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what customer issues belong in this category..."
              className="w-full p-3 border border-[#E2E8F0] rounded-lg focus:outline-none focus:border-[#047857]"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#111827] mb-1">Routing Team</label>
              <input
                type="text"
                value={routingTeam}
                onChange={(e) => setRoutingTeam(e.target.value)}
                className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg focus:outline-none focus:border-[#047857]"
              />
            </div>
            <div>
              <label className="block font-semibold text-[#111827] mb-1">Default Priority</label>
              <select
                value={defaultPriority}
                onChange={(e) => setDefaultPriority(e.target.value as TicketPriority)}
                className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg bg-white"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
          </div>

          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="rounded border-slate-300 text-[#047857] focus:ring-[#047857]"
            />
            <span>Category is active and visible on ticket creation forms</span>
          </label>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#E2E8F0]">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 border border-[#E2E8F0] rounded-lg text-slate-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#047857] hover:bg-[#065F46] text-white font-semibold rounded-lg"
            >
              {editingCat ? 'Save Changes' : 'Create Category'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!confirmDeleteCat}
        onClose={() => setConfirmDeleteCat(null)}
        onConfirm={() => {
          if (confirmDeleteCat) deleteCategory(confirmDeleteCat.id);
        }}
        title={`Delete category "${confirmDeleteCat?.name}"?`}
        description="Existing tickets assigned to this category will retain their historical label, but new tickets will no longer route here."
        confirmLabel="Delete Category"
        destructive
      />
    </div>
  );
}

export function AutomationsView() {
  const { automations, toggleAutomation, addAutomationRule } = useHelpDesk();
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [trigger, setTrigger] = useState('Ticket Created');
  const [condition, setCondition] = useState('Priority = "URGENT"');
  const [action, setAction] = useState('Assign to Senior Engineer · Send Slack Alert');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    addAutomationRule({
      name: name.trim(),
      description: description.trim() || 'Automated support workflow rule.',
      trigger,
      condition,
      action,
      active: true,
    });
    setModalOpen(false);
    setName('');
    setDescription('');
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Support Automations & Routing Workflows"
        description="Automate ticket triage, SLA escalations, and customer follow-ups with event-driven rules."
        actions={
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#047857] hover:bg-[#065F46] rounded-lg transition-colors whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Automation Rule</span>
          </button>
        }
      />

      <div className="grid grid-cols-1 gap-4">
        {automations.map((rule) => (
          <div
            key={rule.id}
            className="bg-white border border-[#E2E8F0] rounded-xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
          >
            <div className="space-y-2 max-w-3xl">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-[#ECFDF5] text-[#047857] flex items-center justify-center shrink-0">
                  <Workflow className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-[#111827]">{rule.name}</h3>
                <span className="text-slate-300">·</span>
                <span className="font-mono text-xs text-[#64748B]">
                  {rule.executionsCount} executions (Last: {rule.lastTriggered})
                </span>
              </div>
              <p className="text-xs text-[#64748B]">{rule.description}</p>
              <div className="flex flex-wrap items-center gap-2 pt-1 text-xs font-mono">
                <span className="px-2.5 py-1 bg-[#F8FAFC] border border-[#E2E8F0] rounded text-slate-700">
                  WHEN: {rule.trigger}
                </span>
                <span className="px-2.5 py-1 bg-[#F8FAFC] border border-[#E2E8F0] rounded text-slate-700">
                  IF: {rule.condition}
                </span>
                <span className="px-2.5 py-1 bg-[#ECFDF5] border border-[#10B981]/30 rounded text-[#047857] font-semibold">
                  THEN: {rule.action}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => toggleAutomation(rule.id)}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                  rule.active
                    ? 'bg-[#ECFDF5] text-[#047857] border-[#10B981]/30'
                    : 'bg-slate-100 text-slate-500 border-slate-200'
                }`}
              >
                {rule.active ? 'Active' : 'Paused'}
              </button>
            </div>
          </div>
        ))}
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Create Automation Rule"
        description="Define trigger events, filter conditions, and automated actions."
      >
        <form onSubmit={handleCreate} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-[#111827] mb-1">Rule Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Escalate VIP Enterprise Billing Inquiries"
              className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg focus:outline-none focus:border-[#047857]"
            />
          </div>
          <div>
            <label className="block font-semibold text-[#111827] mb-1">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Explain what this workflow automates..."
              className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg focus:outline-none focus:border-[#047857]"
            />
          </div>
          <div>
            <label className="block font-semibold text-[#111827] mb-1">Trigger Event</label>
            <select
              value={trigger}
              onChange={(e) => setTrigger(e.target.value)}
              className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg bg-white"
            >
              <option value="Ticket Created">Ticket Created</option>
              <option value="Customer Replied">Customer Replied</option>
              <option value="SLA Timer Milestone">SLA Timer Milestone</option>
            </select>
          </div>
          <div>
            <label className="block font-semibold text-[#111827] mb-1">Condition (IF)</label>
            <input
              type="text"
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              className="w-full px-3 py-2 font-mono border border-[#E2E8F0] rounded-lg"
            />
          </div>
          <div>
            <label className="block font-semibold text-[#111827] mb-1">Action (THEN)</label>
            <input
              type="text"
              value={action}
              onChange={(e) => setAction(e.target.value)}
              className="w-full px-3 py-2 font-mono border border-[#E2E8F0] rounded-lg"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 border border-[#E2E8F0] rounded-lg text-slate-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#047857] hover:bg-[#065F46] text-white font-semibold rounded-lg"
            >
              Save Automation
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export function CompanySettingsView() {
  const { companySettings, updateCompanySettings } = useHelpDesk();

  const [formState, setFormState] = useState(companySettings);
  const [newHolidayDate, setNewHolidayDate] = useState('');
  const [newHolidayName, setNewHolidayName] = useState('');

  const allDays = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday',
  ];

  const toggleWorkingDay = (day: string) => {
    setFormState((prev) => ({
      ...prev,
      workingDays: prev.workingDays.includes(day)
        ? prev.workingDays.filter((d) => d !== day)
        : [...prev.workingDays, day],
    }));
  };

  const handleAddHoliday = () => {
    if (!newHolidayDate || !newHolidayName.trim()) return;
    setFormState((prev) => ({
      ...prev,
      holidays: [
        ...prev.holidays,
        { date: newHolidayDate, name: newHolidayName.trim() },
      ],
    }));
    setNewHolidayDate('');
    setNewHolidayName('');
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateCompanySettings(formState);
  };

  return (
    <form onSubmit={handleSave} className="space-y-6 max-w-5xl">
      <PageHeader
        title="Company Settings & Governance"
        description="Configure organization identity, business hours, holiday calendars, SLA defaults, and team permissions."
        actions={
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#047857] hover:bg-[#065F46] rounded-lg transition-colors whitespace-nowrap shadow-2xs"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Organization Settings</span>
          </button>
        }
      />

      {/* Organization Profile */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2.5 border-b border-[#E2E8F0] pb-3">
          <Building2 className="w-4 h-4 text-[#047857]" />
          <h2 className="text-sm font-bold text-[#111827]">Organization Identity & Time Zone</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-[#111827] mb-1">Company Name</label>
            <input
              type="text"
              value={formState.companyName}
              onChange={(e) =>
                setFormState((prev) => ({ ...prev, companyName: e.target.value }))
              }
              className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg focus:outline-none focus:border-[#047857]"
            />
          </div>

          <div>
            <label className="block font-semibold text-[#111827] mb-1">
              Primary Support Email
            </label>
            <input
              type="email"
              value={formState.supportEmail}
              onChange={(e) =>
                setFormState((prev) => ({ ...prev, supportEmail: e.target.value }))
              }
              className="w-full px-3 py-2 font-mono border border-[#E2E8F0] rounded-lg focus:outline-none focus:border-[#047857]"
            />
          </div>

          <div>
            <label className="block font-semibold text-[#111827] mb-1">
              Custom Portal Domain
            </label>
            <input
              type="text"
              value={formState.workspaceDomain}
              onChange={(e) =>
                setFormState((prev) => ({ ...prev, workspaceDomain: e.target.value }))
              }
              className="w-full px-3 py-2 font-mono border border-[#E2E8F0] rounded-lg focus:outline-none focus:border-[#047857]"
            />
          </div>

          <div>
            <label className="block font-semibold text-[#111827] mb-1">
              Default Organization Time Zone
            </label>
            <select
              value={formState.timezone}
              onChange={(e) =>
                setFormState((prev) => ({ ...prev, timezone: e.target.value }))
              }
              className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg bg-white"
            >
              <option value="UTC+01:00 (Central European Time — Stockholm / Paris)">
                UTC+01:00 (Central European Time — Stockholm / Paris)
              </option>
              <option value="UTC+00:00 (GMT — London / Dublin)">
                UTC+00:00 (GMT — London / Dublin)
              </option>
              <option value="UTC-05:00 (EST — New York)">
                UTC-05:00 (EST — New York)
              </option>
              <option value="UTC-08:00 (PST — San Francisco)">
                UTC-08:00 (PST — San Francisco)
              </option>
              <option value="UTC+09:00 (JST — Tokyo)">
                UTC+09:00 (JST — Tokyo)
              </option>
            </select>
          </div>
        </div>
      </div>

      {/* Business Hours, Working Days & Holidays */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 space-y-5">
        <div className="flex items-center gap-2.5 border-b border-[#E2E8F0] pb-3">
          <Clock className="w-4 h-4 text-[#047857]" />
          <h2 className="text-sm font-bold text-[#111827]">
            Business Hours, Working Days & Holiday Calendar
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-[#111827] mb-1">
              Business Hours Start
            </label>
            <input
              type="time"
              value={formState.businessHoursStart}
              onChange={(e) =>
                setFormState((prev) => ({ ...prev, businessHoursStart: e.target.value }))
              }
              className="w-full px-3 py-2 font-mono border border-[#E2E8F0] rounded-lg"
            />
          </div>

          <div>
            <label className="block font-semibold text-[#111827] mb-1">
              Business Hours End
            </label>
            <input
              type="time"
              value={formState.businessHoursEnd}
              onChange={(e) =>
                setFormState((prev) => ({ ...prev, businessHoursEnd: e.target.value }))
              }
              className="w-full px-3 py-2 font-mono border border-[#E2E8F0] rounded-lg"
            />
          </div>

          <div>
            <label className="block font-semibold text-[#111827] mb-1">
              Default Ticket Priority
            </label>
            <select
              value={formState.defaultPriority}
              onChange={(e) =>
                setFormState((prev) => ({
                  ...prev,
                  defaultPriority: e.target.value as TicketPriority,
                }))
              }
              className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg bg-white"
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#111827] mb-2">
            Active Working Days (SLA Clock Active)
          </label>
          <div className="flex flex-wrap gap-2">
            {allDays.map((day) => {
              const selected = formState.workingDays.includes(day);
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleWorkingDay(day)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                    selected
                      ? 'bg-[#ECFDF5] text-[#047857] border-[#10B981]/40 font-semibold'
                      : 'bg-white text-[#64748B] border-[#E2E8F0] hover:bg-slate-50'
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>

        {/* Holidays */}
        <div className="pt-3 border-t border-[#E2E8F0] space-y-3 text-xs">
          <div className="font-semibold text-[#111827] flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-[#047857]" />
            <span>Scheduled SLA Pause Holidays</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {formState.holidays.map((h, i) => (
              <div
                key={i}
                className="flex items-center justify-between px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg"
              >
                <div>
                  <div className="font-medium text-[#111827]">{h.name}</div>
                  <div className="font-mono text-[11px] text-[#64748B]">{h.date}</div>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setFormState((prev) => ({
                      ...prev,
                      holidays: prev.holidays.filter((_, idx) => idx !== i),
                    }))
                  }
                  className="text-slate-400 hover:text-red-600"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="date"
              value={newHolidayDate}
              onChange={(e) => setNewHolidayDate(e.target.value)}
              className="px-3 py-1.5 border border-[#E2E8F0] rounded-lg font-mono"
            />
            <input
              type="text"
              value={newHolidayName}
              onChange={(e) => setNewHolidayName(e.target.value)}
              placeholder="Holiday name (e.g. Midsummer Eve)"
              className="px-3 py-1.5 border border-[#E2E8F0] rounded-lg flex-1 min-w-[200px]"
            />
            <button
              type="button"
              onClick={handleAddHoliday}
              className="px-3 py-1.5 bg-[#ECFDF5] text-[#047857] font-semibold rounded-lg border border-[#10B981]/30"
            >
              + Add Holiday
            </button>
          </div>
        </div>
      </div>

      {/* Notification Preferences & RBAC Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-2.5 border-b border-[#E2E8F0] pb-3">
            <Bell className="w-4 h-4 text-[#047857]" />
            <h2 className="text-sm font-bold text-[#111827]">Notification Preferences</h2>
          </div>

          <div className="space-y-3 text-xs">
            {[
              {
                key: 'emailNotifications',
                label: 'Email Dispatch on Customer Replies',
                sub: 'Send immediate SMTP notifications to assigned agent',
              },
              {
                key: 'slackWebhookEnabled',
                label: 'Slack Connect Incident Channel Sync',
                sub: 'Post P1 Urgent tickets to #support-escalations',
              },
              {
                key: 'slaBreachAlerts',
                label: '15-Minute Pre-Breach SLA Warning',
                sub: 'Alert Support Managers before resolution clock expires',
              },
              {
                key: 'csatSurveyEnabled',
                label: 'Automated Post-Resolution CSAT Survey',
                sub: 'Request 1-click 5-star rating when ticket is resolved',
              },
            ].map((pref) => {
              const k = pref.key as keyof typeof formState;
              const checked = Boolean(formState[k]);
              return (
                <label
                  key={pref.key}
                  className="flex items-start justify-between gap-3 p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg cursor-pointer"
                >
                  <div>
                    <div className="font-semibold text-[#111827]">{pref.label}</div>
                    <div className="text-[11px] text-[#64748B]">{pref.sub}</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) =>
                      setFormState((prev) => ({ ...prev, [k]: e.target.checked }))
                    }
                    className="mt-1 rounded border-slate-300 text-[#047857] focus:ring-[#047857]"
                  />
                </label>
              );
            })}
          </div>
        </div>

        {/* Team Role Permissions Matrix */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-2.5 border-b border-[#E2E8F0] pb-3">
            <ShieldCheck className="w-4 h-4 text-[#047857]" />
            <h2 className="text-sm font-bold text-[#111827]">Role Permissions Matrix (RBAC)</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#E2E8F0] text-[11px] text-[#64748B]">
                  <th className="py-2">Capability</th>
                  <th className="py-2 text-center">Admin</th>
                  <th className="py-2 text-center">Manager</th>
                  <th className="py-2 text-center">Agent</th>
                  <th className="py-2 text-center">Customer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {[
                  { cap: 'Reply & Upload Attachments', a: true, m: true, ag: true, c: true },
                  { cap: 'View & Post Internal Notes', a: true, m: true, ag: true, c: false },
                  { cap: 'Bulk Reassign & Triage Queue', a: true, m: true, ag: true, c: false },
                  { cap: 'View Customer Phone & PII', a: true, m: true, ag: false, c: false },
                  { cap: 'Configure Categories & SLA', a: true, m: true, ag: false, c: false },
                  { cap: 'Manage Billing & Security', a: true, m: false, ag: false, c: false },
                ].map((row) => (
                  <tr key={row.cap}>
                    <td className="py-2.5 font-medium text-[#111827]">{row.cap}</td>
                    <td className="py-2.5 text-center text-[#047857] font-bold">
                      {row.a ? '✓' : '—'}
                    </td>
                    <td className="py-2.5 text-center text-[#047857] font-bold">
                      {row.m ? '✓' : '—'}
                    </td>
                    <td className="py-2.5 text-center text-[#047857] font-bold">
                      {row.ag ? '✓' : '—'}
                    </td>
                    <td className="py-2.5 text-center text-slate-400">
                      {row.c ? '✓' : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </form>
  );
}
