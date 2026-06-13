"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

export default function OwnerSignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors shrink-0"
    >
      <LogOut className="w-4 h-4" />
      <span className="hidden sm:inline">Sign out</span>
    </button>
  );
}
