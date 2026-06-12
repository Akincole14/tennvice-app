import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400">
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="col-span-2 md:col-span-2">
            <span className="text-2xl font-bold text-white">Tennvice</span>
            <p className="mt-3 text-sm leading-relaxed max-w-xs">
              Subscription-based home maintenance giving every home a full service history — just like your car.
            </p>
          </div>

          {/* Product */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-4">Product</p>
            <ul className="space-y-3 text-sm">
              <li><a href="#features"     className="hover:text-white transition-colors">Features</a></li>
              <li><a href="#how-it-works" className="hover:text-white transition-colors">How it works</a></li>
              <li><a href="#pricing"      className="hover:text-white transition-colors">Pricing</a></li>
              <li><Link href="/login"     className="hover:text-white transition-colors">Sign in</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-4">Company</p>
            <ul className="space-y-3 text-sm">
              <li><a href="#" className="hover:text-white transition-colors">Privacy policy</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Terms of service</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Contact us</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-800 text-xs text-center text-gray-600">
          © {new Date().getFullYear()} Tennvice Ltd. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
