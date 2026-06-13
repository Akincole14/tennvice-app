"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, FileText, Building2, Settings, LogOut, X } from "lucide-react";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";

type Property = { id: string; address: string };

export default function MobileCustomerNav({
  properties,
  name,
  photo,
}: {
  properties: Property[];
  name?: string;
  photo?: string | null;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const initial = (name ?? "C").charAt(0).toUpperCase();

  const navItems = [
    { href: "/portal",        label: "My Home", icon: Home,     exact: true  },
    { href: "/portal/visits", label: "Visits",  icon: FileText, exact: false },
  ];

  return (
    <>
      {/* ── Top header ── */}
      <header className="md:hidden fixed top-0 inset-x-0 z-40 bg-white border-b border-gray-100 h-14 flex items-center px-4 justify-between">
        <Link href="/" className="text-3xl font-bold text-brand-700 hover:opacity-80 transition-opacity">Tennvice</Link>
        <button
          onClick={() => setOpen(true)}
          className="w-8 h-8 rounded-full overflow-hidden shrink-0 ring-2 ring-brand-100"
          aria-label="Open menu"
        >
          {photo ? (
            <img src={photo} alt={name ?? "Customer"} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-brand-600 flex items-center justify-center text-white text-xs font-bold">
              {initial}
            </div>
          )}
        </button>
      </header>

      {/* ── Nav row ── */}
      <nav className="md:hidden fixed top-14 inset-x-0 z-40 bg-white border-b border-gray-200 flex justify-center overflow-x-auto h-12">
        {navItems.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
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
          <div className="px-6 py-4 flex items-center justify-between border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden shrink-0">
                {photo ? (
                  <img src={photo} alt={name ?? "Customer"} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-brand-600 flex items-center justify-center text-white font-bold">
                    {initial}
                  </div>
                )}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{name ?? "Customer"}</p>
                <p className="text-xs text-brand-600">Customer</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="p-2 rounded-xl text-gray-400 hover:bg-gray-100 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="px-4 py-3 space-y-1">
            {properties.length > 0 && (
              <p className="px-4 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-wide">Properties</p>
            )}
            {properties.map((p) => {
              const href = `/portal/properties/${p.id}`;
              return (
                <Link key={p.id} href={href} onClick={() => setOpen(false)}
                  className={cn("flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-colors",
                    pathname === href ? "bg-brand-50 text-brand-700" : "text-gray-700 hover:bg-gray-50")}
                >
                  <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
                    pathname === href ? "bg-brand-100" : "bg-gray-100")}>
                    <Building2 className="w-4 h-4" />
                  </div>
                  <span className="text-base font-semibold truncate">{p.address.split(",")[0]}</span>
                </Link>
              );
            })}
            <Link href="/portal/account" onClick={() => setOpen(false)}
              className={cn("flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-colors",
                pathname.startsWith("/portal/account") ? "bg-brand-50 text-brand-700" : "text-gray-700 hover:bg-gray-50")}
            >
              <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
                pathname.startsWith("/portal/account") ? "bg-brand-100" : "bg-gray-100")}>
                <Settings className="w-4 h-4" />
              </div>
              <span className="text-base font-semibold">Account settings</span>
            </Link>
            <button onClick={() => signOut({ callbackUrl: "/login" })}
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
