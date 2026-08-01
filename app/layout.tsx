import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Ahmed Mounir | Backend Engineer",
  description:
    "Interactive terminal portfolio for Ahmed Mounir Ali — backend engineer focused on distributed systems, database internals, cloud-native architecture, and applied AI.",
  keywords: [
    "Ahmed Mounir",
    "Backend Engineer",
    "Go Developer",
    "Distributed Systems",
    "Database Internals",
    "Cloud Engineer",
  ],
  authors: [{ name: "Ahmed Mounir Ali" }],
  openGraph: {
    title: "Ahmed Mounir — Backend Systems Terminal",
    description: "Explore backend engineering work through an interactive cyber-terminal portfolio.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Ahmed Mounir — Backend Systems Terminal",
    description: "Distributed systems, database internals, cloud, and applied AI.",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>{children}</body>
    </html>
  );
}
