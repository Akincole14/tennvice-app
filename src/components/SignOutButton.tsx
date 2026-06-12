"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

export default function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="inline-flex items-center gap-2 text-sm font-medium text-red-600 border border-red-200 bg-red-50 hover:bg-red-100 px-4 py-2 rounded-xl transition-colors"
    >
      <LogOut className="w-4 h-4" />
      Sign out
    </button>
  );
}
