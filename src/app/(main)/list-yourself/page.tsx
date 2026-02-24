"use client";

import React, { useState, useEffect } from "react";
import emailjs from "@emailjs/browser";
import { colors } from "@/lib/constants/colors";
import { createClient } from "@/lib/supabase/client";
import { TermsCheckbox } from "@/components/atoms/TermsCheckbox";

const EMAILJS_SERVICE_ID = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID || "service_l36mged";
const EMAILJS_TEMPLATE_ID = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID || "template_f9cpm9n";
const EMAILJS_PUBLIC_KEY = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY || "PvRHJTBQovgjhx9T4";
const EMAILJS_TO_EMAIL = "lacid@pauv.com";

const SOCIAL_PLATFORMS = [
  { value: "twitter", label: "Twitter / X" },
  { value: "instagram", label: "Instagram" },
  { value: "tiktok", label: "TikTok" },
  { value: "youtube", label: "YouTube" },
  { value: "twitch", label: "Twitch" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "facebook", label: "Facebook" },
  { value: "snapchat", label: "Snapchat" },
  { value: "threads", label: "Threads" },
];

const CAROUSEL_TAGS = [
  "Athletes",
  "Streamers",
  "Authors",
  "Entrepreneurs",
  "Gamers",
  "Musicians",
  "Actors",
  "YouTubers",
  "Podcasters",
  "Personalities",
];

interface FormData {
  name: string;
  email: string;
  phone: string;
  socialPlatform: string;
  socialHandle: string;
  desiredTicker: string;
  message: string;
}

