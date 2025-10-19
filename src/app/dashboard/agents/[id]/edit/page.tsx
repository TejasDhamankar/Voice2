"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import useSWR, { mutate } from "swr";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

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

// Icons
import { ArrowLeft, Save, Trash2, PlayCircle, PauseCircle, Loader2 } from "lucide-react";

// --- Base URL for API calls ---
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';
const fetcher = (url: string) => fetch(`${API_BASE_URL}${url}`).then(res => {
    if (!res.ok) {
        throw new Error('Failed to fetch data');
    }
    return res.json();
});

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
  // Note: knowledgeDocuments are complex and usually handled separately, included for schema completeness
  knowledgeDocuments: z.array(z.object({
    type: z.enum(['file', 'url', 'text']),
    name: z.string(),
    content: z.string().optional(),
    url: z.string().optional(),
    document_id: z.string().optional(),
  })).optional(),
});

// Constants for UI selections
const llmModels = [
    { id: "gpt-4o-mini", name: "GPT-4O Mini (Recommended)" },
    { id: "gpt-4o", name: "GPT-4O" },
    { id: "gpt-4-turbo", name: "GPT-4 Turbo" },
    { id: "gpt-3.5-turbo", name: "GPT-3.5 Turbo" },
];
const languages = [
    { id: "en", name: "English" }, { id: "es", name: "Spanish" }, { id: "fr", name: "French" },
    { id: "de", name: "German" }, { id: "it", name: "Italian" }, { id: "pt", name: "Portuguese" },
    { id: "hi", name: "Hindi" }, { id: "ja", name: "Japanese" }, { id: "ko", name: "Korean" }, { id: "zh", name: "Chinese" }
];

