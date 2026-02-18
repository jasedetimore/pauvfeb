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

      <div className="mx-auto max-w-2xl px-4 sm:px-6 py-12">
        <div className="text-center mb-10">
          <h1
            className="text-3xl sm:text-4xl font-bold mb-3"
            style={{ color: colors.textPrimary }}
          >
            List Yourself
          </h1>
          <p style={{ color: colors.textSecondary }}>
            Want to be listed on Pauv? Fill out the form below and our team will
            review your request.
          </p>
        </div>

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
              Your request has been submitted. We&apos;ll be in touch soon.
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
  );
}
