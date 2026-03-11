import type { Metadata } from "next";
import { EB_Garamond, Fira_Code, Instrument_Serif } from "next/font/google";
import { GoogleAnalytics } from "@next/third-parties/google";
import { headers } from "next/headers";
import "./globals.css";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { AuthHeader } from "@/components/molecules/AuthHeader";
import { Footer } from "@/components/organisms/Footer";
import { AnimatedBackground } from "@/components/atoms/AnimatedBackground";

const firaCode = Fira_Code({
  variable: "--font-fira-code",
  subsets: ["latin"],
  display: "swap",
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  display: "swap",
  weight: ["400"],
  style: ["normal", "italic"],
});

const ebGaramond = EB_Garamond({
  variable: "--font-eb-garamond",
  subsets: ["latin"],
  display: "swap",
  weight: ["400"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "Pauv | The Market for Human Potential",
  description:
    "Pauv enables rising talent to turn their personal brand into a tradable profile, allowing anyone to open a position on their public sentiment.",
  openGraph: {
    title: "Pauv | The Market for Human Potential",
    description:
      "Pauv enables rising talent to turn their personal brand into a tradable profile, allowing anyone to open a position on their public sentiment.",
    url: "https://www.pauv.com",
    siteName: "Pauv",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Pauv | The Market for Human Potential",
    description:
      "Pauv enables rising talent to turn their personal brand into a tradable profile, allowing anyone to open a position on their public sentiment.",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersList = await headers();
  const host = headersList.get("host") || "";
  const isAdmin = host.startsWith("admin.");

  return (
    <html lang="en">
      <body
        className={`${firaCode.variable} ${instrumentSerif.variable} ${ebGaramond.variable} antialiased`}
        suppressHydrationWarning
      >
        <AnimatedBackground />
        <div style={{ position: "relative", zIndex: 1 }}>
          <AuthProvider>
            {!isAdmin && <AuthHeader />}
            {children}
            {!isAdmin && <Footer />}
          </AuthProvider>
        </div>
        <GoogleAnalytics gaId="G-BCL77Q2MXW" />
      </body>
    </html>
  );
}
