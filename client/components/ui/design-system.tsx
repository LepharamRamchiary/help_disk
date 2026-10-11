'use client';

import React, { useEffect } from 'react';
import {
  TicketStatus,
  TicketPriority,
  UserRole,
  ToastMessage,
} from '@/types/helpdesk';
import {
  CircleDot,
  Clock,
  CheckCircle2,
  Archive,
  AlertTriangle,
  ArrowUp,
  Minus,
  ArrowDown,
  X,
  AlertCircle,
  CheckCircle,
  Info,
  RefreshCw,
  Inbox,
  PlayCircle,
} from 'lucide-react';

export function StatusBadge({ status }: { status: TicketStatus }) {
  const config: Record<
    TicketStatus,
    { label: string; textClass: string; icon: React.ReactNode }
  > = {
    OPEN: {
      label: 'Open',
      textClass: 'text-blue-700',
      icon: <CircleDot className="w-3.5 h-3.5 text-blue-600 shrink-0" aria-hidden="true" />,
    },
    IN_PROGRESS: {
      label: 'In Progress',
      textClass: 'text-[#047857]',
      icon: <PlayCircle className="w-3.5 h-3.5 text-[#047857] shrink-0" aria-hidden="true" />,
    },
    WAITING_FOR_CUSTOMER: {
      label: 'Waiting for Customer',
      textClass: 'text-amber-700',
      icon: <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" aria-hidden="true" />,
    },
    RESOLVED: {
      label: 'Resolved',
      textClass: 'text-emerald-700',
      icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" aria-hidden="true" />,
    },
    CLOSED: {
      label: 'Closed',
      textClass: 'text-slate-600',
      icon: <Archive className="w-3.5 h-3.5 text-slate-500 shrink-0" aria-hidden="true" />,
    },
  };

  const item = config[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-medium whitespace-nowrap shrink-0 ${item.textClass}`}
    >
      {item.icon}
      <span>{item.label}</span>
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: TicketPriority }) {
  const config: Record<
    TicketPriority,
    { label: string; textClass: string; icon: React.ReactNode }
  > = {
    URGENT: {
      label: 'Urgent',
      textClass: 'text-red-700 font-semibold',
      icon: <AlertTriangle className="w-3.5 h-3.5 text-red-600 shrink-0" aria-hidden="true" />,
    },
    HIGH: {
      label: 'High',
      textClass: 'text-orange-700 font-medium',
      icon: <ArrowUp className="w-3.5 h-3.5 text-orange-600 shrink-0" aria-hidden="true" />,
    },
    MEDIUM: {
      label: 'Medium',
      textClass: 'text-amber-700 font-medium',
      icon: <Minus className="w-3.5 h-3.5 text-amber-600 shrink-0" aria-hidden="true" />,
    },
    LOW: {
      label: 'Low',
      textClass: 'text-slate-600 font-normal',
      icon: <ArrowDown className="w-3.5 h-3.5 text-slate-500 shrink-0" aria-hidden="true" />,
    },
  };

  const item = config[priority];
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs whitespace-nowrap shrink-0 ${item.textClass}`}
    >
      {item.icon}
      <span>{item.label}</span>
    </span>
  );
}

export function SlaBadge({
  slaStatus,
  remainingMinutes,
}: {
  slaStatus: 'WITHIN_SLA' | 'AT_RISK' | 'BREACHED' | 'COMPLETED';
  remainingMinutes?: number;
}) {
  const formatMinutes = (mins?: number) => {
    if (mins === undefined) return '';
    const abs = Math.abs(mins);
    const h = Math.floor(abs / 60);
    const m = abs % 60;
    const str = h > 0 ? `${h}h ${m}m` : `${m}m`;
    return mins < 0 ? `${str} overdue` : `${str} left`;
  };

  if (slaStatus === 'COMPLETED') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 whitespace-nowrap shrink-0 font-mono tabular-nums">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
        <span>SLA Met</span>
      </span>
    );
  }

  if (slaStatus === 'BREACHED') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-700 whitespace-nowrap shrink-0 font-mono tabular-nums">
        <AlertTriangle className="w-3.5 h-3.5 text-red-600 shrink-0" />
        <span>Breached {remainingMinutes !== undefined ? `· ${formatMinutes(remainingMinutes)}` : ''}</span>
      </span>
    );
  }

  if (slaStatus === 'AT_RISK') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 whitespace-nowrap shrink-0 font-mono tabular-nums">
        <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
        <span>At Risk {remainingMinutes !== undefined ? `· ${formatMinutes(remainingMinutes)}` : ''}</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 whitespace-nowrap shrink-0 font-mono tabular-nums">
      <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
      <span>On Track {remainingMinutes !== undefined ? `· ${formatMinutes(remainingMinutes)}` : ''}</span>
    </span>
  );
}

export function RoleLabel({ role }: { role: UserRole }) {
  const labels: Record<UserRole, string> = {
    PLATFORM_ADMIN: 'Platform Admin',
    COMPANY_ADMIN: 'Company Admin',
    SUPPORT_MANAGER: 'Support Manager',
    SUPPORT_AGENT: 'Support Agent',
    CUSTOMER: 'Customer',
  };
  return <span className="text-xs font-medium text-slate-600 whitespace-nowrap">{labels[role]}</span>;
}

