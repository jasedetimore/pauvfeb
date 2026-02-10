"use client";

import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { colors } from "@/lib/constants/colors";

const AboutCTA = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <section ref={ref} className="py-16" style={{ backgroundColor: colors.gold }}>
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center max-w-xl mx-auto"
        >
          <h2
            className="font-mono text-3xl md:text-4xl mb-4"
            style={{ color: colors.textDark }}
          >
            Ready to <span className="italic">Start</span>?
          </h2>
          <p
            className="text-sm mb-6"
            style={{ color: `${colors.textDark}B3` }}
          >
            Join the dreamers turning their potential into passive income. 10
            minutes. Zero cost. Lifetime earnings.
          </p>

          <a href="#waitlist">
            <button
              className="rounded-full px-8 py-3 text-sm font-medium transition-colors hover:opacity-90"
              style={{
                backgroundColor: colors.textDark,
                color: colors.textPrimary,
              }}
            >
              Get in Contact →
            </button>
          </a>

          <div
            className="mt-6 flex flex-wrap justify-center gap-4 text-xs"
            style={{ color: `${colors.textDark}99` }}
          >
            <span>✓ Free to join</span>
            <span>✓ No lawyers</span>
            <span>✓ 10 min setup</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default AboutCTA;
