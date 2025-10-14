"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@apollo/client/react";
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
import { testApolloConnection } from "@/lib/apollo/client";
import {
  ADMIN_START_PASSWORD_LOGIN,
  ADMIN_USERS,
  TEST_CONNECTION,
} from "@/lib/apollo/queries";
import { toast } from "sonner";

export default function ApolloTestPage() {
  const [connectionStatus, setConnectionStatus] =
    useState<string>("Testing...");
  const [email, setEmail] = useState("admin@15minutes.app");
  const [password, setPassword] = useState("admin123");

  // Test connection on mount
  useEffect(() => {
    const testConnection = async () => {
      const isConnected = await testApolloConnection();
      setConnectionStatus(isConnected ? "✅ Connected" : "❌ Failed");
    };
    testConnection();
  }, []);

  // Test query
  const {
    data: schemaData,
    loading: schemaLoading,
    error: schemaError,
  } = useQuery(TEST_CONNECTION, {
    errorPolicy: "all",
  });

  // Login mutation
  const [startPasswordLogin, { loading: loginLoading, error: loginError }] =
    useMutation(ADMIN_START_PASSWORD_LOGIN);

  // Users query (requires auth)
  const {
    data: usersData,
    loading: usersLoading,
    error: usersError,
    refetch: refetchUsers,
  } = useQuery(ADMIN_USERS, {
    variables: { page: 1, limit: 5 },
    errorPolicy: "all",
    skip: true, // Skip by default, will be called manually
  });

  const handleLogin = async () => {
    try {
      const result = await startPasswordLogin({
        variables: { email, password },
      });
      console.log("Login result:", result);
      toast.success("Login successful! Challenge token received.");
    } catch (error) {
      console.error("Login error:", error);
      toast.error("Login failed. Check console for details.");
    }
  };

  const handleTestUsers = async () => {
    try {
      await refetchUsers();
      toast.success("Users query executed!");
    } catch (error) {
      console.error("Users query error:", error);
      toast.error("Users query failed. Check console for details.");
    }
  };

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Apollo Client Backend Test</CardTitle>
            <CardDescription>
              Apollo Client ile backend bağlantısını test edin
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Connection Status</Label>
                <div className="text-lg font-mono">{connectionStatus}</div>
              </div>
              <div>
                <Label>Schema Loading</Label>
                <div className="text-lg font-mono">
                  {schemaLoading
                    ? "⏳ Loading..."
                    : schemaError
                    ? "❌ Error"
                    : "✅ Loaded"}
                </div>
              </div>
            </div>

            {schemaError && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <h4 className="font-semibold text-red-800">Schema Error:</h4>
                <pre className="text-sm text-red-600 mt-2 overflow-auto">
                  {JSON.stringify(schemaError, null, 2)}
                </pre>
              </div>
            )}

            {schemaData && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <h4 className="font-semibold text-green-800">Schema Data:</h4>
                <pre className="text-sm text-green-600 mt-2 overflow-auto max-h-40">
                  {JSON.stringify(schemaData, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Login Test</CardTitle>
            <CardDescription>
              Admin login mutation'ını test edin
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
            <Button
              onClick={handleLogin}
              disabled={loginLoading}
              className="w-full"
            >
              {loginLoading ? "Testing Login..." : "Test Login"}
            </Button>
            {loginError && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <h4 className="font-semibold text-red-800">Login Error:</h4>
                <pre className="text-sm text-red-600 mt-2 overflow-auto">
                  {JSON.stringify(loginError, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Users Query Test</CardTitle>
            <CardDescription>
              Authenticated query'yi test edin (login sonrası)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={handleTestUsers}
              disabled={usersLoading}
              className="w-full"
            >
              {usersLoading ? "Loading Users..." : "Test Users Query"}
            </Button>
            {usersError && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <h4 className="font-semibold text-red-800">Users Error:</h4>
                <pre className="text-sm text-red-600 mt-2 overflow-auto">
                  {JSON.stringify(usersError, null, 2)}
                </pre>
              </div>
            )}
            {usersData && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <h4 className="font-semibold text-green-800">Users Data:</h4>
                <pre className="text-sm text-green-600 mt-2 overflow-auto max-h-40">
                  {JSON.stringify(usersData, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
