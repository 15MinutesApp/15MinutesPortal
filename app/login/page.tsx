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
import { Eye, EyeOff } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import {
  startPasswordLogin,
  verifyTotp,
  verifyBackupCode,
} from "@/lib/auth/authService";
import { GraphQLError } from "@/lib/api/graphql";
import { toast } from "sonner";

export default function LoginPage() {
  const [step, setStep] = useState(1); // 1: email/password, 2: TOTP/Backup
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [backupCode, setBackupCode] = useState("");
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

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Login failed");
      }

      console.log("Login successful, challenge token received");
      setStep(2);
      toast.success(data.message);
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
      const response = await fetch("/api/auth/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-email": email,
        },
        body: JSON.stringify({
          otp: useBackupCode ? undefined : otp,
          backupCode: useBackupCode ? backupCode : undefined,
          useBackupCode,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Verification failed");
      }

      // Update auth context with email only (tokens are now in HTTP-only cookies)
      login("", "", email);
      toast.success(data.message);
      router.push("/");
    } catch (error) {
      console.error("Verification error:", error);
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
            <CardDescription className="text-muted-foreground">
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
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label
                      htmlFor={useBackupCode ? "backupCode" : "otp"}
                      className="text-foreground"
                    >
                      {useBackupCode ? "Backup Kodu" : "TOTP Kodu"}
                    </Label>
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
                        TOTP Kodu
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
                        Backup Kod
                      </button>
                    )}
                  </div>
                  <Input
                    id={useBackupCode ? "backupCode" : "otp"}
                    type="text"
                    placeholder={useBackupCode ? "ABCD1234" : "123456"}
                    value={useBackupCode ? backupCode : otp}
                    onChange={(e) => {
                      if (useBackupCode) {
                        setBackupCode(e.target.value);
                      } else {
                        setOtp(e.target.value);
                      }
                    }}
                    required
                    maxLength={useBackupCode ? 8 : 6}
                    className="border-[#FFCDE1] focus-[#CDFBFF]"
                  />
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
