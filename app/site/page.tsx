"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { StatsCards } from "@/components/stats-cards";
import { UsersTable } from "@/components/users-table";
import { VisitorsChart } from "@/components/visitors-chart";
import { useAuth } from "@/contexts/AuthContext";

export default function Page() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    console.log(
      "[Dashboard] Auth state - isLoading:",
      isLoading,
      "isAuthenticated:",
      isAuthenticated
    );

    // Only redirect if we're sure the user is not authenticated
    if (!isLoading && !isAuthenticated) {
      console.log("[Dashboard] Not authenticated, redirecting to login");
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  // Additional check: if user is authenticated but still loading, wait a bit more
  useEffect(() => {
    if (isAuthenticated && isLoading) {
      console.log(
        "[Dashboard] User is authenticated but still loading, waiting..."
      );
    }
  }, [isAuthenticated, isLoading]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-muted-foreground">Yükleniyor...</p>
      </div>
    );
  }

  // Don't render protected content until authenticated
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex flex-col h-screen">
      <header className="flex h-16 shrink-0 items-center gap-2 bg-background">
        <div className="flex items-center gap-2 px-4">
          <h1 className="text-xl font-bold text-foreground">Dashboard</h1>
        </div>
      </header>
      <div className="flex flex-1 flex-col gap-6 p-6">
        <div className="space-y-1">
          <p className="text-muted-foreground">
            15minutes mobil uygulama yönetim paneline hoş geldiniz
          </p>
        </div>
        <StatsCards />
        <VisitorsChart />
        <UsersTable />
      </div>
    </div>
  );
}
