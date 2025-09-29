"use client";

import {
  IconCoin,
  IconDashboard,
  IconKey,
  IconNetwork,
  IconSettings,
  IconShoppingCart,
  IconTransfer,
  IconWallet,
  IconShirt,
  IconChefHat,
} from "@tabler/icons-react";
import * as React from "react";

import { NavMain } from "@/components/nav-main";
import { NavSecondary } from "@/components/nav-secondary";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { user } from "@prisma/client";

const data = {
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: IconDashboard,
    },
    {
      title: "Agent Wallets",
      url: "/dashboard/wallet",
      icon: IconWallet,
    },
    {
      title: "Service Marketplace",
      url: "/dashboard/services",
      icon: IconShoppingCart,
    },
    {
      title: "Transactions",
      url: "/dashboard/transactions",
      icon: IconTransfer,
    },
    {
      title: "API Keys",
      url: "/dashboard/api-keys",
      icon: IconKey,
    },
    {
      title: "Settings",
      url: "/dashboard/setting",
      icon: IconSettings,
    },
  ],
  navClouds: [
    {
      title: "Earn Money",
      icon: IconCoin,
      isActive: true,
      url: "#",
      items: [
        {
          title: "Provide Services",
          url: "#",
        },
        {
          title: "Set Pricing",
          url: "#",
        },
      ],
    },
    {
      title: "Spend Money",
      icon: IconTransfer,
      url: "#",
      items: [
        {
          title: "Browse Services",
          url: "#",
        },
        {
          title: "Request Services",
          url: "#",
        },
      ],
    },
    {
      title: "Agent Network",
      icon: IconNetwork,
      url: "#",
      items: [
        {
          title: "Connected Agents",
          url: "#",
        },
        {
          title: "Discovery",
          url: "#",
        },
      ],
    },
  ],
  navSecondary: [
    {
      title: "Clothing Store",
      url: "/store",
      icon: IconShirt,
    },
    {
      title: "Food & Beverage",
      url: "/fnb-store",
      icon: IconChefHat,
    },
  ],
  documents: [],
};

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user: user;
}

export function AppSidebar({ user, ...props }: AppSidebarProps) {
  if (!user) {
    throw new Error("AppSidebar requires a user but received undefined.");
  }
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader className="p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="/dashboard" className="flex items-center gap-2">
                <div className="w-6 h-6 bg-white border border-white/20 flex items-center justify-center">
                  <div className="w-2 h-2 bg-black"></div>
                </div>
                <span className="text-3xl! font-medium">Vypr</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        {/* <NavDocuments items={data.documents} /> */}
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  );
}
