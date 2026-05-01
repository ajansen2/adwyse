import Link from "next/link";

export function Footer() {
  return (
    <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-white/10 bg-zinc-950">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <img src="/logo.png" alt="AdWyse" className="w-8 h-8" />
              <span className="text-lg font-bold bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
                AdWyse
              </span>
            </div>
            <p className="text-zinc-500 text-sm">
              AI-powered ad attribution for Shopify merchants.
            </p>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Product</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/" className="text-zinc-400 hover:text-white transition">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-zinc-400 hover:text-white transition">
                  About
                </Link>
              </li>
              <li>
                <Link href="/how-it-works" className="text-zinc-400 hover:text-white transition">
                  How It Works
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="text-zinc-400 hover:text-white transition">
                  Pricing
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/privacy" className="text-zinc-400 hover:text-white transition">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-zinc-400 hover:text-white transition">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Contact</h4>
            <a
              href="mailto:adam@adwyse.ca"
              className="text-zinc-400 hover:text-white transition text-sm"
            >
              adam@adwyse.ca
            </a>
          </div>
        </div>
        <div className="border-t border-white/10 pt-8 text-center text-zinc-600 text-sm">
          © {new Date().getFullYear()} AdWyse. All rights reserved.
          <br />
          Operated by Adam Hendra Rais Jansen
        </div>
      </div>
    </footer>
  );
}
