"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { getAdminUsers } from "@/lib/auth/authService";
import { toast } from "sonner";

export default function TestApiPage() {
  const { accessToken, isAuthenticated } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const testApi = async () => {
    if (!accessToken) {
      toast.error("Önce giriş yapmalısınız!");
      return;
    }

    setIsLoading(true);
    try {
      const result = await getAdminUsers(accessToken, page, limit);
      setUsers(result);
      toast.success(`${result.length} kullanıcı bulundu!`);
    } catch (error) {
      console.error("API Test Error:", error);
      toast.error("API çağrısı başarısız!");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Test API</CardTitle>
            <CardDescription>
              Bu sayfaya erişmek için giriş yapmalısınız.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => (window.location.href = "/login")}>
              Giriş Yap
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>API Test Sayfası</CardTitle>
            <CardDescription>
              Backend GraphQL API'nizi test edin. Bu sayfa sadece test
              amaçlıdır.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="page">Sayfa</Label>
                <Input
                  id="page"
                  type="number"
                  value={page}
                  onChange={(e) => setPage(Number(e.target.value))}
                  min="1"
                />
              </div>
              <div>
                <Label htmlFor="limit">Limit</Label>
                <Input
                  id="limit"
                  type="number"
                  value={limit}
                  onChange={(e) => setLimit(Number(e.target.value))}
                  min="1"
                  max="100"
                />
              </div>
            </div>
            <Button onClick={testApi} disabled={isLoading} className="w-full">
              {isLoading ? "Test Ediliyor..." : "Admin Users API'sini Test Et"}
            </Button>
          </CardContent>
        </Card>

        {users.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>API Sonucu</CardTitle>
              <CardDescription>
                {users.length} kullanıcı bulundu
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {users.map((user, index) => (
                  <div key={user.id || index} className="p-3 border rounded-lg">
                    <div className="font-medium">ID: {user.id}</div>
                    <div className="text-sm text-muted-foreground">
                      Email: {user.email}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Oluşturulma:{" "}
                      {new Date(user.createdAt).toLocaleString("tr-TR")}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Debug Bilgileri</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div>
                <strong>Authenticated:</strong>{" "}
                {isAuthenticated ? "Evet" : "Hayır"}
              </div>
              <div>
                <strong>Access Token:</strong> {accessToken ? "Mevcut" : "Yok"}
              </div>
              <div>
                <strong>API URL:</strong>{" "}
                {process.env.NEXT_PUBLIC_GRAPHQL_API_URL || "Tanımlanmamış"}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
