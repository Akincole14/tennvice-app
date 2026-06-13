"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X, Shield, Info, PoundSterling, Wrench, LayoutDashboard } from "lucide-react";
import { useSession } from "next-auth/react";

const links = [
  { href: "#features",     label: "Features",     icon: Shield },
  { href: "#services",     label: "Services",     icon: Wrench },
  { href: "#how-it-works", label: "How it works",  icon: Info },
  { href: "#pricing",      label: "Pricing",       icon: PoundSterling },
];

function dashboardHref(role?: string | null) {
  if (role === "CUSTOMER")   return "/portal";
  if (role === "TECHNICIAN") return "/tech";
  if (role === "OWNER")      return "/owner/dashboard";
  if (role === "MANAGER")    return "/manager/dashboard";
  return "/dashboard";
}

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen]         = useState(false);
  const { data: session, status } = useSession();

  const user      = session?.user as any;
  const loggedIn  = status === "authenticated";
  const initial   = user?.name?.charAt(0)?.toUpperCase() ?? "?";
  const href      = dashboardHref(user?.role);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      <header
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-200 ${
          scrolled || open
            ? "bg-white/95 backdrop-blur-md shadow-sm"
            : "bg-white md:bg-transparent"
        }`}
      >
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-brand-700 shrink-0" onClick={() => setOpen(false)}>
            Tennvice
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-8">
            {links.map(l => (
              <a
                key={l.href}
                href={l.href}
                className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
              >
                {l.label}
              </a>
            ))}
          </nav>

          {/* Desktop CTAs */}
          <div className="hidden md:flex items-center gap-3">
            {loggedIn ? (
              <Link
                href={href}
                className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl border border-gray-200 hover:border-brand-300 hover:bg-brand-50 transition-colors group"
              >
                <div className="w-7 h-7 rounded-full bg-brand-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                  {initial}
                </div>
                <span className="text-sm font-semibold text-gray-700 group-hover:text-brand-700 flex items-center gap-1.5">
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  Dashboard
                </span>
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Sign in
                </Link>
                <Link
                  href="/register"
                  className="text-sm font-semibold bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700 transition-colors"
                >
                  Get started
                </Link>
              </>
            )}
          </div>

          {/* Mobile toggle */}
          <button
            onClick={() => setOpen(o => !o)}
            className="md:hidden p-2 text-gray-600 hover:text-gray-900"
            aria-label="Toggle menu"
          >
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* ── Mobile menu ── */}
      <div
        className={`fixed inset-0 z-[60] md:hidden transition-all duration-300 ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />

        {/* Slide-down panel */}
        <div
          className={`absolute top-0 inset-x-0 bg-white shadow-2xl rounded-b-3xl transition-transform duration-300 ease-out ${
            open ? "translate-y-0" : "-translate-y-full"
          }`}
        >
          {/* Panel header */}
          <div className="px-6 py-4 flex items-center justify-between border-b border-gray-100">
            <Link
              href="/"
              className="text-2xl font-bold text-brand-700"
              onClick={() => setOpen(false)}
            >
              Tennvice
            </Link>
            <button
              onClick={() => setOpen(false)}
              className="p-2 rounded-xl text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Nav links */}
          <nav className="px-4 py-4 space-y-1">
            {links.map(l => {
              const Icon = l.icon;
              return (
                <a
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-4 px-4 py-3.5 rounded-2xl text-gray-700 hover:bg-brand-50 hover:text-brand-700 transition-colors group"
                >
                  <div className="w-9 h-9 rounded-xl bg-gray-100 group-hover:bg-brand-100 flex items-center justify-center shrink-0 transition-colors">
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-base font-semibold">{l.label}</span>
                </a>
              );
            })}
          </nav>

          {/* CTA buttons */}
          <div className="px-6 pb-8 pt-3 space-y-3 border-t border-gray-100">
            {loggedIn ? (
              <Link
                href={href}
                onClick={() => setOpen(false)}
                className="flex items-center justify-center gap-2.5 text-sm font-semibold text-white tv-gradient-warm py-3 rounded-xl hover:opacity-90 transition-opacity"
              >
                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-white text-xs font-bold shrink-0">
                  {initial}
                </div>
                <LayoutDashboard className="w-4 h-4" />
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="block text-center text-sm font-semibold text-gray-700 border border-gray-300 py-3 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Sign in
                </Link>
                <Link
                  href="/register"
                  onClick={() => setOpen(false)}
                  className="block text-center text-sm font-semibold text-white tv-gradient-warm py-3 rounded-xl hover:opacity-90 transition-opacity"
                >
                  Get started →
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
