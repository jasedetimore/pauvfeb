"use client";

import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { colors } from "@/lib/constants/colors";

const benefits = [
  {
    icon: "📈",
    title: "Fan Engagement Insights",
    description: "Live, quantifiable public sentiment data.",
  },
  {
    icon: "🤝",
    title: "Deeper Engagement",
    description: "Deeply committed supporters show up more.",
  },
  {
    icon: "🎯",
    title: "Brand Leverage",
    description: "Your Social Engagement Score becomes proof for deals.",
  },
];

const AboutBenefits = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <section
      id="benefits"
      ref={ref}
      className="py-16 scroll-mt-16"
      style={{ backgroundColor: colors.background }}
    >
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <h2
            className="font-serif text-2xl md:text-3xl mb-3"
            style={{ color: colors.textPrimary }}
          >
            Why <span className="italic">List Yourself</span>?
          </h2>
        </motion.div>

        <div className="grid sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
          {benefits.map((benefit, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
              className="group rounded-lg p-4 transition-all duration-300"
              style={{
                backgroundColor: colors.box,
                border: `1px solid ${colors.border}`,
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = `${colors.gold}80`;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = colors.border;
              }}
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="text-xl">{benefit.icon}</span>
                <h3
                  className="font-medium text-sm"
                  style={{ color: colors.textPrimary }}
                >
                  {benefit.title}
                </h3>
              </div>
              <p
                className="text-xs leading-relaxed"
                style={{ color: `${colors.textPrimary}99` }}
              >
                {benefit.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AboutBenefits;
