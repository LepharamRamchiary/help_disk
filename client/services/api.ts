import {
  Attachment,
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
  useMockAdapter: process.env.NEXT_PUBLIC_USE_MOCK_API === 'true',
};

export interface AuthenticatedUser {
  id: number | string;
  name: string | null;
  email: string;
  role: UserRole;
  createdAt?: string;
}

export interface AuthSession {
  user: AuthenticatedUser;
}

export interface SupportTicketRecord {
  ticketNumber: string;
  subject: string;
  description: string;
  category: string;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  requester: string;
  requesterName: string;
  requesterEmail: string;
  status: 'Open' | 'In Progress' | 'Pending' | 'Resolved' | 'Closed';
  createdAt: string;
  updatedAt: string;
  attachments: Attachment[];
  messages: SupportTicketMessageRecord[];
}

export interface SupportTicketMessageRecord {
  id: string;
  authorId: string;
  authorName: string;
  authorEmail: string;
  authorRole: UserRole;
  body: string;
  isInternalNote: boolean;
  createdAt: string;
  attachments: Attachment[];
}

export interface TicketSummary {
  totalTickets: number;
  todayTickets: number;
  byStatus: {
    Open: number;
    'In Progress': number;
    Pending: number;
    Resolved: number;
    Closed: number;
  };
  byPriority: {
    Low: number;
    Medium: number;
    High: number;
    Urgent: number;
  };
}

const SUPPORT_PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'] as const;
const SUPPORT_STATUSES = ['Open', 'In Progress', 'Pending', 'Resolved', 'Closed'] as const;

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
        credentials: 'include',
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
  if (!isRecord(value)) {
    throw new AuthApiError('The auth service returned an invalid session.', 502);
  }

  return {
    user: parseAuthenticatedUser(value.user),
  };
}

function parseSupportAttachment(
  value: unknown,
  ticketNumber: string
): Attachment {
  if (!isRecord(value)) {
    throw new Error('The support service returned an invalid attachment.');
  }

  const id =
    typeof value.id === 'string'
      ? value.id
      : typeof value._id === 'string'
        ? value._id
        : undefined;
  const rawUrl = typeof value.url === 'string' ? value.url : undefined;
  const storageKey =
    typeof value.storageKey === 'string' ? value.storageKey : undefined;
  const dataUrl =
    typeof value.dataUrl === 'string'
      ? value.dataUrl
      : rawUrl?.startsWith('data:')
        ? rawUrl
        : undefined;
  const url = rawUrl?.startsWith('data:')
    ? undefined
    : rawUrl ||
      (storageKey && id
        ? `${SPRING_BOOT_API_CONFIG.baseUrl.replace(/\/$/, '')}/support/tickets/${encodeURIComponent(ticketNumber)}/attachments/${encodeURIComponent(id)}`
        : undefined);
  const fileName =
    typeof value.fileName === 'string'
      ? value.fileName
      : url?.split('/').pop()?.split('?')[0] || 'Attachment';
  const extension = fileName.slice(fileName.lastIndexOf('.')).toLowerCase();
  const legacyMimeTypes: Record<string, string> = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
  };
  const mimeType =
    typeof value.mimeType === 'string'
      ? value.mimeType
      : legacyMimeTypes[extension] ||
        (dataUrl?.match(/^data:([^;]+);base64,/)?.[1] ?? undefined);
  const fileType =
    value.fileType === 'image' ||
    value.fileType === 'pdf' ||
    value.fileType === 'log' ||
    value.fileType === 'archive'
      ? value.fileType
      : mimeType?.startsWith('image/')
        ? 'image'
        : mimeType === 'application/pdf'
          ? 'pdf'
          : 'log';

  if (
    (!id && !url && !dataUrl) ||
    (!dataUrl && !url) ||
    (url !== undefined && !/^https?:\/\//i.test(url) && !url.startsWith('/')) ||
    (dataUrl !== undefined &&
      !/^data:(image\/(png|jpeg|gif|webp)|application\/pdf|text\/plain|application\/(json|xml)|text\/xml);base64,/.test(
        dataUrl
      ))
  ) {
    throw new Error('The support service returned an invalid attachment.');
  }

  return {
    id: id || `legacy-${url || fileName}`,
    fileName,
    fileSize: typeof value.fileSize === 'string' ? value.fileSize : 'File',
    fileType,
    mimeType,
    dataUrl,
    url,
    uploadedAt: typeof value.uploadedAt === 'string' ? value.uploadedAt : '',
    uploadedBy: typeof value.uploadedBy === 'string' ? value.uploadedBy : 'Unknown',
  };
}

