import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import GoldButton from "../ui/GoldButton";

const CTA = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <section ref={ref} className="py-16 bg-gold">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center max-w-xl mx-auto"
        >
          <h2 className="font-serif text-3xl md:text-4xl text-dark mb-4">
            Ready to <span className="italic">Start</span>?
          </h2>
          <p className="text-dark/70 text-sm mb-6">
            Join the dreamers turning their potential into passive income. 
            10 minutes. Zero cost. Lifetime earnings.
          </p>

          <a href="#waitlist">
            <GoldButton variant="dark" size="lg">
              Get in Contact →
            </GoldButton>
          </a>

          <div className="mt-6 flex flex-wrap justify-center gap-4 text-dark/60 text-xs">
            <span>✓ Free to join</span>
            <span>✓ No lawyers</span>
            <span>✓ 10 min setup</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CTA;
