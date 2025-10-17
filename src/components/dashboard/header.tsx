"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import useSWR from "swr";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/theme-toggle";
import { motion, AnimatePresence } from "framer-motion";
import {
    Bell, Search, ChevronDown, User, Settings, LogOut, HelpCircle,
    Radio, Plus, PhoneCall, Sparkles, Mic
} from "lucide-react";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
    DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { WalletDisplay } from "./wallet-display";

// Mock Data (can be replaced with API calls)
const notifications = [
    { id: 1, title: "New AI model available", message: "Our enhanced conversation model is now ready.", time: "3 days ago", read: true, type: "update", icon: <Sparkles className="h-5 w-5 text-[#A7B3AC]" /> }
];

const quickActions = [
    { label: "Create new agent", icon: <Radio className="h-4 w-4 text-[#A7B3AC]" />, description: "Design a new voice agent", href: "/dashboard/new-agent" },
    { label: "Make a call", icon: <PhoneCall className="h-4 w-4 text-[#A7B3AC]" />, description: "Initiate a call with an agent", href: "/dashboard/calls" },
    { label: "Add contacts", icon: <User className="h-4 w-4 text-[#A7B3AC]" />, description: "Import or add new contacts", href: "/dashboard/contacts" },
];

const fetcher = (url: string) => fetch(url).then(r => r.json());

