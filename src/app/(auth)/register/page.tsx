"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Check,
  ChevronRight,
  ChevronLeft,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  Home,
  User,
  CreditCard,
  ShieldCheck,
  Lock,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";
import { SUBSCRIPTION_TIERS } from "@/lib/utils";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type FormData = {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  address: string;
  postcode: string;
  propertyType: string;
  ownershipType: string;
  bedrooms: string;
  subscriptionTier: string;
  landlordProperties: string;
  landlordRooms: string;
};

const INITIAL: FormData = {
  name: "", email: "", phone: "", password: "", confirmPassword: "",
  address: "", postcode: "", propertyType: "House", ownershipType: "OWNER", bedrooms: "",
  subscriptionTier: "STANDARD",
  landlordProperties: "", landlordRooms: "",
};

// ─── Step indicator ───────────────────────────────────────────────────────────

const STEPS = [
  { label: "Your details",  icon: User },
  { label: "Your property", icon: Home },
  { label: "Choose plan",   icon: ShieldCheck },
  { label: "Direct debit",  icon: CreditCard },
];

function StepBar({ current }: { current: number }) {
  return (
    <ol className="flex items-center gap-0">
      {STEPS.map((s, i) => {
        const done   = i < current;
        const active = i === current;
        const Icon   = s.icon;
        return (
          <li key={i} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-colors",
                  done   ? "bg-brand-600 text-white"
                  : active ? "bg-brand-600 text-white ring-4 ring-brand-100"
                  :          "bg-gray-100 text-gray-400"
                )}
              >
                {done ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
              </div>
              <span className={cn(
                "text-[11px] mt-1 font-medium hidden sm:block",
                active ? "text-brand-700" : done ? "text-gray-500" : "text-gray-400"
              )}>
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={cn(
                "h-0.5 w-10 sm:w-16 mx-1 mb-4 rounded",
                i < current ? "bg-brand-600" : "bg-gray-200"
              )} />
            )}
          </li>
        );
      })}
    </ol>
  );
}

// ─── Field helpers ────────────────────────────────────────────────────────────

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
      {error && (
        <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />{error}
        </p>
      )}
    </div>
  );
}

const inputCls = (err?: string) =>
  cn(
    "w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition",
    err ? "border-red-400 bg-red-50" : "border-gray-300 bg-white"
  );

// ─── Step 1 — Personal details ────────────────────────────────────────────────

