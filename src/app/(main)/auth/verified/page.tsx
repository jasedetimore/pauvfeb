import Link from "next/link";
import { colors } from "@/lib/constants/colors";

export default function EmailVerifiedPage() {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ backgroundColor: colors.backgroundDark }}
    >
      <div
        className="w-full max-w-lg rounded-lg border p-8 text-center"
        style={{
          backgroundColor: colors.box,
          borderColor: colors.boxOutline,
        }}
      >
        <h1
          className="text-2xl font-bold mb-3"
          style={{ color: colors.textPrimary }}
        >
          Verification Successful
        </h1>
        <p className="mb-6" style={{ color: colors.textSecondary }}>
          Your email has been verified. Your Pauv account is now ready.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/account"
            className="px-5 py-3 rounded-lg font-semibold transition-opacity hover:opacity-90"
            style={{
              backgroundColor: colors.gold,
              color: colors.textDark,
            }}
          >
            Go to Dashboard
          </Link>

          <Link
            href="/login"
            className="px-5 py-3 rounded-lg border font-semibold transition-opacity hover:opacity-90"
            style={{
              borderColor: colors.boxOutline,
              color: colors.textPrimary,
            }}
          >
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
