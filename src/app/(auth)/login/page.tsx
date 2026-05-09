"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, AlertCircle, Shield, ClipboardList, Clock, ArrowLeft } from "lucide-react";

const benefits = [
  { icon: ClipboardList, text: "Full service history for every property" },
  { icon: Shield,        text: "Certified, DBS-checked technicians" },
  { icon: Clock,         text: "48-hour emergency response on Premium" },
];

export default function LoginPage() {
  const router = useRouter();
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPwd,  setShowPwd]  = useState(false);
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);

    if (result?.error) {
      setError("Incorrect email or password. Please try again.");
      return;
    }

    const res     = await fetch("/api/auth/session");
    const session = await res.json();
    const role    = session?.user?.role;

    router.push(
      role === "CUSTOMER"   ? "/portal" :
      role === "TECHNICIAN" ? "/tech"   :
      "/dashboard"
    );
  }

  return (
    <div className="min-h-screen flex">

      {/* ── Left brand panel ── */}
      <div className="hidden lg:flex lg:w-1/2 tv-gradient flex-col justify-between p-12 relative overflow-hidden">
        {/* Background decoration */}
        <div aria-hidden className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-white/5 blur-2xl" />
          <div className="absolute -bottom-24 -right-24 w-80 h-80 rounded-full bg-blue-500/20 blur-2xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-brand-500/10 blur-3xl" />
        </div>

        {/* Logo */}
        <div className="relative">
          <Link href="/" className="inline-flex items-center gap-2 text-white">
            <span className="text-2xl font-bold">TennVice</span>
          </Link>
        </div>

        {/* Headline + benefits */}
        <div className="relative space-y-8">
          <div>
            <h1 className="text-4xl font-bold text-white leading-snug">
              Your home's service record,<br />always accessible.
            </h1>
            <p className="mt-4 text-brand-100 text-base leading-relaxed max-w-sm">
              Sign in to view your visit history, inspection reports, and home health status — all in one place.
            </p>
          </div>

          <ul className="space-y-4">
            {benefits.map(b => (
              <li key={b.text} className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
                  <b.icon className="w-4.5 h-4.5 text-white w-[18px] h-[18px]" />
                </div>
                <span className="text-brand-50 text-sm">{b.text}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Bottom trust note */}
        <div className="relative">
          <p className="text-brand-200 text-xs">
            © {new Date().getFullYear()} TennVice Ltd · Secured & encrypted
          </p>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 bg-white">

        {/* Back to home — mobile only shows logo too */}
        <div className="w-full max-w-sm mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </Link>

          {/* Logo on mobile (hidden on desktop where left panel shows it) */}
          <div className="mt-6 lg:hidden">
            <span className="text-2xl font-bold text-brand-700">TennVice</span>
          </div>
        </div>

        {/* Form card */}
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Welcome back</h2>
            <p className="text-gray-500 mt-1 text-sm">Sign in to your account to continue</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2.5 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                {error}
              </div>
            )}

            {/* Email */}
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

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPwd ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-shadow placeholder:text-gray-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label={showPwd ? "Hide password" : "Show password"}
                >
                  {showPwd ? <EyeOff className="w-4.5 h-4.5 w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-600 text-white py-3 rounded-xl font-semibold hover:bg-brand-700 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-brand-200 mt-1"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                  Signing in…
                </span>
              ) : "Sign in"}
            </button>
          </form>

          {/* Divider */}
          <div className="mt-8 pt-6 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-400">
              Don't have an account?{" "}
              <Link href="/register" className="text-brand-600 font-medium hover:underline">
                Create one
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
