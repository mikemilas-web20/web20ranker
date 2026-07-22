import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import Nav from "@/components/Nav";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Creator Scout — YouTube Channel Research & Outreach",
  description:
    "Discover YouTube channels by niche and manage creator outreach.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-slate-950 text-slate-200 font-sans">
        <Nav />
        <main className="mx-auto w-full max-w-6xl px-4 py-8 flex-1">
          {children}
        </main>
      </body>
    </html>
  );
}
