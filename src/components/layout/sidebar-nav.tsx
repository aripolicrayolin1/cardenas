"use client";

import { 
  LayoutDashboard, 
  Activity, 
  Camera, 
  Users, 
  Settings, 
  LogOut,
  Leaf,
  LogIn,
  User,
  Languages,
  Microscope
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
import { usePathname, useRouter } from "next/navigation";
import { useUser } from "@/firebase/auth/use-user";
import { auth } from "@/firebase/config";
import { signOut } from "firebase/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useTranslation } from "@/hooks/use-translation";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

export function SidebarNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useUser();
  const { t, lang, toggleLanguage } = useTranslation();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const navItems = [
    { title: 'dashboard', icon: LayoutDashboard, href: "/" },
    { title: 'monitoring', icon: Activity, href: "/monitoring" },
    { title: 'diagnosis', icon: Camera, href: "/diagnosis" },
    { title: 'diagnosis_pro', icon: Microscope, href: "/diagnosis-pro" },
    { title: 'community', icon: Users, href: "/community" },
    { title: 'farms', icon: Leaf, href: "/farms" },
  ];

  const handleSignOut = async () => {
    await signOut(auth);
    router.push("/login");
  };

  return (
    <Sidebar variant="inset" collapsible="icon" className="glass-nav border-none" suppressHydrationWarning>
      <SidebarHeader className="h-20 flex items-center justify-center px-6">
        <div className="flex items-center gap-2 group-data-[collapsible=icon]:hidden">
          <div className="bg-primary rounded-2xl p-2 shadow-lg shadow-primary/20 animate-float">
            <Leaf className="h-7 w-7 text-white" />
          </div>
          <span 
            className="font-black text-2xl tracking-tighter text-primary" 
            suppressHydrationWarning 
            translate="no"
          >
            Agro<span className="text-foreground">Tech</span>
          </span>
        </div>
        <div className="hidden group-data-[collapsible=icon]:flex bg-primary rounded-xl p-1.5 shadow-lg">
          <Leaf className="h-5 w-5 text-white" />
        </div>
      </SidebarHeader>
      
      <SidebarContent className="py-6">
        {mounted && user && !loading && (
          <div className="px-4 py-2 group-data-[collapsible=icon]:hidden mb-4">
            <div className="flex items-center gap-3 p-3 bg-white/50 backdrop-blur-sm rounded-2xl border border-white/50 shadow-sm transition-all hover:shadow-md">
              <Avatar className="h-10 w-10 border-2 border-primary/20 shadow-inner">
                <AvatarImage src={user.photoURL ?? undefined} alt={user.displayName ?? undefined} />
                <AvatarFallback className="bg-primary/10 text-primary font-bold">
                  {user.displayName?.charAt(0) || user.email?.charAt(0) || <User className="h-5 w-5" />}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col min-w-0">
                <p 
                  className="text-xs font-black truncate text-primary uppercase tracking-tighter" 
                  suppressHydrationWarning
                >
                  {user.displayName || (mounted ? t('farmer') : 'Agricultor')}
                </p>
                <p className="text-[10px] text-muted-foreground truncate font-medium">{user.email}</p>
              </div>
            </div>
          </div>
        )}
        
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="gap-2">
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={pathname === item.href}
                    tooltip={mounted ? t(item.title as any) : item.title}
                    className={`rounded-xl h-11 transition-all duration-300 ${
                      pathname === item.href 
                        ? 'bg-primary text-white shadow-lg shadow-primary/30 scale-105' 
                        : 'hover:bg-primary/10 text-muted-foreground hover:text-primary hover:translate-x-1'
                    }`}
                  >
                    <Link href={item.href} className="flex items-center gap-3 px-4">
                      <item.icon className={`h-5 w-5 ${pathname === item.href ? 'text-white' : 'text-primary'}`} />
                      <span className="font-bold tracking-tight" suppressHydrationWarning>
                        {mounted ? t(item.title as any) : item.title}
                      </span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <div className="px-4 mt-8 group-data-[collapsible=icon]:hidden">
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full gap-2 border-primary/20 text-[10px] h-9 font-black uppercase tracking-widest rounded-xl hover:bg-primary hover:text-white transition-all shadow-sm"
            onClick={toggleLanguage}
          >
            <Languages className="h-4 w-4" />
            <span suppressHydrationWarning>
              {!mounted ? 'CAMBIAR IDIOMA' : lang === 'es' ? 'CAMBIAR A HÑÄHÑU' : 'MPENGI JA ESPAÑOL'}
            </span>
          </Button>
        </div>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-white/20">
        <SidebarMenu className="gap-2">
          {!user && !loading ? (
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip={mounted ? t('login') : 'Entrar'} className="rounded-xl h-11 hover:bg-primary/10 hover:text-primary">
                <Link href="/login" className="flex items-center gap-3 px-4">
                  <LogIn className="h-5 w-5 text-primary" />
                  <span className="font-bold" suppressHydrationWarning>{mounted ? t('login') : 'Entrar'}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ) : (
            <>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip={mounted ? t('settings') : 'Ajustes'} className="rounded-xl h-11 hover:bg-primary/10 hover:text-primary">
                  <Link href="/settings" className="flex items-center gap-3 px-4">
                    <Settings className="h-5 w-5 text-primary" />
                    <span className="font-bold" suppressHydrationWarning>{mounted ? t('settings') : 'Ajustes'}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip={mounted ? t('logout') : 'Salir'} onClick={handleSignOut} className="rounded-xl h-11 hover:bg-destructive/10 hover:text-destructive text-muted-foreground">
                  <div className="flex items-center gap-3 px-4 w-full">
                    <LogOut className="h-5 w-5" />
                    <span className="font-bold" suppressHydrationWarning>{mounted ? t('logout') : 'Salir'}</span>
                  </div>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </>
          )}
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
