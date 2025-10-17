"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import useSWR from "swr";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

// UI Components
import { DashboardHeader } from "@/components/dashboard/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { VariableTextarea } from "@/components/ui/variable-textarea";

// Icons
import { ArrowLeft, Save, Trash2, PlayCircle, PauseCircle, Search, Mic, Plus, Upload, FileText, Link as LinkIcon, BookOpen, Bot, Settings, Volume2, Wrench, Calendar, Mail, SearchIcon, Calculator, Loader2 } from "lucide-react";

// Using camelCase to match your database models
const agentSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  description: z.string().optional(),
  voiceId: z.string().min(1, "Please select a voice"),
  firstMessage: z.string().min(3, "First message is required"),
  systemPrompt: z.string().min(10, "System prompt must be at least 10 characters"),
  llmModel: z.string().optional(),
  temperature: z.number().min(0).max(1).optional(),
  language: z.string().optional(),
  maxDurationSeconds: z.number().min(60).max(7200).optional(),
  tools: z.array(z.string()).optional(),
  disabled: z.boolean().optional(),
  knowledgeDocuments: z.array(z.object({
    type: z.enum(['file', 'url', 'text']),
    name: z.string(),
    content: z.string().optional(),
    url: z.string().optional(),
    document_id: z.string().optional(),
  })).optional(),
});

