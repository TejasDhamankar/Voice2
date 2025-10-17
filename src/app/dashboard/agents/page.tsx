"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DashboardHeader } from "@/components/dashboard/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Bot,
    Phone,
    Plus,
    Settings,
    Clock,
    Volume2,
    Pencil,
    Trash2,
    MoreHorizontal,
    Brain,
    Globe,
    Timer,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Agent type
type Agent = {
    agent_id: string;
    name: string;
    description: string;
    disabled: boolean;
    voice_id: string;
    voiceName: string;
    usage_minutes: number;
    last_called_at: string | null;
    template_name?: string;
    llm_model: string;
    temperature: number;
    language: string;
    max_duration_seconds: number;
    knowledge_documents: Array<any>;
    tools: string[];
};

export default function AgentsPage() {
    const router = useRouter();
    const { user } = useAuth();

    const [agents, setAgents] = useState<Agent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [agentToDelete, setAgentToDelete] = useState<string | null>(null);
    const [deletingAgent, setDeletingAgent] = useState(false);

    useEffect(() => {
        const fetchAgents = async () => {
            try {
                setLoading(true);
                const res = await fetch("/api/getAgents");

                if (!res.ok) {
                    throw new Error("Failed to fetch agents");
                }

                const data = await res.json();
                setAgents(data.agents || []);
            } catch (err: any) {
                console.error("Error fetching agents:", err);
                setError(err.message || "Unexpected error");
            } finally {
                setLoading(false);
            }
        };

        fetchAgents();
    }, []);

    const handleDeleteAgent = async (agentId: string) => {
        try {
            setDeletingAgent(true);
            const response = await fetch(`/api/agents/${agentId}`, {
                method: "DELETE",
            });

            if (!response.ok) {
                throw new Error("Failed to delete agent");
            }

            setAgents((prev) => prev.filter((agent) => agent.agent_id !== agentId));
            setAgentToDelete(null);
        } catch (err: any) {
            console.error("Error deleting agent:", err);
        } finally {
            setDeletingAgent(false);
        }
    };

    const getLanguageName = (code: string) => ({ en: "English", es: "Spanish", fr: "French" }[code] || code.toUpperCase());
    const formatDuration = (seconds: number) => `${Math.floor(seconds / 60)}m`;

    const containerVariant = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.07 } },
    };
    const itemVariant = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
    };

    return (
        <div className="min-h-screen text-foreground flex">
            <main className="flex-1 max-h-screen overflow-y-auto bg-[#111111]">
                <DashboardHeader />
                <div className="container mx-auto px-4 sm:px-6 py-8">
                    <div className="flex flex-wrap justify-between items-center gap-4 mb-8 text-[#F3FFD4]">
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Voice Agents</h1>
                            <p className="text-muted-foreground mt-1">Manage your AI voice agents for phone calls and conversations.</p>
                        </div>
                        <Button onClick={() => router.push('/dashboard/new-agent')} className="gap-2">
                            <Plus className="h-4 w-4" /> New Agent
                        </Button>
                    </div>

                    {loading ? (
                        <div className="text-center text-[#A7A7A7]">Loading agents...</div>
                    ) : error ? (
                        <div className="text-center text-red-500">
                            <p>Error loading agents: {error}</p>
                            <Button variant="outline" onClick={() => window.location.reload()} className="mt-4">Retry</Button>
                        </div>
                    ) : agents.length === 0 ? (
                        <Card className="border-dashed border-[#333333] bg-[#1a1a1a]">
                            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                                <Bot className="h-16 w-16 text-[#A7A7A7] mb-4" />
                                <h3 className="text-xl font-semibold mb-2 text-[#F3FFD4]">No Voice Agents Yet</h3>
                                <p className="text-[#A7A7A7] max-w-md mb-6">Create your first AI voice agent to start making and receiving calls.</p>
                                <Button onClick={() => router.push('/dashboard/new-agent')} className="gap-2">
                                    <Plus className="h-4 w-4" /> Create Your First Agent
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <motion.div
                            initial="hidden"
                            animate="visible"
                            variants={containerVariant}
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                        >
                            {agents.map((agent) => (
                                <motion.div key={agent.agent_id} variants={itemVariant}>
                                    <Card className={cn("overflow-hidden h-full flex flex-col bg-[#1a1a1a] border border-[#333333] hover:border-[#A7B3AC]/50 transition-colors", agent.disabled && "bg-[#222222]/50 hover:border-[#A7A7A7]/30")}>
                                        <CardHeader>
                                            <div className="flex justify-between items-start">
                                                <div className="flex-1">
                                                    <CardTitle className="text-lg text-[#F3FFD4]">{agent.name}</CardTitle>
                                                    {agent.template_name && (
                                                        <Badge variant="secondary" className="mt-1 text-xs bg-[#A7B3AC]/10 text-[#A7B3AC] border border-transparent">
                                                            {agent.template_name}
                                                        </Badge>
                                                    )}
                                                </div>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 -mt-2 text-[#A7A7A7] hover:bg-[#333333] hover:text-[#F3FFD4]">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="bg-[#1a1a1a] border-[#333333] text-[#F3FFD4]">
                                                        <DropdownMenuItem onClick={() => router.push(`/dashboard/agents/${agent.agent_id}/edit`)} className="cursor-pointer">
                                                            <Pencil className="h-4 w-4 mr-2" /> Edit Agent
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => setAgentToDelete(agent.agent_id)} className="cursor-pointer text-destructive focus:text-destructive">
                                                            <Trash2 className="h-4 w-4 mr-2" /> Delete Agent
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                            {agent.description && (
                                                <CardDescription className="line-clamp-2 pt-2 text-[#A7A7A7]">{agent.description}</CardDescription>
                                            )}
                                        </CardHeader>

                                        <CardContent className="flex-1 space-y-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-full bg-[#A7B3AC]/10 flex items-center justify-center">
                                                    <Volume2 className="h-5 w-5 text-[#A7B3AC]" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-[#F3FFD4]">Voice: {agent.voiceName}</p>
                                                    <Badge variant="outline" className="text-xs mt-1 border-[#333333] text-[#A7A7A7]">
                                                        <Globe className="h-3 w-3 mr-1" />{getLanguageName(agent.language)}
                                                    </Badge>
                                                </div>
                                            </div>
                                            <div className="space-y-2 text-sm">
                                                <div className="flex items-center justify-between text-[#F3FFD4]">
                                                    <span className="text-[#A7A7A7] flex items-center gap-2"><Clock className="h-4 w-4" />Last used</span>
                                                    <span>{agent.last_called_at ? formatDistanceToNow(new Date(agent.last_called_at), { addSuffix: true }) : "Never"}</span>
                                                </div>
                                                <div className="flex items-center justify-between text-[#F3FFD4]">
                                                    <span className="text-[#A7A7A7] flex items-center gap-2"><Brain className="h-4 w-4" />Model</span>
                                                    <Badge variant="outline" className="border-[#333333] text-[#A7A7A7]">{agent.llm_model}</Badge>
                                                </div>
                                                <div className="flex items-center justify-between text-[#F3FFD4]">
                                                    <span className="text-[#A7A7A7] flex items-center gap-2"><Timer className="h-4 w-4" />Max duration</span>
                                                    <span>{formatDuration(agent.max_duration_seconds)}</span>
                                                </div>
                                            </div>
                                        </CardContent>

                                        <CardFooter className="border-t border-[#333333] pt-4 flex justify-between gap-2">
                                            <Button variant="outline" size="sm" className="gap-2 w-full" onClick={() => router.push(`/dashboard/agents/${agent.agent_id}/edit`)}>
                                                <Settings className="h-4 w-4" /> Manage
                                            </Button>
                                            <Button size="sm" className="gap-2 w-full" onClick={() => router.push(`/dashboard/calls/new?agent=${agent.agent_id}`)}>
                                                <Phone className="h-4 w-4" /> Make Call
                                            </Button>
                                        </CardFooter>
                                    </Card>
                                </motion.div>
                            ))}
                        </motion.div>
                    )}
                </div>
            </main>

            <AlertDialog open={!!agentToDelete} onOpenChange={(open) => !open && setAgentToDelete(null)}>
                <AlertDialogContent className="bg-[#1a1a1a] border-[#333333]">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-[#F3FFD4]">Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription className="text-[#A7A7A7]">
                            This will permanently delete the agent and all associated data. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deletingAgent} className="bg-transparent text-[#A7A7A7] border-[#333333] hover:bg-[#333333]">Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => { if (agentToDelete) handleDeleteAgent(agentToDelete); }} className="bg-destructive hover:bg-destructive/90" disabled={deletingAgent}>
                            {deletingAgent ? "Deleting..." : "Delete Agent"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            
        </div>
    );
}
