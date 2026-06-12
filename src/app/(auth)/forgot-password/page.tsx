"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, AlertCircle, CheckCircle2 } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email,   setEmail]   = useState("");
  const [sent,    setSent]    = useState(false);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    // Placeholder — wire up to your email/reset API when ready
    await new Promise(r => setTimeout(r, 1000));
    setLoading(false);
    setSent(true);
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col px-6">
      {/* Back to sign in */}
      <div className="w-full max-w-sm mx-auto py-4">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to sign in
        </Link>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center py-8">
        <div className="w-full max-w-sm">
          <div className="mb-8 text-center">
            <span className="text-2xl font-bold text-brand-700">Tennvice</span>
            <h2 className="text-2xl font-bold text-gray-900 mt-6">Forgot your password?</h2>
            <p className="text-gray-500 mt-1 text-sm">
              Enter your email and we'll send you a reset link.
            </p>
          </div>

          {sent ? (
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7 text-green-500" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Check your inbox</p>
                <p className="text-sm text-gray-500 mt-1">
                  If <span className="font-medium text-gray-700">{email}</span> is registered, you'll receive a reset link shortly.
                </p>
              </div>
              <Link
                href="/login"
                className="mt-2 text-sm font-medium text-brand-600 hover:text-brand-800 transition-colors"
              >
                Return to sign in
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="flex items-start gap-2.5 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Email address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  placeholder="you@example.com"
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-shadow placeholder:text-gray-400"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-brand-600 text-white py-3 rounded-xl font-semibold hover:bg-brand-700 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-brand-200"
              >
                {loading ? "Sending…" : "Send reset link"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