const availableTools = [
    { id: "web_search", name: "Web Search", description: "Search the internet for current information", icon: SearchIcon },
    { id: "calculator", name: "Calculator", description: "Perform mathematical calculations", icon: Calculator },
];
const llmModels = [
    { id: "gpt-4o-mini", name: "GPT-4O Mini (Recommended)", description: "Best for most use cases" },
    { id: "gpt-4o", name: "GPT-4O", description: "Most capable model" },
];
const languages = [
    { id: "en", name: "English" }, { id: "es", name: "Spanish" }, { id: "hi", name: "Hindi" },
];

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function EditAgentPage() {
    const params = useParams();
    const id = params.id as string;
    const router = useRouter();

    const { data: voicesData, isLoading: voicesLoading } = useSWR<{ voices: { id: string, name: string, tags: string, demo: string }[] }>("/api/voices", fetcher);
    const { data: agentData, error: agentError, isLoading: agentLoading } = useSWR(id ? `/api/agents/${id}` : null, fetcher);

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deletingAgent, setDeletingAgent] = useState(false);
    const [voiceSearch, setVoiceSearch] = useState("");
    const [playingVoice, setPlayingVoice] = useState<string | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const allVoices = voicesData?.voices || [];

    const form = useForm<z.infer<typeof agentSchema>>({
        resolver: zodResolver(agentSchema),
        defaultValues: {
            name: "",
            description: "",
            voiceId: "",
            firstMessage: "",
            systemPrompt: "",
            llmModel: "gpt-4o-mini",
            temperature: 0.3,
            language: "en",
            maxDurationSeconds: 1800,
            tools: [],
            disabled: false,
            knowledgeDocuments: [],
        },
    });

    useEffect(() => {
        if (agentData) {
            // Use || to ensure no undefined values are passed to reset
            form.reset(agentData);
        }
    }, [agentData, form.reset]);

    const onSubmit = async (values: z.infer<typeof agentSchema>) => {
        setSaving(true);
        setError(null);
        try {
            const response = await fetch(`/api/agents/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(values),
            });
            if (!response.ok) throw new Error((await response.json()).message || "Failed to update agent");
            router.push("/dashboard/agents");
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };
    
    const handleDeleteAgent = async () => {
        setDeletingAgent(true);
        try {
            await fetch(`/api/agents/${id}`, { method: "DELETE" });
            router.push("/dashboard/agents");
        } catch (err: any) {
            setError(err.message);
        } finally {
            setDeletingAgent(false);
        }
    };

    const handlePlayVoice = (voiceId: string, demoUrl: string) => {
        if (playingVoice === voiceId) {
            audioRef.current?.pause();
            setPlayingVoice(null);
        } else {
            audioRef.current?.pause();
            const audio = new Audio(demoUrl);
            audio.onended = () => setPlayingVoice(null);
            audio.play().catch(console.error);
            audioRef.current = audio;
            setPlayingVoice(voiceId);
        }
    };

    if (agentLoading) {
        return (
            <div className="min-h-screen flex bg-[#111111]"><main className="flex-1 h-screen overflow-y-auto"><DashboardHeader /><div className="container mx-auto p-8"><Skeleton className="h-10 w-48 mb-6 bg-[#333]" /><Skeleton className="h-96 w-full bg-[#1a1a1a]" /></div></main></div>
        );
    }

    return (
        <div className="min-h-screen text-foreground flex bg-[#111111]">
            <main className="flex-1 h-screen overflow-y-auto">
                <DashboardHeader />
                <div className="container mx-auto px-4 sm:px-6 py-8">
                    <div className="max-w-6xl mx-auto">
                        <Button variant="ghost" className="mb-4 -ml-2 text-[#A7A7A7] hover:text-[#F3FFD4]" onClick={() => router.push("/dashboard/agents")}><ArrowLeft className="mr-2 h-4 w-4" />Back to Agents</Button>
                        <div className="flex justify-between items-center mb-6">
                            <div><h1 className="text-2xl sm:text-3xl font-bold text-[#F3FFD4]">Edit Agent</h1><p className="text-[#A7A7A7] mt-1">Update your AI voice assistant's configuration</p></div>
                            <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)} className="gap-2"><Trash2 className="h-4 w-4" />Delete Agent</Button>
                        </div>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                                <Tabs defaultValue="basic" className="w-full">
                                    <TabsList className="grid w-full grid-cols-3 bg-[#1a1a1a] border-[#333333]"><TabsTrigger value="basic">Basic</TabsTrigger><TabsTrigger value="behavior">Behavior & Voice</TabsTrigger><TabsTrigger value="advanced">Advanced</TabsTrigger></TabsList>
                                    <TabsContent value="basic" className="mt-6">
                                        <Card className="bg-[#1a1a1a] border-[#333333]">
                                            <CardHeader><CardTitle className="text-[#F3FFD4]">Agent Identity</CardTitle></CardHeader>
                                            <CardContent className="space-y-6">
                                                <FormField control={form.control} name="name" render={({ field }) => ( <FormItem><FormLabel className="text-[#A7A7A7]">Agent Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                                                <FormField control={form.control} name="description" render={({ field }) => ( <FormItem><FormLabel className="text-[#A7A7A7]">Description</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>)} />
                                                <FormField control={form.control} name="disabled" render={({ field }) => (<FormItem className="flex flex-row items-center justify-between rounded-lg border border-[#333333] p-4"><div className="space-y-0.5"><FormLabel className="text-base text-[#F3FFD4]">Disable Agent</FormLabel><FormDescription className="text-[#A7A7A7]">Prevent this agent from being used.</FormDescription></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>)} />
                                            </CardContent>
                                        </Card>
                                    </TabsContent>
                                    <TabsContent value="behavior" className="mt-6">
                                        <Card className="bg-[#1a1a1a] border-[#333333]">
                                            <CardHeader><CardTitle className="text-[#F3FFD4]">Behavior & Voice</CardTitle></CardHeader>
                                            <CardContent className="space-y-6">
                                                <FormField control={form.control} name="firstMessage" render={({ field }) => ( <FormItem><FormLabel className="text-[#A7A7A7]">First Message</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>)} />
                                                <FormField control={form.control} name="systemPrompt" render={({ field }) => ( <FormItem><FormLabel className="text-[#A7A7A7]">System Prompt</FormLabel><FormControl><Textarea rows={6} {...field} /></FormControl><FormMessage /></FormItem>)} />
                                                <FormField control={form.control} name="voiceId" render={({ field }) => ( <FormItem><FormLabel className="text-[#A7A7A7]">Voice</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select a voice" /></SelectTrigger></FormControl><SelectContent>{voicesLoading ? <SelectItem value="loading" disabled>Loading voices...</SelectItem> : allVoices.map(v => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                                            </CardContent>
                                        </Card>
                                    </TabsContent>
                                    <TabsContent value="advanced" className="mt-6">
                                         <Card className="bg-[#1a1a1a] border-[#333333]">
                                            <CardHeader><CardTitle className="text-[#F3FFD4]">Advanced Settings</CardTitle></CardHeader>
                                            <CardContent className="space-y-6">
                                                 <FormField control={form.control} name="llmModel" render={({ field }) => ( <FormItem><FormLabel className="text-[#A7A7A7]">Language Model</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent>{llmModels.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                                                 <FormField control={form.control} name="temperature" render={({ field }) => ( <FormItem><FormLabel className="text-[#A7A7A7]">Temperature: {field.value}</FormLabel><FormControl><Slider min={0} max={1} step={0.1} value={[field.value || 0]} onValueChange={(v) => field.onChange(v[0])} /></FormControl></FormItem>)} />
                                                 <FormField control={form.control} name="language" render={({ field }) => ( <FormItem><FormLabel className="text-[#A7A7A7]">Language</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent>{languages.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                                            </CardContent>
                                        </Card>
                                    </TabsContent>
                                </Tabs>
                                <div className="flex justify-end space-x-4">
                                    <Button type="button" variant="outline" onClick={() => router.push("/dashboard/agents")}>Cancel</Button>
                                    <Button type="submit" disabled={saving} className="gap-2 min-w-[160px]">
                                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                        {saving ? "Saving..." : "Save Changes"}
                                    </Button>
                                </div>
                            </form>
                        </Form>
                    </div>
                </div>
            </main>
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete this agent. This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
                    <AlertDialogFooter><AlertDialogCancel disabled={deletingAgent}>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDeleteAgent} disabled={deletingAgent}>{deletingAgent ? "Deleting..." : "Delete"}</AlertDialogAction></AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}