import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef, useState } from "react";
import emailjs from "@emailjs/browser";
import { z } from "zod";

const emailSchema = z.string().trim().email({ message: "Please enter a valid email" }).max(255);
const nameSchema = z.string().trim().min(1, { message: "Name is required" }).max(100);

const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID || "service_l36mged";
const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || "template_f9cpm9n";
const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || "PvRHJTBQovgjhx9T4";
const EMAILJS_TO_EMAIL = "lacid@pauv.com";

const WaitlistForm = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const formRef = useRef<HTMLFormElement>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const nameResult = nameSchema.safeParse(name);
    if (!nameResult.success) {
      setError(nameResult.error.errors[0].message);
      return;
    }

    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      setError(emailResult.error.errors[0].message);
      return;
    }

    setIsSubmitting(true);
    if (!EMAILJS_TEMPLATE_ID || !EMAILJS_SERVICE_ID || !EMAILJS_PUBLIC_KEY) {
      setError("Email service is not configured.");
      setIsSubmitting(false);
      return;
    }
    try {
      // Align with EmailJS template variables: name, time, message
      const payload = {
        name: `${nameResult.data}, ${emailResult.data}`,
        message: message, // user message
        reply_to: emailResult.data,
        to_email: EMAILJS_TO_EMAIL
      };
      await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, payload, { publicKey: EMAILJS_PUBLIC_KEY });
      setSubmitted(true);
      setName("");
      setEmail("");
      setMessage("");
      formRef.current?.reset();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section ref={ref} id="waitlist" className="py-16 bg-gold scroll-mt-16">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="max-w-md mx-auto text-center"
        >
          <h2 className="font-serif text-2xl md:text-3xl text-dark mb-3">
            Get in <span className="italic">Contact</span>
          </h2>
          <p className="text-dark/70 text-sm mb-8">
            Be among the first issuers.
          </p>

          {submitted ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-dark/10 border border-dark/30 rounded-lg p-6"
            >
              <div className="text-dark text-3xl mb-2">✓</div>
              <p className="text-dark font-medium mb-1">Thanks for reaching out!</p>
              <p className="text-dark/60 text-xs">We'll get in contact with you as soon as we can</p>
            </motion.div>
          ) : (
            <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
              <div>
                <input
                  type="text"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  name="user_name"
                  className="w-full px-4 py-3 bg-light border border-dark/20 rounded-lg text-dark text-sm placeholder:text-dark/40 focus:outline-none focus:border-dark/50 transition-colors"
                />
              </div>
              <div>
                <input
                  type="email"
                  placeholder="Your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  name="user_email"
                  className="w-full px-4 py-3 bg-light border border-dark/20 rounded-lg text-dark text-sm placeholder:text-dark/40 focus:outline-none focus:border-dark/50 transition-colors"
                />
              </div>
              <div>
                <textarea
                  placeholder="Your message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  name="user_message"
                  rows={4}
                  className="w-full px-4 py-3 bg-light border border-dark/20 rounded-lg text-dark text-sm placeholder:text-dark/40 focus:outline-none focus:border-dark/50 transition-colors resize-none"
                />
              </div>
              
              {error && (
                <p className="text-red-600 text-xs">{error}</p>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-dark text-light px-6 py-3 rounded-lg text-sm font-medium hover:bg-dark-soft transition-colors"
              >
                {isSubmitting ? "Submitting…" : "Get in Contact →"}
              </button>

              <p className="text-dark/60 text-[10px]">
                Free to join. No spam. Unsubscribe anytime.
              </p>
            </form>
          )}
        </motion.div>
      </div>
    </section>
  );
};

export default WaitlistForm;