import Link from "next/link";
import { SUBSCRIPTION_TIERS } from "@/lib/utils";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <span className="text-2xl font-bold text-brand-700">TennVice</span>
        <Link
          href="/login"
          className="text-sm font-medium text-brand-600 hover:text-brand-700"
        >
          Sign in
        </Link>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 py-20 text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-6">
          Your home, always in good health.
        </h1>
        <p className="text-xl text-gray-500 mb-10 max-w-2xl mx-auto">
          TennVice provides qualified technicians for regular plumbing and electrical
          health checks — giving you a full service history for your home, just like
          a car service record.
        </p>
        <Link
          href="/login"
          className="inline-block bg-brand-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-brand-700 transition-colors"
        >
          Get started
        </Link>
      </section>

      {/* Pricing */}
      <section className="bg-gray-50 py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Simple, transparent pricing
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Object.entries(SUBSCRIPTION_TIERS).map(([key, tier]) => (
              <div
                key={key}
                className={`bg-white rounded-2xl border p-6 flex flex-col ${
                  key === "PREMIUM" ? "border-brand-500 shadow-lg" : "border-gray-200"
                }`}
              >
                {key === "PREMIUM" && (
                  <span className="text-xs font-semibold text-brand-600 uppercase tracking-wide mb-2">
                    Most popular
                  </span>
                )}
                <h3 className="text-lg font-bold text-gray-900">{tier.label}</h3>
                <p className="text-3xl font-bold text-brand-600 my-3">
                  £{tier.price}
                  <span className="text-sm font-normal text-gray-400">/mo</span>
                </p>
                <ul className="text-sm text-gray-600 space-y-2 flex-1">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <span className="text-green-500 mt-0.5">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center text-sm text-gray-400 py-8">
        © {new Date().getFullYear()} TennVice. All rights reserved.
      </footer>
    </main>
  );
}
