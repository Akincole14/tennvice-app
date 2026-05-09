"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Home, Calendar, FileText, LogOut, Wrench, ClipboardList } from "lucide-react";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";

const adminNav = [
  { href: "/dashboard",    label: "Dashboard",    icon: LayoutDashboard },
  { href: "/customers",    label: "Customers",    icon: Users },
  { href: "/properties",   label: "Properties",   icon: Home },
  { href: "/visits",       label: "Visits",       icon: Calendar },
  { href: "/technicians",  label: "Technicians",  icon: Wrench },
  { href: "/reports",      label: "Reports",      icon: ClipboardList },
];

const customerNav = [
  { href: "/portal", label: "My Home", icon: Home },
  { href: "/portal/visits", label: "Visit History", icon: FileText },
];

export default function Sidebar({ role }: { role: "ADMIN" | "TECHNICIAN" | "CUSTOMER" }) {
  const pathname = usePathname();
  const nav = role === "CUSTOMER" ? customerNav : adminNav;

  return (
    <aside className="w-60 min-h-screen bg-white border-r border-gray-200 flex flex-col">
      <div className="px-6 py-5 border-b border-gray-100">
        <span className="text-2xl font-bold text-brand-700">TennVice</span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {nav.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              (href === "/dashboard" ? pathname === href : pathname.startsWith(href))
                ? "bg-brand-50 text-brand-700"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
          </Link>
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-gray-100">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 w-full transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
