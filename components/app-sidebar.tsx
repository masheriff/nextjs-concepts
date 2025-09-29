"use client"

import * as React from "react"
import {
  BookOpen,
  Command,
  FileText,
  Package,
  SquareTerminal,
  Users,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { UserDisplay } from "./user-display"

const data = {
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: SquareTerminal,
    },
    {
      title: "Customers",
      url: "/customers",
      icon: Users, // Changed from BookOpen to Users (more appropriate for customers)
      items: [
        {
          title: "Add",
          url: "/customers/add",
        },
        {
          title: "View All",
          url: "/customers",
        },
      ],
    },
    {
      title: "Products",
      url: "/products",
      icon: Package, // Changed from Bot to Package (appropriate for products)
      items: [
        {
          title: "Add",
          url: "/products/add",
        },
        {
          title: "View All",
          url: "/products",
        },
      ],
    },
    {
      title: "Invoices",
      url: "/invoices",
      icon: FileText, // Changed from Bot to FileText (appropriate for invoices)
      items: [
        {
          title: "Add",
          url: "/invoices/add",
        },
        {
          title: "View All",
          url: "/invoices",
        },
      ],
    },
    
  ]
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="#">
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <Command className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">Acme Inc</span>
                  <span className="truncate text-xs">Enterprise</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />        
      </SidebarContent>
      <SidebarFooter>
        <UserDisplay />
      </SidebarFooter>
    </Sidebar>
  )
}