export default function ListYourselfPage() {
  const [form, setForm] = useState<FormData>({
    name: "",
    email: "",
    phone: "",
    socialPlatform: "",
    socialHandle: "",
    desiredTicker: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [authUserId, setAuthUserId] = useState<string | null>(null);
  const [authEmail, setAuthEmail] = useState<string | null>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Detect if the user is already logged in
  useEffect(() => {
    const supabase = createClient();
    const hydrateAuthUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) return;

      setAuthUserId(data.user.id);
      setAuthEmail(data.user.email || null);
      setForm((prev) => ({
        ...prev,
        email: data.user?.email || prev.email,
      }));
    };

    void hydrateAuthUser();
  }, []);

  useEffect(() => {
    if (!submitted) return;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [submitted]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSocialHandleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Strip any leading @ the user might type — we add it automatically
    let value = e.target.value;
    if (value.startsWith("@")) {
      value = value.slice(1);
    }
    setForm((prev) => ({ ...prev, socialHandle: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Basic validation
    if (!form.name.trim()) { setError("Name is required."); return; }
    if (!form.email.trim()) { setError("Email is required."); return; }
    if (!form.phone.trim()) { setError("Phone number is required."); return; }
    if (!form.socialPlatform) { setError("Please select a social media platform."); return; }
    if (!form.socialHandle.trim()) { setError("Social media handle is required."); return; }
    if (!form.desiredTicker.trim()) { setError("Desired ticker is required."); return; }

    if (!termsAccepted) {
      setError("You must agree to the Terms of Service, Privacy Policy, and Issuer Terms.");
      return;
    }

    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/issuer-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          social_media_platform: form.socialPlatform,
          social_media_handle: `@${form.socialHandle.trim()}`,
          desired_ticker: form.desiredTicker.trim().toUpperCase(),
          message: form.message.trim() || null,
          terms_accepted: true,
          ...(authUserId ? { user_id: authUserId } : {}),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Something went wrong.");
      }

      // Send email notification from the browser via EmailJS
      try {
        const handle = `@${form.socialHandle.trim()}`;
        const ticker = form.desiredTicker.trim().toUpperCase();
        const time = new Date().toISOString();
        const messageParts = [
          `Email: ${form.email.trim()}`,
          `Phone: ${form.phone.trim()}`,
          `Social Media: ${form.socialPlatform} ${handle}`,
          `Desired Ticker: ${ticker}`,
          form.message.trim() ? `Message: ${form.message.trim()}` : "Message: (none)",
        ];

        await emailjs.send(
          EMAILJS_SERVICE_ID,
          EMAILJS_TEMPLATE_ID,
          {
            name: form.name.trim(),
            time,
            message: messageParts.join(", "),
          },
          { publicKey: EMAILJS_PUBLIC_KEY }
        );
      } catch (emailErr) {
        // Don't block confirmation — DB insert already succeeded
        console.error("EmailJS send failed:", emailErr);
      }

      setSubmitted(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    backgroundColor: colors.box,
    color: colors.textPrimary,
    borderColor: colors.boxOutline,
  };

  const labelStyle: React.CSSProperties = {
    color: colors.textSecondary,
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: colors.backgroundDark }}>
      {/* Carousel animation */}
      <style>{`
        @keyframes carousel-scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .carousel-track {
          animation: carousel-scroll 40s linear infinite;
        }
      `}</style>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12">
        <div className="flex flex-col lg:flex-row gap-10 lg:gap-14 items-start">

          {/* ───── LEFT COLUMN ───── */}
          <div className="w-full lg:w-1/2">
            <h1
              className="text-3xl sm:text-4xl font-bold mb-5"
              style={{ color: colors.textPrimary }}
            >
              Why should I be an Issuer?
            </h1>

            {/* Video */}
            <div className="relative w-full rounded-xl overflow-hidden" style={{ paddingTop: "56.25%" }}>
              <iframe
                src="https://iframe.mediadelivery.net/embed/579822/2e8fa410-9325-4e21-9c64-0d7e1b8e2b63?autoplay=true&loop=false&muted=true&preload=true&responsive=true"
                loading="lazy"
                title="Pauv listing walkthrough"
                className="absolute top-0 h-full w-full border-0"
                allow="accelerometer;gyroscope;autoplay;encrypted-media;picture-in-picture;"
                allowFullScreen
              />
            </div>

            {/* ── 3 Steps ── */}
            <p className="mt-8 text-base font-semibold" style={{ color: colors.textSecondary }}>
              The Process:
            </p>
            <div className="mt-4 space-y-8">

              {/* Step 1 */}
              <div className="flex gap-4">
                <div
                  className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold"
                  style={{ backgroundColor: colors.textPrimary, color: colors.textDark }}
                >
                  1
                </div>
                <div className="min-w-0">
                  <h3 className="text-lg font-semibold" style={{ color: colors.textPrimary }}>
                    List Yourself
                  </h3>
                  <p className="text-sm mt-1" style={{ color: colors.textSecondary }}>
                    Start your listing in less than ten minutes by providing a valid email address and a social media account for identity verification.
                  </p>

                  <p className="text-sm mt-4 font-medium" style={{ color: colors.gold }}>
                    Who can be listed?
                  </p>

                  {/* Scrolling Tag Carousel */}
                  <div className="mt-3 overflow-hidden">
                    <div className="carousel-track flex gap-3 w-max">
                      {[...CAROUSEL_TAGS, ...CAROUSEL_TAGS].map((tag, i) => (
                        <span
                          key={i}
                          className="inline-block whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-medium border"
                          style={{
                            backgroundColor: colors.boxLight,
                            borderColor: colors.boxOutline,
                            color: colors.textPrimary,
                          }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex gap-4">
                <div
                  className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold"
                  style={{ backgroundColor: colors.textPrimary, color: colors.textDark }}
                >
                  2
                </div>
                <div>
                  <h3 className="text-lg font-semibold" style={{ color: colors.textPrimary }}>
                    People Trade Your PV
                  </h3>
                  <p className="text-sm mt-1" style={{ color: colors.textSecondary }}>
                    Once verified, your profile generates unique digital collectibles called PVs that allow your audience to trade and hold a speculative stake in your reputation.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex gap-4">
                <div
                  className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold"
                  style={{ backgroundColor: colors.textPrimary, color: colors.textDark }}
                >
                  3
                </div>
                <div>
                  <h3 className="text-lg font-semibold" style={{ color: colors.textPrimary }}>
                    Passive Income for Life
                  </h3>
                  <p className="text-sm mt-1" style={{ color: colors.textSecondary }}>
                    You receive a 0.25% fee from every transaction involving your PV plus 1% annual interest on your total market cap, providing a lifelong income stream that grows alongside your success.
                  </p>
                </div>
              </div>
            </div>

            {/* Bottom CTA */}
            <div
              className="mt-10 p-6 rounded-xl border"
              style={{ backgroundColor: colors.box, borderColor: colors.boxOutline }}
            >
              <p className="text-lg font-semibold" style={{ color: colors.gold }}>
                That&apos;s all.
              </p>
              <p className="text-sm mt-1" style={{ color: colors.textSecondary }}>
                It really is that simple. You can complete your free listing in under ten minutes to start generating passive income and building a more committed community of fans.
              </p>
            </div>
          </div>

          {/* ───── RIGHT COLUMN — FORM ───── */}
          <div className="w-full lg:w-1/2 lg:sticky lg:top-24">
            {submitted ? (
              <div
                className="rounded-xl border p-10 text-center"
                style={{
                  backgroundColor: colors.box,
                  borderColor: colors.boxOutline,
                }}
              >
                <div
                  className="text-5xl mb-4 inline-flex items-center justify-center w-16 h-16 rounded-full"
                  style={{ backgroundColor: colors.gold, color: colors.textDark }}
                >
                  ✓
                </div>
                <h2
                  className="text-2xl font-bold mb-2"
                  style={{ color: colors.textPrimary }}
                >
                  Confirmed
                </h2>
                <p style={{ color: colors.textSecondary }}>
                  Your request has been submitted. Our team will review and get back
                  to you as soon as possible.
                </p>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="rounded-xl border p-6 sm:p-8 space-y-6"
                style={{
                  backgroundColor: colors.box,
                  borderColor: colors.boxOutline,
                }}
              >
                <div>
                  <h2
                    className="text-xl sm:text-2xl font-bold"
                    style={{ color: colors.textPrimary }}
                  >
                    Request to be an Issuer
                  </h2>
                  <p className="mt-1 text-sm" style={{ color: colors.textSecondary }}>
                    Our team will review and get back to you as soon as possible.
                  </p>
                </div>

                {/* Name */}
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium mb-1.5"
                    style={labelStyle}
                  >
                    Full Name <span style={{ color: colors.red }}>*</span>
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Your full name"
                    className="w-full px-4 py-3 rounded-lg border text-sm focus:outline-none focus:ring-1 transition-colors"
                    style={{
                      ...inputStyle,
                      // @ts-expect-error CSS custom property
                      "--tw-ring-color": colors.gold,
                    }}
                  />
                </div>

                {/* Email */}
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium mb-1.5"
                    style={labelStyle}
                  >
                    Email <span style={{ color: colors.red }}>*</span>
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    readOnly={!!authEmail}
                    className="w-full px-4 py-3 rounded-lg border text-sm focus:outline-none focus:ring-1 transition-colors"
                    style={{
                      ...inputStyle,
                      ...(authEmail ? { opacity: 0.7, cursor: "default" } : {}),
                    }}
                  />
                  {authEmail && (
                    <p className="text-xs mt-1" style={{ color: colors.green }}>
                      Auto-filled from your logged-in account
                    </p>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <label
                    htmlFor="phone"
                    className="block text-sm font-medium mb-1.5"
                    style={labelStyle}
                  >
                    Phone Number <span style={{ color: colors.red }}>*</span>
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="(555) 123-4567"
                    className="w-full px-4 py-3 rounded-lg border text-sm focus:outline-none focus:ring-1 transition-colors"
                    style={inputStyle}
                  />
                </div>

                {/* Social Media */}
                <div>
                  <label
                    className="block text-sm font-medium mb-1.5"
                    style={labelStyle}
                  >
                    Social Media <span style={{ color: colors.red }}>*</span>
                  </label>
                  <div className="flex gap-3">
                    <select
                      name="socialPlatform"
                      value={form.socialPlatform}
                      onChange={handleChange}
                      className="w-[180px] px-3 py-3 rounded-lg border text-sm focus:outline-none focus:ring-1 transition-colors appearance-none cursor-pointer"
                      style={inputStyle}
                    >
                      <option value="">Platform</option>
                      {SOCIAL_PLATFORMS.map((p) => (
                        <option key={p.value} value={p.value}>
                          {p.label}
                        </option>
                      ))}
                    </select>
                    <div className="flex-1 relative">
                      <span
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium"
                        style={{ color: colors.textMuted }}
                      >
                        @
                      </span>
                      <input
                        name="socialHandle"
                        type="text"
                        value={form.socialHandle}
                        onChange={handleSocialHandleChange}
                        placeholder="yourhandle"
                        className="w-full pl-8 pr-4 py-3 rounded-lg border text-sm focus:outline-none focus:ring-1 transition-colors"
                        style={inputStyle}
                      />
                    </div>
                  </div>
                </div>

                {/* Desired Ticker */}
                <div>
                  <label
                    htmlFor="desiredTicker"
                    className="block text-sm font-medium mb-1.5"
                    style={labelStyle}
                  >
                    Desired Ticker <span style={{ color: colors.red }}>*</span>
                  </label>
                  <input
                    id="desiredTicker"
                    name="desiredTicker"
                    type="text"
                    value={form.desiredTicker}
                    onChange={handleChange}
                    placeholder="e.g. MYTICKER"
                    maxLength={10}
                    className="w-full px-4 py-3 rounded-lg border text-sm uppercase focus:outline-none focus:ring-1 transition-colors"
                    style={inputStyle}
                  />
                  <p className="text-xs mt-1" style={{ color: colors.textMuted }}>
                    Max 10 characters. This is the ticker symbol you&apos;d like for your PV.
                  </p>
                </div>

                {/* Message (Optional) */}
                <div>
                  <label
                    htmlFor="message"
                    className="block text-sm font-medium mb-1.5"
                    style={labelStyle}
                  >
                    Message <span style={{ color: colors.textMuted }}>(optional)</span>
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={form.message}
                    onChange={handleChange}
                    placeholder="Anything you'd like us to know..."
                    rows={4}
                    className="w-full px-4 py-3 rounded-lg border text-sm focus:outline-none focus:ring-1 transition-colors resize-none"
                    style={inputStyle}
                  />
                </div>

                {/* Error */}
                {error && (
                  <p className="text-sm font-medium" style={{ color: colors.red }}>
                    {error}
                  </p>
                )}

                {/* Terms & Conditions */}
                <TermsCheckbox
                  checked={termsAccepted}
                  onChange={setTermsAccepted}
                  variant="issuer"
                />

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isSubmitting || !termsAccepted}
                  className="w-full py-3 rounded-lg text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-50"
                  style={{
                    backgroundColor: colors.gold,
                    color: colors.textDark,
                    border: `1px solid ${colors.goldBorder}`,
                  }}
                >
                  {isSubmitting ? "Submitting…" : "Submit Request"}
                </button>
              </form>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
