import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Iris Classifier",
    template: "%s · Iris Classifier",
  },
  description:
    "A machine-learning system that classifies Iris flowers from four measurements, trained on 500 documented observations.",
  applicationName: "Iris Classification System",
};

export const viewport: Viewport = {
  themeColor: "#0c2a1d",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={inter.variable} data-scroll-behavior="smooth">
      <body>{children}</body>
    </html>
  );
}
