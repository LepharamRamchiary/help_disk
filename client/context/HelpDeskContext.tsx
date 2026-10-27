'use client';

import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import {
  Organization,
  User,
  UserRole,
  Customer,
  Category,
  SLAPolicy,
  AutomationRule,
  Ticket,
  TicketStatus,
  TicketPriority,
  NotificationItem,
  CompanySettings,
  PageView,
  ToastMessage,
  Attachment,
} from '@/types/helpdesk';
import { AuthApiError, AuthApiService, type AuthenticatedUser } from '@/services/api';
import {
  INITIAL_ORGANIZATIONS,
  INITIAL_TEAM_MEMBERS,
  INITIAL_CUSTOMERS,
  INITIAL_CATEGORIES,
  INITIAL_SLA_POLICIES,
  INITIAL_AUTOMATIONS,
  INITIAL_TICKETS,
  INITIAL_NOTIFICATIONS,
  INITIAL_COMPANY_SETTINGS,
} from '@/lib/mock-data';

export type SimulationState = 'NORMAL' | 'LOADING' | 'EMPTY' | 'ERROR';

const AUTH_TOKEN_KEY = 'helpdesk.auth.token';

function toHelpDeskUser(user: AuthenticatedUser): User {
  const fullName = user.name?.trim() || user.email.split('@')[0];
  const role: UserRole =
    user.role === 'PLATFORM_ADMIN'
      ? 'PLATFORM_ADMIN'
      : user.role === 'CUSTOMER'
        ? 'CUSTOMER'
        : user.role === 'SUPPORT_MANAGER'
          ? 'SUPPORT_MANAGER'
          : user.role === 'ADMIN' || user.role === 'COMPANY_ADMIN'
            ? 'COMPANY_ADMIN'
            : 'SUPPORT_AGENT';

  return {
    ...INITIAL_TEAM_MEMBERS[0],
    id: String(user.id),
    fullName,
    email: user.email,
    role,
    title: role.replaceAll('_', ' '),
    avatarInitials: fullName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join(''),
    joinedAt: user.createdAt || new Date().toISOString(),
  };
}

interface CreateTicketInput {
  subject: string;
  description: string;
  customerId: string;
  categoryId: string;
  priority: TicketPriority;
  assignedAgentId?: string | null;
  dueDate?: string;
  tags?: string[];
  attachments?: Attachment[];
}

interface HelpDeskContextValue {
  // Navigation & Auth
  currentView: PageView;
  navigateTo: (view: PageView, options?: { ticketId?: string; customerId?: string }) => void;
  currentUser: User;
  switchRolePersona: (role: UserRole) => void;
  loginWithPassword: (email: string, password: string, rememberMe: boolean) => Promise<void>;
  registerAccount: (name: string, email: string, password: string) => Promise<void>;
  loginWithGoogle: (credential: string) => Promise<void>;
  logout: () => void;

  // Organization & Theme
  organizations: Organization[];
  currentOrganization: Organization;
  switchOrganization: (orgId: string) => void;
  sidebarStyle: 'light' | 'dark-emerald';
  toggleSidebarStyle: () => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;

  // Simulation Mode (for testing Skeletons, Empty states, Error states)
  simulationState: SimulationState;
  setSimulationState: (state: SimulationState) => void;

  // Tickets
  tickets: Ticket[];
  selectedTicketId: string;
  selectedTicket: Ticket | undefined;
  setSelectedTicketId: (id: string) => void;
  createTicketModalOpen: boolean;
  setCreateTicketModalOpen: (open: boolean) => void;
  createTicket: (input: CreateTicketInput) => Ticket;
  updateTicketStatus: (ticketId: string, status: TicketStatus) => void;
  updateTicketPriority: (ticketId: string, priority: TicketPriority) => void;
  assignTicketAgent: (ticketId: string, agentId: string | null) => void;
  updateTicketCategory: (ticketId: string, categoryId: string) => void;
  addTicketTag: (ticketId: string, tag: string) => void;
  removeTicketTag: (ticketId: string, tag: string) => void;
  bulkUpdateTickets: (
    ticketIds: string[],
    updates: { status?: TicketStatus; priority?: TicketPriority; assignedAgentId?: string | null }
  ) => void;
  addTicketMessage: (
    ticketId: string,
    body: string,
    isInternalNote: boolean,
    attachments?: Attachment[]
  ) => void;

