"use client";

import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { colors } from "@/lib/constants/colors";

const creators = [
  "Singers",
  "Influencers",
  "Athletes",
  "Actors",
  "Authors",
  "Streamers",
  "Podcasters",
];

const AboutProblem = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <section ref={ref} className="py-14" style={{ backgroundColor: "#FFFFFF" }}>
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="max-w-2xl mx-auto text-center"
        >
          <h2
            className="font-serif text-2xl md:text-3xl mb-4"
            style={{ color: colors.textDark }}
          >
            The Creator{" "}
            <span className="italic" style={{ color: colors.gold }}>
              Treadmill
            </span>
          </h2>

          <p
            className="text-sm leading-relaxed mb-6"
            style={{ color: `${colors.textDark}B3` }}
          >
            If you&apos;re a creator, you know the grind. Stop posting? Rewards
            stop. No new book? No royalties. Miss a season? No paycheck.
            You&apos;re always one step away from zero.
          </p>

          {/* Creator types */}
          <div className="flex flex-wrap justify-center gap-2 mb-6">
            {creators.map((creator, index) => (
              <motion.span
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={isInView ? { opacity: 1, scale: 1 } : {}}
                transition={{ duration: 0.3, delay: 0.3 + index * 0.05 }}
                className="px-3 py-1 rounded-full text-xs"
                style={{
                  backgroundColor: "#F5F5F5",
                  border: `1px solid ${colors.gold}4D`,
                  color: `${colors.textDark}99`,
                }}
              >
                {creator}
              </motion.span>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="rounded-lg p-5"
            style={{ backgroundColor: colors.background }}
          >
            <p
              className="font-medium text-sm mb-1"
              style={{ color: colors.gold }}
            >
              Pauv changes this.
            </p>
            <p
              className="text-xs"
              style={{ color: `${colors.textPrimary}B3` }}
            >
              List yourself once, receive rewards forever—whether you&apos;re
              creating content or not. Your reputation works for you, even while
              you sleep.
            </p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default AboutProblem;
