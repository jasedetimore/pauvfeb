"use client";

import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { colors } from "@/lib/constants/colors";

const AboutStory = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <section
      ref={ref}
      className="py-14"
      style={{ backgroundColor: colors.background }}
    >
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="max-w-2xl mx-auto text-center"
        >
          <span
            className="font-medium tracking-wide text-xs uppercase mb-3 block"
            style={{ color: colors.gold }}
          >
            The Pauv Story
          </span>
          <h2
            className="font-serif text-2xl md:text-3xl mb-6"
            style={{ color: colors.textPrimary }}
          >
            From Garage to <span className="italic">Platinum</span>
          </h2>

          <div
            className="rounded-xl p-6 text-left"
            style={{ backgroundColor: colors.box }}
          >
            <p
              className="text-sm leading-relaxed mb-4"
              style={{ color: `${colors.textPrimary}CC` }}
            >
              <span className="font-medium" style={{ color: colors.gold }}>
                Little Timmy
              </span>{" "}
              just graduated high school. He doesn&apos;t want college—he wants
              to be a singer. He takes 10 minutes to list himself on Pauv. Cost:{" "}
              <span style={{ color: colors.gold }}>$0</span>.
            </p>
            <p
              className="text-sm leading-relaxed mb-4"
              style={{ color: `${colors.textPrimary}CC` }}
            >
              His grandma, teachers, and early supporters buy his PVs. A decade
              later, Little Timmy is a star.
            </p>
            <p
              className="text-sm leading-relaxed"
              style={{ color: `${colors.textPrimary}CC` }}
            >
              Those early supporters? They celebrate his success with unique
              digital rewards. Timmy was able to afford a new mic when he was
              still in his garage, and his grandma was rewarded for her early
              support.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default AboutStory;
