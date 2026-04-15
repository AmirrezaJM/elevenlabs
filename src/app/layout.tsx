import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ClerkProvider } from '@clerk/nextjs'
import { TRPCReactProvider } from "@/trpc/client";

const geistSans = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "elevenLabs",
    template: "%s | elevenLabs"
  },
  description: "AI-powered text-to-speech and voice cloning platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <TRPCReactProvider>
        <html
          lang="en"
          className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
          suppressHydrationWarning
        >
          <body className="min-h-full flex flex-col" suppressHydrationWarning>
            {children}
            <Toaster />
          </body>
        </html>
      </TRPCReactProvider>
    </ClerkProvider>
  );
}
