'use client';

import React, { useState, useEffect } from 'react';
import { useHelpDesk } from '@/context/HelpDeskContext';
import GoogleAuthButton from '@/components/google-provider/GoogleAuthButton';
import { AuthApiService } from '@/services/api';
import {
  Headset,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  Clock,
  Lock,
  Mail,
  User,
  AlertCircle,
  ArrowLeft,
  RefreshCw,
} from 'lucide-react';

export function AuthViews() {
  const {
    currentView,
    navigateTo,
    loginWithPassword,
    registerAccount,
    loginWithGoogle,
    addToast,
  } = useHelpDesk();

  // Login State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);

  // Registration State
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [regError, setRegError] = useState<string | null>(null);
  const [regLoading, setRegLoading] = useState(false);
  const [googleError, setGoogleError] = useState<string | null>(null);

  // Forgot Password State
  const [resetEmail, setResetEmail] = useState('');
  const [resetSubmitted, setResetSubmitted] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetLoading, setResetLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  useEffect(() => {
    if (cooldownSeconds <= 0) return;
    const timer = setInterval(() => {
      setCooldownSeconds((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldownSeconds]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(loginEmail.trim())) {
      setLoginError('Please enter a valid work email address.');
      return;
    }
    if (!loginPassword) {
      setLoginError('Please enter your password.');
      return;
    }
    if (loginPassword.length > 128) {
      setLoginError('Password must be 128 characters or fewer.');
      return;
    }
    setLoginLoading(true);
    try {
      await loginWithPassword(loginEmail.trim(), loginPassword, rememberMe);
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : 'Sign-in failed. Please try again.');
    } finally {
      setLoginLoading(false);
    }
  };

  // Password strength calculation
  const pwdChecks = {
    length: regPassword.length >= 8,
    uppercase: /[A-Z]/.test(regPassword),
    numberOrSymbol: /[0-9!@#$%^&*]/.test(regPassword),
  };
  const pwdStrengthCount =
    (pwdChecks.length ? 1 : 0) +
    (pwdChecks.uppercase ? 1 : 0) +
    (pwdChecks.numberOrSymbol ? 1 : 0);

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);
    if (!regName.trim()) {
      setRegError('Full name is required.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(regEmail.trim())) {
      setRegError('Please provide a valid work email address.');
      return;
    }
    if (regName.trim().length > 100) {
      setRegError('Name must be 100 characters or fewer.');
      return;
    }
    if (regPassword.length > 128) {
      setRegError('Password must be 128 characters or fewer.');
      return;
    }
    if (pwdStrengthCount < 3) {
      setRegError('Please meet all password strength requirements before continuing.');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setRegError('Password confirmation does not match.');
      return;
    }
    if (!acceptTerms) {
      setRegError('You must accept the Master Subscription Agreement and Privacy Policy.');
      return;
    }

    setRegLoading(true);
    try {
      await registerAccount(regName.trim(), regEmail.trim(), regPassword);
    } catch (error) {
      setRegError(error instanceof Error ? error.message : 'Registration failed. Please try again.');
    } finally {
      setRegLoading(false);
    }
  };

  const handleGoogleCredential = async (credential: string) => {
    setGoogleError(null);
    try {
      await loginWithGoogle(credential);
    } catch (error) {
      setGoogleError(error instanceof Error ? error.message : 'Google sign-in failed.');
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError(null);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(resetEmail.trim())) {
      setResetError('Please enter a valid email address.');
      return;
    }
    setResetLoading(true);
    try {
      await AuthApiService.requestPasswordReset(resetEmail.trim());
      setResetSubmitted(true);
      setCooldownSeconds(60);
    } catch (error) {
      setResetError(
        error instanceof Error
          ? error.message
          : 'Could not send reset instructions. Please try again.'
      );
    } finally {
      setResetLoading(false);
    }
  };

  const handleResendReset = async () => {
    if (cooldownSeconds > 0 || resendLoading) return;
    setResetError(null);
    setResendLoading(true);
    try {
      await AuthApiService.requestPasswordReset(resetEmail.trim());
      setCooldownSeconds(60);
      addToast(
        'Reset Instructions Dispatched',
        'If an account matches that address, a new recovery link has been sent.',
        'info'
      );
    } catch (error) {
      setResetError(
        error instanceof Error
          ? error.message
          : 'Could not resend reset instructions. Please try again.'
      );
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 items-stretch bg-white">
      {/* Left Side: Brand Identity & Product Preview */}
      <div className="lg:col-span-5 xl:col-span-6 bg-[#102A23] text-white p-8 sm:p-12 xl:p-16 flex flex-col justify-between relative overflow-hidden">
        {/* Top Brand Lockup */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#047857] border border-[#10B981]/30 flex items-center justify-center text-white shadow-sm">
              <Headset className="w-5 h-5" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-white">HelpDesk Pro</span>
              <span className="block text-xs text-emerald-300/80">
                Enterprise Customer Operations Platform
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => navigateTo('landing')}
              className="text-xs font-medium text-emerald-200 hover:text-white underline underline-offset-4"
            >
              ← Back to Landing Page
            </button>
          </div>
        </div>

        {/* Center Headline & Tasteful Product Preview */}
        <div className="my-12 max-w-xl space-y-8">
          <div className="space-y-4">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white leading-[1.15] text-balance">
              Support that moves your business forward.
            </h1>
            <p className="text-sm sm:text-base text-emerald-100/80 leading-relaxed">
              Unify multi-channel customer requests, enforce real-time SLA guarantees, and empower
              support teams with precision routing and actionable analytics.
            </p>
          </div>

          {/* Tasteful Product Preview Card */}
          <div className="bg-emerald-950/70 border border-emerald-800/70 rounded-xl p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-emerald-800/60 pb-3">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-semibold text-[#10B981]">HD-1001</span>
                <span className="text-xs text-emerald-100 font-medium">
                  SAML 2.0 Certificate Rotation Lockout
                </span>
              </div>
              <span className="text-[11px] font-mono text-emerald-300">SLA Met · 7m</span>
            </div>

            <div className="grid grid-cols-3 gap-4 pt-1">
              <div>
                <div className="text-[11px] text-emerald-300/70">First Response</div>
                <div className="text-lg font-bold font-mono tabular-nums text-white mt-0.5">
                  14m 12s
                </div>
                <div className="text-[11px] text-[#10B981] mt-0.5">-22% vs last month</div>
              </div>
              <div>
                <div className="text-[11px] text-emerald-300/70">SLA Compliance</div>
                <div className="text-lg font-bold font-mono tabular-nums text-white mt-0.5">
                  98.4%
                </div>
                <div className="text-[11px] text-emerald-200/80 mt-0.5">Enterprise Target 95%</div>
              </div>
              <div>
                <div className="text-[11px] text-emerald-300/70">Customer CSAT</div>
                <div className="text-lg font-bold font-mono tabular-nums text-white mt-0.5">
                  4.92 / 5.0
                </div>
                <div className="text-[11px] text-[#10B981] mt-0.5">Top 5% Benchmark</div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Trust Footer */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-6 border-t border-emerald-900/80 text-xs text-emerald-300/70">
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#10B981]" />
              SOC 2 Type II & ISO 27001
            </span>
            <span>·</span>
            <span>Multi-Tenant RBAC</span>
          </div>
          <span>© 2026 HelpDesk Pro Inc.</span>
        </div>
      </div>

      {/* Right Side: Active Auth Form (Login / Register / Forgot Password) */}
      <div className="lg:col-span-7 xl:col-span-6 flex items-center justify-center p-6 sm:p-12 lg:p-16 bg-[#F8FAFC]">
        <div className="w-full max-w-md bg-white border border-[#E2E8F0] rounded-2xl p-8 shadow-xs">
          {/*Auth Mode Navigation Tabs*/}
          <div className="flex items-center gap-1 p-1 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg mb-6">
            <button
              type="button"
              onClick={() => navigateTo('login')}
              className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${
                currentView === 'login'
                  ? 'bg-white text-[#111827] shadow-2xs font-semibold'
                  : 'text-[#64748B] hover:text-[#111827]'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => navigateTo('register')}
              className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${
                currentView === 'register'
                  ? 'bg-white text-[#111827] shadow-2xs font-semibold'
                  : 'text-[#64748B] hover:text-[#111827]'
              }`}
            >
              Register
            </button>
            <button
              type="button"
              onClick={() => navigateTo('forgot-password')}
              className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${
                currentView === 'forgot-password'
                  ? 'bg-white text-[#111827] shadow-2xs font-semibold'
                  : 'text-[#64748B] hover:text-[#111827]'
              }`}
            >
              Reset Password
            </button>
          </div>

          {/* PAGE 1: LOGIN */}
          {currentView === 'login' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-[#111827]">Welcome back</h2>
                <p className="text-xs text-[#64748B] mt-1">
                  Sign in to your HelpDesk Pro workspace to manage customer tickets.
                </p>
              </div>

              {loginError && (
                <div
                  role="alert"
                  className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2"
                >
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}

              <form onSubmit={handleLoginSubmit} className="space-y-4" noValidate>
                <div>
                  <label
                    htmlFor="login-email"
                    className="block text-xs font-semibold text-[#111827] mb-1.5"
                  >
                    Work Email
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
                    <input
                      id="login-email"
                      type="email"
                      required
                      value={loginEmail}
                      maxLength={191}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="name@company.com"
                      className="w-full pl-10 pr-3.5 py-2 text-sm bg-white border border-[#E2E8F0] rounded-lg focus:outline-none focus:border-[#047857]"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label
                      htmlFor="login-password"
                      className="block text-xs font-semibold text-[#111827]"
                    >
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => navigateTo('forgot-password')}
                      className="text-xs font-medium text-[#047857] hover:text-[#065F46]"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
                    <input
                      id="login-password"
                      type={showLoginPassword ? 'text' : 'password'}
                      required
                      value={loginPassword}
                      maxLength={128}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-2 text-sm bg-white border border-[#E2E8F0] rounded-lg focus:outline-none focus:border-[#047857]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      aria-label={showLoginPassword ? 'Hide password' : 'Show password'}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                    >
                      {showLoginPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <label className="inline-flex items-center gap-2 text-xs text-[#64748B] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded border-slate-300 text-[#047857] focus:ring-[#047857]"
                    />
                    <span>Remember this device</span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loginLoading}
                  className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-[#047857] hover:bg-[#065F46] rounded-lg transition-colors flex items-center justify-center gap-2 shadow-2xs"
                >
                  <span>{loginLoading ? 'Signing in…' : 'Sign In to Workspace'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              {googleError && (
                <p role="alert" className="text-xs text-red-700">
                  {googleError}
                </p>
              )}
              <GoogleAuthButton onCredential={handleGoogleCredential} onError={setGoogleError} />

              <p className="text-center text-xs text-[#64748B]">
                New to HelpDesk Pro?{' '}
                <button
                  type="button"
                  onClick={() => navigateTo('register')}
                  className="font-semibold text-[#047857] hover:underline"
                >
                  Create an account
                </button>
              </p>
            </div>
          )}

          {/* PAGE 2: REGISTRATION */}
          {currentView === 'register' && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-bold text-[#111827]">Get started with HelpDesk Pro</h2>
                <p className="text-xs text-[#64748B] mt-1">
                  Create your account with an email and password, or continue with Google.
                </p>
              </div>

              {regError && (
                <div
                  role="alert"
                  className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2"
                >
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{regError}</span>
                </div>
              )}

              <form onSubmit={handleRegisterSubmit} className="space-y-3.5" noValidate>
                <div>
                  <label
                    htmlFor="reg-name"
                    className="block text-xs font-semibold text-[#111827] mb-1"
                  >
                    Full Name <span className="text-red-600">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
                    <input
                      id="reg-name"
                      type="text"
                      required
                      value={regName}
                      maxLength={100}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="Jordan Taylor"
                      className="w-full pl-10 pr-3.5 py-2 text-sm bg-white border border-[#E2E8F0] rounded-lg focus:outline-none focus:border-[#047857]"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="reg-email"
                    className="block text-xs font-semibold text-[#111827] mb-1"
                  >
                    Work Email <span className="text-red-600">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
                    <input
                      id="reg-email"
                      type="email"
                      required
                      value={regEmail}
                      maxLength={191}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="jordan@company.com"
                      className="w-full pl-10 pr-3.5 py-2 text-sm bg-white border border-[#E2E8F0] rounded-lg focus:outline-none focus:border-[#047857]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="reg-password"
                      className="block text-xs font-semibold text-[#111827] mb-1"
                    >
                      Password <span className="text-red-600">*</span>
                    </label>
                    <div className="relative">
                      <input
                        id="reg-password"
                        type={showRegPassword ? 'text' : 'password'}
                        required
                        value={regPassword}
                        maxLength={128}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="Create password"
                        className="w-full pl-3.5 pr-9 py-2 text-sm bg-white border border-[#E2E8F0] rounded-lg focus:outline-none focus:border-[#047857]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegPassword(!showRegPassword)}
                        aria-label="Toggle password visibility"
                        className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                      >
                        {showRegPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="reg-confirm"
                      className="block text-xs font-semibold text-[#111827] mb-1"
                    >
                      Confirm Password <span className="text-red-600">*</span>
                    </label>
                    <input
                      id="reg-confirm"
                      type={showRegPassword ? 'text' : 'password'}
                      required
                      value={regConfirmPassword}
                      maxLength={128}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      placeholder="Repeat password"
                      className="w-full px-3.5 py-2 text-sm bg-white border border-[#E2E8F0] rounded-lg focus:outline-none focus:border-[#047857]"
                    />
                  </div>
                </div>

                {/* Password Strength Guidance */}
                <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-[#111827]">Password Strength</span>
                    <span className="font-mono text-[#64748B]">{pwdStrengthCount}/3 met</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[1, 2, 3].map((step) => (
                      <div
                        key={step}
                        className={`h-1.5 rounded-full transition-colors ${
                          pwdStrengthCount >= step ? 'bg-[#047857]' : 'bg-slate-200'
                        }`}
                      />
                    ))}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-1 text-[11px] text-[#64748B]">
                    <span className={pwdChecks.length ? 'text-[#047857] font-medium' : ''}>
                      ✓ 8+ characters
                    </span>
                    <span className={pwdChecks.uppercase ? 'text-[#047857] font-medium' : ''}>
                      ✓ Uppercase letter
                    </span>
                    <span className={pwdChecks.numberOrSymbol ? 'text-[#047857] font-medium' : ''}>
                      ✓ Number or symbol
                    </span>
                  </div>
                </div>

                <label className="flex items-start gap-2 text-xs text-[#64748B] cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={acceptTerms}
                    onChange={(e) => setAcceptTerms(e.target.checked)}
                    className="mt-0.5 rounded border-slate-300 text-[#047857] focus:ring-[#047857]"
                  />
                  <span>
                    I agree to the HelpDesk Pro Master Subscription Agreement, Data Processing
                    Addendum, and Privacy Notice.
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={regLoading}
                  className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-[#047857] hover:bg-[#065F46] rounded-lg transition-colors"
                >
                  {regLoading ? 'Creating account…' : 'Create Account'}
                </button>
              </form>

              {googleError && (
                <p role="alert" className="text-xs text-red-700">
                  {googleError}
                </p>
              )}
              <GoogleAuthButton onCredential={handleGoogleCredential} onError={setGoogleError} />

              <p className="text-center text-xs text-[#64748B]">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => navigateTo('login')}
                  className="font-semibold text-[#047857] hover:underline"
                >
                  Sign in here
                </button>
              </p>
            </div>
          )}

          {/* PAGE 3: FORGOT PASSWORD */}
          {currentView === 'forgot-password' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-[#111827]">Reset your password</h2>
                <p className="text-xs text-[#64748B] mt-1">
                  Enter your work email and we will send time-limited recovery instructions.
                </p>
              </div>

              {!resetSubmitted ? (
                <form onSubmit={handleForgotSubmit} className="space-y-4" noValidate>
                  {resetError && (
                    <div
                      role="alert"
                      className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2"
                    >
                      <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                      <span>{resetError}</span>
                    </div>
                  )}

                  <div>
                    <label
                      htmlFor="reset-email"
                      className="block text-xs font-semibold text-[#111827] mb-1.5"
                    >
                      Work Email Address
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
                      <input
                        id="reset-email"
                        type="email"
                        required
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        placeholder="name@company.com"
                        className="w-full pl-10 pr-3.5 py-2 text-sm bg-white border border-[#E2E8F0] rounded-lg focus:outline-none focus:border-[#047857]"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={resetLoading}
                    className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-[#047857] hover:bg-[#065F46] rounded-lg transition-colors"
                  >
                    {resetLoading ? 'Sending…' : 'Send Reset Instructions'}
                  </button>
                </form>
              ) : (
                <div className="bg-[#ECFDF5] border border-[#10B981]/30 rounded-xl p-5 space-y-4">
                  {resetError && (
                    <p role="alert" className="text-xs text-red-700">
                      {resetError}
                    </p>
                  )}
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-[#047857] shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <h3 className="text-sm font-semibold text-[#065F46]">
                        Check your inbox for recovery instructions
                      </h3>
                      <p className="text-xs text-[#047857] leading-relaxed">
                        If an active HelpDesk Pro account is associated with{' '}
                        <span className="font-mono font-semibold">{resetEmail}</span>, you will
                        receive a password reset link within the next 2 minutes. For security, we do
                        not disclose whether an email address is registered.
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#10B981]/20 flex items-center justify-between gap-2">
                    <span className="text-[11px] text-[#065F46] font-mono tabular-nums flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      {cooldownSeconds > 0
                        ? `Resend available in ${cooldownSeconds}s`
                        : 'Didn’t receive the email?'}
                    </span>
                    <button
                      type="button"
                      disabled={cooldownSeconds > 0 || resendLoading}
                      onClick={handleResendReset}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                        cooldownSeconds > 0
                          ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                          : 'bg-[#047857] text-white hover:bg-[#065F46]'
                      }`}
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>{resendLoading ? 'Sending…' : 'Resend Link'}</span>
                    </button>
                  </div>
                </div>
              )}

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => navigateTo('login')}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#047857] hover:underline"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Sign In</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