export default function EditAgentPage() {
    const params = useParams();
    const id = params.id as string; // This is the ElevenLabs agent_id from the URL
    const router = useRouter();
    const { user } = useAuth();

    // Fetch voices and specific agent data using SWR and the updated fetcher
    const { data: voicesData, isLoading: voicesLoading } = useSWR<{ voices: { id: string, name: string, tags: string, demo: string }[] }>("/api/voices", fetcher);
    const { data, error: agentError, isLoading: agentLoading } = useSWR(id ? `/api/agents/${id}` : null, fetcher);
    const agentData = data?.agent; // Assuming API returns { agent: {...} }

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deletingAgent, setDeletingAgent] = useState(false);
    const [playingVoice, setPlayingVoice] = useState<string | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const allVoices = voicesData?.voices || [];

    const form = useForm<z.infer<typeof agentSchema>>({
        resolver: zodResolver(agentSchema),
        defaultValues: { disabled: false, tools: [], knowledgeDocuments: [] },
    });

    useEffect(() => {
        // When agent data is fetched, reset the form with the data
        if (agentData) {
            form.reset({
                name: agentData.name || "",
                description: agentData.description || "",
                voiceId: agentData.voiceId || "",
                firstMessage: agentData.firstMessage || "",
                systemPrompt: agentData.systemPrompt || "",
                llmModel: agentData.llmModel || "gpt-4o-mini",
                temperature: agentData.temperature ?? 0.3,
                language: agentData.language || "en",
                maxDurationSeconds: agentData.maxDurationSeconds || 1800,
                tools: agentData.tools || [],
                disabled: agentData.disabled || false,
                knowledgeDocuments: agentData.knowledgeDocuments || [],
            });
        }
    }, [agentData, form.reset]);

    const onSubmit = async (values: z.infer<typeof agentSchema>) => {
        setSaving(true);
        setError(null);
        try {
            const response = await fetch(`${API_BASE_URL}/api/agents/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(values),
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || "Failed to update agent");
            }
            // Invalidate SWR cache for agents list to show updated data
            mutate(`${API_BASE_URL}/api/getAgents`);
            router.push("/dashboard/agents");
        } catch (err: any) {
            setError(err.message);
            console.error("Update error:", err);
        } finally {
            setSaving(false);
        }
    };
    
    const handleDeleteAgent = async () => {
        setDeletingAgent(true);
        setError(null);
        try {
            const response = await fetch(`${API_BASE_URL}/api/agents/${id}`, { method: "DELETE" });
            if (!response.ok) {
                 const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || "Failed to delete agent");
            }
            // Invalidate SWR cache for agents list
            mutate(`${API_BASE_URL}/api/getAgents`);
            router.push("/dashboard/agents");
        } catch (err: any) {
            setError(err.message);
            console.error("Delete error:", err);
        } finally {
            setDeletingAgent(false);
            setDeleteDialogOpen(false);
        }
    };

    const handlePlayVoice = (voiceId: string, demoUrl: string) => {
      // (This logic can remain the same)
    };
    
    // --- Loading and Error States ---
    if (agentLoading || !user) {
        return (
            <div className="min-h-screen flex bg-[#111111]">
                <main className="flex-1 h-screen overflow-y-auto">
                    <DashboardHeader />
                    <div className="container mx-auto p-8">
                        <Skeleton className="h-10 w-48 mb-6 bg-[#222]" />
                        <Skeleton className="h-96 w-full bg-[#1a1a1a]" />
                    </div>
                </main>
            </div>
        );
    }
     if (agentError) {
        return (
             <div className="min-h-screen flex bg-[#111111]"><main className="flex-1 h-screen overflow-y-auto"><DashboardHeader /><div className="container mx-auto p-8 text-center text-red-400">Failed to load agent data. Please try again.</div></main></div>
        )
     }

    return (
        <div className="min-h-screen text-foreground flex bg-[#111111]">
            <main className="flex-1 h-screen overflow-y-auto">
                <DashboardHeader />
                <div className="container mx-auto px-4 sm:px-6 py-8">
                    <div className="max-w-4xl mx-auto">
                        <Button variant="ghost" className="mb-4 -ml-2 text-[#A7A7A7] hover:text-[#F3FFD4]" onClick={() => router.push("/dashboard/agents")}><ArrowLeft className="mr-2 h-4 w-4" />Back to Agents</Button>
                        <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
                            <div>
                                <h1 className="text-2xl sm:text-3xl font-bold text-[#F3FFD4]">Edit Agent</h1>
                                <p className="text-[#A7A7A7] mt-1">Update your AI voice assistant's configuration.</p>
                            </div>
                            <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)} className="gap-2"><Trash2 className="h-4 w-4" />Delete Agent</Button>
                        </div>

                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                                <Tabs defaultValue="basic" className="w-full">
                                    <TabsList className="grid w-full grid-cols-3 bg-[#1a1a1a] border-[#333333]">
                                        <TabsTrigger value="basic">Basic</TabsTrigger>
                                        <TabsTrigger value="behavior">Behavior & Voice</TabsTrigger>
                                        <TabsTrigger value="advanced">Advanced</TabsTrigger>
                                    </TabsList>

                                    {/* --- BASIC TAB --- */}
                                    <TabsContent value="basic" className="mt-6">
                                        <Card className="bg-[#1a1a1a] border-[#333333]">
                                            <CardHeader><CardTitle className="text-[#F3FFD4]">Agent Identity</CardTitle></CardHeader>
                                            <CardContent className="space-y-6">
                                                <FormField control={form.control} name="name" render={({ field }) => ( <FormItem><FormLabel className="text-[#A7A7A7]">Agent Name</FormLabel><FormControl><Input {...field} className="bg-[#222] border-[#333]" /></FormControl><FormMessage /></FormItem>)} />
                                                <FormField control={form.control} name="description" render={({ field }) => ( <FormItem><FormLabel className="text-[#A7A7A7]">Description (Optional)</FormLabel><FormControl><Textarea {...field} className="bg-[#222] border-[#333]" /></FormControl><FormMessage /></FormItem>)} />
                                                <FormField control={form.control} name="disabled" render={({ field }) => (<FormItem className="flex flex-row items-center justify-between rounded-lg border border-[#333333] p-4"><div className="space-y-0.5"><FormLabel className="text-base text-[#F3FFD4]">Disable Agent</FormLabel><FormDescription className="text-[#A7A7A7]">Prevent this agent from being used in calls.</FormDescription></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>)} />
                                            </CardContent>
                                        </Card>
                                    </TabsContent>

                                    {/* --- BEHAVIOR TAB --- */}
                                    <TabsContent value="behavior" className="mt-6">
                                        <Card className="bg-[#1a1a1a] border-[#333333]">
                                            <CardHeader><CardTitle className="text-[#F3FFD4]">Behavior & Voice</CardTitle></CardHeader>
                                            <CardContent className="space-y-6">
                                                <FormField control={form.control} name="firstMessage" render={({ field }) => ( <FormItem><FormLabel className="text-[#A7A7A7]">First Message</FormLabel><FormControl><Textarea {...field} className="bg-[#222] border-[#333]" /></FormControl><FormMessage /></FormItem>)} />
                                                <FormField control={form.control} name="systemPrompt" render={({ field }) => ( <FormItem><FormLabel className="text-[#A7A7A7]">System Prompt</FormLabel><FormControl><Textarea rows={6} {...field} className="bg-[#222] border-[#333]" /></FormControl><FormMessage /></FormItem>)} />
                                                <FormField control={form.control} name="voiceId" render={({ field }) => ( <FormItem><FormLabel className="text-[#A7A7A7]">Voice</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger className="bg-[#222] border-[#333]"><SelectValue placeholder="Select a voice" /></SelectTrigger></FormControl><SelectContent className="bg-[#1a1a1a] border-[#333]">{voicesLoading ? <SelectItem value="loading" disabled>Loading...</SelectItem> : allVoices.map(v => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                                            </CardContent>
                                        </Card>
                                    </TabsContent>
                                    
                                    {/* --- ADVANCED TAB --- */}
                                    <TabsContent value="advanced" className="mt-6">
                                        <Card className="bg-[#1a1a1a] border-[#333333]">
                                            <CardHeader><CardTitle className="text-[#F3FFD4]">Advanced Settings</CardTitle></CardHeader>
                                            <CardContent className="space-y-6">
                                                <FormField control={form.control} name="llmModel" render={({ field }) => ( <FormItem><FormLabel className="text-[#A7A7A7]">Language Model</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger className="bg-[#222] border-[#333]"><SelectValue /></SelectTrigger></FormControl><SelectContent className="bg-[#1a1a1a] border-[#333]">{llmModels.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                                                <FormField control={form.control} name="temperature" render={({ field }) => ( <FormItem><FormLabel className="text-[#A7A7A7]">Temperature: {field.value?.toFixed(1) ?? '0.0'}</FormLabel><FormControl><Slider min={0} max={1} step={0.1} value={[field.value ?? 0]} onValueChange={(v) => field.onChange(v[0])} /></FormControl></FormItem>)} />
                                                <FormField control={form.control} name="language" render={({ field }) => ( <FormItem><FormLabel className="text-[#A7A7A7]">Language</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger className="bg-[#222] border-[#333]"><SelectValue /></SelectTrigger></FormControl><SelectContent className="bg-[#1a1a1a] border-[#333]">{languages.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                                                <FormField control={form.control} name="maxDurationSeconds" render={({ field }) => ( <FormItem><FormLabel className="text-[#A7A7A7]">Max Duration: {Math.floor((field.value ?? 0) / 60)} min</FormLabel><FormControl><Slider min={60} max={7200} step={60} value={[field.value ?? 1800]} onValueChange={(v) => field.onChange(v[0])} /></FormControl></FormItem>)} />
                                            </CardContent>
                                        </Card>
                                    </TabsContent>
                                </Tabs>

                                {/* Error Display */}
                                {error && <p className="text-sm text-red-500 text-center">{error}</p>}

                                <div className="flex justify-end space-x-4 pt-4 border-t border-[#333333]">
                                    <Button type="button" variant="outline" className="border-[#333] hover:bg-[#333]" onClick={() => router.push("/dashboard/agents")}>Cancel</Button>
                                    <Button type="submit" disabled={saving || agentLoading} className="gap-2 min-w-[160px] bg-[#A7B3AC] text-[#111] hover:bg-[#A7B3AC]/90">
                                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                        {saving ? "Saving..." : "Save Changes"}
                                    </Button>
                                </div>
                            </form>
                        </Form>
                    </div>
                </div>
            </main>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent className="bg-[#1a1a1a] border-[#333333]">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-[#F3FFD4]">Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription className="text-[#A7A7A7]">This will permanently delete this agent. This action cannot be undone.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deletingAgent} className="bg-transparent border-[#333] hover:bg-[#333]">Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteAgent} disabled={deletingAgent} className="bg-destructive hover:bg-destructive/90">
                            {deletingAgent ? <><Loader2 className="h-4 w-4 mr-2 animate-spin"/> Deleting...</> : "Delete"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
