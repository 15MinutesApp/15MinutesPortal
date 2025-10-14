import type React from "react";
import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { Suspense } from "react";
import { AuthProvider } from "@/contexts/AuthContext";
import { Toaster } from "@/components/ui/sonner";
import { ApolloProviderWrapper } from "@/lib/apollo/provider";

const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-nunito",
  display: "swap",
});

export const metadata: Metadata = {
  title: "15 Minutes Carpenter",
  description: "15minutes mobil uygulama yönetim paneli",
  generator: "v0.app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body className={`font-sans ${nunito.variable}`}>
        <ApolloProviderWrapper>
          <AuthProvider>
            <Suspense>
              {children}
              <Analytics />
            </Suspense>
            <Toaster />
          </AuthProvider>
        </ApolloProviderWrapper>
      </body>
    </html>
  );
}