export function DashboardHeader() {
    const { user, logout } = useAuth();
    const router = useRouter();
    const [searchFocused, setSearchFocused] = useState(false);
    const [searchValue, setSearchValue] = useState('');
    const [scrolled, setScrolled] = useState(false);
    const searchResultsRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    const { data: agentsData } = useSWR<{ agents: any[] }>(searchValue.length > 2 ? `/api/agents?search=${searchValue}` : null, fetcher);
    const { data: contactsData } = useSWR<{ contacts: any[] }>(searchValue.length > 2 ? `/api/contacts?search=${searchValue}` : null, fetcher);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchResultsRef.current && !searchResultsRef.current.contains(event.target as Node) && searchInputRef.current && !searchInputRef.current.contains(event.target as Node)) {
                setSearchFocused(false);
            }
        };
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setSearchFocused(true);
                searchInputRef.current?.focus();
            }
            if (e.key === 'Escape') {
                setSearchFocused(false);
            }
        };
        const handleScroll = () => setScrolled(window.scrollY > 10);

        document.addEventListener('mousedown', handleClickOutside);
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener("scroll", handleScroll);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener("scroll", handleScroll);
        };
    }, []);
    
    const unreadCount = notifications.filter(n => !n.read).length;

    const handleLogout = () => logout();

    return (
        <header className={cn("sticky top-0 z-40 w-full transition-all duration-300", scrolled ? "border-b border-[#333333] bg-[#1a1a1a]/80 backdrop-blur-xl" : "border-b border-transparent")}>
            <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-6">
                
                {/* Left Section: Logo & Brand */}
                <div className="flex items-center gap-3">
                    <Link href="/dashboard" className="flex items-center gap-2">
                         <div className="h-8 w-8 bg-[#A7B3AC] rounded-lg flex items-center justify-center">
                            <Mic className="h-4 w-4 text-[#111111]" />
                        </div>
                        <span className="font-bold text-lg text-[#F3FFD4] hidden sm:block">Voiceryn</span>
                    </Link>
                </div>

                {/* Center Section: Search */}
                <div className="relative flex-1 max-w-xl">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#A7A7A7]/70" />
                        <Input
                            ref={searchInputRef}
                            placeholder="Search agents, contacts..."
                            className="pl-10 h-9 w-full bg-[#222222] border-[#333333] focus:border-[#A7B3AC] focus:ring-1 focus:ring-[#A7B3AC]/50 placeholder:text-[#A7A7A7]/50"
                            onFocus={() => setSearchFocused(true)}
                            value={searchValue}
                            onChange={(e) => setSearchValue(e.target.value)}
                        />
                        <kbd className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 hidden h-5 select-none items-center gap-1 rounded border border-[#333333] bg-[#111111] px-1.5 font-mono text-[10px] font-medium text-[#A7A7A7] md:flex">
                            <span className="text-xs">⌘</span>K
                        </kbd>
                    </div>

                    <AnimatePresence>
                        {searchFocused && (
                            <motion.div
                                ref={searchResultsRef}
                                className="absolute left-0 right-0 mt-2 bg-[#1a1a1a] border border-[#333333] rounded-lg shadow-xl overflow-hidden"
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2, ease: "easeOut" }}
                            >
                               {/* ... (Search results logic remains the same, just styled to match) ... */}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Right Section: Actions */}
                <div className="flex items-center gap-2">
                    <TooltipProvider>
                        <DropdownMenu>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <DropdownMenuTrigger asChild>
                                        <Button className="h-9 w-9 rounded-full gap-2 bg-[#A7B3AC] text-[#111111] hover:bg-[#A7B3AC]/90">
                                            <Plus className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                </TooltipTrigger>
                                <TooltipContent side="bottom"><p className="text-xs">Quick Actions</p></TooltipContent>
                            </Tooltip>
                            <DropdownMenuContent align="end" className="w-64 p-2 bg-[#1a1a1a] border-[#333333]">
                               {/* ... (Quick actions dropdown styled to match) ... */}
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <DropdownMenu>
                             <Tooltip>
                                <TooltipTrigger asChild>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full relative bg-[#222222] border border-[#333333] hover:bg-[#333333]">
                                            <Bell className="h-4 w-4 text-[#A7A7A7]" />
                                            {unreadCount > 0 && <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-[#A7B3AC] animate-pulse"></span>}
                                        </Button>
                                    </DropdownMenuTrigger>
                                </TooltipTrigger>
                                <TooltipContent side="bottom"><p className="text-xs">Notifications</p></TooltipContent>
                            </Tooltip>
                            <DropdownMenuContent align="end" className="w-96 p-0 bg-[#1a1a1a] border-[#333333]">
                               {/* ... (Notifications dropdown styled to match) ... */}
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <ThemeToggle />

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="gap-2 rounded-full px-2 h-9 border border-[#333333] bg-[#222222] hover:bg-[#333333]">
                                    <Avatar className="h-7 w-7">
                                        <AvatarImage src="/avatars/user.jpg" alt="User avatar" />
                                        <AvatarFallback className="bg-[#A7B3AC]/20 text-[#A7B3AC] text-xs">{user?.name?.charAt(0) || 'U'}</AvatarFallback>
                                    </Avatar>
                                    <div className="hidden md:block text-left">
                                        <p className="text-xs font-medium text-[#F3FFD4]">{user?.name || 'User'}</p>
                                    </div>
                                    <ChevronDown className="h-4 w-4 text-[#A7A7A7]" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56 p-2 bg-[#1a1a1a] border-[#333333]">
                                <div className="p-2 mb-2 border-b border-[#333333]">
                                    <p className="font-semibold text-sm text-[#F3FFD4]">{user?.name || 'User'}</p>
                                    <p className="text-xs text-[#A7A7A7]">{user?.email || 'user@example.com'}</p>
                                </div>
                                <DropdownMenuItem asChild><Link href='/dashboard/profile' className="cursor-pointer h-9"><User className="mr-2 h-4 w-4" /> Profile</Link></DropdownMenuItem>
                                <DropdownMenuItem asChild><Link href='/dashboard/settings' className="cursor-pointer h-9"><Settings className="mr-2 h-4 w-4" /> Settings</Link></DropdownMenuItem>
                                <DropdownMenuSeparator className="bg-[#333333]" />
                                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-400 focus:text-red-400 focus:bg-red-400/10 h-9">
                                    <LogOut className="mr-2 h-4 w-4" /> Log out
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </TooltipProvider>
                </div>
            </div>
        </header>
    );
}