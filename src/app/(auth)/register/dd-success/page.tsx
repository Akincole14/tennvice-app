"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { CheckCircle, Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function DDSuccessPage() {
  const params          = useSearchParams();
  const router          = useRouter();
  const billingRequestId = params.get("billing_request_id");
  const [status, setStatus] = useState<"loading" | "signing-in" | "error">("loading");
  const [error,  setError]  = useState<string | null>(null);

  useEffect(() => {
    if (!billingRequestId) {
      setStatus("error");
      setError("Missing billing request reference.");
      return;
    }

    async function complete() {
      // Notify our server to fetch the mandate and create the subscription
      const res = await fetch("/api/dd/complete", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ billingRequestId }),
      });

      // 202 means mandate not yet confirmed (webhook will catch it) — proceed anyway
      if (!res.ok && res.status !== 202) {
        const data = await res.json().catch(() => ({}));
        setStatus("error");
        setError(data.error ?? "Failed to confirm your Direct Debit. Please contact support.");
        return;
      }

      // Auto sign-in using credentials stored in sessionStorage before the redirect
      setStatus("signing-in");
      const stored = sessionStorage.getItem("tv_reg");
      if (stored) {
        const { email, password } = JSON.parse(stored);
        sessionStorage.removeItem("tv_reg");
        const result = await signIn("credentials", { email, password, redirect: false });
        if (result?.ok) {
          router.push("/portal");
          return;
        }
      }
      // Credentials unavailable — send to login
      router.push("/login?registered=1");
    }

    complete();
  }, [billingRequestId, router]);

  return (
    <div className="min-h-screen tv-gradient-light flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-10 max-w-sm w-full text-center">
        {status === "error" ? (
          <>
            <AlertCircle className="w-14 h-14 text-red-500 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-gray-900 mb-2">Something went wrong</h1>
            <p className="text-sm text-gray-500 mb-6">{error}</p>
            <Link href="/register" className="text-sm font-medium text-brand-700 hover:underline">
              Back to registration
            </Link>
          </>
        ) : (
          <>
            <CheckCircle className="w-14 h-14 text-green-500 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-gray-900 mb-2">Direct Debit confirmed</h1>
            <p className="text-sm text-gray-500 mb-6">
              {status === "signing-in"
                ? "Signing you in…"
                : "Setting up your subscription…"}
            </p>
            <Loader2 className="w-6 h-6 text-brand-600 animate-spin mx-auto" />
          </>
        )}
      </div>
    </div>
  );
}
