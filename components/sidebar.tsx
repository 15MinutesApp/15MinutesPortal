"use client";

import type React from "react";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Users,
  Heart,
  FileText,
  ChevronDown,
  LogOut,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

interface NavItem {
  icon: React.ElementType;
  label: string;
  href: string;
}

const navItems: NavItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/" },
  { icon: Users, label: "Kullanıcılar", href: "/site/users" },
  { icon: Heart, label: "İlgi Alanları", href: "/site/interests" },
  { icon: FileText, label: "Raporlar", href: "/site/reports" },
];

export function AppleSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { refreshAccessToken } = useAuth();

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      if (response.ok) {
        router.push("/login");
      }
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handleRefreshToken = async () => {
    const success = await refreshAccessToken();
    if (success) {
      console.log("Token refreshed successfully");
      // Reload the page to refresh data
      window.location.reload();
    } else {
      console.log("Token refresh failed");
    }
  };

  // Determine active item based on current pathname
  const getActiveItem = () => {
    if (pathname === "/") return "Dashboard";
    if (pathname === "/site/users") return "Kullanıcılar";
    if (pathname === "/site/interests") return "İlgi Alanları";
    if (pathname === "/site/reports") return "Raporlar";
    return "Dashboard";
  };

  const activeItem = getActiveItem();

  return (
    <aside className="fixed left-0 top-0 h-screen w-20 bg-sidebar border-r border-sidebar-border backdrop-blur-xl z-50">
      <nav className="flex flex-col items-center gap-2 py-6 h-full">
        <div className="mb-8 flex flex-col items-center gap-3 w-full px-3">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-400/60 to-pink-500/50 flex items-center justify-center shadow-lg">
            <img
              src="/logo.png"
              alt="15 Minutes"
              className="w-12 h-12 object-contain"
            />
          </div>
          <h2 className="text-xs font-semibold text-foreground text-center leading-tight">
            Carpenter
          </h2>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 flex flex-col gap-3 w-full px-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeItem === item.label;

            return (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  "group relative flex items-center justify-center w-full h-14 rounded-2xl transition-all duration-300 ease-out shadow-sm border",
                  "hover:-translate-y-2 hover:translate-x-1 hover:shadow-lg hover:rotate-[-2deg]",
                  isActive
                    ? "bg-primary text-primary-foreground border-primary/20 shadow-md"
                    : "bg-card text-foreground border-border hover:border-primary/30 hover:bg-card"
                )}
              >
                <Icon className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />

                {/* Tooltip */}
                <div className="absolute left-full ml-4 px-3 py-2 bg-card text-card-foreground text-sm font-medium rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 ease-out whitespace-nowrap shadow-lg border border-border pointer-events-none">
                  {item.label}
                  <div className="absolute right-full top-1/2 -translate-y-1/2 w-0 h-0 border-8 border-transparent border-r-card" />
                </div>
              </Link>
            );
          })}
        </div>

        <div className="mt-auto px-3 w-full space-y-3">
          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="group relative flex items-center justify-center w-full h-14 rounded-2xl transition-all duration-300 ease-out shadow-sm border bg-card text-foreground border-border hover:border-red-500/30 hover:bg-red-50 hover:text-red-600 hover:-translate-y-2 hover:translate-x-1 hover:shadow-lg hover:rotate-[-2deg]"
          >
            <LogOut className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />

            {/* Logout Tooltip */}
            <div className="absolute left-full ml-4 px-3 py-2 bg-card text-card-foreground text-sm font-medium rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 ease-out whitespace-nowrap shadow-lg border border-border pointer-events-none">
              Çıkış Yap
              <div className="absolute right-full top-1/2 -translate-y-1/2 w-0 h-0 border-8 border-transparent border-r-card" />
            </div>
          </button>
        </div>
      </nav>
    </aside>
  );
}
