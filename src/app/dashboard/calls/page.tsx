// app/dashboard/calls/page.tsx (or wherever your CallsPage component resides)
"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/contexts/AuthContext";
import { format, formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useSocket } from "@/hooks/useSocket"; // Import the WebSocket hook

// UI Components
import { DashboardHeader } from "@/components/dashboard/header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogTrigger } from "@/components/ui/dialog";
// Removed unused DropdownMenu imports, using modal now
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";

// Icons
import {
    PhoneCall, Upload, Phone, CalendarClock, Clock, MoreHorizontal, // Removed PlayCircle
    AlertCircle, CheckCircle, XCircle, Loader2, Mic, Plus, X, FileText,
    ChevronRight, HelpCircle, Info, LayoutGrid, Download
} from "lucide-react";

// --- Base URL for API calls ---
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || ''; // Use env var or default to relative path

const fetcher = (url: string) => fetch(`${API_BASE_URL}${url}`).then(r => r.json()); // Prepend base URL to SWR fetches

const dialerSchema = z.object({
    agentId: z.string().min(1, "Please select an agent"),
    phoneNumber: z.string()
        .min(8, "Enter a valid phone number")
        .regex(/^[+\d\s()-]+$/, "Enter a valid phone number"),
    contactName: z.string().min(1, "Contact name is required"),
    customMessage: z.string().optional(),
});

// Define a simple type for recent calls if not already defined elsewhere
type RecentCall = {
    _id: string;
    contactName?: string;
    phoneNumber: string;
    status: string;
    startTime?: string; // ISO date string
    duration?: number; // seconds
    agentId?: string; // Corresponds to agent.agent_id from Agent model
    agentName?: string;
    cost?: number;
    callType?: string;
    notes?: string;
    transcription?: string;
    // Add other fields fetched from API if necessary
};

