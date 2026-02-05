import { motion } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import logoGold from "@/assets/pauv-logo-gold.png";

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const navRef = useRef<HTMLElement | null>(null);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    const headerHeight = navRef.current?.offsetHeight ?? 0;
    const top = el.getBoundingClientRect().top + window.scrollY - headerHeight;
    window.scrollTo({ top, behavior: "smooth" });
    try {
      window.history.replaceState(null, "", `#${id}`);
    } catch (_) {
      // ignore
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <motion.nav
      animate={{ y: 0 }}
      transition={{ duration: 0.6 }}
      ref={navRef}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b ${
        scrolled
          ? "bg-dark/95 backdrop-blur-md border-gold/10"
          : "bg-dark border-dark"
      }`}
    >
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <a
            href="#"
            className="flex items-center"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: "smooth" });
              try {
                window.history.replaceState(null, "", "/");
              } catch (_) {
                // ignore
              }
            }}
          >
            <img src={logoGold} alt="Pauv" className="h-8" />
          </a>

          {/* Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <a
              href="#benefits"
              onClick={(e) => {
                e.preventDefault();
                scrollToSection("benefits");
              }}
              className="text-light/70 hover:text-gold transition-colors text-sm tracking-wide"
            >
              Benefits
            </a>
            <a
              href="#how-it-works"
              onClick={(e) => {
                e.preventDefault();
                scrollToSection("how-it-works");
              }}
              className="text-light/70 hover:text-gold transition-colors text-sm tracking-wide"
            >
              How It Works
            </a>
            <a
              href="#faq"
              onClick={(e) => {
                e.preventDefault();
                scrollToSection("faq");
              }}
              className="text-light/70 hover:text-gold transition-colors text-sm tracking-wide"
            >
              FAQ
            </a>
          </div>

          {/* CTA */}
          <a 
            href="#waitlist"
            onClick={(e) => {
              e.preventDefault();
              scrollToSection("waitlist");
            }}
            className="bg-gold text-dark px-6 py-2.5 rounded-full text-sm font-medium hover:bg-gold-light transition-colors"
          >
            Get in Contact
          </a>
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar;
