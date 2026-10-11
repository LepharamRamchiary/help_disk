export type UserRole =
  | 'PLATFORM_ADMIN'
  | 'COMPANY_ADMIN'
  | 'SUPPORT_MANAGER'
  | 'SUPPORT_AGENT'
  | 'CUSTOMER';

export type TicketStatus =
  | 'OPEN'
  | 'IN_PROGRESS'
  | 'WAITING_FOR_CUSTOMER'
  | 'RESOLVED'
  | 'CLOSED';

export type TicketPriority = 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW';

export type AgentAvailability = 'ONLINE' | 'BUSY' | 'OFFLINE';

export type PageView =
  | 'landing'
  | 'login'
  | 'register'
  | 'forgot-password'
  | 'overview'
  | 'tickets'
  | 'my-tickets'
  | 'unassigned'
  | 'priority-queue'
  | 'create-ticket'
  | 'ticket-detail'
  | 'customers'
  | 'team'
  | 'reports'
  | 'sla'
  | 'categories'
  | 'automations'
  | 'settings'
  | 'notifications'
  | 'customer-portal'
  | 'platform-admin';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  domain: string;
  plan: 'Enterprise' | 'Growth' | 'Starter';
  status: 'Active' | 'Trial' | 'Suspended';
  createdAt: string;
  agentCount: number;
  seatLimit: number;
  monthlyTickets: number;
  slaCompliance: number;
  mrr: number;
  primaryContact: string;
}

export interface User {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  title: string;
  organizationId: string;
  organizationName: string;
  avatarInitials: string;
  availability: AgentAvailability;
  active: boolean;
  assignedTicketsCount: number;
  openTicketsCount: number;
  overdueTicketsCount: number;
  avgResponseTimeMinutes: number;
  csatScore: number;
  joinedAt: string;
}

export interface Customer {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  organization: string;
  tier: 'Enterprise' | 'Mid-Market' | 'Standard';
  location: string;
  timezone: string;
  avatarInitials: string;
  totalTickets: number;
  openTickets: number;
  csatRating: number;
  lastInteraction: string;
  createdAt: string;
  notes: string;
}

export interface Attachment {
  id: string;
  fileName: string;
  fileSize: string;
  fileType: 'image' | 'pdf' | 'log' | 'archive';
  uploadedAt: string;
  uploadedBy: string;
}

export interface TicketMessage {
  id: string;
  ticketId: string;
  authorId: string;
  authorName: string;
  authorRole: UserRole;
  authorInitials: string;
  body: string;
  isInternalNote: boolean;
  createdAt: string;
  attachments: Attachment[];
}

export interface TicketActivity {
  id: string;
  ticketId: string;
  actorName: string;
  action: string;
  timestamp: string;
}

export interface Ticket {
  id: string; // e.g., HD-1001
  organizationId: string;
  subject: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  categoryId: string;
  categoryName: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerOrganization: string;
  customerInitials: string;
  assignedAgentId: string | null;
  assignedAgentName: string | null;
  assignedAgentInitials: string | null;
  createdAt: string;
  updatedAt: string;
  dueDate?: string;
  firstResponseDeadline: string;
  resolutionDeadline: string;
  firstResponseRemainingMinutes: number; // negative if breached
  resolutionRemainingMinutes: number; // negative if breached
  slaStatus: 'WITHIN_SLA' | 'AT_RISK' | 'BREACHED' | 'COMPLETED';
  tags: string[];
  messages: TicketMessage[];
  activities: TicketActivity[];
}

export interface Category {
  id: string;
  name: string;
  description: string;
  defaultPriority: TicketPriority;
  routingTeam: string;
  ticketCount: number;
  active: boolean;
}

export interface SLAPolicy {
  id: string;
  name: string;
  priority: TicketPriority;
  firstResponseTarget: string;
  firstResponseMinutes: number;
  resolutionTarget: string;
  resolutionMinutes: number;
  businessHoursOnly: boolean;
  escalationRule: string;
  complianceRate: number;
  activeBreaches: number;
}

export interface AutomationRule {
  id: string;
  name: string;
  description: string;
  trigger: string;
  condition: string;
  action: string;
  active: boolean;
  executionsCount: number;
  lastTriggered: string;
}

export interface NotificationItem {
  id: string;
  type: 'ASSIGNMENT' | 'CUSTOMER_REPLY' | 'STATUS_CHANGE' | 'SLA_ALERT' | 'MENTION';
  title: string;
  description: string;
  ticketId: string;
  createdAt: string;
  read: boolean;
}

export interface CompanySettings {
  companyName: string;
  supportEmail: string;
  workspaceDomain: string;
  timezone: string;
  businessHoursStart: string;
  businessHoursEnd: string;
  workingDays: string[];
  holidays: { date: string; name: string }[];
  defaultPriority: TicketPriority;
  autoAssignEnabled: boolean;
  csatSurveyEnabled: boolean;
  emailNotifications: boolean;
  slackWebhookEnabled: boolean;
  slaBreachAlerts: boolean;
}

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  variant: 'success' | 'error' | 'info' | 'warning';
}
