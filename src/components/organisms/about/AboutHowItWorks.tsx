"use client";

import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { colors } from "@/lib/constants/colors";

const steps = [
  {
    number: "01",
    title: "Create Account",
    description: "10 minutes. No paperwork, no fees.",
  },
  {
    number: "02",
    title: "Get Listed",
    description: "Limited Edition Digital Collectibles",
  },
  {
    number: "03",
    title: "Receive Rewards Forever",
    description: "0.35% of every exchange. Long term fan loyalty.",
  },
];

const AboutHowItWorks = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <section
      id="how-it-works"
      ref={ref}
      className="py-14 scroll-mt-16"
      style={{ backgroundColor: "#FFFFFF" }}
    >
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <h2
            className="font-serif text-2xl md:text-3xl mb-3"
            style={{ color: colors.textDark }}
          >
            Three Steps to{" "}
            <span className="italic" style={{ color: colors.gold }}>
              Freedom
            </span>
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 max-w-3xl mx-auto">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: index * 0.15 }}
              className="text-center"
            >
              <div
                className="inline-flex items-center justify-center w-12 h-12 rounded-full mb-3"
                style={{
                  background: `linear-gradient(to bottom right, ${colors.gold}, ${colors.goldBorder})`,
                }}
              >
                <span
                  className="font-serif text-base font-medium"
                  style={{ color: colors.textDark }}
                >
                  {step.number}
                </span>
              </div>
              <h3
                className="font-serif text-lg mb-1"
                style={{ color: colors.textDark }}
              >
                {step.title}
              </h3>
              <p className="text-xs" style={{ color: `${colors.textDark}99` }}>
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AboutHowItWorks;
