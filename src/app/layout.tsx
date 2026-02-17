import type { Metadata } from "next";
import { EB_Garamond, Fira_Code, Instrument_Serif } from "next/font/google";
import { GoogleAnalytics } from "@next/third-parties/google";
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
  title: "Pauv",
  description: "Welcome to Pauv",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${firaCode.variable} ${instrumentSerif.variable} ${ebGaramond.variable} antialiased`}
        suppressHydrationWarning
      >
        <AuthProvider>
          <AuthHeader />
          {children}
          <Footer />
        </AuthProvider>
        <GoogleAnalytics gaId="G-BCL77Q2MXW" />
      </body>
    </html>
  );
}
