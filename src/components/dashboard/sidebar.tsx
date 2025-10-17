"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import useSWR from "swr";
import { useAuth } from "@/contexts/AuthContext";

import {
  LayoutDashboard,
  ShoppingBag,
  Users,
  BarChart,
  Settings,
  HelpCircle,
  LogOut,
  ChevronLeft,
  Menu,
  Plus,
  Contact,
  Shield,
  Calendar,
  CreditCard,
  Clock,
  Star,
  Receipt,
  TrendingUp,
  MapPin,
  Bell,
  PhoneCall,
  Bot,
  Headphones,
  Mic,
  Database,
  MessageSquare,
  Activity,
  Target,
  GitBranch
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const fetcher = (url: string) => fetch(url).then(r => r.json());

export function DashboardSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const { user, logout } = useAuth();

  // AI Voice Agent data
  const { data: agentsData } = useSWR<{ agents: any[] }>("/api/agents", fetcher);
  const agentCount = agentsData?.agents?.length ?? 0;
  const activeAgents = agentsData?.agents?.filter(a => !a.disabled).length ?? 0;

  // Active calls
  const { data: callsData } = useSWR<{ calls: any[], pagination: any }>("/api/calls?status=in-progress", fetcher);
  const activeCallCount = callsData?.calls?.length ?? 0;

  // Conversations
  const { data: conversationsData } = useSWR<{ conversations: any[] }>("/api/conversations?status=active", fetcher);
  const activeConversations = conversationsData?.conversations?.length ?? 0;

  const navItems = [
    {
      icon: <LayoutDashboard className="h-5 w-5" />,
      label: "Dashboard",
      href: "/dashboard",
      description: "Overview & analytics"
    },
    // Core AI Voice System
    {
      icon: <PhoneCall className="h-5 w-5" />,
      label: "Calls",
      href: "/dashboard/calls",
      badge: activeCallCount > 0 ? activeCallCount : undefined,
      description: "Voice calls & history",
      section: "ai"
    },
    {
      icon: <Bot className="h-5 w-5" />,
      label: "AI Agents",
      href: "/dashboard/agents",
      badge: `${activeAgents}/${agentCount}`,
      description: "Voice AI assistants",
      section: "ai"
    },
    {
      icon: <MessageSquare className="h-5 w-5" />,
      label: "Call History",
      href: "/dashboard/calls/history",
      badge: activeConversations > 0 ? activeConversations : undefined,
      description: "Call transcripts & logs",
      section: "ai"
    },
    // CRM & Lead Management
    {
      icon: <Target className="h-5 w-5" />,
      label: "Leads",
      href: "/dashboard/leads",
      description: "Lead management & CRM",
      section: "crm",
      isNew: true
    },
    {
      icon: <GitBranch className="h-5 w-5" />,
      label: "Pipelines",
      href: "/dashboard/leads/customize",
      description: "Sales pipeline setup",
      section: "crm"
    },
    {
      icon: <Users className="h-5 w-5" />,
      label: "Contacts",
      href: "/dashboard/contacts",
      description: "Customer database",
      section: "crm"
    },
    // Business & Management
    {
      icon: <Database className="h-5 w-5" />,
      label: "Knowledge Base",
      href: "/dashboard/knowledge",
      description: "AI training data",
      section: "business"
    },
    {
      icon: <BarChart className="h-5 w-5" />,
      label: "Analytics",
      href: "/dashboard/analytics",
      description: "Usage & insights",
      section: "business"
    },
    {
      icon: <CreditCard className="h-5 w-5" />,
      label: "Billing",
      href: "/dashboard/billing",
      description: "Usage & payments",
      section: "business"
    }
  ];

  const bottomNavItems = [
    {
      icon: <Settings className="h-5 w-5" />,
      label: "Settings",
      href: "/dashboard/settings"
    }
  ];

  /* ---------- local handlers ---------- */
  const toggleSidebar = () => setCollapsed(!collapsed);
  const toggleMobileSidebar = () => setMobileOpen(!mobileOpen);
  const handleLogout = () => {
    logout();
  };

  const NavSection = ({ title, items, isBottom = false }: { title?: string, items: any[], isBottom?: boolean }) => {
    if (collapsed) {
      return (
        <div className="space-y-2">
          {items.map((item) => (
            <NavItem key={item.href} item={item} isBottom={isBottom} />
          ))}
        </div>
      );
    }

    return (
      <div className="space-y-1">
        {title && (
          <div className="px-3 py-2">
            <p className="text-xs font-semibold text-muted-foreground/80 uppercase tracking-wider">
              {title}
            </p>
          </div>
        )}
        {items.map((item) => (
          <NavItem key={item.href} item={item} isBottom={isBottom} />
        ))}
      </div>
    );
  };

  const NavItem = ({ item, isBottom = false }: { item: any, isBottom?: boolean }) => {
    const active = pathname === item.href ||
      (item.href !== '/dashboard' && pathname.startsWith(item.href)) ||
      (item.href === '/dashboard/leads' && pathname.startsWith('/dashboard/leads'));

    if (collapsed) {
      return (
        <TooltipProvider delayDuration={100}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="flex justify-center relative"
              >
                <Button
                  variant="ghost"
                  className={cn(
                    "justify-center px-3 py-3 relative h-12 w-12 rounded-xl transition-all duration-200",
                    active
                      ? "bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-600 dark:text-blue-400 shadow-sm border border-blue-500/20"
                      : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/10 hover:scale-105"
                  )}
                >
                  {item.icon}
                  {item.isNew && (
                    <div className="absolute -top-1 -right-1 h-3 w-3 bg-gradient-to-r from-orange-400 to-red-500 rounded-full animate-pulse" />
                  )}
                  {item.badge !== undefined && (
                    <Badge className={cn(
                      "absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs",
                      item.urgent ? "bg-red-500 text-white animate-pulse" : "bg-blue-500 text-white"
                    )}>
                      {typeof item.badge === 'string' ? item.badge : (typeof item.badge === 'number' && item.badge > 9 ? '9+' : item.badge)}
                    </Badge>
                  )}
                </Button>
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right" className="flex flex-col gap-1">
              <span className="font-medium">{item.label}</span>
              {item.description && <span className="text-xs text-muted-foreground">{item.description}</span>}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return (
      <Link
        href={item.href}
        onClick={() => setMobileOpen(false)}
        className="block group relative"
      >
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start gap-3 px-3 py-3 h-auto rounded-xl transition-all duration-200 group-hover:scale-[1.02]",
            active
              ? "bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-600 dark:text-blue-400 shadow-sm border border-blue-500/20"
              : "text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent/10"
          )}
        >
          <div className="flex items-center gap-3 flex-1">
            <div className={cn(
              "flex items-center justify-center w-8 h-8 rounded-lg transition-colors",
              active ? "bg-blue-500/10" : "group-hover:bg-sidebar-accent/20"
            )}>
              {item.icon}
            </div>
            <div className="flex flex-col items-start flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">{item.label}</span>
                {item.isNew && (
                  <Badge className="bg-gradient-to-r from-orange-400 to-red-500 text-white text-xs px-1.5 py-0.5 animate-pulse">
                    NEW
                  </Badge>
                )}
              </div>
              {item.description && (
                <span className="text-xs text-muted-foreground">{item.description}</span>
              )}
            </div>
            {item.badge !== undefined && (
              <Badge className={cn(
                "ml-auto text-xs",
                item.urgent ? "bg-red-500 text-white animate-pulse" :
                  item.section === "ai" ? "bg-blue-500/20 text-blue-600 border-blue-500/20" :
                    item.section === "crm" ? "bg-green-500/20 text-green-600 border-green-500/20" :
                      "bg-purple-500/20 text-purple-600 border-purple-500/20"
              )}>
                {item.badge}
              </Badge>
            )}
          </div>
        </Button>
      </Link>
    );
  };

  // Group items by section
  const coreItems = navItems.filter(item => !item.section);
  const aiItems = navItems.filter(item => item.section === 'ai');
  const crmItems = navItems.filter(item => item.section === 'crm');
  const businessItems = navItems.filter(item => item.section === 'business');

  return (
    <>
      {/* Mobile hamburger */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 md:hidden bg-background/80 backdrop-blur-sm border border-border/40"
        onClick={toggleMobileSidebar}
      >
        <Menu className="h-6 w-6" />
      </Button>

      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-background/80 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed h-screen top-0 left-0 bg-gradient-to-b from-sidebar to-sidebar/95 border-r border-sidebar-border/50 z-50 backdrop-blur-xl",
          "transition-all duration-300 flex flex-col shadow-xl",
          "md:relative md:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
          collapsed ? "w-20" : "w-72"
        )}
      >
        {/* Header */}
        <div className={cn(
          "flex items-center px-4 h-16 border-b border-sidebar-border/50 bg-sidebar/50",
          collapsed ? "justify-center" : "justify-between"
        )}>
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="relative">
              <div className="h-9 w-9 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <Mic className="h-5 w-5 text-white" />
              </div>
              <div className="absolute -top-0.5 -right-0.5">
                <div className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
                </div>
              </div>
            </div>
            {!collapsed && (
              <div>
                <span className="font-bold text-lg bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">
                  Xseize
                </span>
                <p className="text-xs text-sidebar-foreground/60">AI Voice Platform</p>
              </div>
            )}
          </Link>

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="hidden md:flex text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/10 rounded-lg"
          >
            <ChevronLeft className={`h-4 w-4 transition-transform duration-200 ${collapsed ? "rotate-180" : ""}`} />
          </Button>
        </div>

        {/* Main Navigation */}
        <div className="flex-1 flex flex-col min-h-0">
          {collapsed ? (
            <div className="flex-1 flex flex-col justify-start py-6 px-3 space-y-3">
              <NavSection items={coreItems} />
              <div className="pt-2">
                <Separator className="bg-sidebar-border/50" />
              </div>
              <NavSection items={aiItems} />
              <div className="pt-2">
                <Separator className="bg-sidebar-border/50" />
              </div>
              <NavSection items={crmItems} />
              <div className="pt-2">
                <Separator className="bg-sidebar-border/50" />
              </div>
              <NavSection items={businessItems} />
              <div className="pt-4">
                <Separator className="bg-sidebar-border/50" />
              </div>
              <div className="pt-2 space-y-2">
                {bottomNavItems.map((item) => (
                  <NavItem key={item.href} item={item} isBottom />
                ))}
              </div>
            </div>
          ) : (
            <ScrollArea className="flex-1 h-full">
              <nav className="py-6 px-3 space-y-6">
                <NavSection items={coreItems} />
                <NavSection title="AI Voice System" items={aiItems} />
                <NavSection title="CRM & Lead Management" items={crmItems} />
                <NavSection title="Business Management" items={businessItems} />

                <div className="py-2">
                  <Separator className="bg-sidebar-border/50" />
                </div>

                <NavSection items={bottomNavItems} isBottom />
              </nav>
            </ScrollArea>
          )}
        </div>

        {/* Footer */}
        <div className={cn(
          "p-4 border-t border-sidebar-border/50 bg-sidebar/50",
          collapsed && "flex flex-col items-center"
        )}>
          {/* Quick Action Buttons */}
          <div className={cn("space-y-2 mb-4", collapsed && "space-y-1")}>
            <Link href="/dashboard/calls/new" onClick={() => setMobileOpen(false)}>
              <Button
                className={cn(
                  "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white shadow-lg",
                  "transition-all duration-200 hover:scale-105 rounded-xl",
                  collapsed ? "px-3 justify-center w-full" : "w-full"
                )}
              >
                <PhoneCall className="h-4 w-4" />
                {!collapsed && <span className="ml-2">New Call</span>}
              </Button>
            </Link>

            {!collapsed && (
              <div className="grid grid-cols-2 gap-2">
                <Link href="/dashboard/leads" onClick={() => setMobileOpen(false)}>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full border-green-500/20 text-green-600 hover:bg-green-500/10"
                  >
                    <Target className="h-3 w-3 mr-1" />
                    <span className="text-xs">Leads</span>
                  </Button>
                </Link>
                <Link href="/dashboard/agents/new" onClick={() => setMobileOpen(false)}>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full border-purple-500/20 text-purple-600 hover:bg-purple-500/10"
                  >
                    <Bot className="h-3 w-3 mr-1" />
                    <span className="text-xs">Agent</span>
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
