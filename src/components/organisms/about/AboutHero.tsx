"use client";

import React from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { colors } from "@/lib/constants/colors";

const AboutHero = () => {
  return (
    <section
      className="relative min-h-[calc(100vh-4rem)] lg:h-[calc(100vh-4rem)] overflow-hidden flex items-center py-12 lg:py-0"
      style={{ backgroundColor: colors.background }}
    >
      {/* Background gradient */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(to bottom right, ${colors.background}, ${colors.box}, ${colors.background})`,
        }}
      />

      {/* Gold accent glow */}
      <div
        className="absolute top-1/4 right-1/4 w-72 h-72 rounded-full blur-3xl"
        style={{ backgroundColor: `${colors.gold}1A` }}
      />
      <div
        className="absolute bottom-1/4 left-1/4 w-48 h-48 rounded-full blur-3xl"
        style={{ backgroundColor: `${colors.gold}0D` }}
      />

      {/* Content */}
      <div className="relative z-10 container mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-12 items-center justify-items-center">
          {/* Left content */}
          <div className="text-center lg:text-left lg:pl-8 xl:pl-16 w-full">
            {/* Main headline */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-5xl md:text-5xl lg:text-6xl mb-4"
              style={{
                color: colors.textPrimary,
                fontFamily:
                  "var(--font-eb-garamond), 'EB Garamond', Garamond, Georgia, serif",
                letterSpacing: "-0.02em",
                lineHeight: 0.95,
                textRendering: "optimizeLegibility",
                WebkitFontSmoothing: "antialiased",
              }}
            >
              <span className="block font-normal">Unlock the Value of</span>
              <span className="block italic" style={{ color: colors.gold }}>
                Your Brand
              </span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-base md:text-lg font-mono max-w-md mx-auto lg:mx-0 mb-6 leading-relaxed"
              style={{ color: `${colors.textPrimary}B3` }}
            >
              List yourself for free in 10 minutes. Long term fan loyalty. Let
              Fans Support Your Journey.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start items-center"
            >
              <a href="#waitlist">
                <button
                  className="rounded-full px-5 py-2 text-sm font-medium transition-colors hover:opacity-90"
                  style={{
                    backgroundColor: colors.textPrimary,
                    color: colors.textDark,
                  }}
                >
                  Get in Contact
                </button>
              </a>
              <a href="#benefits">
                <button
                  className="rounded-full px-5 py-2 text-sm font-medium border-2 transition-colors hover:opacity-90"
                  style={{
                    backgroundColor: "transparent",
                    borderColor: colors.textPrimary,
                    color: colors.textPrimary,
                  }}
                >
                  Learn More
                </button>
              </a>
            </motion.div>

            {/* Mobile App Mockup - Show on mobile only */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="mt-8 lg:hidden flex justify-center"
            >
              <div className="relative flex items-center justify-center">
                <div
                  className="absolute inset-0 rounded-full blur-3xl scale-75"
                  style={{ backgroundColor: `${colors.gold}33` }}
                />
                <Image
                  src="/app-mockup.png"
                  alt="Pauv App"
                  width={290}
                  height={580}
                  className="relative z-10 object-contain drop-shadow-2xl"
                  priority
                />
              </div>
            </motion.div>
          </div>

          {/* Right - App Mockup */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="hidden lg:flex justify-center items-center"
          >
            <div className="relative flex items-center justify-center">
              <div
                className="absolute inset-0 rounded-full blur-3xl scale-75"
                style={{ backgroundColor: `${colors.gold}33` }}
              />
              <Image
                src="/app-mockup.png"
                alt="Pauv App"
                width={255}
                height={510}
                className="relative z-10 object-contain drop-shadow-2xl"
                priority
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default AboutHero;
