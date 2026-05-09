import Link from "next/link";
import {
  Shield, Clock, Wrench, Zap, CheckCircle, ArrowRight,
  Home, Droplets, Flame, AlertTriangle, Star, ClipboardList,
} from "lucide-react";
import Navbar from "@/components/marketing/Navbar";
import Footer from "@/components/marketing/Footer";
import { SUBSCRIPTION_TIERS } from "@/lib/utils";

// ─── Data ────────────────────────────────────────────────────────────────────

const stats = [
  { value: "1,200+", label: "Homes protected" },
  { value: "8,400+", label: "Visits completed" },
  { value: "4.9 ★",  label: "Average rating" },
  { value: "48 hr",  label: "Emergency response" },
];

const features = [
  {
    icon: ClipboardList,
    title: "Full service history",
    body: "Every visit generates a signed inspection report, giving your home the same kind of verifiable service record your car has.",
    color: "bg-blue-50 text-blue-600",
  },
  {
    icon: Shield,
    title: "Certified technicians",
    body: "Every technician is DBS-checked, insured, and holds the relevant trade qualifications — verified by our AI certificate system.",
    color: "bg-green-50 text-green-600",
  },
  {
    icon: Zap,
    title: "Emergency cover",
    body: "Premium and Enterprise members get guaranteed emergency call-outs, with a 48-hour response commitment.",
    color: "bg-amber-50 text-amber-600",
  },
  {
    icon: Clock,
    title: "No call-out surprises",
    body: "Your subscription covers scheduled visits and parts discounts. You'll always know what you're paying before we arrive.",
    color: "bg-purple-50 text-purple-600",
  },
];

const steps = [
  {
    number: "01",
    title: "Choose your plan",
    body: "Pick the cover that suits your home — from a basic annual check to full emergency cover with unlimited call-outs.",
  },
  {
    number: "02",
    title: "We schedule your visits",
    body: "We match you with a local, certified technician and book visits at times that work for you.",
  },
  {
    number: "03",
    title: "Receive your report",
    body: "After every visit you get a signed inspection report with check results, recommendations, and your running service history.",
  },
];

