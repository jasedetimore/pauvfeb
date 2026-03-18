"use client";

import React from "react";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { colors } from "@/lib/constants/colors";

const AboutVideo = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <section ref={ref} className="py-14" style={{ backgroundColor: "#FFFFFF" }}>
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="max-w-5xl mx-auto text-center"
        >
          <h2
            className="font-serif text-2xl md:text-3xl mb-6"
            style={{ color: colors.textDark }}
          >
            See How It <span className="italic">Works</span>
          </h2>

          {/* Platform Summary */}
          <div className="max-w-3xl mx-auto mt-8 mb-10">
            <p
              className="font-serif text-lg md:text-xl leading-relaxed"
              style={{ color: colors.textSecondary }}
            >
              Pauv is the first true market for human potential. We transform influence into a tradable asset, allowing fans and early believers to back the creators, athletes, and visionaries they support. Instead of just consuming content, you can now own a stake in their success and trade on their trajectory.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default AboutVideo;
