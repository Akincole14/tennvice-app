"use client";

import { useState } from "react";
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react";

type User = { name: string; email: string; phone: string | null };

function StatusMessage({ type, text }: { type: "success" | "error"; text: string }) {
  return (
    <div className={`flex items-center gap-2 text-sm rounded-xl px-4 py-3 ${
      type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
    }`}>
      {type === "success"
        ? <CheckCircle className="w-4 h-4 shrink-0" />
        : <AlertCircle className="w-4 h-4 shrink-0" />}
      {text}
    </div>
  );
}

function Field({ label, type = "text", value, onChange, placeholder, autoComplete }: {
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoComplete?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
      />
    </div>
  );
}

function SaveButton({ loading, label = "Save changes" }: { loading: boolean; label?: string }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="flex items-center gap-2 px-5 py-2.5 bg-brand-600 text-white text-sm font-medium rounded-xl hover:bg-brand-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {label}
    </button>
  );
}

export default function AccountClient({ user }: { user: User }) {
  // ── Profile form ──────────────────────────────────────────────
  const [name,  setName]  = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [phone, setPhone] = useState(user.phone ?? "");
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileStatus, setProfileStatus]   = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setProfileLoading(true);
    setProfileStatus(null);
    try {
      const res = await fetch("/api/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "profile", name, email, phone }),
      });
      const data = await res.json();
      if (!res.ok) setProfileStatus({ type: "error", text: data.error ?? "Something went wrong" });
      else         setProfileStatus({ type: "success", text: "Your details have been updated." });
    } catch {
      setProfileStatus({ type: "error", text: "Network error. Please try again." });
    } finally {
      setProfileLoading(false);
    }
  }

  // ── Password form ─────────────────────────────────────────────
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword,     setNewPassword]     = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwLoading,  setPwLoading]  = useState(false);
  const [pwStatus,   setPwStatus]   = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function savePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPwStatus({ type: "error", text: "New passwords do not match." });
      return;
    }
    setPwLoading(true);
    setPwStatus(null);
    try {
      const res = await fetch("/api/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "password", currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPwStatus({ type: "error", text: data.error ?? "Something went wrong" });
      } else {
        setPwStatus({ type: "success", text: "Password updated successfully." });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch {
      setPwStatus({ type: "error", text: "Network error. Please try again." });
    } finally {
      setPwLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Personal details */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-5">Personal details</h2>
        <form onSubmit={saveProfile} className="space-y-4">
          <Field
            label="Full name"
            value={name}
            onChange={setName}
            placeholder="Your full name"
            autoComplete="name"
          />
          <Field
            label="Email address"
            type="email"
            value={email}
            onChange={setEmail}
            placeholder="you@example.com"
            autoComplete="email"
          />
          <Field
            label="Phone number"
            type="tel"
            value={phone}
            onChange={setPhone}
            placeholder="07700 000000"
            autoComplete="tel"
          />
          {profileStatus && <StatusMessage {...profileStatus} />}
          <div className="pt-1">
            <SaveButton loading={profileLoading} />
          </div>
        </form>
      </div>

      {/* Change password */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-1">Change password</h2>
        <p className="text-sm text-gray-500 mb-5">Must be at least 8 characters.</p>
        <form onSubmit={savePassword} className="space-y-4">
          <Field
            label="Current password"
            type="password"
            value={currentPassword}
            onChange={setCurrentPassword}
            autoComplete="current-password"
          />
          <Field
            label="New password"
            type="password"
            value={newPassword}
            onChange={setNewPassword}
            autoComplete="new-password"
          />
          <Field
            label="Confirm new password"
            type="password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            autoComplete="new-password"
          />
          {pwStatus && <StatusMessage {...pwStatus} />}
          <div className="pt-1">
            <SaveButton loading={pwLoading} label="Update password" />
          </div>
        </form>
      </div>
    </div>
  );
}
