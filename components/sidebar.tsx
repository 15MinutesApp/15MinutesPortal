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
  { icon: Users, label: "Users", href: "/site/users" },
  { icon: Heart, label: "Interests", href: "/site/interests" },
  { icon: FileText, label: "Reports", href: "/site/reports" },
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
    if (pathname === "/site/users") return "Users";
    if (pathname === "/site/interests") return "Interests";
    if (pathname === "/site/reports") return "Reports";
    return "Dashboard";
  };

  const activeItem = getActiveItem();

  return (
    <aside className="fixed left-0 top-0 h-screen w-24 bg-sidebar z-50 overflow-visible">
      <div className="absolute right-0 top-0 h-full w-px bg-pink-400/30 shadow-lg"></div>
      <nav className="flex flex-col items-center gap-2 pt-2 pb-6 h-full overflow-visible">
        <div className="mb-6 flex flex-col items-center w-full px-2 mt-2">
          <div className="w-18 h-18 flex items-center justify-center mb-4">
            <img
              src="/logo.png"
              alt="15 Minutes"
              className="w-18 h-18 object-contain"
            />
          </div>
          <h2 className="text-sm font-semibold text-foreground/70 text-center leading-tight -mt-1">
            Carpenter
          </h2>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 flex flex-col gap-3 items-center w-full">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeItem === item.label;

            return (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  "group relative flex items-center justify-center w-14 h-14 rounded-2xl transition-all duration-300 ease-out shadow-sm border",
                  "hover:-translate-y-2 hover:translate-x-1 hover:shadow-lg hover:rotate-[-2deg]",
                  isActive
                    ? "bg-pink-200/60 text-pink-400 border-pink-400/80 shadow-md"
                    : "bg-card text-foreground border-border hover:border-pink-400/40 hover:bg-pink-50/50"
                )}
              >
                <Icon className="w-5 h-5 transition-transform duration-300 group-hover:scale-125" />

                {/* Tooltip */}
                <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-3 py-2 bg-card text-card-foreground text-sm font-medium rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 ease-out whitespace-nowrap shadow-lg border border-border pointer-events-none z-[60]">
                  {item.label}
                  <div className="absolute right-full top-1/2 -translate-y-1/2 w-0 h-0 border-4 border-transparent border-r-card" />
                </div>
              </Link>
            );
          })}
        </div>

        <div className="mt-auto flex flex-col items-center w-full space-y-3">
          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="group relative flex items-center justify-center w-14 h-14 rounded-2xl transition-all duration-300 ease-out shadow-sm border bg-card text-foreground border-border hover:border-red-500/30 hover:bg-red-50 hover:text-red-600 hover:-translate-y-2 hover:translate-x-1 hover:shadow-lg hover:rotate-[-2deg]"
          >
            <LogOut className="w-5 h-5 transition-transform duration-300 group-hover:scale-125" />

            {/* Logout Tooltip */}
            <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-3 py-2 bg-card text-card-foreground text-sm font-medium rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 ease-out whitespace-nowrap shadow-lg border border-border pointer-events-none z-[60]">
              Logout
              <div className="absolute right-full top-1/2 -translate-y-1/2 w-0 h-0 border-4 border-transparent border-r-card" />
            </div>
          </button>
        </div>
      </nav>
    </aside>
  );
}