  // Customers
  customers: Customer[];
  selectedCustomerId: string | null;
  setSelectedCustomerId: (id: string | null) => void;
  addCustomer: (customer: Omit<Customer, 'id' | 'totalTickets' | 'openTickets' | 'csatRating' | 'lastInteraction' | 'createdAt' | 'avatarInitials'>) => void;

  // Team Members
  teamMembers: User[];
  inviteTeamMember: (input: { fullName: string; email: string; role: UserRole; title: string }) => void;
  updateTeamMemberRole: (userId: string, role: UserRole) => void;
  toggleTeamMemberActive: (userId: string) => void;

  // Categories, SLA, Automations & Settings
  categories: Category[];
  saveCategory: (category: Omit<Category, 'id' | 'ticketCount'> & { id?: string }) => void;
  toggleCategoryActive: (id: string) => void;
  deleteCategory: (id: string) => void;
  slaPolicies: SLAPolicy[];
  automations: AutomationRule[];
  toggleAutomation: (id: string) => void;
  addAutomationRule: (rule: Omit<AutomationRule, 'id' | 'executionsCount' | 'lastTriggered'>) => void;
  companySettings: CompanySettings;
  updateCompanySettings: (settings: Partial<CompanySettings>) => void;

  // Platform Admin
  toggleOrganizationStatus: (orgId: string) => void;
  updateOrganizationPlan: (orgId: string, plan: Organization['plan']) => void;

  // Notifications & Toasts
  notifications: NotificationItem[];
  unreadNotificationsCount: number;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  toasts: ToastMessage[];
  addToast: (title: string, description?: string, variant?: ToastMessage['variant']) => void;
  dismissToast: (id: string) => void;

  // Spring Boot API Inspector Modal
  apiDocsModalOpen: boolean;
  setApiDocsModalOpen: (open: boolean) => void;
}

const HelpDeskContext = createContext<HelpDeskContextValue | undefined>(undefined);

