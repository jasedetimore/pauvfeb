import logoGold from "@/assets/pauv-logo-gold.png";

const Footer = () => {
  return (
    <footer className="py-12 bg-dark border-t border-gold/10">
      <div className="container mx-auto px-6">
        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
          {/* Column 1: Brand */}
          <div className="space-y-4">
            <img src={logoGold} alt="Pauv Inc." className="h-8" />
            <p className="text-light/60 text-sm leading-relaxed">
              Unlocking the value of the creator economy.
            </p>
          </div>

          {/* Column 2: Company */}
          <div className="space-y-4">
            <h4 className="text-light font-semibold text-sm uppercase tracking-wider">
              Company
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="#"
                  className="text-light/50 hover:text-gold transition-colors"
                >
                  About Us
                </a>
              </li>
              <li>
                <a
                  href="/contact"
                  className="text-light/50 hover:text-gold transition-colors"
                >
                  Contact
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: Legal */}
          <nav className="space-y-4" aria-label="Legal">
            <h4 className="text-light font-semibold text-sm uppercase tracking-wider">
              Legal
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="/terms"
                  className="text-light/50 hover:text-gold transition-colors"
                >
                  Terms of Service
                </a>
              </li>
              <li>
                <a
                  href="/privacy"
                  className="text-light/50 hover:text-gold transition-colors"
                >
                  Privacy Policy
                </a>
              </li>
              <li>
                <a
                  href="/refunds"
                  className="text-light/50 hover:text-gold transition-colors"
                >
                  Refund Policy
                </a>
              </li>
            </ul>
          </nav>

          {/* Column 4: Contact Info */}
          <div className="space-y-4">
            <h4 className="text-light font-semibold text-sm uppercase tracking-wider">
              Contact Info
            </h4>
            <div className="space-y-2 text-sm text-light/50">
              <p className="leading-relaxed">
                5206 Regency Cv<br />
                Austin, TX 78724
              </p>
              <p>
                <a
                  href="mailto:support@pauv.com"
                  className="hover:text-gold transition-colors"
                >
                  support@pauv.com
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-gold/10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-light/30 text-sm">
              © 2026 Pauv Inc.
            </p>
            <p className="text-light/30 text-xs text-center md:text-right max-w-xl">
              USDP are platform-specific credits with no cash value. PVs are digital collectibles and do not represent ownership in any person or entity.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
