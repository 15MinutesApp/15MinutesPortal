import type React from "react";
import { Suspense } from "react";
import { AppleSidebar } from "@/components/sidebar";

export default function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex h-screen">
      <AppleSidebar />
      <main className="flex-1 ml-20">
        <Suspense>{children}</Suspense>
      </main>
    </div>
  );
}
