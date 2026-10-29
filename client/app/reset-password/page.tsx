'use client';

import Link from 'next/link';
import { useEffect, useState, type FormEvent } from 'react';
import { AuthApiService } from '@/services/api';

export default function ResetPasswordPage() {
  const [token, setToken] = useState('');
  const [tokenLoaded, setTokenLoaded] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [complete, setComplete] = useState(false);

  useEffect(() => {
    setToken(new URLSearchParams(window.location.search).get('token') || '');
    setTokenLoaded(true);
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!token) {
      setError('This password reset link is invalid or incomplete.');
      return;
    }
    if (password.length < 8 || password.length > 128) {
      setError('Password must be between 8 and 128 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Password confirmation does not match.');
      return;
    }

    setSubmitting(true);
    try {
      await AuthApiService.resetPassword(token, password);
      setComplete(true);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Could not reset your password. Please request a new link and try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-6">
      <section className="w-full max-w-md rounded-2xl border border-[#E2E8F0] bg-white p-8 shadow-sm">
        <h1 className="text-xl font-bold text-[#111827]">
          {complete ? 'Password updated' : 'Choose a new password'}
        </h1>
        <p className="mt-2 text-sm text-[#64748B]">
          {complete
            ? 'Your password has been reset. You can now sign in with your new password.'
            : 'Enter a new password for your HelpDesk Pro account.'}
        </p>

        {complete ? (
          <Link
            href="/"
            className="mt-6 inline-flex w-full justify-center rounded-lg bg-[#047857] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#065F46]"
          >
            Return to HelpDesk Pro
          </Link>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {error && (
              <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </p>
            )}
            {tokenLoaded && !token && (
              <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                This password reset link is invalid or incomplete.
              </p>
            )}
            <div>
              <label htmlFor="new-password" className="mb-1.5 block text-sm font-semibold text-[#111827]">
                New password
              </label>
              <input
                id="new-password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                maxLength={128}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-lg border border-[#E2E8F0] px-3.5 py-2 text-sm focus:border-[#047857] focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="confirm-password" className="mb-1.5 block text-sm font-semibold text-[#111827]">
                Confirm new password
              </label>
              <input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                maxLength={128}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="w-full rounded-lg border border-[#E2E8F0] px-3.5 py-2 text-sm focus:border-[#047857] focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={submitting || !tokenLoaded || !token}
              className="w-full rounded-lg bg-[#047857] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#065F46] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? 'Updating password…' : 'Reset Password'}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}