const services = [
  { icon: Droplets,      label: "Plumbing",    desc: "Pipes, pressure, water pump, cylinder, leakage checks" },
  { icon: Zap,           label: "Electrical",  desc: "Circuit, consumer unit, socket and safety inspections" },
  { icon: Flame,         label: "Boiler",      desc: "Annual service, efficiency check, flue and pressure test" },
  { icon: AlertTriangle, label: "Emergency",   desc: "Same-week call-outs for urgent plumbing or electrical faults" },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

const tierHighlight: Record<string, boolean> = { PREMIUM: true };

// ─── Page ────────────────────────────────────────────────────────────────────

export default function HomePage() {
  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-white">

        {/* ── Hero ── */}
        <section className="relative overflow-hidden bg-gradient-to-br from-brand-50 via-white to-blue-50 pt-36 pb-24 px-6">
          {/* Background decoration */}
          <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-brand-100/40 blur-3xl" />
            <div className="absolute -bottom-20 -left-20 w-[400px] h-[400px] rounded-full bg-blue-100/30 blur-3xl" />
          </div>

          <div className="relative max-w-5xl mx-auto text-center">
            <span className="inline-flex items-center gap-2 text-xs font-semibold text-brand-700 bg-brand-100 px-3 py-1.5 rounded-full mb-6">
              <Shield className="w-3.5 h-3.5" />
              Trusted home maintenance subscription
            </span>

            <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 leading-tight mb-6">
              Your home, always
              <br />
              <span className="text-brand-600">in good health.</span>
            </h1>

            <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">
              TennVice sends certified technicians for regular plumbing, electrical and boiler checks — giving your home a verifiable service record, just like a car.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4">
              <a
                href="#pricing"
                className="inline-flex items-center gap-2 bg-brand-600 text-white px-7 py-3.5 rounded-xl font-semibold hover:bg-brand-700 transition-colors shadow-lg shadow-brand-200"
              >
                See our plans <ArrowRight className="w-4 h-4" />
              </a>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 border border-gray-300 text-gray-700 px-7 py-3.5 rounded-xl font-medium hover:bg-gray-50 transition-colors"
              >
                Sign in
              </Link>
            </div>
          </div>

          {/* Visual mock — service report card */}
          <div className="relative max-w-2xl mx-auto mt-16">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Service report · May 2025</p>
                  <p className="font-semibold text-gray-900 mt-0.5">12 Maple Close, London</p>
                </div>
                <span className="px-2.5 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">Signed</span>
              </div>
              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: "Pipes",     result: "Pass",     color: "text-green-600 bg-green-50" },
                  { label: "Heating",   result: "Pass",     color: "text-green-600 bg-green-50" },
                  { label: "Pressure",  result: "Advisory", color: "text-amber-600 bg-amber-50" },
                  { label: "Electrical",result: "Pass",     color: "text-green-600 bg-green-50" },
                  { label: "Boiler",    result: "Pass",     color: "text-green-600 bg-green-50" },
                  { label: "Leakage",   result: "Pass",     color: "text-green-600 bg-green-50" },
                  { label: "Cylinder",  result: "Pass",     color: "text-green-600 bg-green-50" },
                  { label: "Water pump",result: "Pass",     color: "text-green-600 bg-green-50" },
                ].map(c => (
                  <div key={c.label} className={`rounded-xl px-3 py-2.5 ${c.color.split(" ")[1]}`}>
                    <p className="text-xs text-gray-500">{c.label}</p>
                    <p className={`text-xs font-semibold ${c.color.split(" ")[0]}`}>{c.result}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
                <span className="flex items-center gap-1.5"><Wrench className="w-3.5 h-3.5" /> Mike Johnson · Certified technician</span>
                <span>Visit #14 of 24</span>
              </div>
            </div>
          </div>
        </section>

        {/* ── Stats ── */}
        <section className="border-y border-gray-100 bg-white py-10 px-6">
          <div className="max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-8 text-center">
            {stats.map(s => (
              <div key={s.label}>
                <p className="text-3xl font-bold text-brand-600">{s.value}</p>
                <p className="text-sm text-gray-500 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Features ── */}
        <section id="features" className="py-24 px-6 bg-gray-50">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-14">
              <h2 className="text-4xl font-bold text-gray-900">Why homeowners choose TennVice</h2>
              <p className="text-lg text-gray-500 mt-4 max-w-xl mx-auto">
                We combine qualified tradespeople with digital record-keeping so you always know your home's condition.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {features.map(f => (
                <div key={f.title} className="bg-white rounded-2xl border border-gray-200 p-7 flex gap-5">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${f.color}`}>
                    <f.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-lg">{f.title}</h3>
                    <p className="text-gray-500 mt-1.5 text-sm leading-relaxed">{f.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── How it works ── */}
        <section id="how-it-works" className="py-24 px-6 bg-white">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-14">
              <h2 className="text-4xl font-bold text-gray-900">How it works</h2>
              <p className="text-lg text-gray-500 mt-4 max-w-lg mx-auto">
                Up and running in minutes. Your first visit booked within a week.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {steps.map((step, i) => (
                <div key={step.number} className="relative">
                  {i < steps.length - 1 && (
                    <div aria-hidden className="hidden md:block absolute top-8 left-full w-full h-px bg-gray-200 -translate-x-8 z-0" />
                  )}
                  <div className="relative z-10">
                    <div className="w-14 h-14 rounded-2xl bg-brand-600 text-white flex items-center justify-center font-bold text-lg mb-5">
                      {step.number}
                    </div>
                    <h3 className="font-semibold text-gray-900 text-lg mb-2">{step.title}</h3>
                    <p className="text-gray-500 text-sm leading-relaxed">{step.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Services ── */}
        <section className="py-20 px-6 bg-brand-600">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-white">Everything your home needs</h2>
              <p className="text-brand-200 mt-3 text-base">One subscription, four service areas.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {services.map(s => (
                <div key={s.label} className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-white border border-white/10">
                  <s.icon className="w-7 h-7 mb-4 text-brand-200" />
                  <h3 className="font-semibold text-lg mb-1.5">{s.label}</h3>
                  <p className="text-brand-100 text-sm leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Pricing ── */}
        <section id="pricing" className="py-24 px-6 bg-gray-50">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-14">
              <h2 className="text-4xl font-bold text-gray-900">Simple, transparent pricing</h2>
              <p className="text-lg text-gray-500 mt-4 max-w-xl mx-auto">
                No hidden call-out fees. No surprise invoices. Just one monthly subscription.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5 items-start">
              {(Object.entries(SUBSCRIPTION_TIERS) as [string, typeof SUBSCRIPTION_TIERS[keyof typeof SUBSCRIPTION_TIERS]][]).map(([key, tier]) => {
                const highlighted = tierHighlight[key];
                return (
                  <div
                    key={key}
                    className={`relative bg-white rounded-2xl border p-6 flex flex-col ${
                      highlighted
                        ? "border-brand-500 shadow-xl shadow-brand-100 ring-2 ring-brand-500"
                        : "border-gray-200"
                    }`}
                  >
                    {highlighted && (
                      <div className="absolute -top-3.5 left-0 right-0 flex justify-center">
                        <span className="inline-flex items-center gap-1 text-xs font-semibold bg-brand-600 text-white px-3 py-1 rounded-full">
                          <Star className="w-3 h-3" /> Most popular
                        </span>
                      </div>
                    )}
                    <h3 className="text-base font-bold text-gray-900">{tier.label}</h3>
                    <div className="mt-3 mb-5">
                      <span className="text-3xl font-bold text-brand-600">£{tier.price}</span>
                      <span className="text-sm text-gray-400">/mo</span>
                    </div>
                    <ul className="space-y-2.5 flex-1 mb-6">
                      {tier.features.map(f => (
                        <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                          <CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                          {f}
                        </li>
                      ))}
                    </ul>
                    <a
                      href="/login"
                      className={`block text-center text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors ${
                        highlighted
                          ? "bg-brand-600 text-white hover:bg-brand-700"
                          : "border border-gray-300 text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      Get started
                    </a>
                  </div>
                );
              })}
            </div>

            <p className="text-center text-sm text-gray-400 mt-8">
              All plans include a digital service logbook, certified technicians, and our online customer portal.
            </p>
          </div>
        </section>

        {/* ── Social proof ── */}
        <section className="py-20 px-6 bg-white">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">What our customers say</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  quote: "Finally a service that treats my home like my car. I have a full history of every check and I can share it with any buyer or landlord.",
                  name: "Sarah K.",
                  location: "Homeowner · London",
                },
                {
                  quote: "The technician was on time, professional, and the report was in my inbox before he'd even left. Exactly what I needed.",
                  name: "James T.",
                  location: "Landlord · Manchester",
                },
                {
                  quote: "We had an emergency over the bank holiday. TennVice had someone with us within 24 hours. Worth every penny of Premium.",
                  name: "Priya M.",
                  location: "Homeowner · Birmingham",
                },
              ].map(r => (
                <div key={r.name} className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                  <div className="flex gap-0.5 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-gray-700 text-sm leading-relaxed mb-4">"{r.quote}"</p>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{r.name}</p>
                    <p className="text-xs text-gray-400">{r.location}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA banner ── */}
        <section className="py-20 px-6 bg-gray-900">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-brand-400 bg-brand-950/50 border border-brand-800 px-3 py-1.5 rounded-full mb-6">
              <Home className="w-3.5 h-3.5" />
              Protect your home today
            </div>
            <h2 className="text-4xl font-bold text-white mb-5">
              Ready to give your home a service record?
            </h2>
            <p className="text-gray-400 text-lg mb-8 max-w-xl mx-auto">
              Join over 1,200 homeowners and landlords who trust TennVice to keep their properties safe, compliant, and documented.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <a
                href="#pricing"
                className="inline-flex items-center gap-2 bg-brand-600 text-white px-7 py-3.5 rounded-xl font-semibold hover:bg-brand-700 transition-colors"
              >
                View plans <ArrowRight className="w-4 h-4" />
              </a>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 border border-gray-700 text-gray-300 px-7 py-3.5 rounded-xl font-medium hover:bg-gray-800 transition-colors"
              >
                Sign in to your account
              </Link>
            </div>
          </div>
        </section>

      </main>

      <Footer />
    </>
  );
}