function parseSupportAttachments(
  value: unknown,
  ticketNumber: string
): Attachment[] {
  if (value === undefined) {
    return [];
  }
  if (!Array.isArray(value)) {
    throw new Error('The support service returned an invalid attachment list.');
  }
  return value.map((attachment) =>
    parseSupportAttachment(attachment, ticketNumber)
  );
}

function parseSupportTicket(value: unknown): SupportTicketRecord {
  const priority =
    isRecord(value) &&
    typeof value.priority === 'string' &&
    SUPPORT_PRIORITIES.find((item) => item === value.priority);
  const status =
    isRecord(value) &&
    typeof value.status === 'string' &&
    SUPPORT_STATUSES.find((item) => item === value.status);
  if (
    !isRecord(value) ||
    typeof value.ticketNumber !== 'string' ||
    typeof value.subject !== 'string' ||
    typeof value.description !== 'string' ||
    typeof value.category !== 'string' ||
    !priority ||
    typeof value.requester !== 'string' ||
    typeof value.requesterName !== 'string' ||
    typeof value.requesterEmail !== 'string' ||
    !status ||
    typeof value.createdAt !== 'string' ||
    typeof value.updatedAt !== 'string'
  ) {
    throw new Error('The support service returned an invalid ticket.');
  }

  if (value.messages !== undefined && !Array.isArray(value.messages)) {
    throw new Error('The support service returned an invalid ticket message list.');
  }
  const messages = Array.isArray(value.messages) ? value.messages : [];

  return {
    ticketNumber: value.ticketNumber,
    subject: value.subject,
    description: value.description,
    category: value.category,
    priority,
    requester: value.requester,
    requesterName: value.requesterName,
    requesterEmail: value.requesterEmail,
    status,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
    attachments: parseSupportAttachments(value.attachments, value.ticketNumber),
    messages: messages.map((message) => {
      if (!isRecord(message)) {
        throw new Error('The support service returned an invalid ticket message.');
      }

      const id =
        typeof message.id === 'string'
          ? message.id
          : typeof message._id === 'string'
            ? message._id
            : undefined;
      if (
        !id ||
        typeof message.authorId !== 'string' ||
        typeof message.authorName !== 'string' ||
        typeof message.authorEmail !== 'string' ||
        !isUserRole(message.authorRole) ||
        typeof message.body !== 'string' ||
        typeof message.isInternalNote !== 'boolean' ||
        typeof message.createdAt !== 'string'
      ) {
        throw new Error('The support service returned an invalid ticket message.');
      }

      return {
        id,
        authorId: message.authorId,
        authorName: message.authorName,
        authorEmail: message.authorEmail,
        authorRole: message.authorRole,
        body: message.body,
        isInternalNote: message.isInternalNote,
        createdAt: message.createdAt,
        attachments: parseSupportAttachments(
          message.attachments,
          value.ticketNumber
        ),
      };
    }),
  };
}

function createTicketFormData(
  fields: Record<string, string>,
  attachments: Attachment[]
): FormData {
  const formData = new FormData();
  for (const [name, value] of Object.entries(fields)) {
    formData.append(name, value);
  }

  for (const attachment of attachments) {
    const match =
      typeof attachment.dataUrl === 'string'
        ? /^data:([a-z0-9.+-]+\/[a-z0-9.+-]+);base64,([A-Za-z0-9+/]+={0,2})$/i.exec(
            attachment.dataUrl
          )
        : null;
    if (!match || (attachment.mimeType && attachment.mimeType !== match[1])) {
      throw new Error(`Could not prepare "${attachment.fileName}" for upload.`);
    }

    const binary = atob(match[2]);
    const bytes = Uint8Array.from(binary, (character) =>
      character.charCodeAt(0)
    );
    const contents = new Uint8Array(bytes).buffer;
    formData.append(
      'attachments',
      new Blob([contents], { type: match[1] }),
      attachment.fileName
    );
  }

  return formData;
}

async function supportRequest(path: string, options: RequestInit = {}): Promise<unknown> {
  let response: Response;
  try {
    response = await fetch(
      `${SPRING_BOOT_API_CONFIG.baseUrl.replace(/\/$/, '')}/support/tickets${path}`,
      {
        ...options,
        credentials: 'include',
        headers: {
          ...(typeof FormData !== 'undefined' && options.body instanceof FormData
            ? {}
            : { 'Content-Type': 'application/json' }),
          ...(options.headers || {}),
        },
      }
    );
  } catch {
    throw new Error('Unable to reach the support service. Please try again.');
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new Error('The support service returned an invalid response.');
  }

  if (!isRecord(body) || !response.ok || body.success !== true) {
    throw new Error(
      isRecord(body) && typeof body.message === 'string'
        ? body.message
        : 'The support service request failed.'
    );
  }

  return body.data;
}