export default function CallsPage() {
    const { user } = useAuth();
    const [callTab, setCallTab] = useState("dialer");
    const [uploading, setUploading] = useState(false);
    const [selectedCall, setSelectedCall] = useState<RecentCall | null>(null);
    const [makingCall, setMakingCall] = useState(false);
    const [dialerValue, setDialerValue] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();
    const [showImportDialog, setShowImportDialog] = useState(false);
    const [importSummary, setImportSummary] = useState<{
        created: number;
        agentName: string;
        uploadedContacts: any[]; // Consider defining a stricter type
    } | null>(null);

    // --- State for Live Call Management ---
    const [pollingIntervalId, setPollingIntervalId] = useState<NodeJS.Timeout | null>(null);
    const [currentCallId, setCurrentCallId] = useState<string | null>(null);
    const [currentSignedUrl, setCurrentSignedUrl] = useState<string | null>(null);
    const [liveCallStatus, setLiveCallStatus] = useState<string | null>(null);

    // --- WebSocket Hook ---
    const {
        isConnected: isSocketConnected,
        messages: socketMessages,
        stopSocket
    } = useSocket(currentSignedUrl);

    // --- Data Fetching ---
    // Use the fetcher with API_BASE_URL prepended
    const { data: agentsData, isLoading: agentsLoading } = useSWR<{ agents: any[] }>("/api/getAgents", fetcher);
    const agents = agentsData?.agents?.filter(a => !a.disabled) || [];

    const { data: callsData, isLoading: callsLoading, mutate: refreshCalls } = useSWR<{ calls: RecentCall[] }>("/api/calls?limit=10", fetcher);
    const calls = callsData?.calls || [];

    // --- Form Setup ---
    const form = useForm<z.infer<typeof dialerSchema>>({
        resolver: zodResolver(dialerSchema),
        defaultValues: { agentId: "", contactName: "", phoneNumber: "", customMessage: "" }
    });
     // Set default agent if available after loading
    useEffect(() => {
        if (!form.getValues('agentId') && agents.length > 0) {
            form.setValue('agentId', agents[0].agent_id);
        }
    }, [agents, form]);

    // --- Polling Logic ---
    const stopPolling = useCallback(() => {
        if (pollingIntervalId) {
            clearInterval(pollingIntervalId);
            setPollingIntervalId(null);
            console.log("Polling stopped.");
        }
    }, [pollingIntervalId]);

    const pollCallStatus = useCallback(async (callId: string) => {
        try {
            // Use API_BASE_URL
            const res = await fetch(`${API_BASE_URL}/api/calls/${callId}/status`);
            if (!res.ok) {
                console.error("Polling failed:", res.status);
                if (res.status === 404) {
                     setLiveCallStatus("Error: Call not found");
                     stopPolling();
                } else if (res.status >= 500) {
                     setLiveCallStatus("Error: Server issue during polling");
                }
                return;
            }
            const data = await res.json();
            console.log("Poll status:", data);
            
            setLiveCallStatus(prevStatus => prevStatus !== data.status ? data.status : prevStatus); 

            if (data.signedUrl && data.status === 'connected') {
                console.log("Signed URL received, connecting WebSocket...");
                setCurrentSignedUrl(data.signedUrl); 
                stopPolling(); 
            } else if (['failed', 'ended', 'completed', 'busy', 'no-answer'].includes(data.status)) {
                console.log(`Call ${data.status}. Stopping poll.`);
                stopPolling();
                if (data.failureReason) {
                     setLiveCallStatus(`Failed: ${data.failureReason}`);
                }
                setTimeout(() => refreshCalls(), 1000); 
            }
        } catch (err) {
            console.error("Network error during polling:", err);
            setLiveCallStatus("Error: Network issue during polling");
        }
    }, [stopPolling, refreshCalls]); // Added dependencies


    // --- Call Initiation ---
    const onMakeCall = async (formData: z.infer<typeof dialerSchema>) => {
        if (makingCall || pollingIntervalId || isSocketConnected) {
             alert("Please wait for the current call operation to complete.");
             return; 
        }
        
        stopSocket(); 
        setCurrentSignedUrl(null);
        setCurrentCallId(null);
        setLiveCallStatus(null); 
        stopPolling(); 

        try {
            setMakingCall(true);
            setLiveCallStatus('Initiating call...'); 
            const cleanedPhoneNumber = formData.phoneNumber.replace(/\D/g, '');

            // Use API_BASE_URL
            const response = await fetch(`${API_BASE_URL}/api/calls/initiate-exotel`, { 
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...formData, phoneNumber: cleanedPhoneNumber }),
            });

            if (!response.ok) {
                 let errorMsg = "Failed to initiate call";
                 try { const errorData = await response.json(); errorMsg = errorData.message || errorMsg; } catch {}
                throw new Error(errorMsg);
            }
            
            const result = await response.json();
            console.log("Call initiation request successful:", result);

            if (!result.callId) { throw new Error("Backend did not return a Call ID."); }

            setCurrentCallId(result.callId);
            setLiveCallStatus(result.initialStatus || 'ringing'); 
            
            const intervalId = setInterval(() => pollCallStatus(result.callId), 3000); 
            setPollingIntervalId(intervalId);

            await refreshCalls(); 

        } catch (error) {
            console.error("Error making call:", error);
            const errorMsg = error instanceof Error ? error.message : 'Unknown error';
            alert(`Error initiating call: ${errorMsg}`);
             setLiveCallStatus(`Error: ${errorMsg}`);
            stopPolling(); 
        } finally {
            setMakingCall(false); 
        }
    };

    // --- Hangup Logic ---
     const onHangupCall = async () => {
         const callIdToHangup = currentCallId; 

         if (!callIdToHangup && !isSocketConnected) {
             console.log("No active call identified to hang up.");
             setLiveCallStatus(null);
             return;
         }
         
         console.log("Attempting to hang up call:", callIdToHangup || "via socket");
         
         stopPolling(); 
         stopSocket(); 
         setCurrentSignedUrl(null); 
         setLiveCallStatus('Disconnecting...'); 
         
         if (callIdToHangup) {
             try {
                // Use API_BASE_URL
                const res = await fetch(`${API_BASE_URL}/api/calls/${callIdToHangup}/hangup`, { method: 'POST' });
                if (!res.ok) {
                     const errorData = await res.json().catch(() => ({ message: 'Hangup request failed' }));
                     console.error("Failed to request hangup via backend:", errorData.message);
                     setLiveCallStatus('Hangup Failed'); 
                } else {
                     console.log("Hangup request sent successfully.");
                     setLiveCallStatus('Disconnected'); 
                }
             } catch (err) {
                 console.error("Error sending hangup request:", err);
                 setLiveCallStatus('Error during hangup');
             } finally {
                  setCurrentCallId(null); 
                  setTimeout(() => refreshCalls(), 1500);
             }
         } else {
             console.warn("Could not determine call ID to hang up via API, only disconnected WebSocket.");
             setLiveCallStatus('Disconnected (WebSocket only)');
             setCurrentCallId(null); 
              setTimeout(() => refreshCalls(), 1500);
         }
    };

    // --- Cleanup Effect ---
    useEffect(() => {
        return () => {
            stopPolling(); 
            stopSocket(); 
        };
    }, [stopPolling, stopSocket]);

    // --- CSV Upload and Batch Call Logic (Pointing to API_BASE_URL) ---
    const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const agentId = form.getValues("agentId");
        if (!agentId) { alert("Please select an agent first"); return; }

        try {
            setUploading(true);
            const formData = new FormData();
            formData.append("file", file);
            formData.append("agentId", agentId);

            // Use API_BASE_URL - Assuming /api/calls/import-csv endpoint exists
            const response = await fetch(`${API_BASE_URL}/api/calls/import-csv`, { 
                method: "POST", 
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: "Failed to upload CSV" }));
                throw new Error(errorData.message);
            }

            const data = await response.json();
            if (data.contacts && data.contacts.length > 0) {
                setImportSummary({
                    created: data.createdCount || data.contacts.length, // Adjust based on backend response key
                    agentName: data.agentName || "Selected agent",
                    uploadedContacts: data.contacts 
                });
                setShowImportDialog(true);
            } else {
                alert("No new contacts were processed from the uploaded file.");
            }
        } catch (error) {
            console.error("Error uploading CSV:", error);
            alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = ""; 
        }
    };

    const startCallingProcess = async () => {
        if (!importSummary || !importSummary.uploadedContacts.length) return;
        const agentIdForBatch = form.getValues("agentId");

        try {
            setShowImportDialog(false); 
            alert(`Initiating calls for ${importSummary.created} contacts...`);

            // Use API_BASE_URL - Assuming /api/calls/batch-initiate-exotel endpoint exists
            const response = await fetch(`${API_BASE_URL}/api/calls/batch-initiate-exotel`, { 
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    agentId: agentIdForBatch, 
                    contacts: importSummary.uploadedContacts 
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: "Failed to start batch calls" }));
                throw new Error(errorData.message);
            }
            const result = await response.json();
            console.log("Batch call initiation result:", result);
            alert(`Successfully queued ${result.initiatedCount || 0} calls.`);
            refreshCalls(); 
        } catch (error) {
            console.error("Error starting batch calls:", error);
            alert(`Error starting calls: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setImportSummary(null);
        }
    };
    // --- ---

    // --- Helper Functions (Remain the same) ---
    const handleDialerButtonClick = (value: string) => {
        const newValue = value === 'backspace' 
            ? dialerValue.slice(0, -1) 
            : dialerValue + value;
        setDialerValue(newValue);
        form.setValue("phoneNumber", newValue, { shouldValidate: true }); 
    };
    const formatPhoneNumber = (number: string) => {
         if (!number) return '';
        const cleaned = ('' + number).replace(/\D/g, '');
        // Simple North American format - adjust if needed
        const match = cleaned.match(/^(1|)?(\d{3})(\d{3})(\d{4})$/);
        if (match) {
            const intlCode = (match[1] ? '+1 ' : '');
            return [intlCode, '(', match[2], ') ', match[3], '-', match[4]].join('');
        }
        if (cleaned.startsWith('+') && cleaned.length > 5) { return '+' + cleaned.substring(1); }
        return number; 
    };
    const getStatusBadge = (status: string | null | undefined) => {
        status = status?.toLowerCase() || 'unknown'; 
        switch (status) {
            case 'ended': case 'completed': return <Badge className="bg-green-500/20 text-green-600 border-green-500/20">Completed</Badge>;
            case 'connected': return <Badge className="bg-blue-500/20 text-blue-600 border-blue-500/20">Connected</Badge>;
            case 'in-progress': case 'answered': return <Badge className="bg-yellow-500/20 text-yellow-600 border-yellow-500/20">In Progress</Badge>;
            case 'ringing': return <Badge className="bg-yellow-500/20 text-yellow-600 border-yellow-500/20 animate-pulse">Ringing</Badge>;
            case 'initiating': case 'queued': case 'pending': return <Badge variant="secondary" className="bg-gray-500/20 text-gray-400 border-gray-500/20">Queued</Badge>;
            case 'disconnecting': return <Badge variant="destructive" className="bg-orange-500/20 text-orange-500 border-orange-500/20">Disconnecting</Badge>;
            case 'disconnected': return <Badge variant="destructive" className="bg-gray-600/30 text-gray-500 border-gray-600/30">Disconnected</Badge>;
            case 'failed': case 'busy': case 'no-answer': return <Badge variant="destructive" className="bg-red-500/20 text-red-600 border-red-500/20 capitalize">{status.replace('-', ' ')}</Badge>;
            default: if (status.startsWith('error')) { return <Badge variant="destructive" className="bg-red-500/20 text-red-600 border-red-500/20">Error</Badge>; } return <Badge variant="outline" className="capitalize">{status}</Badge>;
        }
    };
    // --- ---

    // --- Animation Variants (Remain the same) ---
    const fadeInUpVariant = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
    };
    // --- ---

    return (
        <div className="min-h-screen text-foreground flex bg-[#111111]">
            <main className="flex-1 overflow-y-auto h-screen">
                <DashboardHeader />
                <div className="container mx-auto px-4 sm:px-6 py-8">
                    {/* Header */}
                    <motion.div initial="hidden" animate="visible" variants={fadeInUpVariant}>
                        <h1 className="text-2xl sm:text-3xl font-bold mb-1 text-[#F3FFD4]">Call Management</h1>
                        <p className="text-[#A7A7A7] mb-8">Make calls or import contacts.</p>
                    </motion.div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Dialer/Import Section */}
                        <motion.div className="lg:col-span-2" initial="hidden" animate="visible" variants={fadeInUpVariant}>
                            <Tabs value={callTab} onValueChange={setCallTab} className="w-full">
                                {/* Tab Selection */}
                                <div className="flex flex-wrap gap-4 justify-between items-center mb-6">
                                     <TabsList className="grid grid-cols-2 bg-[#1a1a1a] border border-[#333333] p-1 h-auto">
                                        <TabsTrigger value="dialer" disabled={isSocketConnected || !!pollingIntervalId}>
                                            <Phone className="h-4 w-4 mr-2" /> Dialer
                                        </TabsTrigger>
                                        <TabsTrigger value="import" disabled={isSocketConnected || !!pollingIntervalId}>
                                            <Upload className="h-4 w-4 mr-2" /> Import
                                        </TabsTrigger>
                                    </TabsList>
                                     {/* Removed separate New Call button */}
                                </div>

                                {/* Dialer Tab */}
                                <TabsContent value="dialer">
                                    <Card className="bg-[#1a1a1a] border border-[#333333]">
                                        <CardHeader>
                                             <CardTitle className="flex items-center gap-2 text-[#F3FFD4]"><Phone className="h-5 w-5 text-[#A7B3AC]" /> AI Dialer</CardTitle>
                                             <CardDescription className="text-[#A7A7A7]">Select agent and enter details.</CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <Form {...form}>
                                                <form onSubmit={form.handleSubmit(onMakeCall)} className="space-y-6">
                                                     {/* Agent Selector */}
                                                    <FormField control={form.control} name="agentId" render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className="text-[#A7A7A7]">Agent</FormLabel>
                                                            <Select onValueChange={field.onChange} value={field.value} disabled={agentsLoading || makingCall || !!pollingIntervalId || isSocketConnected}>
                                                                <FormControl><SelectTrigger className="bg-[#222222] border-[#333333]"><SelectValue placeholder={agentsLoading ? "Loading..." : "Select agent"} /></SelectTrigger></FormControl>
                                                                <SelectContent className="bg-[#1a1a1a] border-[#333333]">
                                                                    {agentsLoading ? <SelectItem value="loading" disabled>Loading...</SelectItem> : agents.length > 0 ? agents.map(agent => ( <SelectItem key={agent.agent_id} value={agent.agent_id}>{agent.name}</SelectItem> )) : <SelectItem value="no-agents" disabled>No agents</SelectItem>}
                                                                </SelectContent>
                                                            </Select>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )} />
                                                     {/* Contact & Phone */}
                                                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                         {/* ... Contact Name Field ... */}
                                                         <FormField control={form.control} name="contactName" render={({ field }) => ( <FormItem> <FormLabel className="text-[#A7A7A7]">Contact Name</FormLabel> <FormControl><Input placeholder="John Smith" {...field} disabled={makingCall || !!pollingIntervalId || isSocketConnected} className="bg-[#222222] border-[#333333] placeholder:text-[#A7A7A7]/50" /></FormControl> <FormMessage /> </FormItem> )} />
                                                         {/* ... Phone Number Field ... */}
                                                         <FormField control={form.control} name="phoneNumber" render={({ field }) => ( <FormItem> <FormLabel className="text-[#A7A7A7]">Phone Number</FormLabel> <FormControl><Input placeholder="+1 555 123 4567" {...field} value={dialerValue} onChange={(e)=>{field.onChange(e); setDialerValue(e.target.value)}} disabled={makingCall || !!pollingIntervalId || isSocketConnected} className="bg-[#222222] border-[#333333] placeholder:text-[#A7A7A7]/50" /></FormControl> <FormMessage /> </FormItem> )} />
                                                     </div>
                                                      {/* Dialer Pad */}
                                                      <div className="mt-4 p-4 sm:p-6 bg-[#1f1f1f]/60 rounded-lg border border-[#333333]">
                                                          {/* ... Dialer Display ... */}
                                                          <div className="flex justify-center mb-4"><div className="text-center px-3 py-2 rounded-lg bg-[#1a1a1a] shadow-sm min-w-[200px] border border-[#333333]"><p className="text-2xl font-mono tracking-wider text-[#F3FFD4]">{formatPhoneNumber(dialerValue) || '—'}</p></div></div>
                                                          {/* ... Dialer Buttons ... */}
                                                          <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-4 max-w-xs mx-auto">{[1, 2, 3, 4, 5, 6, 7, 8, 9, '*', 0, '#'].map((num) => (<Button key={num} type="button" variant="outline" className="h-12 sm:h-14 text-lg sm:text-xl font-medium bg-[#2a2a2a] border-[#444] hover:bg-[#3a3a3a] text-[#F3FFD4]" onClick={() => handleDialerButtonClick(num.toString())} disabled={makingCall || !!pollingIntervalId || isSocketConnected}>{num}</Button>))}</div>
                                                          {/* ... Dialer Actions (+, Call, Backspace) ... */}
                                                          <div className="flex justify-center gap-3">
                                                            <TooltipProvider> <Tooltip> <TooltipTrigger asChild><Button type="button" variant="outline" className="rounded-full w-10 h-10 sm:w-12 sm:h-12 p-0 bg-[#2a2a2a] border-[#444] hover:bg-[#3a3a3a]" onClick={() => handleDialerButtonClick('+')} disabled={makingCall || !!pollingIntervalId || isSocketConnected}><Plus className="h-4 w-4" /></Button></TooltipTrigger> <TooltipContent>Add +</TooltipContent> </Tooltip> </TooltipProvider>
                                                            {/* Call button moved to form actions */}
                                                            <TooltipProvider> <Tooltip> <TooltipTrigger asChild><Button type="button" variant="outline" className="rounded-full w-10 h-10 sm:w-12 sm:h-12 p-0 bg-[#2a2a2a] border-[#444] hover:bg-[#3a3a3a]" onClick={() => handleDialerButtonClick('backspace')} disabled={makingCall || !!pollingIntervalId || isSocketConnected}><X className="h-4 w-4" /></Button></TooltipTrigger> <TooltipContent>Delete</TooltipContent> </Tooltip> </TooltipProvider>
                                                          </div>
                                                      </div>
                                                      {/* Custom Message */}
                                                      <FormField control={form.control} name="customMessage" render={({ field }) => ( <FormItem> <FormLabel className="text-[#A7A7A7]">Custom Instructions (Optional)</FormLabel> <FormControl><Textarea placeholder="Specific context for the agent..." {...field} disabled={makingCall || !!pollingIntervalId || isSocketConnected} className="min-h-[80px] bg-[#222222] border-[#333333] placeholder:text-[#A7A7A7]/50" /></FormControl> <FormMessage /> </FormItem> )} />
                                                      {/* Form Actions */}
                                                      <div className="flex flex-col sm:flex-row gap-4 items-center pt-2">
                                                            <Button type="submit" className="w-full sm:w-auto bg-[#A7B3AC] text-[#111111] hover:bg-[#A7B3AC]/90 font-bold disabled:opacity-60" disabled={makingCall || !!pollingIntervalId || isSocketConnected || uploading || !form.formState.isValid}>
                                                                {makingCall ? ( <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Initiating...</> ) 
                                                                : (pollingIntervalId || isSocketConnected) ? ( <><Mic className="h-4 w-4 mr-2" /> Call Active</> ) 
                                                                : ( <><Phone className="h-4 w-4 mr-2" /> Start Call</> )}
                                                            </Button>
                                                            {/* "How it works" Dialog */}
                                                            <Dialog>
                                                                <DialogTrigger asChild><Button variant="outline" size="sm" type="button" className="w-full sm:w-auto sm:ml-auto border-[#333333] text-[#A7A7A7] hover:bg-[#333333] hover:text-[#F3FFD4]"><HelpCircle className="h-4 w-4 mr-2" /> How it works</Button></DialogTrigger>
                                                                <DialogContent className="bg-[#1a1a1a] border-[#333333] text-[#F3FFD4]">
                                                                     {/* ... Dialog content remains same ... */}
                                                                      <DialogHeader><DialogTitle>How AI Voice Calls Work</DialogTitle><DialogDescription className="text-[#A7A7A7]">Learn how calls are initiated and handled.</DialogDescription></DialogHeader><div className="space-y-4 py-4 text-sm"><div className="flex gap-4 items-start"><div className="h-8 w-8 rounded-full bg-[#A7B3AC]/10 flex items-center justify-center flex-shrink-0"><Phone className="h-4 w-4 text-[#A7B3AC]" /></div><div><h4 className="font-medium mb-1">1. Initiate</h4><p className="text-[#A7A7A7]">Select agent, enter details, click call. Request goes to our server.</p></div></div><div className="flex gap-4 items-start"><div className="h-8 w-8 rounded-full bg-[#A7B3AC]/10 flex items-center justify-center flex-shrink-0"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-webhook text-[#A7B3AC]"><path d="M18 16.98h-5.99c-1.1 0-1.95.94-2.48 1.9A4 4 0 0 1 2 17c.01-.7.23-1.37.64-1.93.41-.56 1-1.01 1.7-1.31-.08-.1-.16-.21-.24-.33a5.29 5.29 0 0 1-1.4-4.57c.31-1.15 1.11-2.08 2.22-2.48.9-.33 1.91-.33 2.81 0l.5.18.5-.18c.9-.33 1.91-.33 2.81 0 1.11.4 1.91 1.33 2.22 2.48.47 1.77-.3 3.65-1.4 4.57-.08.12-.16.23-.24.33.7.3 1.29.75 1.7 1.31.41.56.63 1.23.64 1.93a4 4 0 0 1-7.52-1.92c-.53-.97-1.38-1.92-2.48-1.92Z"/><path d="M12 12v-2"/></svg></div><div><h4 className="font-medium mb-1">2. Connect (Exotel)</h4><p className="text-[#A7A7A7]">Server tells Exotel to call the number and connect to our webhook.</p></div></div><div className="flex gap-4 items-start"><div className="h-8 w-8 rounded-full bg-[#A7B3AC]/10 flex items-center justify-center flex-shrink-0"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-left-right text-[#A7B3AC]"><path d="M8 3 4 7l4 4"/><path d="M4 7h16"/><path d="m16 21 4-4-4-4"/><path d="M20 17H4"/></svg></div><div><h4 className="font-medium mb-1">3. Bridge (ElevenLabs)</h4><p className="text-[#A7A7A7]">On answer, webhook gets WebSocket URL from ElevenLabs & tells Exotel to stream audio.</p></div></div><div className="flex gap-4 items-start"><div className="h-8 w-8 rounded-full bg-[#A7B3AC]/10 flex items-center justify-center flex-shrink-0"><Mic className="h-4 w-4 text-[#A7B3AC]" /></div><div><h4 className="font-medium mb-1">4. Converse</h4><p className="text-[#A7A7A7]">Browser connects to WebSocket for live transcript & audio.</p></div></div></div><DialogFooter><DialogClose asChild><Button variant="outline" className="border-[#333333]">Got it</Button></DialogClose></DialogFooter>
                                                                </DialogContent>
                                                            </Dialog>
                                                      </div>
                                                </form>
                                            </Form>
                                        </CardContent>
                                    </Card>
                                </TabsContent>

                                {/* Import Tab */}
                                <TabsContent value="import">
                                     <Card className="bg-[#1a1a1a] border border-[#333333]">
                                          {/* ... Import Tab Header ... */}
                                           <CardHeader className="border-b border-[#333333]"><CardTitle className="flex items-center gap-2 text-[#F3FFD4]"><Upload className="h-5 w-5 text-[#A7B3AC]" /> Bulk Import</CardTitle><CardDescription className="text-[#A7A7A7]">Upload CSV for multiple calls.</CardDescription></CardHeader>
                                           <CardContent className="pt-6">
                                                {/* Agent Selector for Import */}
                                                <FormField control={form.control} name="agentId" render={({ field }) => ( <FormItem className="mb-6"> <FormLabel className="text-[#A7A7A7]">Agent for Upload</FormLabel> <Select onValueChange={field.onChange} value={field.value} disabled={agentsLoading || uploading}> <FormControl><SelectTrigger className="bg-[#222222] border-[#333333]"><SelectValue placeholder={agentsLoading ? "Loading..." : "Select agent for batch"} /></SelectTrigger></FormControl> <SelectContent className="bg-[#1a1a1a] border-[#333333]"> {agentsLoading ? <SelectItem value="loading" disabled>Loading...</SelectItem> : agents.length > 0 ? agents.map(agent => ( <SelectItem key={agent.agent_id} value={agent.agent_id}>{agent.name}</SelectItem> )) : <SelectItem value="no-agents" disabled>No agents</SelectItem>} </SelectContent> </Select> <FormDescription className="text-[#A7A7A7]/80">This agent handles calls from the CSV.</FormDescription> <FormMessage /> </FormItem> )} />
                                                {/* File Upload Area */}
                                                <div className="border-2 border-dashed border-[#333333] rounded-lg p-8 text-center bg-[#1f1f1f]/50">
                                                     {/* ... Upload Icon/Text/Buttons ... */}
                                                     <div className="mx-auto w-16 h-16 mb-4 rounded-full bg-[#2a2a2a] flex items-center justify-center border border-[#444]"><Upload className="h-8 w-8 text-[#A7A7A7]" /></div><h3 className="text-lg font-medium mb-2 text-[#F3FFD4]">Upload Contact List</h3><p className="text-sm text-[#A7A7A7] mb-4 max-w-md mx-auto">CSV: 'name', 'phoneNumber', optional 'customMessage'.</p><input ref={fileInputRef} type="file" accept=".csv" onChange={handleCSVUpload} className="hidden" /><div className="flex flex-col sm:flex-row justify-center gap-3"><Button type="button" className="bg-[#A7B3AC] text-[#111111] hover:bg-[#A7B3AC]/90 font-bold flex-1 sm:flex-initial" onClick={() => { if(!form.getValues('agentId')) { alert('Please select an agent first.'); return; } fileInputRef.current?.click(); }} disabled={uploading || agentsLoading}>{uploading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Uploading...</> : <><Upload className="h-4 w-4 mr-2" /> Select CSV</>}</Button><Button type="button" variant="outline" asChild className="flex-1 sm:flex-initial border-[#333333] hover:bg-[#333333]"><a href="/templates/contacts_template.csv" download><Download className="h-4 w-4 mr-2" /> Template</a></Button></div>
                                                </div>
                                           </CardContent>
                                          {/* ... Import Tab Footer ... */}
                                           <CardFooter className="border-t border-[#333333] pt-6"><div className="flex items-start gap-2 text-sm text-[#A7A7A7]"> <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" /> <p>Calls are queued via backend. Monitor status in Recent Calls.</p> </div></CardFooter>
                                     </Card>
                                </TabsContent>
                            </Tabs>

                            {/* --- Live Call Status Display --- */}
                            <motion.div variants={fadeInUpVariant} className="mt-6">
                                 {/* ... (Live Call Status Card remains the same) ... */}
                                  <Card className="bg-[#1a1a1a] border border-[#333333]"> <CardHeader> <CardTitle className="text-[#F3FFD4] text-lg flex items-center gap-2"><Mic className="h-5 w-5 text-[#A7B3AC]" /> Live Call</CardTitle> </CardHeader> <CardContent> {liveCallStatus ? ( <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"> {getStatusBadge(liveCallStatus)} {(isSocketConnected || pollingIntervalId || ['ringing', 'connected', 'initiating', 'in-progress', 'answered'].includes(liveCallStatus.toLowerCase())) && ( <Button variant="destructive" size="sm" onClick={onHangupCall}><XCircle className="h-4 w-4 mr-2" /> Hang Up</Button> )} </div> ) : ( <p className="text-sm text-[#A7A7A7] italic">No active call.</p> )} {isSocketConnected && ( <div className="mt-4 max-h-60 overflow-y-auto border-t border-[#333333] pt-4 space-y-2"><h4 className="text-md font-semibold text-[#F3FFD4] mb-2">Live Transcript</h4><div className="text-sm text-[#A7A7A7] space-y-1">{socketMessages.filter(msg => msg.type === 'user_transcript' || msg.type === 'agent_response').slice(-10).map((msg, index) => (<p key={index} className={cn(msg.type === 'user_transcript' ? "text-blue-300" : "text-green-300")}>{msg.type === 'user_transcript' ? `User: ${msg.user_transcript_event?.user_transcript}` : `Agent: ${msg.agent_response_event?.agent_response}`}</p>))}{socketMessages.length === 0 && <p>Waiting...</p>}</div></div> )} </CardContent> </Card>
                            </motion.div>

                        </motion.div> {/* End Left Column */}

                        {/* Recent Calls Section */}
                        <motion.div className="lg:col-span-1" initial="hidden" animate="visible" variants={fadeInUpVariant}>
                            {/* ... (Recent Calls Card remains the same) ... */}
                             <Card className="h-fit max-h-[calc(100vh-200px)] flex flex-col bg-[#1a1a1a] border border-[#333333]"> <CardHeader className="border-b border-[#333333] flex-shrink-0"><CardTitle className="flex items-center gap-2 text-[#F3FFD4]"><CalendarClock className="h-5 w-5 text-[#A7B3AC]" /> Recent Calls</CardTitle><CardDescription className="text-[#A7A7A7]">Latest call activities.</CardDescription></CardHeader> <CardContent className="p-0 flex-1 overflow-hidden"> {callsLoading ? ( <div className="p-8 text-center text-[#A7A7A7]"><Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />Loading...</div> ) : calls.length > 0 ? ( <ScrollArea className="h-full"><div className="divide-y divide-[#333333]">{calls.map((call) => ( <div key={call._id} className="p-4 hover:bg-[#222222] transition-colors cursor-pointer" onClick={() => setSelectedCall(call)} tabIndex={0} onKeyDown={(e)=>{if(e.key === 'Enter') setSelectedCall(call)}}> <div className="flex items-start gap-3"><Avatar className="h-10 w-10 flex-shrink-0"><AvatarFallback className="bg-[#A7B3AC]/10 text-[#A7B3AC]">{call.contactName?.charAt(0)?.toUpperCase() || '?'}</AvatarFallback></Avatar><div className="flex-1 min-w-0"><div className="flex justify-between items-start gap-2"><p className="font-medium text-sm text-[#F3FFD4] truncate">{call.contactName || "Unknown"}</p>{getStatusBadge(call.status)}</div><p className="text-sm text-[#A7A7A7] truncate">{formatPhoneNumber(call.phoneNumber)}</p><div className="flex items-center gap-2 mt-1 flex-wrap"><p className="text-xs text-[#A7A7A7] whitespace-nowrap">{call.startTime ? formatDistanceToNow(new Date(call.startTime), { addSuffix: true }) : "Scheduled"}</p>{call.duration != null && call.duration > 0 && (<><span className="text-xs text-[#A7A7A7]">•</span><p className="text-xs text-[#A7A7A7] whitespace-nowrap">{Math.floor(call.duration / 60)}m {call.duration % 60}s</p></>)}</div></div></div> </div> ))}</div></ScrollArea> ) : ( <div className="p-8 text-center"> <div className="mx-auto w-16 h-16 mb-4 rounded-full bg-[#2a2a2a] flex items-center justify-center border border-[#444]"><PhoneCall className="h-8 w-8 text-[#A7A7A7]" /></div> <h3 className="text-lg font-medium mb-2 text-[#F3FFD4]">No Calls Yet</h3> <p className="text-sm text-[#A7A7A7] mb-6">Use the dialer or import contacts.</p> <Button variant="outline" onClick={() => setCallTab("dialer")} disabled={isSocketConnected || !!pollingIntervalId} className="mx-auto border-[#333333] text-[#A7A7A7] hover:bg-[#333333] hover:text-[#F3FFD4]"><Phone className="h-4 w-4 mr-2" /> Make First Call</Button> </div> )} </CardContent> <CardFooter className="p-4 border-t border-[#333333] flex-shrink-0"><Link href="/dashboard/calls/history" className="w-full"><Button variant="outline" className="w-full border-[#333333] text-[#A7A7A7] hover:bg-[#333333] hover:text-[#F3FFD4]"><CalendarClock className="h-4 w-4 mr-2" /> View Full History</Button></Link></CardFooter> </Card>
                        </motion.div> {/* End Right Column */}
                    </div> {/* End Grid */}

                    {/* Modals */}
                    {/* Call Details Modal */}
                    <Dialog open={!!selectedCall} onOpenChange={(open) => !open && setSelectedCall(null)}>
                        {/* ... (Modal content remains the same) ... */}
                         <DialogContent className="bg-[#1a1a1a] border-[#333333] text-[#F3FFD4] max-w-lg"> <DialogHeader><DialogTitle>Call Details</DialogTitle><DialogDescription className="text-[#A7A7A7]">Info about this call.</DialogDescription></DialogHeader> {selectedCall && ( <div className="space-y-4 py-2"> <div className="flex items-center gap-4 pb-2"><Avatar className="h-14 w-14 bg-[#222222]"><AvatarFallback className="bg-[#A7B3AC]/10 text-[#A7B3AC] text-lg">{selectedCall.contactName?.charAt(0)?.toUpperCase() || '?'}</AvatarFallback></Avatar><div><h3 className="font-medium text-lg">{selectedCall.contactName || "Unknown"}</h3><p className="text-[#A7A7A7]">{formatPhoneNumber(selectedCall.phoneNumber)}</p></div></div> <Separator className="bg-[#333333]" /> <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm"> <div><p className="text-xs text-[#A7A7A7] mb-0.5">Status</p><div>{getStatusBadge(selectedCall.status)}</div></div> <div><p className="text-xs text-[#A7A7A7] mb-0.5">Agent</p><p className="font-medium truncate">{selectedCall.agentName || "N/A"}</p></div> <div><p className="text-xs text-[#A7A7A7] mb-0.5">Time</p><p>{selectedCall.startTime ? format(new Date(selectedCall.startTime), "MMM d, h:mm a") : "N/A"}</p></div> <div><p className="text-xs text-[#A7A7A7] mb-0.5">Duration</p><p>{selectedCall.duration != null && selectedCall.duration >= 0 ? `${Math.floor(selectedCall.duration / 60)}m ${selectedCall.duration % 60}s` : "N/A"}</p></div> <div><p className="text-xs text-[#A7A7A7] mb-0.5">Cost</p><p>₹{selectedCall.cost?.toFixed(2) || "0.00"}</p></div> <div><p className="text-xs text-[#A7A7A7] mb-0.5">Type</p><p>{selectedCall.callType || "Standard"}</p></div> </div> {selectedCall.notes && (<div className="space-y-1 pt-2"><p className="text-xs text-[#A7A7A7]">Notes</p><div className="p-3 bg-[#222222] rounded-md text-sm border border-[#333333] max-h-24 overflow-y-auto"><p className="whitespace-pre-wrap">{selectedCall.notes}</p></div></div>)} {selectedCall.transcription && (<div className="space-y-1 pt-2"><p className="text-xs text-[#A7A7A7]">Transcription</p><ScrollArea className="h-40"><div className="p-3 bg-[#222222] rounded-md text-sm border border-[#333333] whitespace-pre-wrap">{selectedCall.transcription}</div></ScrollArea></div>)} <DialogFooter className="pt-4 flex flex-col sm:flex-row gap-2"> <Button variant="outline" className="border-[#333333] w-full sm:w-auto" onClick={() => { if (selectedCall.agentId) { form.reset({ agentId: selectedCall.agentId, phoneNumber: selectedCall.phoneNumber, contactName: selectedCall.contactName || "", customMessage: "" }); setDialerValue(selectedCall.phoneNumber); setCallTab("dialer"); setSelectedCall(null); } else { alert("Agent ID missing."); } }} disabled={makingCall || !!pollingIntervalId || isSocketConnected}><Phone className="h-4 w-4 mr-2" /> Call Again</Button> <DialogClose asChild><Button variant="default" className="w-full sm:w-auto">Close</Button></DialogClose> </DialogFooter> </div> )} </DialogContent>
                    </Dialog>

                    {/* Import Confirmation Dialog */}
                    <Dialog open={showImportDialog} onOpenChange={(open) => { if (!open) { setShowImportDialog(false); setImportSummary(null); } }}>
                        {/* ... (Import Dialog content remains the same) ... */}
                         <DialogContent className="bg-[#1a1a1a] border-[#333333] text-[#F3FFD4]"> <DialogHeader> <DialogTitle>Contacts Ready</DialogTitle> <DialogDescription className="text-[#A7A7A7]"> How to proceed with imported contacts? </DialogDescription> </DialogHeader> {importSummary && ( <div className="py-4 space-y-4"> <div className="flex items-center gap-2"> <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" /> <p className="font-medium"> Prepared {importSummary.created} contacts </p> </div> <div className="p-3 bg-[#222222] rounded-lg border border-[#333333]"> <p className="text-sm mb-1 text-[#A7A7A7]">Selected Agent:</p> <p className="font-medium">{importSummary.agentName}</p> </div> <div className="grid grid-cols-1 gap-4"> <Card className="border border-[#333333] bg-[#222222]"> <CardContent className="pt-6 pb-4"> <div className="flex justify-between items-start mb-3"> <div><h3 className="font-medium text-[#F3FFD4]">Quick Call Batch</h3><p className="text-sm text-[#A7A7A7] mt-1">Start calling contacts immediately.</p></div> <div className="h-9 w-9 rounded-full bg-[#A7B3AC]/10 flex items-center justify-center flex-shrink-0"><Phone className="h-5 w-5 text-[#A7B3AC]" /></div> </div> <Button className="w-full bg-[#A7B3AC] text-[#111111]" onClick={startCallingProcess}>Start Calling Now</Button> </CardContent> </Card> {/* Campaign card removed for simplicity, can be added back */} </div> </div> )} <DialogFooter> <DialogClose asChild><Button variant="outline" className="border-[#333333]">Cancel</Button></DialogClose> </DialogFooter> </DialogContent>
                    </Dialog>

                    {/* Analytics Section - Simplified */}
                    <motion.div className="mt-8" initial="hidden" animate="visible" variants={fadeInUpVariant}>
                         {/* ... (Analytics section remains the same) ... */}
                         <div className="flex justify-between items-center mb-4 text-[#F3FFD4]"> <h2 className="text-xl font-bold">Analytics</h2> <Link href="/dashboard/analytics"><Button variant="ghost" size="sm" className="text-[#A7A7A7] hover:text-[#F3FFD4]">View All <ChevronRight className="ml-1 h-4 w-4" /></Button></Link> </div> <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"><Card className="bg-[#1a1a1a] border border-[#333333]"><CardContent className="pt-6 text-[#F3FFD4]"><div className="flex justify-between items-start mb-2"><div className="space-y-1"><p className="text-sm text-[#A7A7A7]">Total Calls</p><p className="text-3xl font-bold">{callsLoading ? '-' : calls.length}</p></div><div className="h-10 w-10 rounded-full bg-[#A7B3AC]/10 flex items-center justify-center"><PhoneCall className="h-5 w-5 text-[#A7B3AC]" /></div></div> <div className="mt-4"><Progress value={0} className="h-1 bg-[#333]" indicatorClassName="bg-[#A7B3AC]" /><p className="text-xs text-[#A7A7A7] mt-2">Usage N/A</p></div></CardContent></Card><Card className="bg-[#1a1a1a] border border-[#333333]"><CardContent className="pt-6 text-[#F3FFD4]"><div className="flex justify-between items-start mb-2"><div className="space-y-1"><p className="text-sm text-[#A7A7A7]">Success Rate</p><p className="text-3xl font-bold">{callsLoading ? '-' : calls.length > 0 ? `${Math.round(calls.filter(c => c.status === 'completed' || c.status === 'ended').length / calls.length * 100)}%` : '0%'}</p></div><div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center"><CheckCircle className="h-5 w-5 text-green-500" /></div></div><div className="mt-4"><div className="flex items-center justify-between text-xs text-[#A7A7A7]"><span>Completed</span><span>{callsLoading ? '-' : calls.filter(c => c.status === 'completed' || c.status === 'ended').length}</span></div></div></CardContent></Card><Card className="bg-[#1a1a1a] border border-[#333333]"><CardContent className="pt-6 text-[#F3FFD4]"><div className="flex justify-between items-start mb-2"><div className="space-y-1"><p className="text-sm text-[#A7A7A7]">Avg. Duration</p><p className="text-3xl font-bold">{callsLoading ? '-' : calls.length > 0 && calls.some(c => c.duration && c.duration > 0) ? `${Math.round(calls.reduce((sum, call) => sum + (call.duration || 0), 0) / calls.filter(c => c.duration && c.duration > 0).length / 60)}m` : '0m'}</p></div><div className="h-10 w-10 rounded-full bg-[#A7B3AC]/10 flex items-center justify-center"><Clock className="h-5 w-5 text-[#A7B3AC]" /></div></div><div className="mt-4"><div className="flex items-center justify-between text-xs text-[#A7A7A7]"><span>Avg. Cost</span><span>₹{callsLoading ? '-' : (calls.reduce((s,c)=> s + (c.cost || 0), 0) / (calls.length || 1)).toFixed(2)}</span></div></div></CardContent></Card><Card className="bg-[#1a1a1a] border border-[#333333]"><CardContent className="pt-6 text-[#F3FFD4]"><div className="flex justify-between items-start mb-2"><div className="space-y-1"><p className="text-sm text-[#A7A7A7]">Active/Queued</p><p className="text-3xl font-bold">{callsLoading ? '-' : calls.filter(c => ['ringing', 'in-progress', 'connected', 'initiating', 'queued', 'pending'].includes(c.status)).length}</p></div><div className="h-10 w-10 rounded-full bg-yellow-500/10 flex items-center justify-center"><Mic className="h-5 w-5 text-yellow-500" /></div></div><div className="mt-4"><div className="flex items-center justify-between text-xs text-[#A7A7A7]"><span>Failed</span><span>{callsLoading ? '-' : calls.filter(c => c.status === 'failed' || c.status === 'busy' || c.status === 'no-answer').length}</span></div></div></CardContent></Card></div>
                    </motion.div>

                </div> {/* End Container */}
            </main>
        </div>
    );
}