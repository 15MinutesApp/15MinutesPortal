"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { InterestsAccordion } from "./interests-accordion";
import { interestsData } from "./data";
import { Toaster } from "@/components/ui/toaster";

export default function InterestsPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-muted-foreground">Yükleniyor...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <SidebarProvider className="dark">
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 bg-card px-4">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1 text-foreground" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <h1 className="text-2xl font-bold text-foreground">
              İlgi Alanları
            </h1>
          </div>
        </header>
        <div className=" flex flex-1 flex-col gap-6 mr-10 ml-16">
          <div className="space-y-2">
            <p className="text-muted-foreground">
              Kullanıcıların ilgi alanlarını kategoriler ve alt kategoriler
              halinde yönetin.
            </p>
          </div>
          <InterestsAccordion data={interestsData} />
        </div>
      </SidebarInset>
      <Toaster />
    </SidebarProvider>
  );
}