export const AuthApiService = {
  login: async (email: string, password: string, rememberMe: boolean): Promise<AuthSession> =>
    parseAuthSession(
      await authRequest('/login', {
        method: 'POST',
        body: JSON.stringify({ email, password, rememberMe }),
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
  requestPasswordReset: async (email: string): Promise<void> => {
    await authRequest('/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },
  resetPassword: async (token: string, password: string): Promise<void> => {
    await authRequest('/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
    });
  },
  me: async (): Promise<AuthenticatedUser> =>
    parseAuthenticatedUser(await authRequest('/me')),
  logout: async (): Promise<void> => {
    await authRequest('/logout', { method: 'POST' });
  },
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
    description: 'Authenticates credentials and sets an HttpOnly session cookie.',
  },
  {
    module: 'Authentication',
    method: 'POST',
    path: '/api/v1/auth/register',
    springController: 'AuthController#registerTenantOrUser',
    description: 'Creates an account and sets an HttpOnly session cookie.',
  },
  {
    module: 'Authentication',
    method: 'POST',
    path: '/api/v1/auth/forgot-password',
    springController: 'AuthController#requestPasswordReset',
    description: 'Dispatches time-bound SHA-256 reset token without leaking email enumeration.',
  },
  {
    module: 'Authentication',
    method: 'POST',
    path: '/api/v1/auth/reset-password',
    springController: 'AuthController#resetPassword',
    description: 'Validates a time-bound reset token and updates the account password.',
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
  dashboard: {
    summary: async (): Promise<TicketSummary> => {
      const data = await supportRequest('/summary');
      if (!isRecord(data) || !isRecord(data.byStatus) || !isRecord(data.byPriority)) {
        throw new Error('The support service returned an invalid ticket summary.');
      }

      return data as unknown as TicketSummary;
    },
  },
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
  },
  tickets: {
    my: async (): Promise<SupportTicketRecord[]> => {
      const data = await supportRequest('/my');
      if (!Array.isArray(data)) {
        throw new Error('The support service returned an invalid ticket list.');
      }

      return data.map(parseSupportTicket);
    },
    today: async (): Promise<SupportTicketRecord[]> => {
      const data = await supportRequest('/today');
      if (!Array.isArray(data)) {
        throw new Error('The support service returned an invalid today ticket list.');
      }

      return data.map(parseSupportTicket);
    },
    all: async (): Promise<SupportTicketRecord[]> => {
      const data = await supportRequest('');
      if (!Array.isArray(data)) {
        throw new Error('The support service returned an invalid ticket list.');
      }

      return data.map(parseSupportTicket);
    },
    reply: async (
      ticketNumber: string,
      body: string,
      isInternalNote: boolean,
      attachments: Attachment[] = []
    ): Promise<SupportTicketRecord> => {
      const data = await supportRequest(`/${encodeURIComponent(ticketNumber)}/messages`, {
        method: 'POST',
        body: createTicketFormData(
          { body, isInternalNote: String(isInternalNote) },
          attachments
        ),
      });

      return parseSupportTicket(data);
    },
    updateStatus: async (
      ticketNumber: string,
      status: SupportTicketRecord['status']
    ): Promise<SupportTicketRecord> => {
      const data = await supportRequest(`/${encodeURIComponent(ticketNumber)}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });

      return parseSupportTicket(data);
    },
    create: async (
      input: {
        subject: string;
        description: string;
        category: string;
        priority: TicketPriority;
        attachments: Attachment[];
      }
    ): Promise<SupportTicketRecord> => {
      const formData = createTicketFormData(
        {
          subject: input.subject,
          description: input.description,
          category: input.category,
          priority: input.priority,
        },
        input.attachments
      );
      let response: Response;
      try {
        response = await fetch(
          `${SPRING_BOOT_API_CONFIG.baseUrl.replace(/\/$/, '')}/support/tickets`,
          {
            method: 'POST',
            credentials: 'include',
            body: formData,
          }
        );
      } catch {
        throw new Error('Unable to reach the support service. Please try again.');
      }

      let body: unknown;
      try {
        body = await response.json();
      } catch {
        throw new Error('The support service returned an invalid response.');
      }

      if (!isRecord(body)) {
        throw new Error('The support service returned an invalid response.');
      }
      if (!response.ok || body.success !== true || !isRecord(body.data)) {
        throw new Error(
          typeof body.message === 'string'
            ? body.message
            : 'Ticket creation failed.'
        );
      }

      return parseSupportTicket(body.data);
    },
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