export function HelpDeskProvider({ children }: { children: React.ReactNode }) {
  const [organizations, setOrganizations] = useState<Organization[]>(INITIAL_ORGANIZATIONS);
  const [currentOrgId, setCurrentOrgId] = useState<string>('org-1');
  const [teamMembers, setTeamMembers] = useState<User[]>(INITIAL_TEAM_MEMBERS);
  const [currentUser, setCurrentUser] = useState<User>(INITIAL_TEAM_MEMBERS[0]); // Alex Morgan (Company Admin / Manager)
  const [currentView, setCurrentView] = useState<PageView>('landing');

  const [sidebarStyle, setSidebarStyle] = useState<'light' | 'dark-emerald'>('light');
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [simulationState, setSimulationState] = useState<SimulationState>('NORMAL');

  const [tickets, setTickets] = useState<Ticket[]>(INITIAL_TICKETS);
  const [selectedTicketId, setSelectedTicketId] = useState<string>('HD-1001');
  const [createTicketModalOpen, setCreateTicketModalOpen] = useState<boolean>(false);

  const [customers, setCustomers] = useState<Customer[]>(INITIAL_CUSTOMERS);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  const [categories, setCategories] = useState<Category[]>(INITIAL_CATEGORIES);
  const [slaPolicies] = useState<SLAPolicy[]>(INITIAL_SLA_POLICIES);
  const [automations, setAutomations] = useState<AutomationRule[]>(INITIAL_AUTOMATIONS);
  const [companySettings, setCompanySettings] = useState<CompanySettings>(INITIAL_COMPANY_SETTINGS);

  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [apiDocsModalOpen, setApiDocsModalOpen] = useState<boolean>(false);

  const addToast = useCallback(
    (title: string, description?: string, variant: ToastMessage['variant'] = 'success') => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      setToasts((prev) => [...prev, { id, title, description, variant }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4200);
    },
    []
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const applyAuthenticatedUser = useCallback((authUser: AuthenticatedUser) => {
    const user = toHelpDeskUser(authUser);
    setCurrentUser(user);
    setCurrentView(
      user.role === 'CUSTOMER'
        ? 'customer-portal'
        : user.role === 'PLATFORM_ADMIN'
          ? 'platform-admin'
          : 'overview'
    );
  }, []);

  const persistSession = useCallback(
    (token: string, rememberMe: boolean) => {
      window.localStorage.removeItem(AUTH_TOKEN_KEY);
      window.sessionStorage.removeItem(AUTH_TOKEN_KEY);
      const storage = rememberMe ? window.localStorage : window.sessionStorage;
      storage.setItem(AUTH_TOKEN_KEY, token);
    },
    []
  );

  const loginWithPassword = useCallback(
    async (email: string, password: string, rememberMe: boolean) => {
      const session = await AuthApiService.login(email, password);
      persistSession(session.token, rememberMe);
      applyAuthenticatedUser(session.user);
      addToast('Welcome back to HelpDesk Pro', `Signed in as ${session.user.email}.`);
    },
    [addToast, applyAuthenticatedUser, persistSession]
  );

  const registerAccount = useCallback(
    async (name: string, email: string, password: string) => {
      const session = await AuthApiService.register(name, email, password);
      persistSession(session.token, true);
      applyAuthenticatedUser(session.user);
      addToast('Account created', `Welcome to HelpDesk Pro, ${session.user.name || session.user.email}.`);
    },
    [addToast, applyAuthenticatedUser, persistSession]
  );

  const loginWithGoogle = useCallback(
    async (credential: string) => {
      const session = await AuthApiService.google(credential);
      persistSession(session.token, true);
      applyAuthenticatedUser(session.user);
      addToast('Google sign-in successful', `Signed in as ${session.user.email}.`);
    },
    [addToast, applyAuthenticatedUser, persistSession]
  );

  useEffect(() => {
    let active = true;
    const token =
      window.localStorage.getItem(AUTH_TOKEN_KEY) ||
      window.sessionStorage.getItem(AUTH_TOKEN_KEY);
    if (!token) return;

    AuthApiService.me(token)
      .then((user) => {
        if (active) applyAuthenticatedUser(user);
      })
      .catch((error: unknown) => {
        if (!active) return;
        if (error instanceof AuthApiError && (error.status === 401 || error.status === 404)) {
          window.localStorage.removeItem(AUTH_TOKEN_KEY);
          window.sessionStorage.removeItem(AUTH_TOKEN_KEY);
          setCurrentView('login');
          addToast('Session expired', 'Please sign in again to continue.', 'info');
          return;
        }

        addToast(
          'Could not restore your session',
          error instanceof Error ? error.message : 'Please try signing in again.',
          'error'
        );
      });
    return () => {
      active = false;
    };
  }, [addToast, applyAuthenticatedUser]);

  const navigateTo = useCallback(
    (view: PageView, options?: { ticketId?: string; customerId?: string }) => {
      if (options?.ticketId) {
        setSelectedTicketId(options.ticketId);
      }
      if (options?.customerId !== undefined) {
        setSelectedCustomerId(options.customerId);
      }
      setCurrentView(view);
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    },
    []
  );

  const switchRolePersona = useCallback(
    (role: UserRole) => {
      let targetUser = teamMembers.find((u) => u.role === role);
      if (!targetUser) {
        targetUser = INITIAL_TEAM_MEMBERS.find((u) => u.role === role) || INITIAL_TEAM_MEMBERS[0];
      }
      setCurrentUser(targetUser);

      if (role === 'CUSTOMER') {
        setCurrentView('customer-portal');
        addToast(
          'Switched to Customer Portal View',
          `Signed in as ${targetUser.fullName}. Internal notes and admin controls are strictly hidden.`,
          'info'
        );
      } else if (role === 'PLATFORM_ADMIN') {
        setCurrentView('platform-admin');
        addToast(
          'Switched to Platform Administrator',
          `Signed in as ${targetUser.fullName}. Multi-tenant SaaS operations unlocked.`,
          'info'
        );
      } else {
        if (currentView === 'customer-portal' || currentView === 'platform-admin' || currentView === 'login') {
          setCurrentView('overview');
        }
        addToast(
          `Active Role: ${role.replace('_', ' ')}`,
          `Signed in as ${targetUser.fullName} (${targetUser.title})`,
          'info'
        );
      }
    },
    [teamMembers, currentView, addToast]
  );

  const logout = useCallback(() => {
    window.localStorage.removeItem(AUTH_TOKEN_KEY);
    window.sessionStorage.removeItem(AUTH_TOKEN_KEY);
    setCurrentView('login');
    addToast('Signed out', 'Your session has been securely closed.', 'info');
  }, [addToast]);

  const currentOrganization = useMemo(
    () => organizations.find((o) => o.id === currentOrgId) || organizations[0],
    [organizations, currentOrgId]
  );

  const switchOrganization = useCallback(
    (orgId: string) => {
      const target = organizations.find((o) => o.id === orgId);
      if (target) {
        setCurrentOrgId(orgId);
        addToast(`Switched Workspace`, `Now viewing ${target.name} (${target.plan} Plan)`, 'info');
      }
    },
    [organizations, addToast]
  );

  const toggleSidebarStyle = useCallback(() => {
    setSidebarStyle((prev) => (prev === 'light' ? 'dark-emerald' : 'light'));
  }, []);

  const selectedTicket = useMemo(
    () => tickets.find((t) => t.id === selectedTicketId) || tickets[0],
    [tickets, selectedTicketId]
  );

  const createTicket = useCallback(
    (input: CreateTicketInput): Ticket => {
      const nextNum = 1001 + tickets.length;
      const newId = `HD-${nextNum}`;
      const customer =
        customers.find((c) => c.id === input.customerId) ||
        customers.find((c) => c.email === currentUser.email) ||
        customers[0];
      const category = categories.find((c) => c.id === input.categoryId) || categories[0];
      const agent = input.assignedAgentId
        ? teamMembers.find((m) => m.id === input.assignedAgentId) || null
        : null;

      const slaTargetMinutes =
        input.priority === 'URGENT'
          ? 120
          : input.priority === 'HIGH'
          ? 480
          : input.priority === 'MEDIUM'
          ? 1440
          : 4320;

      const newTicket: Ticket = {
        id: newId,
        organizationId: currentOrgId,
        subject: input.subject.trim(),
        description: input.description.trim(),
        status: 'OPEN',
        priority: input.priority,
        categoryId: category.id,
        categoryName: category.name,
        customerId: customer.id,
        customerName: customer.fullName,
        customerEmail: customer.email,
        customerOrganization: customer.organization,
        customerInitials: customer.avatarInitials,
        assignedAgentId: agent ? agent.id : null,
        assignedAgentName: agent ? agent.fullName : null,
        assignedAgentInitials: agent ? agent.avatarInitials : null,
        createdAt: '2026-10-11 09:40',
        updatedAt: 'Just now',
        dueDate: input.dueDate || '2026-10-12 17:00',
        firstResponseDeadline: 'Today +1h',
        resolutionDeadline: 'Tomorrow',
        firstResponseRemainingMinutes: Math.round(slaTargetMinutes / 4),
        resolutionRemainingMinutes: slaTargetMinutes,
        slaStatus: 'WITHIN_SLA',
        tags: input.tags && input.tags.length > 0 ? input.tags : [category.name.toLowerCase().split(' ')[0]],
        messages: [
          {
            id: `msg-${Date.now()}`,
            ticketId: newId,
            authorId: currentUser.role === 'CUSTOMER' ? customer.id : currentUser.id,
            authorName: currentUser.role === 'CUSTOMER' ? customer.fullName : currentUser.fullName,
            authorRole: currentUser.role,
            authorInitials:
              currentUser.role === 'CUSTOMER' ? customer.avatarInitials : currentUser.avatarInitials,
            body: input.description.trim(),
            isInternalNote: false,
            createdAt: 'Just now',
            attachments: input.attachments || [],
          },
        ],
        activities: [
          {
            id: `act-${Date.now()}`,
            ticketId: newId,
            actorName: currentUser.fullName,
            action: `Created ticket ${newId} with ${input.priority} priority`,
            timestamp: 'Just now',
          },
        ],
      };

      setTickets((prev) => [newTicket, ...prev]);
      setSelectedTicketId(newId);

      // Also add notification
      setNotifications((prev) => [
        {
          id: `notif-${Date.now()}`,
          type: 'ASSIGNMENT',
          title: `New Ticket Created: ${newId}`,
          description: `${newTicket.subject} (${newTicket.customerOrganization})`,
          ticketId: newId,
          createdAt: 'Just now',
          read: false,
        },
        ...prev,
      ]);

      addToast(`Ticket ${newId} Created`, `"${newTicket.subject}" has been logged in the queue.`);
      return newTicket;
    },
    [tickets.length, customers, currentUser, categories, teamMembers, currentOrgId, addToast]
  );

  const updateTicketStatus = useCallback(
    (ticketId: string, status: TicketStatus) => {
      setTickets((prev) =>
        prev.map((t) => {
          if (t.id !== ticketId) return t;
          const updatedSla =
            status === 'RESOLVED' || status === 'CLOSED' ? 'COMPLETED' : t.slaStatus;
          return {
            ...t,
            status,
            slaStatus: updatedSla,
            updatedAt: 'Just now',
            activities: [
              ...t.activities,
              {
                id: `act-${Date.now()}`,
                ticketId,
                actorName: currentUser.fullName,
                action: `Updated status from ${t.status.replace(/_/g, ' ')} to ${status.replace(/_/g, ' ')}`,
                timestamp: 'Just now',
              },
            ],
          };
        })
      );
      addToast('Status Updated', `Ticket ${ticketId} marked as ${status.replace(/_/g, ' ')}.`);
    },
    [currentUser.fullName, addToast]
  );

  const updateTicketPriority = useCallback(
    (ticketId: string, priority: TicketPriority) => {
      setTickets((prev) =>
        prev.map((t) =>
          t.id === ticketId
            ? {
                ...t,
                priority,
                updatedAt: 'Just now',
                activities: [
                  ...t.activities,
                  {
                    id: `act-${Date.now()}`,
                    ticketId,
                    actorName: currentUser.fullName,
                    action: `Changed priority to ${priority}`,
                    timestamp: 'Just now',
                  },
                ],
              }
            : t
        )
      );
      addToast('Priority Updated', `Ticket ${ticketId} priority set to ${priority}.`);
    },
    [currentUser.fullName, addToast]
  );

  const assignTicketAgent = useCallback(
    (ticketId: string, agentId: string | null) => {
      const agent = agentId ? teamMembers.find((m) => m.id === agentId) || null : null;
      setTickets((prev) =>
        prev.map((t) =>
          t.id === ticketId
            ? {
                ...t,
                assignedAgentId: agent ? agent.id : null,
                assignedAgentName: agent ? agent.fullName : null,
                assignedAgentInitials: agent ? agent.avatarInitials : null,
                status: t.status === 'OPEN' && agent ? 'IN_PROGRESS' : t.status,
                updatedAt: 'Just now',
                activities: [
                  ...t.activities,
                  {
                    id: `act-${Date.now()}`,
                    ticketId,
                    actorName: currentUser.fullName,
                    action: agent ? `Assigned ticket to ${agent.fullName}` : 'Unassigned ticket',
                    timestamp: 'Just now',
                  },
                ],
              }
            : t
        )
      );
      addToast(
        agent ? 'Agent Assigned' : 'Ticket Unassigned',
        agent ? `${ticketId} assigned to ${agent.fullName}.` : `${ticketId} returned to unassigned queue.`
      );
    },
    [teamMembers, currentUser.fullName, addToast]
  );

  const updateTicketCategory = useCallback(
    (ticketId: string, categoryId: string) => {
      const cat = categories.find((c) => c.id === categoryId);
      if (!cat) return;
      setTickets((prev) =>
        prev.map((t) =>
          t.id === ticketId
            ? {
                ...t,
                categoryId: cat.id,
                categoryName: cat.name,
                updatedAt: 'Just now',
              }
            : t
        )
      );
      addToast('Category Updated', `Moved ${ticketId} to ${cat.name}.`);
    },
    [categories, addToast]
  );

  const addTicketTag = useCallback((ticketId: string, tag: string) => {
    const clean = tag.trim().toLowerCase().replace(/\s+/g, '-');
    if (!clean) return;
    setTickets((prev) =>
      prev.map((t) =>
        t.id === ticketId && !t.tags.includes(clean)
          ? { ...t, tags: [...t.tags, clean], updatedAt: 'Just now' }
          : t
      )
    );
  }, []);

  const removeTicketTag = useCallback((ticketId: string, tag: string) => {
    setTickets((prev) =>
      prev.map((t) =>
        t.id === ticketId ? { ...t, tags: t.tags.filter((tg) => tg !== tag), updatedAt: 'Just now' } : t
      )
    );
  }, []);

  const bulkUpdateTickets = useCallback(
    (
      ticketIds: string[],
      updates: { status?: TicketStatus; priority?: TicketPriority; assignedAgentId?: string | null }
    ) => {
      const agent =
        updates.assignedAgentId !== undefined && updates.assignedAgentId !== null
          ? teamMembers.find((m) => m.id === updates.assignedAgentId) || null
          : null;

      setTickets((prev) =>
        prev.map((t) => {
          if (!ticketIds.includes(t.id)) return t;
          return {
            ...t,
            status: updates.status ?? t.status,
            priority: updates.priority ?? t.priority,
            assignedAgentId:
              updates.assignedAgentId !== undefined ? (agent ? agent.id : null) : t.assignedAgentId,
            assignedAgentName:
              updates.assignedAgentId !== undefined ? (agent ? agent.fullName : null) : t.assignedAgentName,
            assignedAgentInitials:
              updates.assignedAgentId !== undefined
                ? agent
                  ? agent.avatarInitials
                  : null
                : t.assignedAgentInitials,
            updatedAt: 'Just now',
          };
        })
      );
      addToast('Bulk Update Complete', `Updated ${ticketIds.length} selected ticket(s).`);
    },
    [teamMembers, addToast]
  );

  const addTicketMessage = useCallback(
    (ticketId: string, body: string, isInternalNote: boolean, attachments: Attachment[] = []) => {
      if (!body.trim() && attachments.length === 0) return;
      const newMessage = {
        id: `msg-${Date.now()}`,
        ticketId,
        authorId: currentUser.id,
        authorName: currentUser.fullName,
        authorRole: currentUser.role,
        authorInitials: currentUser.avatarInitials,
        body: body.trim(),
        isInternalNote: currentUser.role === 'CUSTOMER' ? false : isInternalNote,
        createdAt: 'Just now',
        attachments,
      };

      setTickets((prev) =>
        prev.map((t) => {
          if (t.id !== ticketId) return t;
          const nextStatus =
            !isInternalNote && currentUser.role !== 'CUSTOMER' && t.status === 'OPEN'
              ? 'IN_PROGRESS'
              : t.status;
          return {
            ...t,
            status: nextStatus,
            updatedAt: 'Just now',
            messages: [...t.messages, newMessage],
            activities: [
              ...t.activities,
              {
                id: `act-${Date.now()}`,
                ticketId,
                actorName: currentUser.fullName,
                action: isInternalNote ? 'Added an internal staff note' : 'Posted a conversation reply',
                timestamp: 'Just now',
              },
            ],
          };
        })
      );

      addToast(
        isInternalNote ? 'Internal Note Saved' : 'Reply Sent',
        isInternalNote
          ? `Visible only to support staff on ${ticketId}.`
          : `Your response on ${ticketId} has been delivered.`
      );
    },
    [currentUser, addToast]
  );

  const addCustomer = useCallback(
    (
      input: Omit<
        Customer,
        'id' | 'totalTickets' | 'openTickets' | 'csatRating' | 'lastInteraction' | 'createdAt' | 'avatarInitials'
      >
    ) => {
      const parts = input.fullName.trim().split(' ');
      const initials =
        parts.length >= 2
          ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
          : input.fullName.slice(0, 2).toUpperCase();
      const newCust: Customer = {
        ...input,
        id: `cust-${Date.now()}`,
        avatarInitials: initials,
        totalTickets: 0,
        openTickets: 0,
        csatRating: 5.0,
        lastInteraction: 'Just added',
        createdAt: '2026-10-11',
      };
      setCustomers((prev) => [newCust, ...prev]);
      addToast('Customer Profile Added', `${input.fullName} (${input.organization}) added to directory.`);
    },
    [addToast]
  );

  const inviteTeamMember = useCallback(
    (input: { fullName: string; email: string; role: UserRole; title: string }) => {
      const parts = input.fullName.trim().split(' ');
      const initials =
        parts.length >= 2
          ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
          : input.fullName.slice(0, 2).toUpperCase();
      const newMember: User = {
        id: `usr-${Date.now()}`,
        fullName: input.fullName,
        email: input.email,
        role: input.role,
        title: input.title || 'Support Specialist',
        organizationId: currentOrgId,
        organizationName: currentOrganization.name,
        avatarInitials: initials,
        availability: 'ONLINE',
        active: true,
        assignedTicketsCount: 0,
        openTicketsCount: 0,
        overdueTicketsCount: 0,
        avgResponseTimeMinutes: 15,
        csatScore: 5.0,
        joinedAt: '2026-10-11',
      };
      setTeamMembers((prev) => [newMember, ...prev]);
      addToast('Invitation Sent', `Invited ${input.fullName} (${input.email}) as ${input.role.replace('_', ' ')}.`);
    },
    [currentOrgId, currentOrganization.name, addToast]
  );

  const updateTeamMemberRole = useCallback(
    (userId: string, role: UserRole) => {
      setTeamMembers((prev) => prev.map((m) => (m.id === userId ? { ...m, role } : m)));
      addToast('Role Updated', `Member role updated to ${role.replace('_', ' ')}.`);
    },
    [addToast]
  );

  const toggleTeamMemberActive = useCallback(
    (userId: string) => {
      setTeamMembers((prev) =>
        prev.map((m) => {
          if (m.id !== userId) return m;
          const nextActive = !m.active;
          addToast(
            nextActive ? 'Account Activated' : 'Account Deactivated',
            `${m.fullName}'s support seat is now ${nextActive ? 'active' : 'deactivated'}.`,
            nextActive ? 'success' : 'warning'
          );
          return {
            ...m,
            active: nextActive,
            availability: nextActive ? 'ONLINE' : 'OFFLINE',
          };
        })
      );
    },
    [addToast]
  );

  const saveCategory = useCallback(
    (category: Omit<Category, 'id' | 'ticketCount'> & { id?: string }) => {
      if (category.id) {
        setCategories((prev) =>
          prev.map((c) => (c.id === category.id ? { ...c, ...category, id: c.id } : c))
        );
        addToast('Category Updated', `"${category.name}" routing configuration saved.`);
      } else {
        const newCat: Category = {
          ...category,
          id: `cat-${Date.now()}`,
          ticketCount: 0,
        };
        setCategories((prev) => [...prev, newCat]);
        addToast('Category Created', `"${category.name}" is now available for ticket classification.`);
      }
    },
    [addToast]
  );

  const toggleCategoryActive = useCallback(
    (id: string) => {
      setCategories((prev) =>
        prev.map((c) => (c.id === id ? { ...c, active: !c.active } : c))
      );
      addToast('Category Status Updated', 'Ticket routing availability updated.');
    },
    [addToast]
  );

  const deleteCategory = useCallback(
    (id: string) => {
      const target = categories.find((c) => c.id === id);
      setCategories((prev) => prev.filter((c) => c.id !== id));
      addToast('Category Deleted', target ? `Removed "${target.name}".` : 'Category removed.', 'info');
    },
    [categories, addToast]
  );

  const toggleAutomation = useCallback(
    (id: string) => {
      setAutomations((prev) =>
        prev.map((a) => (a.id === id ? { ...a, active: !a.active } : a))
      );
      addToast('Automation Updated', 'Workflow rule execution state toggled.');
    },
    [addToast]
  );

  const addAutomationRule = useCallback(
    (rule: Omit<AutomationRule, 'id' | 'executionsCount' | 'lastTriggered'>) => {
      const newRule: AutomationRule = {
        ...rule,
        id: `auto-${Date.now()}`,
        executionsCount: 0,
        lastTriggered: 'Never',
      };
      setAutomations((prev) => [newRule, ...prev]);
      addToast('Automation Created', `Workflow rule "${rule.name}" is now active.`);
    },
    [addToast]
  );

  const updateCompanySettings = useCallback(
    (settings: Partial<CompanySettings>) => {
      setCompanySettings((prev) => ({ ...prev, ...settings }));
      addToast('Organization Settings Saved', 'Changes have been applied to your workspace.');
    },
    [addToast]
  );

  const toggleOrganizationStatus = useCallback(
    (orgId: string) => {
      setOrganizations((prev) =>
        prev.map((org) => {
          if (org.id !== orgId) return org;
          const nextStatus = org.status === 'Suspended' ? 'Active' : 'Suspended';
          addToast(
            `Tenant ${nextStatus}`,
            `${org.name} status changed to ${nextStatus}.`,
            nextStatus === 'Active' ? 'success' : 'warning'
          );
          return { ...org, status: nextStatus };
        })
      );
    },
    [addToast]
  );

  const updateOrganizationPlan = useCallback(
    (orgId: string, plan: Organization['plan']) => {
      setOrganizations((prev) =>
        prev.map((org) => (org.id === orgId ? { ...org, plan } : org))
      );
      addToast('Subscription Tier Updated', `Updated tenant subscription to ${plan} Plan.`);
    },
    [addToast]
  );

  const markNotificationRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    addToast('Notifications Cleared', 'All notifications have been marked as read.', 'info');
  }, [addToast]);

  const unreadNotificationsCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  const value = useMemo<HelpDeskContextValue>(
    () => ({
      currentView,
      navigateTo,
      currentUser,
      switchRolePersona,
      loginWithPassword,
      registerAccount,
      loginWithGoogle,
      logout,
      organizations,
      currentOrganization,
      switchOrganization,
      sidebarStyle,
      toggleSidebarStyle,
      sidebarCollapsed,
      setSidebarCollapsed,
      simulationState,
      setSimulationState,
      tickets,
      selectedTicketId,
      selectedTicket,
      setSelectedTicketId,
      createTicketModalOpen,
      setCreateTicketModalOpen,
      createTicket,
      updateTicketStatus,
      updateTicketPriority,
      assignTicketAgent,
      updateTicketCategory,
      addTicketTag,
      removeTicketTag,
      bulkUpdateTickets,
      addTicketMessage,
      customers,
      selectedCustomerId,
      setSelectedCustomerId,
      addCustomer,
      teamMembers,
      inviteTeamMember,
      updateTeamMemberRole,
      toggleTeamMemberActive,
      categories,
      saveCategory,
      toggleCategoryActive,
      deleteCategory,
      slaPolicies,
      automations,
      toggleAutomation,
      addAutomationRule,
      companySettings,
      updateCompanySettings,
      toggleOrganizationStatus,
      updateOrganizationPlan,
      notifications,
      unreadNotificationsCount,
      markNotificationRead,
      markAllNotificationsRead,
      toasts,
      addToast,
      dismissToast,
      apiDocsModalOpen,
      setApiDocsModalOpen,
    }),
    [
      currentView,
      navigateTo,
      currentUser,
      switchRolePersona,
      loginWithPassword,
      registerAccount,
      loginWithGoogle,
      logout,
      organizations,
      currentOrganization,
      switchOrganization,
      sidebarStyle,
      toggleSidebarStyle,
      sidebarCollapsed,
      simulationState,
      tickets,
      selectedTicketId,
      selectedTicket,
      createTicketModalOpen,
      createTicket,
      updateTicketStatus,
      updateTicketPriority,
      assignTicketAgent,
      updateTicketCategory,
      addTicketTag,
      removeTicketTag,
      bulkUpdateTickets,
      addTicketMessage,
      customers,
      selectedCustomerId,
      addCustomer,
      teamMembers,
      inviteTeamMember,
      updateTeamMemberRole,
      toggleTeamMemberActive,
      categories,
      saveCategory,
      toggleCategoryActive,
      deleteCategory,
      slaPolicies,
      automations,
      toggleAutomation,
      addAutomationRule,
      companySettings,
      updateCompanySettings,
      toggleOrganizationStatus,
      updateOrganizationPlan,
      notifications,
      unreadNotificationsCount,
      markNotificationRead,
      markAllNotificationsRead,
      toasts,
      addToast,
      dismissToast,
      apiDocsModalOpen,
    ]
  );

  return <HelpDeskContext.Provider value={value}>{children}</HelpDeskContext.Provider>;
}

export function useHelpDesk() {
  const ctx = useContext(HelpDeskContext);
  if (!ctx) {
    throw new Error('useHelpDesk must be used within a HelpDeskProvider');
  }
  return ctx;
}
