"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useHelpDesk, SimulationState } from "@/context/HelpDeskContext";
import { PageView, UserRole } from "@/types/helpdesk";
import { Avatar, Modal } from "@/components/ui/design-system";
import { SPRING_BOOT_ENDPOINTS, SPRING_BOOT_API_CONFIG } from "@/services/api";
import {
  Headset,
  LayoutDashboard,
  Ticket as TicketIcon,
  UserCheck,
  Inbox,
  Flame,
  Users,
  UserCog,
  BarChart3,
  ShieldAlert,
  FolderKanban,
  Workflow,
  Settings,
  Bell,
  Search,
  ChevronLeft,
  ChevronDown,
  Plus,
  Building2,
  LogOut,
  HelpCircle,
  PanelLeftClose,
  PanelLeftOpen,
  Menu,
  X,
  Globe,
  Code2,
  KeyRound,
  UserPlus,
} from "lucide-react";

interface NavItem {
  id: PageView;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badgeCount?: number;
  roles: UserRole[];
}

interface NavSection {
  title: string;
  items: NavItem[];
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const {
    currentView,
    navigateTo,
    currentUser,
    switchRolePersona,
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
    customers,
    unreadNotificationsCount,
    notifications,
    markNotificationRead,
    markAllNotificationsRead,
    setCreateTicketModalOpen,
    apiDocsModalOpen,
    setApiDocsModalOpen,
  } = useHelpDesk();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [orgMenuOpen, setOrgMenuOpen] = useState(false);
  const [notifPopoverOpen, setNotifPopoverOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Global keyboard shortcut Cmd+K / Ctrl+K for search
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchModalOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const unassignedCount = useMemo(
    () =>
      tickets.filter((t) => !t.assignedAgentId && t.status !== "CLOSED").length,
    [tickets],
  );
  const urgentCount = useMemo(
    () =>
      tickets.filter(
        (t) =>
          (t.priority === "URGENT" ||
            t.slaStatus === "AT_RISK" ||
            t.slaStatus === "BREACHED") &&
          t.status !== "RESOLVED" &&
          t.status !== "CLOSED",
      ).length,
    [tickets],
  );
  const myTicketsCount = useMemo(
    () =>
      tickets.filter(
        (t) =>
          t.assignedAgentId === currentUser.id &&
          t.status !== "RESOLVED" &&
          t.status !== "CLOSED",
      ).length,
    [tickets, currentUser.id],
  );

  const navSections: NavSection[] = useMemo(() => {
    if (currentUser.role === "CUSTOMER") {
      return [
        {
          title: "Customer Portal",
          items: [
            {
              id: "customer-portal",
              label: "My Support Portal",
              icon: Globe,
              roles: ["CUSTOMER"],
            },
            {
              id: "create-ticket",
              label: "Submit a Request",
              icon: Plus,
              roles: ["CUSTOMER"],
            },
            {
              id: "notifications",
              label: "Notifications",
              icon: Bell,
              badgeCount: unreadNotificationsCount || undefined,
              roles: ["CUSTOMER"],
            },
          ],
        },
      ];
    }

    const sections: NavSection[] = [
      {
        title: "Workspace",
        items: [
          {
            id: "overview",
            label: "Overview",
            icon: LayoutDashboard,
            roles: [
              "PLATFORM_ADMIN",
              "COMPANY_ADMIN",
              "SUPPORT_MANAGER",
              "SUPPORT_AGENT",
            ],
          },
          {
            id: "tickets",
            label: "All Tickets",
            icon: TicketIcon,
            badgeCount: tickets.length,
            roles: [
              "PLATFORM_ADMIN",
              "COMPANY_ADMIN",
              "SUPPORT_MANAGER",
              "SUPPORT_AGENT",
            ],
          },
          {
            id: "my-tickets",
            label: "My Tickets",
            icon: UserCheck,
            badgeCount: myTicketsCount || undefined,
            roles: [
              "PLATFORM_ADMIN",
              "COMPANY_ADMIN",
              "SUPPORT_MANAGER",
              "SUPPORT_AGENT",
            ],
          },
          {
            id: "unassigned",
            label: "Unassigned",
            icon: Inbox,
            badgeCount: unassignedCount || undefined,
            roles: [
              "PLATFORM_ADMIN",
              "COMPANY_ADMIN",
              "SUPPORT_MANAGER",
              "SUPPORT_AGENT",
            ],
          },
          {
            id: "priority-queue",
            label: "Priority Queue",
            icon: Flame,
            badgeCount: urgentCount || undefined,
            roles: [
              "PLATFORM_ADMIN",
              "COMPANY_ADMIN",
              "SUPPORT_MANAGER",
              "SUPPORT_AGENT",
            ],
          },
        ],
      },
      {
        title: "Management",
        items: [
          {
            id: "customers",
            label: "Customers",
            icon: Users,
            roles: [
              "PLATFORM_ADMIN",
              "COMPANY_ADMIN",
              "SUPPORT_MANAGER",
              "SUPPORT_AGENT",
            ],
          },
          {
            id: "team",
            label: "Team Members",
            icon: UserCog,
            roles: ["PLATFORM_ADMIN", "COMPANY_ADMIN", "SUPPORT_MANAGER"],
          },
          {
            id: "reports",
            label: "Reports & Analytics",
            icon: BarChart3,
            roles: ["PLATFORM_ADMIN", "COMPANY_ADMIN", "SUPPORT_MANAGER"],
          },
          {
            id: "sla",
            label: "SLA Monitoring",
            icon: ShieldAlert,
            roles: [
              "PLATFORM_ADMIN",
              "COMPANY_ADMIN",
              "SUPPORT_MANAGER",
              "SUPPORT_AGENT",
            ],
          },
        ],
      },
      {
        title: "Configuration",
        items: [
          {
            id: "categories",
            label: "Categories",
            icon: FolderKanban,
            roles: ["PLATFORM_ADMIN", "COMPANY_ADMIN", "SUPPORT_MANAGER"],
          },
          {
            id: "automations",
            label: "Automations",
            icon: Workflow,
            roles: ["PLATFORM_ADMIN", "COMPANY_ADMIN", "SUPPORT_MANAGER"],
          },
          {
            id: "settings",
            label: "Company Settings",
            icon: Settings,
            roles: ["PLATFORM_ADMIN", "COMPANY_ADMIN"],
          },
        ],
      },
      {
        title: "Portals & SaaS Ops",
        items: [
          {
            id: "customer-portal",
            label: "Customer Portal",
            icon: Globe,
            roles: [
              "PLATFORM_ADMIN",
              "COMPANY_ADMIN",
              "SUPPORT_MANAGER",
              "SUPPORT_AGENT",
            ],
          },
          {
            id: "platform-admin",
            label: "Platform Admin",
            icon: Building2,
            roles: ["PLATFORM_ADMIN", "COMPANY_ADMIN"],
          },
        ],
      },
    ];

    return sections
      .map((sec) => ({
        ...sec,
        items: sec.items.filter((item) =>
          item.roles.includes(currentUser.role),
        ),
      }))
      .filter((sec) => sec.items.length > 0);
  }, [
    currentUser.role,
    tickets.length,
    myTicketsCount,
    unassignedCount,
    urgentCount,
    unreadNotificationsCount,
  ]);

  const viewTitleMap: Record<PageView, { section: string; label: string }> = {
    landing: { section: "Public", label: "Landing Page" },
    login: { section: "Auth", label: "Sign In" },
    register: { section: "Auth", label: "Create Organization" },
    "forgot-password": { section: "Auth", label: "Password Recovery" },
    overview: { section: "Workspace", label: "Overview" },
    tickets: { section: "Workspace", label: "All Tickets" },
    "my-tickets": { section: "Workspace", label: "My Tickets" },
    unassigned: { section: "Workspace", label: "Unassigned Queue" },
    "priority-queue": { section: "Workspace", label: "Priority Queue" },
    "create-ticket": { section: "Workspace", label: "New Support Ticket" },
    "ticket-detail": { section: "Tickets", label: "Ticket Conversation" },
    customers: { section: "Management", label: "Customers" },
    team: { section: "Management", label: "Team Members" },
    reports: { section: "Management", label: "Reports & Analytics" },
    sla: { section: "Management", label: "SLA Monitoring" },
    categories: { section: "Configuration", label: "Categories" },
    automations: { section: "Configuration", label: "Automations" },
    settings: { section: "Configuration", label: "Company Settings" },
    notifications: { section: "Workspace", label: "Notifications Center" },
    "customer-portal": { section: "Portal", label: "Customer Support Portal" },
    "platform-admin": { section: "Platform", label: "Platform Administration" },
  };

  const currentBreadcrumb = viewTitleMap[currentView] || {
    section: "Workspace",
    label: "Overview",
  };

  // Search results for global Cmd+K dialog
  const filteredSearchTickets = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return tickets.slice(0, 5);
    return tickets
      .filter(
        (t) =>
          t.id.toLowerCase().includes(q) ||
          t.subject.toLowerCase().includes(q) ||
          t.customerName.toLowerCase().includes(q) ||
          t.customerOrganization.toLowerCase().includes(q),
      )
      .slice(0, 6);
  }, [tickets, searchQuery]);

  const filteredSearchCustomers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return customers.slice(0, 3);
    return customers
      .filter(
        (c) =>
          c.fullName.toLowerCase().includes(q) ||
          c.organization.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q),
      )
      .slice(0, 4);
  }, [customers, searchQuery]);

  // Landing & Auth views render full screen without the internal sidebar
  if (
    currentView === "landing" ||
    currentView === "login" ||
    currentView === "register" ||
    currentView === "forgot-password"
  ) {
    return <div className="min-h-screen bg-[#F8FAFC]">{children}</div>;
  }

  const isDarkSidebar = sidebarStyle === "dark-emerald";

  const renderSidebarContent = (isMobile = false) => {
    const collapsed = !isMobile && sidebarCollapsed;

    // Labels never unmount, they only fade, so icons never move
    const fade = `transition-opacity duration-200 ${
      collapsed ? "opacity-0 pointer-events-none" : "opacity-100 delay-100"
    }`;

    return (
      <div
        className={`flex flex-col h-full w-full select-none overflow-hidden transition-colors duration-150 ${
          isDarkSidebar
            ? "bg-[#102A23] text-slate-100 border-r border-[#102A23]"
            : "bg-white text-[#111827] border-r border-[#E2E8F0]"
        }`}
      >
        {/* Brand Header — logo is always at the same x (18px → center = 36px) */}
        <div
          className={`flex items-center justify-between h-16 px-[18px] shrink-0 border-b ${
            isDarkSidebar ? "border-emerald-900/60" : "border-[#E2E8F0]"
          }`}
        >
          <button
            type="button"
            onClick={() =>
              navigateTo(
                currentUser.role === "CUSTOMER"
                  ? "customer-portal"
                  : "overview",
              )
            }
            className="flex items-center gap-3 text-left focus-visible:outline-2 focus-visible:outline-[#10B981] rounded-lg"
          >
            <div className="w-9 h-9 rounded-xl bg-[#047857] text-white flex items-center justify-center shadow-xs shrink-0">
              <Headset className="w-5 h-5" />
            </div>
            <div className={`overflow-hidden ${fade}`}>
              <div
                className={`text-sm font-bold tracking-tight whitespace-nowrap ${
                  isDarkSidebar ? "text-white" : "text-[#111827]"
                }`}
              >
                HelpDesk Pro
              </div>
              <div
                className={`text-[11px] whitespace-nowrap ${
                  isDarkSidebar ? "text-emerald-300/80" : "text-[#64748B]"
                }`}
              >
                Customer Support Cloud
              </div>
            </div>
          </button>

          {isMobile && (
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              aria-label="Close navigation menu"
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Organization Switcher — always rendered so vertical positions never shift */}
        {currentUser.role !== "CUSTOMER" && (
          <div className="px-3 pt-3 pb-1 relative shrink-0">
            <button
              type="button"
              onClick={() => !collapsed && setOrgMenuOpen((prev) => !prev)}
              title={collapsed ? currentOrganization.name : undefined}
              className={`w-full flex items-center justify-between ${
                collapsed ? "gap-0" : "gap-2"
              } px-[11px] py-2 rounded-xl border text-left overflow-hidden transition-colors ${
                isDarkSidebar
                  ? "bg-emerald-950/60 border-emerald-800/60 hover:bg-emerald-900/50 text-white"
                  : "bg-[#F8FAFC] border-[#E2E8F0] hover:bg-slate-100/70 text-[#111827]"
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-6 h-6 rounded-md bg-[#047857]/15 text-[#10B981] font-bold text-xs flex items-center justify-center shrink-0">
                  {currentOrganization.name.slice(0, 1)}
                </div>
                <div className={`min-w-0 ${fade}`}>
                  <div className="text-xs font-semibold truncate whitespace-nowrap">
                    {currentOrganization.name}
                  </div>
                  <div
                    className={`text-[11px] truncate whitespace-nowrap ${
                      isDarkSidebar ? "text-emerald-300/70" : "text-[#64748B]"
                    }`}
                  >
                    {currentOrganization.plan} · {currentOrganization.domain}
                  </div>
                </div>
              </div>
              {/* Chevron collapses its width so it never squeezes the "A" logo */}
              <ChevronDown
                className={`shrink-0 h-3.5 transition-all duration-200 ${
                  collapsed ? "w-0 opacity-0" : "w-3.5 opacity-60 delay-100"
                }`}
              />
            </button>

            {orgMenuOpen && !collapsed && (
              <div className="absolute left-3 right-3 top-16 z-30 bg-white border border-[#E2E8F0] rounded-xl shadow-lg py-1.5 text-[#111827]">
                <div className="px-3 py-1 text-[11px] font-medium text-[#64748B]">
                  Switch Tenant Organization
                </div>
                {organizations.map((org) => (
                  <button
                    key={org.id}
                    type="button"
                    onClick={() => {
                      switchOrganization(org.id);
                      setOrgMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-xs text-left hover:bg-[#F0FDF4] transition-colors ${
                      org.id === currentOrganization.id
                        ? "bg-[#ECFDF5] text-[#047857] font-semibold"
                        : "text-slate-700"
                    }`}
                  >
                    <span className="truncate">{org.name}</span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {org.plan}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Primary Navigation Links — scrollbar hidden when collapsed so icons stay centered */}
        <nav
          className={`flex-1 overflow-y-auto overflow-x-hidden px-3 py-3 space-y-5 ${
            collapsed
              ? "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              : ""
          }`}
          aria-label="Main Navigation"
        >
          {navSections.map((section, idx) => (
            <div key={section.title}>
              {/* Title row keeps its height: text fades out, divider fades in when collapsed */}
              <div className="relative h-6 px-4 pb-1.5 flex items-center overflow-hidden">
                <span
                  className={`text-[11px] font-semibold tracking-wider uppercase whitespace-nowrap ${fade} ${
                    isDarkSidebar ? "text-emerald-300/60" : "text-[#64748B]"
                  }`}
                >
                  {section.title}
                </span>

                {idx > 0 && (
                  <span
                    className={`absolute left-4 right-4 top-1/2 h-px transition-opacity duration-200 ${
                      collapsed ? "opacity-100 delay-100" : "opacity-0"
                    } ${isDarkSidebar ? "bg-emerald-800/60" : "bg-[#E2E8F0]"}`}
                  />
                )}
              </div>

              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    currentView === item.id ||
                    (item.id === "tickets" && currentView === "ticket-detail");

                  return (
                    <button
                      key={item.id}
                      type="button"
                      title={collapsed ? item.label : undefined}
                      onClick={() => {
                        navigateTo(item.id);
                        if (isMobile) setMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-4 py-2 rounded-lg overflow-hidden text-xs font-medium transition-colors duration-150 ${
                        isActive
                          ? isDarkSidebar
                            ? "bg-[#047857] text-white font-semibold shadow-xs"
                            : "bg-[#ECFDF5] text-[#047857] font-semibold"
                          : isDarkSidebar
                            ? "text-slate-300 hover:bg-emerald-900/50 hover:text-white"
                            : "text-slate-600 hover:bg-[#F0FDF4] hover:text-[#111827]"
                      }`}
                    >
                      <span className="flex items-center gap-2.5 min-w-0">
                        <Icon
                          className={`w-4 h-4 shrink-0 ${
                            isActive
                              ? isDarkSidebar
                                ? "text-white"
                                : "text-[#047857]"
                              : isDarkSidebar
                                ? "text-emerald-300/70"
                                : "text-slate-400"
                          }`}
                        />
                        <span className={`truncate whitespace-nowrap ${fade}`}>
                          {item.label}
                        </span>
                      </span>
                      {item.badgeCount !== undefined && (
                        <span
                          className={`shrink-0 font-mono tabular-nums text-[11px] px-1.5 py-0.5 rounded-md ${fade} ${
                            isActive
                              ? isDarkSidebar
                                ? "bg-emerald-900 text-emerald-100"
                                : "bg-[#047857]/10 text-[#047857] font-semibold"
                              : isDarkSidebar
                                ? "text-emerald-300/70"
                                : "text-[#64748B]"
                          }`}
                        >
                          {item.badgeCount}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom: profile + sign out — same layout in both states */}
        <div
          className={`p-3 border-t shrink-0 space-y-1 ${
            isDarkSidebar ? "border-emerald-900/60" : "border-[#E2E8F0]"
          }`}
        >
          <div className="flex items-center gap-2.5 px-2 py-1 overflow-hidden">
            <Avatar
              initials={currentUser.avatarInitials}
              size="sm"
              variant="emerald"
            />
            <div className={`min-w-0 ${fade}`}>
              <div
                className={`text-xs font-semibold truncate whitespace-nowrap ${
                  isDarkSidebar ? "text-white" : "text-[#111827]"
                }`}
              >
                {currentUser.fullName}
              </div>
              <div
                className={`text-[11px] truncate whitespace-nowrap ${
                  isDarkSidebar ? "text-emerald-300/70" : "text-[#64748B]"
                }`}
              >
                {currentUser.role.replace("_", " ")}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={logout}
            title="Sign out"
            aria-label="Sign out"
            className={`w-full flex items-center gap-2.5 px-4 py-2 rounded-lg overflow-hidden text-xs font-medium transition-colors ${
              isDarkSidebar
                ? "text-emerald-300/80 hover:text-white hover:bg-emerald-900/50"
                : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
            }`}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span className={`whitespace-nowrap ${fade}`}>Sign out</span>
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex bg-[#F8FAFC] text-[#111827]">
      {/* Desktop Left Sidebar */}
      <aside
        className={`hidden lg:block shrink-0 transition-[width] duration-300 ease-in-out ${
          sidebarCollapsed ? "w-[72px]" : "w-[260px]"
        }`}
      >
        <div
          className={`fixed top-0 left-0 bottom-0 z-30 transition-[width] duration-300 ease-in-out ${
            sidebarCollapsed ? "w-[72px]" : "w-[260px]"
          }`}
        >
          {renderSidebarContent(false)}

          <button
            type="button"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            aria-label={
              sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"
            }
            title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="absolute top-5 -right-3 z-40 w-6 h-6 rounded-full bg-white border border-[#E2E8F0] shadow-sm flex items-center justify-center text-slate-500 hover:text-[#047857] hover:border-[#10B981] transition-colors"
          >
            <ChevronLeft
              className={`w-3.5 h-3.5 transition-transform duration-300 ${
                sidebarCollapsed ? "rotate-180" : ""
              }`}
            />
          </button>
        </div>
      </aside>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/50"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative w-[270px] max-w-[85vw] h-full z-10">
            {renderSidebarContent(true)}
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navigation Bar — Clean White with subtle bottom border */}
        <header className="sticky top-0 z-20 h-16 bg-white border-b border-[#E2E8F0] px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          {/* Zone 1: Mobile Menu Trigger + Breadcrumb Navigation */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation drawer"
              className="lg:hidden p-2 -ml-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
            >
              <Menu className="w-5 h-5" />
            </button>

            <nav
              aria-label="Breadcrumb"
              className="flex items-center gap-2 text-xs min-w-0"
            >
              <span className="text-[#64748B] font-medium hidden sm:inline whitespace-nowrap">
                {currentBreadcrumb.section}
              </span>
              <span
                className="text-slate-300 hidden sm:inline"
                aria-hidden="true"
              >
                /
              </span>
              <span className="font-semibold text-[#111827] truncate whitespace-nowrap">
                {currentBreadcrumb.label}
              </span>
            </nav>
          </div>

          {/* Zone 2: Global Search Input Trigger */}
          <div className="flex-1 max-w-md hidden md:block">
            <button
              type="button"
              onClick={() => setSearchModalOpen(true)}
              className="w-full flex items-center justify-between gap-3 px-3.5 py-2 text-xs text-[#64748B] bg-[#F8FAFC] hover:bg-slate-100/80 border border-[#E2E8F0] rounded-lg transition-colors"
            >
              <span className="flex items-center gap-2 truncate">
                <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">
                  Search tickets (HD-1001), customers, or settings...
                </span>
              </span>
              <kbd className="px-1.5 py-0.5 text-[10px] font-mono font-medium text-slate-500 bg-white border border-slate-200 rounded shrink-0">
                ⌘K
              </kbd>
            </button>
          </div>

          {/* Zone 3: Quick Actions, Notifications, Theme & Account Menu */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setSearchModalOpen(true)}
              aria-label="Search workspace"
              className="md:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Spring Boot API & UI State Inspector Button */}
            <button
              type="button"
              onClick={() => setApiDocsModalOpen(true)}
              className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-[#F8FAFC] hover:bg-[#ECFDF5] hover:text-[#047857] border border-[#E2E8F0] rounded-lg transition-colors whitespace-nowrap shrink-0"
              title="Inspect Java Spring Boot REST API Contract & Test UI States"
            >
              <Code2 className="w-3.5 h-3.5 text-[#047857]" />
              <span>Spring Boot API</span>
            </button>

            {/* Sidebar Theme Toggle */}
            <button
              type="button"
              onClick={toggleSidebarStyle}
              aria-label="Toggle dark emerald sidebar theme"
              title={
                sidebarStyle === "light"
                  ? "Switch to Dark Emerald (#102A23) Sidebar"
                  : "Switch to Crisp White Sidebar"
              }
              className="p-2 text-slate-500 hover:text-[#047857] hover:bg-[#F0FDF4] rounded-lg transition-colors"
            >
              {sidebarStyle === "light" ? (
                <PanelLeftClose className="w-4 h-4" />
              ) : (
                <PanelLeftOpen className="w-4 h-4 text-[#047857]" />
              )}
            </button>

            {/* Notification Bell & Popover */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setNotifPopoverOpen((prev) => !prev);
                  setUserMenuOpen(false);
                }}
                aria-label={`Notifications (${unreadNotificationsCount} unread)`}
                className="relative p-2 text-slate-600 hover:text-[#047857] hover:bg-[#F0FDF4] rounded-lg transition-colors"
              >
                <Bell className="w-4 h-4" />
                {unreadNotificationsCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[#047857] text-white text-[10px] font-mono font-bold flex items-center justify-center">
                    {unreadNotificationsCount}
                  </span>
                )}
              </button>

              {notifPopoverOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-[#E2E8F0] rounded-xl shadow-xl z-40 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-[#E2E8F0] bg-[#F8FAFC]">
                    <span className="text-xs font-semibold text-[#111827]">
                      Notifications ({unreadNotificationsCount} unread)
                    </span>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={markAllNotificationsRead}
                        className="text-[11px] font-medium text-[#047857] hover:underline"
                      >
                        Mark all read
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setNotifPopoverOpen(false);
                          navigateTo("notifications");
                        }}
                        className="text-[11px] font-medium text-slate-600 hover:text-slate-900"
                      >
                        View all
                      </button>
                    </div>
                  </div>
                  <div className="max-h-80 overflow-y-auto divide-y divide-[#E2E8F0]">
                    {notifications.slice(0, 5).map((n) => (
                      <button
                        key={n.id}
                        type="button"
                        onClick={() => {
                          markNotificationRead(n.id);
                          setNotifPopoverOpen(false);
                          navigateTo("ticket-detail", { ticketId: n.ticketId });
                        }}
                        className={`w-full text-left px-4 py-3 hover:bg-[#F0FDF4] transition-colors ${
                          !n.read ? "bg-[#ECFDF5]/40" : "bg-white"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-semibold text-[#111827] truncate">
                            {n.title}
                          </span>
                          <span className="text-[11px] text-[#64748B] font-mono shrink-0">
                            {n.createdAt}
                          </span>
                        </div>
                        <p className="text-xs text-[#64748B] mt-1 line-clamp-2">
                          {n.description}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Primary CTA: Create Ticket */}
            <button
              type="button"
              onClick={() => setCreateTicketModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#047857] hover:bg-[#065F46] rounded-lg transition-colors whitespace-nowrap shrink-0 shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Ticket</span>
            </button>

            {/* User Avatar & Role Persona Switcher Menu */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setUserMenuOpen((prev) => !prev);
                  setNotifPopoverOpen(false);
                }}
                aria-label="Account and Role Switcher menu"
                className="flex items-center gap-2 pl-1.5 pr-2 py-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <Avatar
                  initials={currentUser.avatarInitials}
                  size="sm"
                  variant="emerald"
                />
                <ChevronDown className="w-3.5 h-3.5 text-slate-500 hidden sm:block" />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white border border-[#E2E8F0] rounded-xl shadow-xl z-40 py-1.5 overflow-hidden">
                  <div className="px-4 py-2.5 border-b border-[#E2E8F0]">
                    <div className="text-xs font-semibold text-[#111827]">
                      {currentUser.fullName}
                    </div>
                    <div className="text-[11px] text-[#64748B] truncate">
                      {currentUser.email}
                    </div>
                    <div className="text-[11px] font-medium text-[#047857] mt-1">
                      Active Role: {currentUser.role.replace("_", " ")}
                    </div>
                  </div>

                  <div className="px-3 py-1.5 text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">
                    Switch Role Persona (Live RBAC)
                  </div>
                  {(
                    [
                      {
                        role: "COMPANY_ADMIN",
                        label: "Alex Morgan — Company Admin",
                        sub: "Full workspace, analytics & settings",
                      },
                      {
                        role: "SUPPORT_MANAGER",
                        label: "Priya Patel — Support Manager",
                        sub: "Team management, SLA & reports",
                      },
                      {
                        role: "SUPPORT_AGENT",
                        label: "Sarah Jenkins — Support Agent",
                        sub: "Assigned tickets & priority queue",
                      },
                      {
                        role: "CUSTOMER",
                        label: "Elena Rostova — Customer Portal",
                        sub: "Simplified portal (no internal notes)",
                      },
                      {
                        role: "PLATFORM_ADMIN",
                        label: "Marcus Vance — Platform Admin",
                        sub: "Multi-tenant organizations & billing",
                      },
                    ] as const
                  ).map((p) => (
                    <button
                      key={p.role}
                      type="button"
                      onClick={() => {
                        switchRolePersona(p.role);
                        setUserMenuOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-xs hover:bg-[#F0FDF4] transition-colors ${
                        currentUser.role === p.role
                          ? "bg-[#ECFDF5] text-[#047857] font-semibold"
                          : "text-slate-700"
                      }`}
                    >
                      <div>{p.label}</div>
                      <div className="text-[11px] text-[#64748B] font-normal">
                        {p.sub}
                      </div>
                    </button>
                  ))}

                  <div className="border-t border-[#E2E8F0] mt-1.5 pt-1.5 px-3 py-1 text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">
                    Auth & Onboarding Screens
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setUserMenuOpen(false);
                      navigateTo("login");
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50"
                  >
                    <KeyRound className="w-3.5 h-3.5 text-slate-400" />
                    <span>Page 1: Split-Screen Login</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setUserMenuOpen(false);
                      navigateTo("register");
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50"
                  >
                    <UserPlus className="w-3.5 h-3.5 text-slate-400" />
                    <span>Page 2: SaaS Registration</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setUserMenuOpen(false);
                      navigateTo("forgot-password");
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50"
                  >
                    <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                    <span>Page 3: Forgot Password</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Sub-Toolbar for Role Preview & Data Source Status */}
        <div className="bg-[#F0FDF4] border-b border-[#10B981]/20 px-4 sm:px-6 lg:px-8 py-2 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-[#065F46] flex-wrap">
            <span className="font-semibold">Perspective Switcher:</span>
            {(
              [
                { role: "COMPANY_ADMIN", label: "Admin / Manager" },
                { role: "SUPPORT_AGENT", label: "Support Agent" },
                { role: "CUSTOMER", label: "Customer Portal" },
                { role: "PLATFORM_ADMIN", label: "Platform Admin" },
              ] as const
            ).map((r) => (
              <button
                key={r.role}
                type="button"
                onClick={() => switchRolePersona(r.role)}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors whitespace-nowrap ${
                  currentUser.role === r.role
                    ? "bg-[#047857] text-white shadow-2xs"
                    : "bg-white/80 text-[#047857] hover:bg-white border border-[#10B981]/30"
                }`}
              >
                {r.label}
              </button>
            ))}
            <span className="text-slate-300 hidden sm:inline">·</span>
            <button
              type="button"
              onClick={() => navigateTo("landing")}
              className="text-[#047857] hover:underline font-medium whitespace-nowrap"
            >
              Landing Page
            </button>
            <span className="text-slate-300 hidden sm:inline">·</span>
            <button
              type="button"
              onClick={() => navigateTo("login")}
              className="text-[#047857] hover:underline font-medium whitespace-nowrap"
            >
              Login Screen
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-[#065F46] hidden xl:inline">
              Data Source: Development API Adapter (Spring Boot Ready)
            </span>
            <div className="flex items-center gap-1 bg-white border border-[#E2E8F0] rounded-lg p-0.5">
              {(
                ["NORMAL", "LOADING", "EMPTY", "ERROR"] as SimulationState[]
              ).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setSimulationState(st)}
                  className={`px-2 py-0.5 text-[11px] font-medium rounded transition-colors ${
                    simulationState === st
                      ? "bg-[#047857] text-white"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                  title={`Simulate ${st.toLowerCase()} state across views`}
                >
                  {st === "NORMAL"
                    ? "Live Demo"
                    : st === "LOADING"
                      ? "Skeleton"
                      : st === "EMPTY"
                        ? "Empty"
                        : "Error"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Page Viewport */}
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 max-w-[1440px] w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Global Search Modal (Cmd+K) */}
      <Modal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        title="Global Workspace Search"
        description="Jump to any support ticket, customer profile, or configuration screen."
        maxWidth="max-w-xl"
      >
        <div className="space-y-4">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Ticket ID (e.g. HD-1001), subject, or customer..."
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg focus:outline-none focus:border-[#047857]"
            />
          </div>

          <div className="space-y-3">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B] mb-1.5">
                Support Tickets
              </div>
              <div className="divide-y divide-[#E2E8F0] border border-[#E2E8F0] rounded-lg overflow-hidden">
                {filteredSearchTickets.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      setSearchModalOpen(false);
                      navigateTo("ticket-detail", { ticketId: t.id });
                    }}
                    className="w-full flex items-center justify-between gap-3 px-3.5 py-2.5 text-left hover:bg-[#F0FDF4] transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-semibold text-[#047857]">
                          {t.id}
                        </span>
                        <span className="text-xs font-medium text-[#111827] truncate">
                          {t.subject}
                        </span>
                      </div>
                      <div className="text-[11px] text-[#64748B] mt-0.5">
                        {t.customerName} · {t.customerOrganization}
                      </div>
                    </div>
                    <span className="text-[11px] font-mono text-slate-500 shrink-0">
                      {t.status.replace(/_/g, " ")}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {currentUser.role !== "CUSTOMER" && (
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B] mb-1.5">
                  Customers
                </div>
                <div className="divide-y divide-[#E2E8F0] border border-[#E2E8F0] rounded-lg overflow-hidden">
                  {filteredSearchCustomers.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        setSearchModalOpen(false);
                        navigateTo("customers", { customerId: c.id });
                      }}
                      className="w-full flex items-center justify-between gap-3 px-3.5 py-2 text-left hover:bg-[#F0FDF4] transition-colors"
                    >
                      <div>
                        <div className="text-xs font-semibold text-[#111827]">
                          {c.fullName}
                        </div>
                        <div className="text-[11px] text-[#64748B]">
                          {c.organization} · {c.email}
                        </div>
                      </div>
                      <span className="text-xs font-mono text-[#047857]">
                        {c.totalTickets} tickets
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* Spring Boot REST API Contract & Architecture Modal */}
      <Modal
        isOpen={apiDocsModalOpen}
        onClose={() => setApiDocsModalOpen(false)}
        title="Spring Boot REST API Integration & Project Architecture"
        description={`Configured Base URL: ${SPRING_BOOT_API_CONFIG.baseUrl} · Mode: Development API Adapter`}
        maxWidth="max-w-3xl"
      >
        <div className="space-y-5 text-xs">
          <div className="bg-[#ECFDF5] border border-[#10B981]/30 rounded-xl p-4 text-[#065F46]">
            <div className="font-semibold text-sm mb-1">
              Clean Separation of Mock Adapter vs. Live Spring Boot REST API
            </div>
            <p className="leading-relaxed">
              HelpDesk Pro is architected with a modular TypeScript service
              layer (
              <code className="font-mono bg-white/80 px-1.5 py-0.5 rounded">
                /services/api.ts
              </code>
              ) designed for a Java 21 Spring Boot 3.x REST backend. When{" "}
              <code className="font-mono bg-white/80 px-1.5 py-0.5 rounded">
                NEXT_PUBLIC_USE_MOCK_API=false
              </code>{" "}
              is set, requests route directly to the Spring Boot controllers
              below with JWT Bearer authentication and multi-tenant{" "}
              <code className="font-mono">X-Organization-Id</code> headers.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-sm text-[#111827] mb-2">
              REST API Endpoint Modules
            </h4>
            <div className="border border-[#E2E8F0] rounded-xl overflow-hidden divide-y divide-[#E2E8F0]">
              {SPRING_BOOT_ENDPOINTS.map((ep, idx) => (
                <div
                  key={idx}
                  className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white hover:bg-slate-50"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span
                        className={`font-mono font-bold text-[10px] px-1.5 py-0.5 rounded ${
                          ep.method === "GET"
                            ? "bg-blue-50 text-blue-700"
                            : ep.method === "POST"
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-amber-50 text-amber-800"
                        }`}
                      >
                        {ep.method}
                      </span>
                      <span className="font-mono font-semibold text-[#111827]">
                        {ep.path}
                      </span>
                    </div>
                    <p className="text-[#64748B]">{ep.description}</p>
                  </div>
                  <span className="font-mono text-[11px] text-slate-500 shrink-0">
                    {ep.springController}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="border border-[#E2E8F0] rounded-xl p-4 bg-[#F8FAFC]">
              <h5 className="font-semibold text-[#111827] mb-1.5">
                Development & Startup
              </h5>
              <pre className="font-mono text-[11px] text-slate-700 space-y-1 overflow-x-auto">
                {`# 1. Install packages
npm install

# 2. Start development server
npm run dev

# 3. Production build
npm run build && npm run start`}
              </pre>
            </div>
            <div className="border border-[#E2E8F0] rounded-xl p-4 bg-[#F8FAFC]">
              <h5 className="font-semibold text-[#111827] mb-1.5">
                Environment Configuration
              </h5>
              <pre className="font-mono text-[11px] text-slate-700 space-y-1 overflow-x-auto">
                {`# .env.local
NEXT_PUBLIC_API_BASE_URL="http://localhost:8000/api/v1"
NEXT_PUBLIC_GOOGLE_CLIENT_ID="YOUR_GOOGLE_CLIENT_ID"
NEXT_PUBLIC_USE_MOCK_API="false"`}
              </pre>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
