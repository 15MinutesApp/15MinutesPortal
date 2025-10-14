"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Ban } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const reportedUsers = [
  {
    id: 1,
    name: "Ahmet Yılmaz",
    email: "ahmet@example.com",
    reportCount: 5,
    reason: "Uygunsuz içerik paylaşımı",
    status: "pending",
    date: "15 Ocak 2025",
  },
  {
    id: 2,
    name: "Mehmet Demir",
    email: "mehmet@example.com",
    reportCount: 3,
    reason: "Spam mesajlar",
    status: "reviewed",
    date: "14 Ocak 2025",
  },
  {
    id: 3,
    name: "Ayşe Kaya",
    email: "ayse@example.com",
    reportCount: 8,
    reason: "Taciz ve rahatsız edici davranış",
    status: "pending",
    date: "13 Ocak 2025",
  },
  {
    id: 4,
    name: "Fatma Şahin",
    email: "fatma@example.com",
    reportCount: 2,
    reason: "Sahte profil",
    status: "reviewed",
    date: "12 Ocak 2025",
  },
];

export default function ReportsPage() {
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
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 bg-background">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1 text-foreground" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <h1 className="text-xl font-bold text-foreground">Raporlar</h1>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-6 p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-muted-foreground">
                Şikayet edilen kullanıcıları görüntüleyin ve yönetin
              </p>
            </div>
          </div>
          <div className="grid gap-4">
            {reportedUsers.map((user) => (
              <Card key={user.id} className="bg-background border-border">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-foreground flex items-center gap-2">
                        {user.name}
                        <Badge
                          variant={
                            user.status === "pending"
                              ? "destructive"
                              : "secondary"
                          }
                        >
                          {user.status === "pending"
                            ? "Beklemede"
                            : "İncelendi"}
                        </Badge>
                      </CardTitle>
                      <CardDescription className="text-muted-foreground">
                        {user.email}
                      </CardDescription>
                    </div>
                    <AlertTriangle className="h-5 w-5 text-primary" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground">
                          Şikayet Sayısı:
                        </span>
                        <Badge
                          variant="outline"
                          className="border-primary text-primary"
                        >
                          {user.reportCount}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        <span className="font-medium text-foreground">
                          Sebep:
                        </span>{" "}
                        {user.reason}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {user.date}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-border text-foreground hover:bg-muted bg-transparent"
                      >
                        İncele
                      </Button>
                      <Button
                        size="sm"
                        className="bg-primary text-primary-foreground hover:bg-primary/90"
                      >
                        <Ban className="mr-2 h-4 w-4" />
                        Engelle
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
