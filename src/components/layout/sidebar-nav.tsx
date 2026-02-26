
"use client";

import { 
  LayoutDashboard, 
  Activity, 
  Camera, 
  Users, 
  Settings, 
  LogOut,
  Leaf
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { title: "Dashboard", icon: LayoutDashboard, href: "/" },
  { title: "Monitoreo", icon: Activity, href: "/monitoring" },
  { title: "Diagnóstico IA", icon: Camera, href: "/diagnosis" },
  { title: "Comunidad", icon: Users, href: "/community" },
  { title: "Fincas", icon: Leaf, href: "/farms" },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <Sidebar variant="inset" collapsible="icon">
      <SidebarHeader className="h-16 flex items-center justify-center border-b px-6">
        <div className="flex items-center gap-2 group-data-[collapsible=icon]:hidden">
          <div className="bg-primary rounded-lg p-1.5">
            <Leaf className="h-6 w-6 text-white" />
          </div>
          <span className="font-bold text-xl tracking-tight text-primary">Guardian<span className="text-foreground">Cultivo</span></span>
        </div>
        <div className="hidden group-data-[collapsible=icon]:flex bg-primary rounded-lg p-1">
          <Leaf className="h-5 w-5 text-white" />
        </div>
      </SidebarHeader>
      <SidebarContent className="py-4">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={pathname === item.href}
                    tooltip={item.title}
                  >
                    <Link href={item.href}>
                      <item.icon className="h-5 w-5" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Ajustes">
              <Link href="/settings">
                <Settings className="h-5 w-5" />
                <span>Configuración</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Cerrar Sesión">
              <LogOut className="h-5 w-5" />
              <span>Salir</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
