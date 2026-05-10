"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Users, Calendar, Wrench,
  Home, ClipboardList, Settings, LogOut, X,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard",   label: "Dashboard",   icon: LayoutDashboard, exact: true  },
  { href: "/customers",   label: "Customers",   icon: Users,           exact: false },
  { href: "/visits",      label: "Visits",      icon: Calendar,        exact: false },
  { href: "/technicians", label: "Technicians", icon: Wrench,          exact: false },
];

const moreItems = [
  { href: "/properties", icon: Home,          label: "Properties"       },
  { href: "/reports",    icon: ClipboardList, label: "Reports"          },
  { href: "/account",    icon: Settings,      label: "Account settings" },
];

export default function MobileAdminNav({ name, photo }: { name: string; photo?: string | null }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const initial = (name || "A").charAt(0).toUpperCase();

  const isActive = (href: string, exact: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  return (
    <>
      {/* ── Top header ── */}
      <header className="md:hidden fixed top-0 inset-x-0 z-40 bg-white border-b border-gray-100 h-14 flex items-center px-4 justify-between">
        <span className="text-xl font-bold text-brand-700">Tennvice</span>
        <button
          onClick={() => setOpen(true)}
          className="w-8 h-8 rounded-full overflow-hidden shrink-0 ring-2 ring-brand-100"
          aria-label="Open menu"
        >
          {photo ? (
            <img src={photo} alt={name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-brand-600 flex items-center justify-center text-white text-xs font-bold">
              {initial}
            </div>
          )}
        </button>
      </header>

      {/* ── Nav row (h-12 = 48px, so total fixed height = 56+48 = 104px) ── */}
      <nav className="md:hidden fixed top-14 inset-x-0 z-40 bg-white border-b border-gray-200 flex overflow-x-auto h-12">
        {navItems.map(({ href, label, icon: Icon, exact }) => {
          const active = isActive(href, exact);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex-shrink-0 flex flex-col items-center gap-0.5 px-5 py-2.5 border-b-2 transition-colors",
                active
                  ? "border-brand-500 text-brand-600"
                  : "border-transparent text-gray-500 hover:text-gray-800"
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[11px] font-medium whitespace-nowrap">{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* ── More sheet (avatar) ── */}
      <div
        className={cn(
          "md:hidden fixed inset-0 z-50 transition-all duration-300",
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
      >
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
        <div
          className={cn(
            "absolute bottom-0 inset-x-0 bg-white rounded-t-3xl shadow-2xl transition-transform duration-300 ease-out",
            open ? "translate-y-0" : "translate-y-full"
          )}
        >
          <div className="px-6 py-4 flex items-center justify-between border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden shrink-0">
                {photo ? (
                  <img src={photo} alt={name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-brand-600 flex items-center justify-center text-white font-bold">
                    {initial}
                  </div>
                )}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{name}</p>
                <p className="text-xs text-brand-600">Administrator</p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="p-2 rounded-xl text-gray-400 hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="px-4 py-3 space-y-1">
            {moreItems.map(({ href, icon: Icon, label }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-colors",
                  pathname.startsWith(href) ? "bg-brand-50 text-brand-700" : "text-gray-700 hover:bg-gray-50"
                )}
              >
                <div className={cn(
                  "w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
                  pathname.startsWith(href) ? "bg-brand-100" : "bg-gray-100"
                )}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-base font-semibold">{label}</span>
              </Link>
            ))}
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="flex items-center gap-4 px-4 py-3.5 rounded-2xl w-full text-left text-red-600 hover:bg-red-50 transition-colors"
            >
              <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
                <LogOut className="w-4 h-4" />
              </div>
              <span className="text-base font-semibold">Sign out</span>
            </button>
          </nav>
          <div className="h-6" />
        </div>
      </div>
    </>
  );
}