function Step1({
  data,
  set,
  errors,
}: {
  data: FormData;
  set: (k: keyof FormData, v: string) => void;
  errors: Partial<Record<keyof FormData, string>>;
}) {
  const [show,  setShow]  = useState(false);
  const [showC, setShowC] = useState(false);
  return (
    <div className="space-y-4">
      <Field label="Full name" error={errors.name}>
        <input className={inputCls(errors.name)} value={data.name} onChange={e => set("name", e.target.value)} placeholder="Jane Smith" />
      </Field>
      <Field label="Email address" error={errors.email}>
        <input className={inputCls(errors.email)} type="email" value={data.email} onChange={e => set("email", e.target.value)} placeholder="jane@example.com" />
      </Field>
      <Field label="Phone number (optional)">
        <input className={inputCls()} value={data.phone} onChange={e => set("phone", e.target.value)} placeholder="+44 7700 900000" />
      </Field>
      <Field label="Password" error={errors.password}>
        <div className="relative">
          <input className={inputCls(errors.password)} type={show ? "text" : "password"} value={data.password} onChange={e => set("password", e.target.value)} placeholder="Min 8 characters" />
          <button type="button" onClick={() => setShow(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </Field>
      <Field label="Confirm password" error={errors.confirmPassword}>
        <div className="relative">
          <input className={inputCls(errors.confirmPassword)} type={showC ? "text" : "password"} value={data.confirmPassword} onChange={e => set("confirmPassword", e.target.value)} placeholder="Repeat password" />
          <button type="button" onClick={() => setShowC(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            {showC ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </Field>
    </div>
  );
}

// ─── Step 2 — Property details ────────────────────────────────────────────────

const PROPERTY_TYPES  = ["House", "Flat", "Bungalow", "Maisonette", "Other"];
const OWNERSHIP_TYPES = [
  { value: "OWNER",    label: "Owner-occupied" },
  { value: "TENANT",   label: "Tenant" },
  { value: "LANDLORD", label: "Landlord" },
];

function Step2({
  data,
  set,
  errors,
}: {
  data: FormData;
  set: (k: keyof FormData, v: string) => void;
  errors: Partial<Record<keyof FormData, string>>;
}) {
  const isLandlord = data.ownershipType === "LANDLORD";

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Ownership">
          <select className={inputCls()} value={data.ownershipType} onChange={e => set("ownershipType", e.target.value)}>
            {OWNERSHIP_TYPES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </Field>
        <Field label="Property type">
          <select className={inputCls()} value={data.propertyType} onChange={e => set("propertyType", e.target.value)}>
            {PROPERTY_TYPES.map(t => <option key={t}>{t}</option>)}
          </select>
        </Field>
      </div>

      {isLandlord && (
        <div className="space-y-4 rounded-2xl border border-brand-200 bg-brand-50/50 p-4">
          <p className="text-xs font-semibold text-brand-700 uppercase tracking-wide">Landlord details</p>
          <Field label="Number of properties">
            <select
              className={inputCls()}
              value={data.landlordProperties}
              onChange={e => { set("landlordProperties", e.target.value); set("landlordRooms", ""); }}
            >
              <option value="">Select…</option>
              {["1","2","3","4","5","6","7","8","9","10+"].map(n => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </Field>

          {data.landlordProperties && (
            <Field label="Rooms per property">
              <select
                className={inputCls()}
                value={data.landlordRooms}
                onChange={e => set("landlordRooms", e.target.value)}
              >
                <option value="">Select…</option>
                <option value="1-2">1–2 rooms</option>
                <option value="2-4">2–4 rooms</option>
                <option value="4-6">4–6 rooms</option>
                <option value="6+">6+ rooms</option>
              </select>
            </Field>
          )}
        </div>
      )}

      <Field label="Property address" error={errors.address}>
        <input className={inputCls(errors.address)} value={data.address} onChange={e => set("address", e.target.value)} placeholder="12 Acacia Avenue, London" />
      </Field>
      <Field label="Postcode" error={errors.postcode}>
        <input className={cn(inputCls(errors.postcode), "uppercase")} value={data.postcode} onChange={e => set("postcode", e.target.value.toUpperCase())} placeholder="SW1A 1AA" />
      </Field>

      {!isLandlord && (
        <Field label="Bedrooms (optional)">
          <select className={inputCls()} value={data.bedrooms} onChange={e => set("bedrooms", e.target.value)}>
            <option value="">Select…</option>
            {["1","2","3","4","5"].map(n => <option key={n} value={n}>{n}{n === "5" ? "+" : ""}</option>)}
          </select>
        </Field>
      )}
    </div>
  );
}

// ─── Step 3 — Choose plan ─────────────────────────────────────────────────────

const TIER_ORDER = ["BASIC", "STANDARD", "PLUS", "PREMIUM"] as const;

function Step3({ data, set }: { data: FormData; set: (k: keyof FormData, v: string) => void }) {
  return (
    <div className="space-y-3">
      {TIER_ORDER.map(key => {
        const tier     = SUBSCRIPTION_TIERS[key];
        const selected = data.subscriptionTier === key;
        const popular  = key === "PREMIUM";
        return (
          <button
            key={key}
            type="button"
            onClick={() => set("subscriptionTier", key)}
            className={cn(
              "w-full text-left rounded-2xl border-2 p-4 transition-all",
              selected
                ? "border-brand-600 bg-brand-50 shadow-sm"
                : "border-gray-200 bg-white hover:border-brand-300"
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-gray-900">{tier.label}</span>
                  {popular && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-600 text-white uppercase tracking-wide">
                      Popular
                    </span>
                  )}
                </div>
                <ul className="space-y-0.5">
                  {tier.features.map(f => (
                    <li key={f} className="flex items-center gap-1.5 text-xs text-gray-600">
                      <Check className="w-3.5 h-3.5 text-brand-600 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="shrink-0 text-right">
                <span className="text-2xl font-bold text-gray-900">£{tier.price}</span>
                <span className="text-xs text-gray-500">/mo</span>
                <div className={cn(
                  "mt-2 w-5 h-5 rounded-full border-2 flex items-center justify-center ml-auto",
                  selected ? "border-brand-600 bg-brand-600" : "border-gray-300"
                )}>
                  {selected && <Check className="w-3 h-3 text-white" />}
                </div>
              </div>
            </div>
          </button>
        );
      })}
      <div className="rounded-2xl border-2 border-dashed border-gray-200 p-4 flex items-center justify-between">
        <div>
          <p className="font-semibold text-gray-700">Enterprise</p>
          <p className="text-xs text-gray-500">12+ visits · dedicated manager · custom pricing</p>
        </div>
        <Link href="/#contact" className="text-sm font-medium text-brand-700 hover:underline shrink-0">
          Contact us →
        </Link>
      </div>
    </div>
  );
}

// ─── Step 4 — Direct debit via GoCardless ─────────────────────────────────────

function Step4({ data, isLandlord }: { data: FormData; isLandlord: boolean }) {
  if (isLandlord) {
    return (
      <div className="space-y-5">
        <div className="bg-brand-50 rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-brand-600 shrink-0" />
            <p className="text-sm font-semibold text-brand-900">Landlord enquiry</p>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed">
            A member of our team will be in touch with you shortly to review your submission and give you your quote.
          </p>
          <ul className="space-y-2 pt-1">
            {[
              "Tailored pricing for your portfolio",
              "Dedicated account manager",
              "Flexible visit scheduling across all properties",
              "Consolidated billing and reporting",
            ].map(item => (
              <li key={item} className="flex items-center gap-2 text-xs text-gray-600">
                <Check className="w-3.5 h-3.5 text-green-500 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border border-gray-200 p-4 space-y-2">
          <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1">Submission summary</p>
          {[
            { label: "Number of properties", value: data.landlordProperties || "—" },
            { label: "Rooms per property",   value: data.landlordRooms ? `${data.landlordRooms} rooms` : "—" },
            { label: "Property type",        value: data.propertyType || "—" },
            { label: "Address",              value: [data.address, data.postcode].filter(Boolean).join(", ") || "—" },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-start justify-between gap-4 text-sm">
              <span className="text-gray-400 shrink-0">{label}</span>
              <span className="text-gray-700 font-medium text-right">{value}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const tier = SUBSCRIPTION_TIERS[data.subscriptionTier as keyof typeof SUBSCRIPTION_TIERS];
  return (
    <div className="space-y-5">
      {/* Order summary */}
      <div className="bg-brand-50 rounded-2xl p-5">
        <p className="text-xs font-semibold text-brand-700 uppercase tracking-wide mb-3">Order summary</p>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-gray-900">{tier.label} plan</p>
            <p className="text-xs text-gray-500 mt-0.5">{tier.visitsPerYear} visits/year · {tier.discount}% discount on parts &amp; labour</p>
          </div>
          <div className="text-right">
            <span className="text-2xl font-bold text-brand-700">£{tier.price}</span>
            <span className="text-xs text-gray-500">/mo</span>
          </div>
        </div>
      </div>

      {/* GoCardless explanation */}
      <div className="rounded-2xl border border-gray-200 p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Lock className="w-4 h-4 text-brand-600 shrink-0" />
          <p className="text-sm font-semibold text-gray-900">Secure Direct Debit via GoCardless</p>
        </div>
        <p className="text-sm text-gray-500">
          Clicking <strong>Set up Direct Debit</strong> will create your account and open the GoCardless secure payment page where you can enter your bank details. Your information is never stored on our servers.
        </p>
        <ul className="space-y-2">
          {[
            "Protected by the Direct Debit Guarantee",
            "Bank-level 256-bit encryption",
            "FCA regulated payment provider",
            "Cancel anytime from your account",
          ].map(item => (
            <li key={item} className="flex items-center gap-2 text-xs text-gray-600">
              <Check className="w-3.5 h-3.5 text-green-500 shrink-0" />
              {item}
            </li>
          ))}
        </ul>
      </div>

      {/* DD Guarantee notice */}
      <p className="text-[11px] text-gray-400 leading-relaxed">
        Payments are collected by GoCardless Ltd on behalf of Tennvice. GoCardless is authorised by the Financial Conduct Authority under the Payment Services Regulations 2017, registration number 597190, for the provision of payment services.
      </p>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function RegisterPage() {
  const router  = useRouter();
  const [step,              setStep]              = useState(0);
  const [form,              setForm]              = useState<FormData>(INITIAL);
  const [errors,            setErrors]            = useState<Partial<Record<keyof FormData, string>>>({});
  const [apiErr,            setApiErr]            = useState<string | null>(null);
  const [loading,           setLoading]           = useState(false);
  const [landlordSubmitted, setLandlordSubmitted] = useState(false);

  const isLandlord = form.ownershipType === "LANDLORD";

  function set(key: keyof FormData, value: string) {
    setForm(f => ({ ...f, [key]: value }));
    setErrors(e => ({ ...e, [key]: undefined }));
  }

  function validate(): boolean {
    const errs: Partial<Record<keyof FormData, string>> = {};

    if (step === 0) {
      if (!form.name.trim())  errs.name  = "Name is required";
      if (!form.email.trim()) errs.email = "Email is required";
      else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = "Enter a valid email";
      if (form.password.length < 8) errs.password = "At least 8 characters";
      if (form.password !== form.confirmPassword) errs.confirmPassword = "Passwords don't match";
    }
    if (step === 1) {
      if (!form.address.trim())  errs.address  = "Address is required";
      if (!form.postcode.trim()) errs.postcode = "Postcode is required";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function next() {
    if (!validate()) return;
    if (step === 1 && isLandlord) { setStep(3); return; }
    setStep(s => s + 1);
  }

  function back() {
    setErrors({});
    if (step === 3 && isLandlord) { setStep(1); return; }
    setStep(s => s - 1);
  }

  async function submit() {
    setLoading(true);
    setApiErr(null);

    try {
      const res = await fetch("/api/register", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          name:               form.name,
          email:              form.email,
          phone:              form.phone,
          password:           form.password,
          address:            form.address,
          postcode:           form.postcode,
          propertyType:       form.propertyType,
          ownershipType:      form.ownershipType,
          bedrooms:           form.bedrooms,
          subscriptionTier:   form.subscriptionTier,
          landlordProperties: form.landlordProperties || undefined,
          landlordRooms:      form.landlordRooms || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setApiErr(data.error ?? "Registration failed");
        setLoading(false);
        return;
      }

      if (isLandlord) {
        setLandlordSubmitted(true);
        setLoading(false);
        return;
      }

      // Store credentials briefly so dd-success page can auto sign-in
      sessionStorage.setItem("tv_reg", JSON.stringify({ email: form.email, password: form.password }));

      // Redirect to GoCardless (or fallback login page)
      window.location.href = data.redirectUrl;
    } catch {
      setApiErr("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen tv-gradient-light flex flex-col p-4">
      {/* Back to home — pinned to top */}
      <div className="w-full max-w-lg mx-auto py-3">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-brand-700 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to home
        </Link>
      </div>

      {/* Centred content */}
      <div className="flex-1 flex items-center justify-center">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="text-3xl font-bold text-brand-700 inline-block mb-2">Tennvice</Link>
          <h1 className="text-2xl font-bold text-gray-900">Create your account</h1>
          <p className="text-gray-500 mt-1 text-sm">Set up your home maintenance subscription in minutes</p>
        </div>

        {/* Step bar */}
        <div className="flex justify-center mb-8">
          <StepBar current={step} />
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-8">
          {landlordSubmitted ? (
            <div className="text-center space-y-4 py-4">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Enquiry received!</h2>
              <p className="text-gray-500 text-sm leading-relaxed max-w-sm mx-auto">
                A member of our team will be in touch with you shortly to review your submission and give you your quote.
              </p>
              <Link
                href="/"
                className="inline-block mt-4 text-sm font-semibold text-brand-600 hover:underline"
              >
                Back to home
              </Link>
            </div>
          ) : (
            <>
              <h2 className="text-lg font-semibold text-gray-900 mb-6">{STEPS[step].label}</h2>

              {step === 0 && <Step1 data={form} set={set} errors={errors} />}
              {step === 1 && <Step2 data={form} set={set} errors={errors} />}
              {step === 2 && <Step3 data={form} set={set} />}
              {step === 3 && <Step4 data={form} isLandlord={isLandlord} />}

              {apiErr && (
                <div className="mt-5 flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {apiErr}
                </div>
              )}

              {/* Navigation */}
              <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
                {step > 0 ? (
                  <button
                    type="button"
                    onClick={back}
                    disabled={loading}
                    className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 disabled:opacity-40"
                  >
                    <ChevronLeft className="w-4 h-4" /> Back
                  </button>
                ) : (
                  <Link href="/login" className="text-sm text-gray-500 hover:text-gray-700">
                    Already have an account?
                  </Link>
                )}

                {step < 3 ? (
                  <button
                    type="button"
                    onClick={next}
                    className="flex items-center gap-1.5 px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-xl transition-colors"
                  >
                    Continue <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={submit}
                    disabled={loading}
                    className="flex items-center gap-2 px-6 py-2.5 tv-gradient-warm disabled:opacity-60 text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity"
                  >
                    {loading ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</>
                    ) : isLandlord ? (
                      <>Submit enquiry <ArrowRight className="w-4 h-4" /></>
                    ) : (
                      <>Set up Direct Debit <ArrowRight className="w-4 h-4" /></>
                    )}
                  </button>
                )}
              </div>
            </>
          )}
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          By registering you agree to our{" "}
          <Link href="/terms" className="underline hover:text-gray-600">Terms of Service</Link>{" "}
          and{" "}
          <Link href="/privacy" className="underline hover:text-gray-600">Privacy Policy</Link>.
        </p>
      </div>
      </div>
    </div>
  );
}
