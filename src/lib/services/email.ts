/**
 * Email Service
 * 
 * Sends emails via Resend API if RESEND_API_KEY is configured.
 * Falls back to console logging the email content (for development).
 * 
 * To enable real emails:
 * 1. Sign up at https://resend.com
 * 2. Add RESEND_API_KEY to your .env.local
 * 3. Optionally set RESEND_FROM_EMAIL (defaults to onboarding@resend.dev)
 */

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "Pauv <onboarding@resend.dev>";

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailParams): Promise<{ success: boolean; message: string }> {
  // If Resend API key is configured, send a real email
  if (RESEND_API_KEY) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: FROM_EMAIL,
          to: [to],
          subject,
          html,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        console.error("Resend API error:", err);
        return { success: false, message: `Email send failed: ${err.message || res.statusText}` };
      }

      return { success: true, message: "Email sent successfully" };
    } catch (error) {
      console.error("Email send error:", error);
      return { success: false, message: "Failed to send email" };
    }
  }

  // Fallback: log email content for development
  console.log("═══════════════════════════════════════");
  console.log("📧 EMAIL (no RESEND_API_KEY configured)");
  console.log(`   To: ${to}`);
  console.log(`   Subject: ${subject}`);
  console.log(`   Body: ${html}`);
  console.log("═══════════════════════════════════════");

  return { success: true, message: "Email logged to console (no RESEND_API_KEY configured)" };
}

/**
 * Build the issuer claim email HTML
 */
export function buildClaimEmailHtml(claimUrl: string, issuerName: string): string {
  return `
    <div style="font-family: 'Courier New', monospace; max-width: 600px; margin: 0 auto; background: #000000; color: #FFFFFF; padding: 40px; border: 1px solid #333333;">
      <div style="text-align: center; margin-bottom: 32px;">
        <h1 style="color: #E5C68D; font-size: 28px; margin: 0;">PAUV</h1>
      </div>
      <h2 style="color: #FFFFFF; font-size: 20px; margin-bottom: 16px;">
        Your Issuer Profile is Ready
      </h2>
      <p style="color: #A3A3A3; font-size: 14px; line-height: 1.6; margin-bottom: 24px;">
        Congratulations, <strong style="color: #FFFFFF;">${issuerName}</strong>! Your application to become a Pauv Issuer has been approved.
      </p>
      <p style="color: #A3A3A3; font-size: 14px; line-height: 1.6; margin-bottom: 32px;">
        Click the button below to set up your account password and claim your profile. This link expires in 72 hours.
      </p>
      <div style="text-align: center; margin-bottom: 32px;">
        <a href="${claimUrl}" style="
          display: inline-block;
          background: #E5C68D;
          color: #000000;
          font-weight: bold;
          padding: 14px 32px;
          text-decoration: none;
          border-radius: 6px;
          font-size: 14px;
          font-family: 'Courier New', monospace;
        ">
          Claim Your Profile
        </a>
      </div>
      <p style="color: #999999; font-size: 12px; line-height: 1.6;">
        If you didn&apos;t apply to become a Pauv Issuer, you can safely ignore this email.
      </p>
      <hr style="border: none; border-top: 1px solid #333333; margin: 24px 0;" />
      <p style="color: #999999; font-size: 11px; text-align: center;">
        &copy; ${new Date().getFullYear()} Pauv. All rights reserved.
      </p>
    </div>
  `;
}
