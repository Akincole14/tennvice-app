"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Shield, Droplets, Zap, Flame, AlertTriangle,
  ClipboardList, CheckCircle, ChevronLeft, ChevronRight,
  Star, BookOpen, BadgeCheck, Percent,
} from "lucide-react";
import { cn } from "@/lib/utils";

const slides = [
  {
    tag:      "About Tennvice",
    headline: "Your home deserves a service record",
    body:     "Tennvice is a home maintenance subscription that sends certified technicians to your property for regular inspections — building a verifiable digital logbook every single visit, just like a car service history.",
    accent:   "from-[#4A6ED4] to-[#48BEDA]",
    content: (
      <div className="grid grid-cols-2 gap-4 mt-8">
        {[
          { icon: Shield,        label: "DBS-checked technicians",    sub: "Every engineer is verified & insured" },
          { icon: ClipboardList, label: "Signed inspection reports",  sub: "Digital record after every visit"    },
          { icon: BookOpen,      label: "Running home logbook",       sub: "Full history, always accessible"     },
          { icon: BadgeCheck,    label: "Certified trade work",       sub: "Gas Safe, NICEIC & more"             },
        ].map(({ icon: Icon, label, sub }) => (
          <div key={label} className="bg-white/10 border border-white/30 rounded-2xl p-4 flex items-start gap-3 shadow-lg shadow-black/20">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
              <Icon className="w-4 h-4 text-gray-900" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900 leading-snug">{label}</p>
              <p className="text-xs text-gray-700 mt-0.5">{sub}</p>
            </div>
          </div>
        ))}
      </div>
    ),
  },
  {
    tag:      "Our services",
    headline: "Four essential areas, one subscription",
    body:     "From routine boiler services to emergency electrical faults — Tennvice covers every critical system in your home so nothing is overlooked.",
    accent:   "from-[#F5A820] to-[#E86515]",
    content: (
      <div className="grid grid-cols-2 gap-4 mt-8">
        {[
          { icon: Droplets,      label: "Plumbing",    desc: "Pipes, pressure, water pump, cylinder & leakage checks"       },
          { icon: Zap,           label: "Electrical",  desc: "Circuit, consumer unit, socket & safety inspections"           },
          { icon: Flame,         label: "Boiler",      desc: "Annual service, efficiency check, flue & pressure test"        },
          { icon: AlertTriangle, label: "Emergency",   desc: "Same-week call-outs for urgent plumbing or electrical faults"  },
        ].map(({ icon: Icon, label, desc }) => (
          <div key={label} className="bg-white/10 border border-white/30 rounded-2xl p-4 shadow-lg shadow-black/20">
            <div className="flex items-center gap-2 mb-2">
              <Icon className="w-5 h-5 text-gray-900" />
              <span className="text-sm font-bold text-gray-900">{label}</span>
            </div>
            <p className="text-xs text-gray-700 leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>
    ),
  },
  {
    tag:      "How it works",
    headline: "Up and running in minutes",
    body:     "We keep it simple — choose a plan, we handle the rest. Your first visit is booked within a week and every subsequent one is scheduled around you.",
    accent:   "from-[#E86515] to-[#C0145C]",
    content: (
      <div className="mt-8 space-y-4">
        {[
          { num: "01", title: "Choose your plan",       desc: "Pick the cover that suits your home — Basic annual check to Premium emergency cover."                              },
          { num: "02", title: "We schedule your visits", desc: "We match you with a local certified technician and book visits at times that work for you."                         },
          { num: "03", title: "Receive your report",    desc: "After every visit you get a signed inspection report with results, recommendations, and your running service history." },
        ].map(({ num, title, desc }) => (
          <div key={num} className="flex items-start gap-4 bg-white/10 border border-white/30 rounded-2xl p-4 shadow-lg shadow-black/20">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0 font-bold text-gray-900 text-sm">
              {num}
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">{title}</p>
              <p className="text-xs text-gray-700 mt-0.5 leading-relaxed">{desc}</p>
            </div>
          </div>
        ))}
      </div>
    ),
  },
  {
    tag:      "What you get",
    headline: "Peace of mind, built into your subscription",
    body:     "Every plan includes tangible benefits — from a growing digital logbook to emergency call-outs and discounts on parts and labour.",
    accent:   "from-[#C0145C] to-[#4A6ED4]",
    content: (
      <div className="mt-8 grid grid-cols-2 gap-4">
        {[
          { icon: BookOpen,      label: "Digital service logbook",  sub: "Every visit logged permanently"          },
          { icon: ClipboardList, label: "Signed inspection reports", sub: "Sharable with buyers, landlords & agents" },
          { icon: Percent,       label: "Parts & labour discounts", sub: "Up to 20% off on all call-out work"       },
          { icon: AlertTriangle, label: "Emergency cover",          sub: "48-hr response on Premium plans"          },
          { icon: Star,          label: "Verified technicians",     sub: "Only top-rated, certified engineers"       },
          { icon: CheckCircle,   label: "Cancel any time",          sub: "No long contracts or lock-ins"            },
        ].map(({ icon: Icon, label, sub }) => (
          <div key={label} className="flex items-start gap-3 bg-white/10 border border-white/30 rounded-2xl p-3 shadow-lg shadow-black/20">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0 mt-0.5">
              <Icon className="w-3.5 h-3.5 text-gray-900" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900 leading-snug">{label}</p>
              <p className="text-xs text-gray-700 mt-0.5">{sub}</p>
            </div>
          </div>
        ))}
      </div>
    ),
  },
];

export default function ChampionCarousel() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  const next = useCallback(() => setActive(a => (a + 1) % slides.length), []);
  const prev = useCallback(() => setActive(a => (a - 1 + slides.length) % slides.length), []);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(next, 6000);
    return () => clearInterval(id);
  }, [paused, next]);

  const slide = slides[active];

  return (
    <section
      id="services"
      className="py-20 px-6 tv-gradient relative overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Subtle blob decorations */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full bg-white/5 blur-3xl" />
      </div>

      <div className="relative max-w-5xl mx-auto">
        {/* Header row */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <span className={cn(
              "inline-block text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full bg-white/15 text-white/80 mb-3"
            )}>
              {slide.tag}
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-white leading-snug">
              {slide.headline}
            </h2>
            <p className="text-white/65 mt-3 text-base max-w-xl leading-relaxed">
              {slide.body}
            </p>
          </div>

          {/* Prev / Next */}
          <div className="hidden sm:flex items-center gap-2 shrink-0 ml-8">
            <button
              onClick={prev}
              className="w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors"
              aria-label="Previous"
            >
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
            <button
              onClick={next}
              className="w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors"
              aria-label="Next"
            >
              <ChevronRight className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Slide content */}
        <div key={active} className="animate-fade-in">
          {slide.content}
        </div>

        {/* Dot indicators + mobile arrows */}
        <div className="flex items-center justify-between mt-10">
          <div className="flex gap-2">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setActive(i)}
                aria-label={`Go to slide ${i + 1}`}
                className={cn(
                  "h-2 rounded-full transition-all duration-300",
                  i === active ? "w-8 bg-white" : "w-2 bg-white/35 hover:bg-white/55"
                )}
              />
            ))}
          </div>

          {/* Mobile prev/next */}
          <div className="flex sm:hidden items-center gap-2">
            <button onClick={prev} className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors" aria-label="Previous">
              <ChevronLeft className="w-4 h-4 text-white" />
            </button>
            <button onClick={next} className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors" aria-label="Next">
              <ChevronRight className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
