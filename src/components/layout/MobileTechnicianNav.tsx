"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Calendar, Award, MoreHorizontal, Settings, LogOut, X } from "lucide-react";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";

const tabItems = [
  { href: "/tech",              label: "Dashboard",   icon: LayoutDashboard, exact: true },
  { href: "/tech/visits",       label: "Visits",      icon: Calendar,        exact: false },
  { href: "/tech/certificates", label: "Certificates", icon: Award,           exact: false },
];

export default function MobileTechnicianNav({
  name,
  photo,
}: {
  name: string;
  photo?: string | null;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const initial = (name || "T").charAt(0).toUpperCase();

  const isActive = (href: string, exact: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  const moreActive = pathname.startsWith("/tech/account");

  return (
    <>
      {/* ── Top header ── */}
      <header className="md:hidden fixed top-0 inset-x-0 z-40 bg-white border-b border-gray-200 px-4 h-14 flex items-center justify-between">
        <div>
          <span className="text-xl font-bold text-brand-700">Tennvice</span>
          <span className="ml-2 text-xs text-gray-400">Technician</span>
        </div>
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

      {/* ── Bottom tab bar ── */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-gray-200 flex items-stretch">
        {tabItems.map(({ href, label, icon: Icon, exact }) => {
          const active = isActive(href, exact);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex-1 flex flex-col items-center justify-center gap-0.5 py-2 transition-colors",
                active ? "text-brand-600" : "text-gray-400"
              )}
            >
              <Icon className={cn("w-5 h-5", active && "stroke-[2.5]")} />
              <span className="text-[10px] font-medium leading-none">{label}</span>
            </Link>
          );
        })}
        <button
          onClick={() => setOpen(true)}
          className={cn(
            "flex-1 flex flex-col items-center justify-center gap-0.5 py-2 transition-colors",
            moreActive || open ? "text-brand-600" : "text-gray-400"
          )}
          aria-label="More options"
        >
          <MoreHorizontal className="w-5 h-5" />
          <span className="text-[10px] font-medium leading-none">More</span>
        </button>
      </nav>

      {/* ── More sheet ── */}
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
          {/* Sheet header */}
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
                <p className="text-xs text-brand-600">Technician</p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="p-2 rounded-xl text-gray-400 hover:bg-gray-100 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="px-4 py-3 space-y-1">
            <Link
              href="/tech/account"
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-colors",
                moreActive ? "bg-brand-50 text-brand-700" : "text-gray-700 hover:bg-gray-50"
              )}
            >
              <div className={cn(
                "w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
                moreActive ? "bg-brand-100" : "bg-gray-100"
              )}>
                <Settings className="w-4 h-4" />
              </div>
              <span className="text-base font-semibold">Account settings</span>
            </Link>

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