export function Avatar({
  initials,
  size = 'md',
  variant = 'emerald',
}: {
  initials: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  variant?: 'emerald' | 'slate' | 'blue' | 'amber';
}) {
  const sizes = {
    xs: 'w-6 h-6 text-[11px]',
    sm: 'w-7 h-7 text-xs',
    md: 'w-8 h-8 text-xs',
    lg: 'w-10 h-10 text-sm',
  };

  const variants = {
    emerald: 'bg-[#ECFDF5] text-[#047857] border border-[#10B981]/30',
    slate: 'bg-slate-100 text-slate-700 border border-slate-200',
    blue: 'bg-blue-50 text-blue-700 border border-blue-200',
    amber: 'bg-amber-50 text-amber-800 border border-amber-200',
  };

  return (
    <div
      className={`${sizes[size]} ${variants[variant]} rounded-lg font-semibold flex items-center justify-center shrink-0 select-none`}
      aria-hidden="true"
    >
      {initials}
    </div>
  );
}

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = 'max-w-lg',
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  maxWidth?: string;
}) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-[2px] animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className={`bg-white border border-[#E2E8F0] rounded-xl shadow-xl w-full ${maxWidth} max-h-[90vh] flex flex-col overflow-hidden`}
      >
        <div className="flex items-start justify-between gap-4 px-6 py-4 border-b border-[#E2E8F0]">
          <div>
            <h2 id="modal-title" className="text-base font-semibold text-[#111827]">
              {title}
            </h2>
            {description && <p className="text-xs text-[#64748B] mt-0.5">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors focus-visible:outline-2 focus-visible:outline-[#047857]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  destructive = false,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  destructive?: boolean;
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="max-w-md">
      <div className="space-y-5">
        <p className="text-sm text-[#64748B] leading-relaxed">{description}</p>
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-[#E2E8F0] rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`px-4 py-2 text-xs font-medium text-white rounded-lg transition-colors whitespace-nowrap ${
              destructive
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-[#047857] hover:bg-[#065F46]'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}

export function ToastContainer({
  toasts,
  onDismiss,
}: {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}) {
  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none"
      aria-live="polite"
    >
      {toasts.map((t) => {
        const icons = {
          success: <CheckCircle className="w-4 h-4 text-[#047857] shrink-0 mt-0.5" />,
          error: <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />,
          warning: <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />,
          info: <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />,
        };
        return (
          <div
            key={t.id}
            className="pointer-events-auto flex items-start justify-between gap-3 bg-white border border-[#E2E8F0] rounded-xl p-3.5 shadow-lg transition-all duration-150"
          >
            <div className="flex items-start gap-2.5">
              {icons[t.variant]}
              <div>
                <p className="text-xs font-semibold text-[#111827]">{t.title}</p>
                {t.description && (
                  <p className="text-xs text-[#64748B] mt-0.5 leading-relaxed">{t.description}</p>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => onDismiss(t.id)}
              aria-label="Dismiss notification"
              className="text-slate-400 hover:text-slate-600 p-1 rounded"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

export function LoadingSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 space-y-4" aria-busy="true">
      <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-4">
        <div className="h-4 w-48 bg-slate-100 rounded animate-pulse" />
        <div className="h-8 w-28 bg-slate-100 rounded-lg animate-pulse" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center justify-between gap-4 py-2">
            <div className="h-4 w-20 bg-slate-100 rounded animate-pulse" />
            <div className="h-4 flex-1 bg-slate-100 rounded animate-pulse" />
            <div className="h-4 w-32 bg-slate-100 rounded animate-pulse" />
            <div className="h-4 w-24 bg-slate-100 rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
}: {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="bg-white border border-[#E2E8F0] rounded-xl p-12 text-center max-w-xl mx-auto my-4">
      <div className="w-11 h-11 rounded-xl bg-[#ECFDF5] text-[#047857] flex items-center justify-center mx-auto mb-4">
        <Inbox className="w-5 h-5" />
      </div>
      <h3 className="text-base font-semibold text-[#111827]">{title}</h3>
      <p className="text-sm text-[#64748B] mt-1.5 max-w-md mx-auto leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-5 inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#047857] hover:bg-[#065F46] rounded-lg transition-colors whitespace-nowrap"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

export function ErrorBanner({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div
      role="alert"
      className="bg-red-50/80 border border-red-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
    >
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
        <div>
          <h4 className="text-sm font-semibold text-red-900">
            Unable to synchronize with Spring Boot REST API
          </h4>
          <p className="text-xs text-red-700 mt-0.5">{message}</p>
        </div>
      </div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-red-800 bg-white border border-red-200 hover:bg-red-50 rounded-lg transition-colors whitespace-nowrap shrink-0"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Retry Connection
        </button>
      )}
    </div>
  );
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#111827]">{title}</h1>
        {description && <p className="text-sm text-[#64748B] mt-1">{description}</p>}
      </div>
      {actions && <div className="flex items-center flex-wrap gap-2.5 shrink-0">{actions}</div>}
    </div>
  );
}
