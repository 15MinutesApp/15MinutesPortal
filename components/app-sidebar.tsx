"use client";

import type * as React from "react";
import Image from "next/image";
import { Users, Heart, FileText, LayoutDashboard, Clock } from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { NavUser } from "@/components/nav-user";

const navItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: LayoutDashboard,
  },
  {
    title: "Kullanıcılar",
    url: "/users",
    icon: Users,
  },
  {
    title: "İlgi Alanları",
    url: "/interests",
    icon: Heart,
  },
  {
    title: "Raporlar",
    url: "/reports",
    icon: FileText,
  },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              asChild
              className="group-data-[collapsible=icon]:translate-x-1"
            >
              <a href="/">
                <div className="flex aspect-square size-12 items-center justify-center">
                  <Image
                    src="/logo.png"
                    alt="15 Minutes Logo"
                    width={60}
                    height={60}
                  />
                </div>
                <div className="grid flex-1 text-left text-md leading-tight">
                  <span className="truncate font-semibold text-foreground">
                    15 Minutes
                  </span>
                  <span className="truncate text-md text-muted-foreground">
                    Carpenter
                  </span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                asChild
                className="group-data-[collapsible=icon]:translate-x-1"
              >
                <a href={item.url}>
                  <item.icon className="size-5" />
                  <span className="text-foreground ">{item.title}</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
