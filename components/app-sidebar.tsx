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
              className="mt-3 mb-5 ml-1 overflow-visible group-data-[collapsible=icon]:translate-x-1"
            >
              <a href="/">
                <div className="flex size-20 items-center justify-start group-data-[collapsible=icon]:size-8">
                  <Image
                    src="/logo.png"
                    alt="15 Minutes Logo"
                    width={80}
                    height={80}
                    className="h-16 w-16 object-contain group-data-[collapsible=icon]:h-5 group-data-[collapsible=icon]:w-5"
                  />
                </div>
                <div className="-ml-3 text-left text-lg leading-tight group-data-[collapsible=icon]:hidden">
                  <span className="truncate font-semibold text-foreground">
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
                className="ml-3.5 group-data-[collapsible=icon]:translate-x-1"
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
