"use client";

import React from "react";
import { AuthHeader } from "@/components/molecules/AuthHeader";
import { colors } from "@/lib/constants/colors";
import AboutHero from "@/components/organisms/about/AboutHero";
import AboutVideo from "@/components/organisms/about/AboutVideo";
import AboutBenefits from "@/components/organisms/about/AboutBenefits";
import AboutProblem from "@/components/organisms/about/AboutProblem";
import AboutFAQ from "@/components/organisms/about/AboutFAQ";
import AboutHowItWorks from "@/components/organisms/about/AboutHowItWorks";
import AboutStory from "@/components/organisms/about/AboutStory";
import AboutContactForm from "@/components/organisms/about/AboutContactForm";

export default function AboutPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: colors.backgroundDark }}>
      <AuthHeader
        navigationLinks={[
          { href: "/", label: "Issuers" },
          { href: "/list-yourself", label: "List Yourself" },
          { href: "/about", label: "About", active: true },
        ]}
      />

      <main className="overflow-x-hidden">
        <AboutHero />
        <AboutVideo />
        <AboutBenefits />
        <AboutProblem />
        <AboutFAQ />
        <AboutHowItWorks />
        <AboutStory />
        <AboutContactForm />
      </main>
    </div>
  );
}
