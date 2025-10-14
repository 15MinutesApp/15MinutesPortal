"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const interests = [
  { name: "Spor", count: 456, color: "bg-primary" },
  { name: "Müzik", count: 389, color: "bg-chart-2" },
  { name: "Teknoloji", count: 567, color: "bg-chart-3" },
  { name: "Sanat", count: 234, color: "bg-chart-4" },
  { name: "Yemek", count: 445, color: "bg-chart-5" },
  { name: "Seyahat", count: 378, color: "bg-primary" },
  { name: "Kitap", count: 289, color: "bg-chart-2" },
  { name: "Film", count: 512, color: "bg-chart-3" },
];

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
        <header className="flex h-16 shrink-0 items-center gap-2 bg-card">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1 text-foreground" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/" className="text-muted-foreground">
                    Dashboard
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage className="text-foreground">
                    İlgi Alanları
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-6 p-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              İlgi Alanları
            </h1>
            <p className="text-muted-foreground">
              Kullanıcıların ilgi alanlarını görüntüleyin ve analiz edin
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {interests.map((interest) => (
              <Card key={interest.name} className="bg-card border-border">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-foreground">
                    {interest.name}
                  </CardTitle>
                  <Heart
                    className={`h-4 w-4 ${interest.color} text-white rounded-full p-0.5`}
                  />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">
                    {interest.count}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    kullanıcı ilgileniyor
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">
                Popüler İlgi Alanları
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                En çok tercih edilen kategoriler
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {interests
                  .sort((a, b) => b.count - a.count)
                  .slice(0, 5)
                  .map((interest, index) => (
                    <div
                      key={interest.name}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl font-bold text-primary">
                          #{index + 1}
                        </span>
                        <span className="text-foreground font-medium">
                          {interest.name}
                        </span>
                      </div>
                      <Badge className="bg-primary text-primary-foreground">
                        {interest.count} kullanıcı
                      </Badge>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
