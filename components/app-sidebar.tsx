"use client"

import * as React from "react"
import {
  BookOpen,
  Bot,
  Command,
  Frame,
  LifeBuoy,
  Map,
  PieChart,
  Send,
  Settings2,
  SquareTerminal,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
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
      url: "dashboard",
      icon: SquareTerminal,
    },
    {
      title: "Customers",
      url: "#",
      icon: BookOpen,
      items: [
        {
          title: "Add",
          url: "#",
        },
        {
          title: "View All",
          url: "#",
        },
      ],
    },
    {
      title: "Invoices",
      url: "#",
      icon: Bot,
      items: [
        {
          title: "Add",
          url: "#",
        },
        {
          title: "View All",
          url: "#",
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
