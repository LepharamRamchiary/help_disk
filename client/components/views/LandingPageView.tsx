'use client';

import React, { useState } from 'react';
import { useHelpDesk } from '@/context/HelpDeskContext';
import { StatusBadge, PriorityBadge } from '@/components/ui/design-system';
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Lock,
  BarChart3,
  Users,
  Workflow,
} from 'lucide-react';

export function LandingPageView() {
  const { navigateTo, loginWithEmail, addToast } = useHelpDesk();
  const [workEmail, setWorkEmail] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);

  const handleQuickStartSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError(null);
    if (!workEmail.trim() || !workEmail.includes('@')) {
      setEmailError('Please enter a valid work email address to continue.');
      return;
    }
    addToast('Email Verified', 'Sign in below to access your HelpDesk Pro workspace.', 'info');
    navigateTo('login');
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#111827] flex flex-col">
      {/* Top Bar Contract: Exactly 3 zones separated by gap-8 */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-xs border-b border-[#E2E8F0]">
        <div className="max-w-[1440px] mx-auto flex items-center justify-between gap-8 px-6 lg:px-12 py-4">
          {/* Zone 1: Single text element wordmark */}
          <a
            href="#top"
            className="text-lg font-bold tracking-tight text-[#047857] whitespace-nowrap shrink-0"
          >
            HelpDesk Pro
          </a>

          {/* Zone 2: 4–5 concise single-line text navigation links */}
          <nav
            aria-label="Primary Marketing Navigation"
            className="hidden md:flex items-center gap-7 text-sm font-medium text-[#64748B]"
          >
            <a
              href="#capabilities"
              className="hover:text-[#111827] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Capabilities
            </a>
            <a
              href="#sla-engine"
              className="hover:text-[#111827] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              SLA Engine
            </a>
            <a
              href="#case-studies"
              className="hover:text-[#111827] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Case Studies
            </a>
            <a
              href="#pricing"
              className="hover:text-[#111827] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Pricing
            </a>
            <button
              type="button"
              onClick={() => navigateTo('login')}
              className="hover:text-[#047857] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Sign In
            </button>
          </nav>

          {/* Zone 3: 1 primary action */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => navigateTo('login')}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#047857] hover:bg-[#065F46] rounded-lg transition-colors whitespace-nowrap shrink-0 shadow-2xs"
            >
              Sign In to Workspace
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main id="top" className="flex-1">
        {/* 1. HERO SECTION */}
        <section className="max-w-[1440px] mx-auto px-6 lg:px-12 pt-12 pb-16 lg:pt-20 lg:pb-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-stretch">
            {/* Left Column: Proposition & Primary CTA */}
            <div className="lg:col-span-6 flex flex-col justify-between space-y-8">
              <div className="space-y-5">
                <p className="text-xs font-semibold text-[#047857] tracking-wide">
                  Multi-Tenant Customer Support & Ticketing SaaS · SOC 2 Type II Certified
                </p>

                <h1
                  className="font-bold tracking-tight text-[#111827] leading-[1.12] text-balance"
                  style={{ fontSize: 'clamp(2.25rem, 3.8vw, 3.5rem)' }}
                >
                  Support that moves your business forward.
                </h1>

                <p className="text-base text-[#64748B] leading-relaxed max-w-xl">
                  Centralize incoming customer tickets, enforce real-time service-level agreements,
                  and coordinate support agents, managers, and customers in one unified emerald
                  workspace.
                </p>
              </div>

              {/* Action Block */}
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => navigateTo('login')}
                    className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-[#047857] hover:bg-[#065F46] rounded-xl transition-colors whitespace-nowrap shrink-0 shadow-xs"
                  >
                    <span>Sign In to Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => loginWithEmail('alex.morgan@acmecloud.io', 'COMPANY_ADMIN')}
                    className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold text-[#047857] bg-[#ECFDF5] hover:bg-[#10B981]/20 border border-[#10B981]/30 rounded-xl transition-colors whitespace-nowrap shrink-0"
                  >
                    <span>Instant 1-Click Live Preview</span>
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs text-[#64748B]">
                  <span>14-day Enterprise trial</span>
                  <span aria-hidden="true">·</span>
                  <span>Java Spring Boot REST API ready</span>
                  <span aria-hidden="true">·</span>
                  <span>Role-based access control</span>
                </div>
              </div>
            </div>

            {/* Right Column: Live Interactive Product Preview Surface */}
            <div className="lg:col-span-6 flex flex-col">
              <div className="flex-1 bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-5">
                <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-4">
                  <div>
                    <div className="text-xs font-bold text-[#111827]">
                      Acme Cloud Inc. — Support Operations Queue
                    </div>
                    <div className="text-[11px] text-[#64748B] mt-0.5">
                      Real-time ticket triage & SLA deadline enforcement
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigateTo('login')}
                    className="text-xs font-semibold text-[#047857] hover:underline whitespace-nowrap"
                  >
                    Open Full Queue →
                  </button>
                </div>

                {/* Preview Ticket Rows */}
                <div className="divide-y divide-[#E2E8F0] text-xs">
                  {[
                    {
                      id: 'HD-1001',
                      subject: 'Unable to log in to my account (SAML 2.0 Cert)',
                      org: 'NordicBank Financial',
                      priority: 'URGENT' as const,
                      status: 'IN_PROGRESS' as const,
                      sla: '28m left',
                    },
                    {
                      id: 'HD-1002',
                      subject: 'Payment successful but order not confirmed',
                      org: 'Vantage Retail Group',
                      priority: 'HIGH' as const,
                      status: 'OPEN' as const,
                      sla: '19m left',
                    },
                    {
                      id: 'HD-1003',
                      subject: 'Request to update registered email domain',
                      org: 'Atelier Mode Paris',
                      priority: 'MEDIUM' as const,
                      status: 'WAITING_FOR_CUSTOMER' as const,
                      sla: 'On Track',
                    },
                    {
                      id: 'HD-1005',
                      subject: 'Unable to download September VAT invoice PDF',
                      org: 'Solaris Clean Energy',
                      priority: 'MEDIUM' as const,
                      status: 'RESOLVED' as const,
                      sla: 'SLA Met',
                    },
                  ].map((item) => (
                    <div
                      key={item.id}
                      onClick={() => navigateTo('login')}
                      className="py-3 flex items-center justify-between gap-3 hover:bg-[#F0FDF4]/60 px-2 rounded-lg transition-colors cursor-pointer"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-[#047857]">{item.id}</span>
                          <span className="font-semibold text-[#111827] truncate">
                            {item.subject}
                          </span>
                        </div>
                        <div className="text-[11px] text-[#64748B] mt-0.5">{item.org}</div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <PriorityBadge priority={item.priority} />
                        <StatusBadge status={item.status} />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Bottom Mini SLA Summary */}
                <div className="pt-3 border-t border-[#E2E8F0] flex items-center justify-between text-xs">
                  <span className="text-[#64748B]">
                    Active Roles: Admin · Manager · Agent · Customer Portal
                  </span>
                  <span className="font-mono font-semibold text-[#047857] tabular-nums">
                    96.4% SLA Compliance
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Full-Width 4-Column Quantitative KPI Strip Below Hero Split */}
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                metric: '14m 12s',
                label: 'Median First-Response Time',
                context: 'Across P1 & P2 enterprise support queues in Q3 2026',
              },
              {
                metric: '98.4%',
                label: 'SLA Target Compliance',
                context: 'Automated escalation at 75% deadline elapsed threshold',
              },
              {
                metric: '4.89 / 5.0',
                label: 'Verified Customer CSAT',
                context: 'Top 5% industry benchmark across 1,420 monthly tickets',
              },
              {
                metric: '190ms',
                label: '90-Day Analytics Latency',
                context: 'Indexed Spring Boot reporting queries at 50,000+ tickets',
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className="bg-white border border-[#E2E8F0] rounded-xl p-5 space-y-1"
              >
                <div className="text-2xl font-bold font-mono tabular-nums text-[#047857]">
                  {stat.metric}
                </div>
                <div className="text-xs font-bold text-[#111827]">{stat.label}</div>
                <p className="text-xs text-[#64748B] leading-relaxed">{stat.context}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 2. CORE CAPABILITIES (ASYMMETRIC BENTO GRID WITH EDITORIAL NUMBERING) */}
        <section
          id="capabilities"
          className="bg-white border-y border-[#E2E8F0] py-16 lg:py-24"
        >
          <div className="max-w-[1440px] mx-auto px-6 lg:px-12 space-y-10">
            <div className="max-w-2xl space-y-3">
              <p className="text-xs font-semibold text-[#047857]">
                Platform Architecture & Capabilities
              </p>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#111827] text-balance">
                Purpose-built workflows for every role in your support organization.
              </h2>
              <p className="text-sm text-[#64748B] leading-relaxed">
                From customer self-service submission to multi-tenant platform administration,
                HelpDesk Pro eliminates fragmented spreadsheets and shared inboxes.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* Span 2 Marquee Capability */}
              <div className="lg:col-span-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-7 flex flex-col justify-between space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-semibold text-[#047857]">
                      01. Centralized Ticket Triage & Internal Collaboration
                    </span>
                    <Workflow className="w-5 h-5 text-[#047857]" />
                  </div>
                  <h3 className="text-lg font-bold text-[#111827]">
                    Two-Column Conversation Timelines with Staff-Only Internal Notes
                  </h3>
                  <p className="text-sm text-[#64748B] leading-relaxed">
                    Support engineers can reply to customers, attach diagnostic logs, and post
                    amber-highlighted internal engineering notes on the same timeline—while strict
                    role-based access control guarantees internal notes never leak to the customer
                    portal.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-[#E2E8F0] text-xs">
                  <div>
                    <span className="font-semibold text-[#111827] block">Bulk Queue Actions</span>
                    <span className="text-[#64748B]">Reassign or resolve multiple tickets</span>
                  </div>
                  <div>
                    <span className="font-semibold text-[#111827] block">Canned Templates</span>
                    <span className="text-[#64748B]">1-click technical responses</span>
                  </div>
                  <div>
                    <span className="font-semibold text-[#111827] block">Audit History</span>
                    <span className="text-[#64748B]">Chronological actor & SLA logs</span>
                  </div>
                </div>
              </div>

              {/* Span 1 Capability */}
              <div
                id="sla-engine"
                className="bg-[#102A23] text-white rounded-2xl p-7 flex flex-col justify-between space-y-6"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-semibold text-[#10B981]">
                      02. Real-Time SLA Engine
                    </span>
                    <Clock className="w-5 h-5 text-[#10B981]" />
                  </div>
                  <h3 className="text-lg font-bold text-white">
                    Automated Response & Resolution Deadlines
                  </h3>
                  <p className="text-sm text-emerald-100/80 leading-relaxed">
                    Define P1–P4 SLA policies with business-hour calendars and regional holiday
                    pauses. Automatically flag at-risk tickets 15 minutes prior to breach.
                  </p>
                </div>

                <div className="pt-4 border-t border-emerald-800/70 flex items-center justify-between text-xs font-mono">
                  <span className="text-emerald-300">P1 Urgent Target</span>
                  <span className="text-white font-bold">15m Reply · 2h Resolve</span>
                </div>
              </div>

              {/* Span 1 Capability */}
              <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-7 flex flex-col justify-between space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-semibold text-[#047857]">
                      03. Dedicated Customer Portal
                    </span>
                    <Users className="w-5 h-5 text-[#047857]" />
                  </div>
                  <h3 className="text-lg font-bold text-[#111827]">
                    Simplified Self-Service Experience
                  </h3>
                  <p className="text-sm text-[#64748B] leading-relaxed">
                    Customers get a clean, distraction-free portal to submit requests, upload
                    screenshots, and track ticket progress without seeing internal admin controls.
                  </p>
                </div>
                <div className="pt-4 border-t border-[#E2E8F0] text-xs text-[#047857] font-semibold">
                  Zero internal note exposure guaranteed
                </div>
              </div>

              {/* Span 2 Capability */}
              <div className="lg:col-span-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-7 flex flex-col justify-between space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-semibold text-[#047857]">
                      04. Executive Analytics & Multi-Tenant Governance
                    </span>
                    <BarChart3 className="w-5 h-5 text-[#047857]" />
                  </div>
                  <h3 className="text-lg font-bold text-[#111827]">
                    CSAT Benchmarking, Workload Balancing & Spring Boot REST Integration
                  </h3>
                  <p className="text-sm text-[#64748B] leading-relaxed">
                    Supervise agent capacity, compare CSAT against top-5% industry benchmarks,
                    export CSV audit reports, and manage multi-tenant subscriptions from the
                    Platform Administration console.
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-[#E2E8F0] text-xs">
                  <span className="text-[#64748B]">
                    Includes 16 connected screens across 5 distinct user personas
                  </span>
                  <button
                    type="button"
                    onClick={() => navigateTo('login')}
                    className="font-semibold text-[#047857] hover:underline"
                  >
                    Sign In to Explore All 16 Screens →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. PROOF OF IMPACT / CASE STUDIES */}
        <section id="case-studies" className="py-16 lg:py-24 max-w-[1440px] mx-auto px-6 lg:px-12">
          <div className="space-y-10">
            <div className="max-w-2xl space-y-2">
              <p className="text-xs font-semibold text-[#047857]">Verified Customer Outcomes</p>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#111827]">
                Trusted by high-velocity engineering and operations teams.
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  metric: '-64% First-Response Time in 60 Days',
                  quote:
                    'Before HelpDesk Pro, urgent SAML 2.0 lockout requests sat in a shared inbox for over 45 minutes. Automated category routing cut our P1 first-response time down to 7 minutes.',
                  author: 'Elena Rostova',
                  role: 'Head of Engineering',
                  org: 'NordicBank Financial',
                },
                {
                  metric: '98.1% Billing SLA Compliance Across 40 Seats',
                  quote:
                    'During seasonal retail peaks we process 3,100+ monthly tickets. The real-time SLA countdown queue and Stripe webhook triage rules eliminated overdue billing escalations.',
                  author: 'Marcus Sterling',
                  role: 'VP of Customer Operations',
                  org: 'Vantage Retail Group',
                },
                {
                  metric: '4.92 / 5.0 Customer Satisfaction Score',
                  quote:
                    'Our customers love the clean self-service portal, and our APAC engineers rely on staff-only internal notes to share HAR traces without cluttering the customer thread.',
                  author: 'Kenji Takahashi',
                  role: 'Director of Cloud Infrastructure',
                  org: 'Kuroda Robotics Ltd.',
                },
              ].map((cs) => (
                <div
                  key={cs.author}
                  className="bg-white border border-[#E2E8F0] rounded-2xl p-6 flex flex-col justify-between space-y-5"
                >
                  <div className="space-y-3">
                    <div className="text-sm font-bold font-mono text-[#047857]">{cs.metric}</div>
                    <p className="text-xs sm:text-sm text-[#111827] leading-relaxed">
                      “{cs.quote}”
                    </p>
                  </div>
                  <div className="pt-4 border-t border-[#E2E8F0] text-xs">
                    <div className="font-bold text-[#111827]">{cs.author}</div>
                    <div className="text-[#64748B]">
                      {cs.role} · {cs.org}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 4. TRANSPARENT PRICING TIERS */}
        <section
          id="pricing"
          className="bg-white border-t border-[#E2E8F0] py-16 lg:py-24"
        >
          <div className="max-w-[1440px] mx-auto px-6 lg:px-12 space-y-10">
            <div className="max-w-2xl space-y-2">
              <p className="text-xs font-semibold text-[#047857]">Predictable Multi-Tenant Plans</p>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#111827]">
                Pricing built for growing support teams.
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
              {[
                {
                  name: 'Starter',
                  audience: 'For early-stage support teams',
                  price: '$29',
                  cadence: 'per agent / month',
                  specs: [
                    'Up to 10 support agent seats',
                    'Standard email & portal ticketing',
                    'Business-hours SLA tracking',
                    '30-day reporting retention',
                  ],
                  featured: false,
                },
                {
                  name: 'Growth',
                  audience: 'For scaling support operations',
                  price: '$59',
                  cadence: 'per agent / month',
                  specs: [
                    'Up to 25 support agent seats',
                    'Event-driven automation rules',
                    'Custom customer portal domain',
                    'CSAT surveys & CSV exports',
                  ],
                  featured: true,
                },
                {
                  name: 'Enterprise',
                  audience: 'For multi-region organizations',
                  price: '$99',
                  cadence: 'per agent / month',
                  specs: [
                    'Unlimited seats & multi-tenant orgs',
                    '24/7 P1 SLA escalation webhooks',
                    'SAML 2.0 SSO & RBAC privacy controls',
                    'Dedicated Spring Boot API cluster',
                  ],
                  featured: false,
                },
              ].map((plan) => (
                <div
                  key={plan.name}
                  className={`rounded-2xl p-6 flex flex-col justify-between space-y-6 border ${
                    plan.featured
                      ? 'bg-[#F0FDF4]/60 border-[#047857]'
                      : 'bg-[#F8FAFC] border-[#E2E8F0]'
                  }`}
                >
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-base font-bold text-[#111827]">{plan.name}</h3>
                      <p className="text-xs text-[#64748B] mt-0.5">{plan.audience}</p>
                    </div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-3xl font-bold font-mono tabular-nums text-[#111827]">
                        {plan.price}
                      </span>
                      <span className="text-xs text-[#64748B]">{plan.cadence}</span>
                    </div>
                    <ul className="space-y-2.5 text-xs text-[#111827] pt-2">
                      {plan.specs.map((s) => (
                        <li key={s} className="flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#047857] shrink-0" />
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button
                    type="button"
                    onClick={() => navigateTo('login')}
                    className={`w-full py-2.5 px-4 text-xs font-semibold rounded-xl transition-colors ${
                      plan.featured
                        ? 'bg-[#047857] text-white hover:bg-[#065F46]'
                        : 'bg-white text-[#111827] border border-[#E2E8F0] hover:bg-slate-100'
                    }`}
                  >
                    Sign In or Start {plan.name} Trial
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 5. CONVERSION CTA / WORKSPACE ACCESS */}
        <section className="bg-[#102A23] text-white py-16">
          <div className="max-w-4xl mx-auto px-6 text-center space-y-6">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-balance">
              Ready to step inside the HelpDesk Pro workspace?
            </h2>
            <p className="text-sm text-emerald-100/80 max-w-xl mx-auto">
              Enter your work email or click Sign In to test the complete dashboard, ticket details,
              SLA monitoring, customer portal, and platform admin screens.
            </p>

            <form
              onSubmit={handleQuickStartSubmit}
              className="max-w-md mx-auto flex flex-col sm:flex-row gap-2.5"
              noValidate
            >
              <input
                type="email"
                value={workEmail}
                onChange={(e) => setWorkEmail(e.target.value)}
                placeholder="Enter your work email..."
                className="flex-1 px-4 py-2.5 text-xs bg-white text-[#111827] rounded-xl focus:outline-none"
              />
              <button
                type="submit"
                className="px-5 py-2.5 text-xs font-semibold bg-[#047857] hover:bg-[#065F46] border border-[#10B981]/40 text-white rounded-xl transition-colors whitespace-nowrap"
              >
                Continue to Login
              </button>
            </form>
            {emailError && <p className="text-xs text-red-300">{emailError}</p>}

            <div className="pt-2">
              <button
                type="button"
                onClick={() => navigateTo('login')}
                className="text-xs font-semibold text-[#10B981] hover:underline"
              >
                Or go directly to Simple Login Screen →
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Quiet Footer */}
      <footer className="bg-white border-t border-[#E2E8F0] py-8 px-6 lg:px-12">
        <div className="max-w-[1440px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#64748B]">
          <div className="flex items-center gap-3">
            <span className="font-bold text-[#111827]">HelpDesk Pro</span>
            <span>·</span>
            <span>Enterprise Customer Support SaaS</span>
          </div>
          <div className="flex items-center gap-6">
            <button
              type="button"
              onClick={() => navigateTo('login')}
              className="hover:text-[#047857]"
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => navigateTo('register')}
              className="hover:text-[#047857]"
            >
              Create Account
            </button>
            <span>© 2026 HelpDesk Pro Inc.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
