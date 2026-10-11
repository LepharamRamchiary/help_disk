'use client';

import React from 'react';
import { HelpDeskProvider, useHelpDesk } from '@/context/HelpDeskContext';
import { AppShell } from '@/components/layout/AppShell';
import { LandingPageView } from '@/components/views/LandingPageView';
import { AuthViews } from '@/components/views/AuthViews';
import { DashboardView } from '@/components/views/DashboardView';
import { TicketsView } from '@/components/views/TicketsView';
import {
  CreateTicketModal,
  CreateTicketPageView,
} from '@/components/views/CreateTicketModalAndView';
import { TicketDetailView } from '@/components/views/TicketDetailView';
import { CustomersView } from '@/components/views/CustomersView';
import { TeamMembersView } from '@/components/views/TeamMembersView';
import {
  ReportsAnalyticsView,
  SlaMonitoringView,
} from '@/components/views/ReportsAndSlaView';
import {
  CategoriesView,
  AutomationsView,
  CompanySettingsView,
} from '@/components/views/ConfigViews';
import {
  NotificationsView,
  CustomerPortalView,
  PlatformAdminView,
} from '@/components/views/NotificationsPortalPlatformView';
import { ToastContainer } from '@/components/ui/design-system';

function HelpDeskRouter() {
  const { currentView, toasts, dismissToast } = useHelpDesk();

  const renderActiveView = () => {
    switch (currentView) {
      case 'landing':
        return <LandingPageView />;
      case 'login':
      case 'register':
      case 'forgot-password':
        return <AuthViews />;
      case 'overview':
        return <DashboardView />;
      case 'tickets':
      case 'my-tickets':
      case 'unassigned':
      case 'priority-queue':
        return <TicketsView />;
      case 'create-ticket':
        return <CreateTicketPageView />;
      case 'ticket-detail':
        return <TicketDetailView />;
      case 'customers':
        return <CustomersView />;
      case 'team':
        return <TeamMembersView />;
      case 'reports':
        return <ReportsAnalyticsView />;
      case 'sla':
        return <SlaMonitoringView />;
      case 'categories':
        return <CategoriesView />;
      case 'automations':
        return <AutomationsView />;
      case 'settings':
        return <CompanySettingsView />;
      case 'notifications':
        return <NotificationsView />;
      case 'customer-portal':
        return <CustomerPortalView />;
      case 'platform-admin':
        return <PlatformAdminView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <>
      <AppShell>{renderActiveView()}</AppShell>
      <CreateTicketModal />
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </>
  );
}

export default function HomePage() {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="text-xs font-semibold text-[#047857]">
          Loading HelpDesk Pro Workspace...
        </div>
      </div>
    );
  }

  return (
    <HelpDeskProvider>
      <HelpDeskRouter />
    </HelpDeskProvider>
  );
}
