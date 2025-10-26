"use client";

import type React from "react";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Eye, EyeOff } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export default function LoginPage() {
  const [step, setStep] = useState(1); // 1: email/password, 2: TOTP/Backup
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [backupCode, setBackupCode] = useState("");
  const [challengeToken, setChallengeToken] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [useBackupCode, setUseBackupCode] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const { login } = useAuth();

  const handleFirstStep = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      console.log("Attempting login with:", { email, password: "***" });

      // Direct GraphQL API call with credentials for HTTP-only cookies
      const response = await fetch("/api/graphql", {
        method: "POST",
        credentials: "include", // Important: allows cookies to be sent and received
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: `
            mutation StartPasswordLogin($email: String!, $password: String!) {
              Admin_startPasswordLogin(email: $email, password: $password)
            }
          `,
          variables: { email, password },
        }),
      });

      const data = await response.json();

      if (!response.ok || data.errors) {
        throw new Error(data.errors?.[0]?.message || "Login failed");
      }

      console.log("Login successful, challenge token received");
      setChallengeToken(data.data.Admin_startPasswordLogin);
      setStep(2);
      toast.success("Email ve şifre doğrulandı. Lütfen TOTP kodunuzu girin.");
    } catch (error) {
      console.error("Login error details:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Bir hata oluştu. Lütfen tekrar deneyin."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSecondStep = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const totpCode = useBackupCode ? backupCode : otp;

      // Direct GraphQL API call with credentials for HTTP-only cookies
      const response = await fetch("/api/graphql", {
        method: "POST",
        credentials: "include", // Important: allows cookies to be sent and received
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: `
            mutation VerifyTotp($challengeToken: String!, $totpCode: String!) {
              Admin_verifyTotp(challengeToken: $challengeToken, totpCode: $totpCode) {
                accessToken
                refreshToken
              }
            }
          `,
          variables: { challengeToken, totpCode },
        }),
      });

      const data = await response.json();

      console.log("TOTP verification response status:", response.status);
      console.log("TOTP verification response headers:", response.headers);
      console.log("TOTP verification response data:", data);

      if (!response.ok || data.errors) {
        throw new Error(data.errors?.[0]?.message || "Verification failed");
      }

      // Handle successful login
      console.log("Login successful!", data);

      // Cookie'leri kontrol et
      console.log("All cookies after login:", document.cookie);

      // Tokens are now in HTTP-only cookies set by backend
      // Update auth context with email only
      login("", "", email);
      toast.success("Giriş başarılı! Yönlendiriliyorsunuz...");

      // Full page reload to ensure cookies are properly set and AuthContext refreshes
      window.location.href = "/";
    } catch (error) {
      console.error("Login error:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Bir hata oluştu. Lütfen tekrar deneyin."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sol taraf - Sabrina resmi */}
      <div className="hidden lg:flex lg:w-1/2 relative">
        <Image
          src="/sabrina.png"
          alt="Sabrina"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#F869A2]/20 to-transparent" />
      </div>

      {/* Sağ taraf - Login formu */}
      <div className="w-full lg:w-1/3 flex items-center justify-center p-4">
        <Card className="!rounded-3xl w-full max-w-md border-0 shadow-xl border-t-2 shadow-pink-500/30">
          <CardHeader className="space-y-4 text-center">
            <div className="flex justify-center">
              <Image
                src="/logo.png"
                alt="15 Minutes Logo"
                width={150}
                height={150}
                className="object-contain"
              />
            </div>
            <CardTitle className="text-2xl font-bold text-foreground">
              {step === 1 ? "Giriş Yap" : "Doğrulama"}
            </CardTitle>
            <CardDescription className="mb-3 text-muted-foreground">
              {step === 1
                ? "15 Minutes Carpenter'a hoş geldiniz."
                : useBackupCode
                ? "Lütfen backup kodunuzu girin"
                : "Lütfen TOTP kodunuzu girin"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {step === 1 ? (
              <form onSubmit={handleFirstStep} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-foreground">
                    E-posta
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-foreground">
                    Şifre
                  </Label>
                  <InputGroup>
                    <InputGroupInput
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <InputGroupAddon align="inline-end">
                      <InputGroupButton
                        type="button"
                        aria-label={
                          showPassword ? "Şifreyi gizle" : "Şifreyi göster"
                        }
                        onClick={() => setShowPassword((v) => !v)}
                        className="cursor-pointer"
                      >
                        {showPassword ? <EyeOff /> : <Eye />}
                      </InputGroupButton>
                    </InputGroupAddon>
                  </InputGroup>
                </div>
                <Button
                  type="submit"
                  className="w-full bg-[#FFCDE1] hover:bg-[#CDFBFF] text-[#1C1C1C] cursor-pointer"
                  disabled={isLoading}
                >
                  {isLoading ? "Gönderiliyor..." : "Devam Et"}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleSecondStep} className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-center">
                    {useBackupCode ? (
                      <InputOTP
                        maxLength={8}
                        value={backupCode}
                        onChange={(value) => setBackupCode(value.toUpperCase())}
                        pattern="[A-Z0-9]*"
                      >
                        <InputOTPGroup>
                          <InputOTPSlot index={0} />
                          <InputOTPSlot index={1} />
                          <InputOTPSlot index={2} />
                          <InputOTPSlot index={3} />
                        </InputOTPGroup>
                        <InputOTPSeparator />
                        <InputOTPGroup>
                          <InputOTPSlot index={4} />
                          <InputOTPSlot index={5} />
                          <InputOTPSlot index={6} />
                          <InputOTPSlot index={7} />
                        </InputOTPGroup>
                      </InputOTP>
                    ) : (
                      <InputOTP
                        maxLength={6}
                        value={otp}
                        onChange={(value) => setOtp(value)}
                        pattern="[0-9]*"
                      >
                        <InputOTPGroup>
                          <InputOTPSlot index={0} />
                          <InputOTPSlot index={1} />
                          <InputOTPSlot index={2} />
                        </InputOTPGroup>
                        <InputOTPSeparator />
                        <InputOTPGroup>
                          <InputOTPSlot index={3} />
                          <InputOTPSlot index={4} />
                          <InputOTPSlot index={5} />
                        </InputOTPGroup>
                      </InputOTP>
                    )}
                  </div>
                  <div className="mt-10 flex justify-center">
                    {useBackupCode ? (
                      <button
                        type="button"
                        onClick={() => {
                          setUseBackupCode(false);
                          setOtp("");
                          setBackupCode("");
                        }}
                        className="underline text-sm text-[#e0528a] hover:opacity-80 cursor-pointer"
                      >
                        TOTP Kodu ile giriş yap
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setUseBackupCode(true);
                          setOtp("");
                          setBackupCode("");
                        }}
                        className="underline text-sm text-[#e0528a] hover:opacity-80 cursor-pointer"
                      >
                        Backup Kod ile giriş yap
                      </button>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Button
                    type="submit"
                    className="w-full bg-[#FFCDE1] hover:bg-[#CDFBFF] text-[#1C1C1C] cursor-pointer"
                    disabled={isLoading}
                  >
                    {isLoading ? "Doğrulanıyor..." : "Giriş Yap"}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}