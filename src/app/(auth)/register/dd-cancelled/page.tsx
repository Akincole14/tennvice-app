"use client";

import Link from "next/link";
import { XCircle } from "lucide-react";

export default function DDCancelledPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-10 max-w-sm w-full text-center">
        <XCircle className="w-14 h-14 text-orange-400 mx-auto mb-4" />
        <h1 className="text-xl font-bold text-gray-900 mb-2">Direct Debit not set up</h1>
        <p className="text-sm text-gray-500 mb-6">
          Your account has been created but your Direct Debit mandate was not completed. You can set it up later from your account settings.
        </p>
        <Link
          href="/login"
          className="inline-block px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-xl transition-colors"
        >
          Sign in to your account
        </Link>
      </div>
    </div>
  );
}
