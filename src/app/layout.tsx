import type { Metadata } from "next";
import { EB_Garamond, Fira_Code, Instrument_Serif } from "next/font/google";
import { GoogleAnalytics } from "@next/third-parties/google";
import { headers } from "next/headers";
import "./globals.css";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { AuthHeader } from "@/components/molecules/AuthHeader";
import { Footer } from "@/components/organisms/Footer";

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
    "Invest in the people you care about. Pauv is the world's first marketplace for individual potential. Buy, sell, and trade digital collectibles tied to the success of your favorite athletes and creators.",
  openGraph: {
    title: "Pauv | The Market for Human Potential",
    description:
      "Invest in the people you care about. Pauv is the world's first marketplace for individual potential. Buy, sell, and trade digital collectibles tied to the success of your favorite athletes and creators.",
    url: "https://www.pauv.com",
    siteName: "Pauv",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Pauv | The Market for Human Potential",
    description:
      "Invest in the people you care about. Pauv is the world's first marketplace for individual potential. Buy, sell, and trade digital collectibles tied to the success of your favorite athletes and creators.",
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
        <AuthProvider>
          {!isAdmin && <AuthHeader />}
          {children}
          {!isAdmin && <Footer />}
        </AuthProvider>
        <GoogleAnalytics gaId="G-BCL77Q2MXW" />
      </body>
    </html>
  );
}
