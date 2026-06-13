import Link from "next/link";
import {
  Shield, Clock, Zap, CheckCircle, ArrowRight,
  Home, Star, ClipboardList,
} from "lucide-react";
import Navbar from "@/components/marketing/Navbar";
import Footer from "@/components/marketing/Footer";
import ChampionCarousel from "@/components/marketing/ChampionCarousel";
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

// ─── Helpers ─────────────────────────────────────────────────────────────────

const tierHighlight: Record<string, boolean> = { PLUS: true };

// ─── Page ────────────────────────────────────────────────────────────────────

export default function HomePage() {
  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-white">

        {/* ── Hero ── */}
        <section className="relative overflow-hidden tv-gradient-light pt-28 pb-16 sm:pt-36 sm:pb-24 px-6">
          {/* Background decoration */}
          <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-[#F5A820]/20 blur-3xl" />
            <div className="absolute -bottom-20 -left-20 w-[400px] h-[400px] rounded-full bg-[#4A6ED4]/15 blur-3xl" />
            <div className="absolute top-1/2 -right-20 w-[300px] h-[300px] rounded-full bg-[#C0145C]/10 blur-3xl" />
          </div>

          <div className="relative max-w-5xl mx-auto text-center">
            <span className="inline-flex items-center gap-2 text-xs font-semibold text-white tv-gradient-warm px-3 py-1.5 rounded-full mb-6 shadow-sm">
              <Shield className="w-3.5 h-3.5" />
              Trusted home maintenance subscription
            </span>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 leading-tight mb-5 sm:mb-6">
              Protect Your Home &
              <br />
              <span
                className="bg-clip-text text-transparent"
                style={{ backgroundImage: "linear-gradient(135deg, #F5A820 0%, #E86515 50%, #C0145C 100%)" }}
              >
                Have Some Peace Of Mind!
              </span>
            </h1>

            <p className="text-base sm:text-xl text-gray-500 max-w-2xl mx-auto mb-8 sm:mb-10 leading-relaxed">
              We are guaranteed to provide you the best home utility maintenance service, to put yours and your family's minds at rest!<br />Certified technicians for regular plumbing, electrical and boiler checks — giving your home a verifiable service record!
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4">
              <a
                href="#pricing"
                className="inline-flex items-center gap-2 tv-gradient-warm text-white px-7 py-3.5 rounded-xl font-semibold transition-opacity hover:opacity-90 shadow-lg shadow-brand-200"
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
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">Why homeowners choose Tennvice</h2>
              <p className="text-base sm:text-lg text-gray-500 mt-4 max-w-xl mx-auto">
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
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">How it works</h2>
              <p className="text-base sm:text-lg text-gray-500 mt-4 max-w-lg mx-auto">
                Up and running in minutes. Your first visit booked within a week.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
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

        {/* ── Champion carousel ── */}
        <ChampionCarousel />

        {/* ── Pricing ── */}
        <section id="pricing" className="py-24 px-6 bg-gray-50">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-14">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">Simple, transparent pricing</h2>
              <p className="text-base sm:text-lg text-gray-500 mt-4 max-w-xl mx-auto">
                No hidden call-out fees. No surprise invoices. Just one monthly subscription.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5 items-start">
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
                      {key === "ENTERPRISE" ? (
                        <span className="text-2xl font-bold text-brand-600">Get A Quote</span>
                      ) : (
                        <>
                          <span className="text-3xl font-bold text-brand-600">£{tier.price}</span>
                          <span className="text-sm text-gray-400">/mo</span>
                        </>
                      )}
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
                      href={key === "ENTERPRISE" ? "/contact" : "/login"}
                      className={`block text-center text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors ${
                        highlighted
                          ? "bg-brand-600 text-white hover:bg-brand-700"
                          : "border border-gray-300 text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      {key === "ENTERPRISE" ? "Contact us" : "Get started"}
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
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center mb-12">What our customers say</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
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
                  quote: "We had an emergency over the bank holiday. Tennvice had someone with us within 24 hours. Worth every penny of Premium.",
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
        <section className="py-20 px-6 tv-gradient-dark relative overflow-hidden">
          <div aria-hidden className="pointer-events-none absolute inset-0">
            <div className="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full bg-[#E86515]/10 blur-3xl" />
            <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full bg-[#4A6ED4]/10 blur-3xl" />
          </div>
          <div className="relative max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-white/80 bg-white/10 border border-white/20 px-3 py-1.5 rounded-full mb-6">
              <Home className="w-3.5 h-3.5" />
              Protect your home today
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-5">
              Ready to give your home a service record?
            </h2>
            <p className="text-white/60 text-base sm:text-lg mb-8 max-w-xl mx-auto">
              Join over 1,200 homeowners and landlords who trust Tennvice to keep their properties safe, compliant, and documented.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <a
                href="#pricing"
                className="inline-flex items-center gap-2 tv-gradient-warm text-white px-7 py-3.5 rounded-xl font-semibold hover:opacity-90 transition-opacity shadow-lg"
              >
                View plans <ArrowRight className="w-4 h-4" />
              </a>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 border border-white/30 text-white/80 px-7 py-3.5 rounded-xl font-medium hover:bg-white/10 transition-colors"
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
