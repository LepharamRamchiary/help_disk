import {
  USER_ROLES,
  Ticket,
  TicketPriority,
  TicketStatus,
  User,
  UserRole,
  Customer,
  Category,
  SLAPolicy,
  AutomationRule,
  Organization,
  NotificationItem,
  CompanySettings,
} from '@/types/helpdesk';

export const SPRING_BOOT_API_CONFIG = {
  baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1',
  useMockAdapter: process.env.NEXT_PUBLIC_USE_MOCK_API !== 'false',
};

export interface AuthenticatedUser {
  id: number | string;
  name: string | null;
  email: string;
  role: UserRole;
  createdAt?: string;
}

export interface AuthSession {
  token: string;
  tokenType: string;
  expiresIn: number;
  user: AuthenticatedUser;
}

export class AuthApiError extends Error {
  constructor(
    message: string,
    public readonly status: number
  ) {
    super(message);
    this.name = 'AuthApiError';
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isUserRole(value: unknown): value is UserRole {
  return typeof value === 'string' && USER_ROLES.some((role) => role === value);
}

function parseAuthenticatedUser(value: unknown): AuthenticatedUser {
  if (
    !isRecord(value) ||
    (typeof value.id !== 'number' && typeof value.id !== 'string') ||
    typeof value.email !== 'string' ||
    (value.name !== null && typeof value.name !== 'string') ||
    !isUserRole(value.role)
  ) {
    throw new AuthApiError('The auth service returned an invalid user profile.', 502);
  }

  return {
    id: value.id,
    name: value.name,
    email: value.email,
    role: value.role,
    createdAt: typeof value.createdAt === 'string' ? value.createdAt : undefined,
  };
}

async function authRequest(path: string, options: RequestInit = {}): Promise<unknown> {
  let response: Response;
  try {
    response = await fetch(
      `${SPRING_BOOT_API_CONFIG.baseUrl.replace(/\/$/, '')}/auth${path}`,
      {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(options.headers || {}),
        },
      }
    );
  } catch {
    throw new AuthApiError(
      'Unable to reach the auth service. Check the API URL and make sure the services are running.',
      0
    );
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new AuthApiError('The auth service returned an invalid response.', response.status);
  }

  if (!isRecord(body)) {
    throw new AuthApiError('The auth service returned an invalid response.', response.status);
  }
  if (!response.ok || body.success !== true) {
    throw new AuthApiError(
      typeof body.message === 'string' ? body.message : 'Authentication request failed.',
      response.status
    );
  }

  return body.data;
}

function parseAuthSession(value: unknown): AuthSession {
  if (
    !isRecord(value) ||
    typeof value.token !== 'string' ||
    typeof value.tokenType !== 'string' ||
    typeof value.expiresIn !== 'number'
  ) {
    throw new AuthApiError('The auth service returned an invalid session.', 502);
  }

  return {
    token: value.token,
    tokenType: value.tokenType,
    expiresIn: value.expiresIn,
    user: parseAuthenticatedUser(value.user),
  };
}

export const AuthApiService = {
  login: async (email: string, password: string): Promise<AuthSession> =>
    parseAuthSession(
      await authRequest('/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      })
    ),
  register: async (name: string, email: string, password: string): Promise<AuthSession> =>
    parseAuthSession(
      await authRequest('/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password }),
      })
    ),
  google: async (credential: string): Promise<AuthSession> =>
    parseAuthSession(
      await authRequest('/google', {
        method: 'POST',
        body: JSON.stringify({ credential }),
      })
    ),
  me: async (token: string): Promise<AuthenticatedUser> =>
    parseAuthenticatedUser(
      await authRequest('/me', {
        headers: { Authorization: `Bearer ${token}` },
      })
    ),
};

export interface ApiEndpointSpec {
  module: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  springController: string;
  description: string;
}

export const SPRING_BOOT_ENDPOINTS: ApiEndpointSpec[] = [
  {
    module: 'Authentication',
    method: 'POST',
    path: '/api/v1/auth/login',
    springController: 'AuthController#authenticateUser',
    description: 'Authenticates credentials and returns JWT Bearer token + organization claims.',
  },
  {
    module: 'Authentication',
    method: 'POST',
    path: '/api/v1/auth/register',
    springController: 'AuthController#registerTenantOrUser',
    description: 'Provisions new tenant workspace or joins existing organization via domain token.',
  },
  {
    module: 'Authentication',
    method: 'POST',
    path: '/api/v1/auth/forgot-password',
    springController: 'AuthController#requestPasswordReset',
    description: 'Dispatches time-bound SHA-256 reset token without leaking email enumeration.',
  },
  {
    module: 'Tickets',
    method: 'GET',
    path: '/api/v1/tickets?page=0&size=25&status=&priority=',
    springController: 'TicketController#findAllTickets',
    description: 'Paginated multi-tenant ticket query with JPA Specification filtering & sorting.',
  },
  {
    module: 'Tickets',
    method: 'POST',
    path: '/api/v1/tickets',
    springController: 'TicketController#createTicket',
    description: 'Creates support ticket, computes initial SLA deadlines, and evaluates automation rules.',
  },
  {
    module: 'Ticket Messages',
    method: 'POST',
    path: '/api/v1/tickets/{ticketId}/messages',
    springController: 'TicketMessageController#appendMessage',
    description: 'Appends public reply or staff-only internal note; enforces RBAC visibility filter.',
  },
  {
    module: 'Customers',
    method: 'GET',
    path: '/api/v1/customers',
    springController: 'CustomerController#listCustomers',
    description: 'Returns customer directory with aggregated ticket counts and CSAT scores.',
  },
  {
    module: 'Users / Team',
    method: 'PATCH',
    path: '/api/v1/users/{userId}/role',
    springController: 'TeamMemberController#updateMemberRole',
    description: 'Updates support staff RBAC role or active account status.',
  },
  {
    module: 'Dashboard & SLA',
    method: 'GET',
    path: '/api/v1/dashboard/summary',
    springController: 'DashboardAnalyticsController#getExecutiveSummary',
    description: 'Computes real-time ticket queues, SLA compliance rates, and agent workload metrics.',
  },
  {
    module: 'Reports',
    method: 'GET',
    path: '/api/v1/reports/analytics?range=30d',
    springController: 'ReportingController#getPerformanceMetrics',
    description: 'Aggregates resolution time distributions, CSAT benchmarks, and SLA breach history.',
  },
  {
    module: 'Settings & Categories',
    method: 'PUT',
    path: '/api/v1/settings/organization',
    springController: 'OrganizationSettingsController#updateConfig',
    description: 'Updates business hours, holiday calendars, SLA targets, and routing categories.',
  },
  {
    module: 'Platform Admin',
    method: 'PATCH',
    path: '/api/v1/platform/organizations/{orgId}/status',
    springController: 'PlatformAdminController#setTenantStatus',
    description: 'Platform-level tenant activation, suspension, and subscription tier management.',
  },
];

async function requestWithFallback<T>(
  path: string,
  options: RequestInit,
  mockFallback: () => T | Promise<T>
): Promise<{ data: T; source: 'MOCK_ADAPTER' | 'SPRING_BOOT_API' }> {
  if (SPRING_BOOT_API_CONFIG.useMockAdapter) {
    const data = await mockFallback();
    return { data, source: 'MOCK_ADAPTER' };
  }

  try {
    const response = await fetch(`${SPRING_BOOT_API_CONFIG.baseUrl}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    const data = (await response.json()) as T;
    return { data, source: 'SPRING_BOOT_API' };
  } catch {
    const data = await mockFallback();
    return { data, source: 'MOCK_ADAPTER' };
  }
}

export const HelpDeskApiService = {
  auth: {
    login: async (email: string, password: string) =>
      requestWithFallback('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }, () => ({
        success: true,
        message: 'Login successful',
        data: {
          token: 'mock-token',
          tokenType: 'Bearer',
          expiresIn: 3600,
          user: { email },
        },
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.helpdesk-pro-demo',
        authenticatedAt: new Date().toISOString(),
      })),
    requestPasswordReset: async (email: string) =>
      requestWithFallback(
        '/auth/forgot-password',
        { method: 'POST', body: JSON.stringify({ email }) },
        () => ({ accepted: true, timestamp: new Date().toISOString() })
      ),
  },
  tickets: {
    exportToCsv: (tickets: Ticket[], filename = 'helpdesk-pro-tickets-export.csv') => {
      const headers = [
        'Ticket ID',
        'Subject',
        'Customer Name',
        'Customer Organization',
        'Priority',
        'Status',
        'Category',
        'Assigned Agent',
        'SLA Status',
        'Created At',
        'Updated At',
      ];
      const rows = tickets.map((t) => [
        t.id,
        `"${t.subject.replace(/"/g, '""')}"`,
        `"${t.customerName}"`,
        `"${t.customerOrganization}"`,
        t.priority,
        t.status,
        `"${t.categoryName}"`,
        `"${t.assignedAgentName || 'Unassigned'}"`,
        t.slaStatus,
        t.createdAt,
        t.updatedAt,
      ]);
      const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    },
  },
};

export type {
  Ticket,
  TicketPriority,
  TicketStatus,
  User,
  UserRole,
  Customer,
  Category,
  SLAPolicy,
  AutomationRule,
  Organization,
  NotificationItem,
  CompanySettings,
};
