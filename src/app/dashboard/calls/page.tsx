"use client";

import { useState, useRef, useEffect, useCallback, JSX } from "react";
import { useRouter } from "next/navigation";
import useSWR, { mutate } from "swr";
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
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";

// Icons
import { 
    PhoneCall, Upload, Phone, CalendarClock, Clock, MoreHorizontal, AlertCircle, CheckCircle, 
    XCircle, Loader2, Mic, Plus, X, FileText, ChevronRight, HelpCircle, Info, LayoutGrid, Download 
} from "lucide-react";

// --- Base URL for API calls ---
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';

// --- SWR Fetcher with Base URL and Error Handling ---
const fetcher = (url: string) => fetch(`${API_BASE_URL}${url}`).then(res => {
    if (!res.ok) {
        throw new Error('Failed to fetch data');
    }
    return res.json();
});

const dialerSchema = z.object({
    agentId: z.string().min(1, "Please select an agent"),
    phoneNumber: z.string()
        .min(8, "Enter a valid phone number including country code (e.g., +91)")
        .regex(/^[+\d\s()-]+$/, "Enter a valid phone number format"),
    contactName: z.string().min(1, "Contact name is required"),
    customMessage: z.string().optional(),
});

// Define a type for recent calls for better type safety
type RecentCall = {
    _id: string;
    contactName?: string;
    phoneNumber: string;
    status: string;
    startTime?: string; // ISO date string
    duration?: number; // seconds
    agentId?: string; 
    agentName?: string;
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
        uploadedContacts: any[];
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

    // --- Data Fetching using the updated fetcher ---
    const { data: agentsData, isLoading: agentsLoading } = useSWR<{ agents: any[] }>(user ? "/api/getAgents" : null, fetcher);
    const agents = agentsData?.agents?.filter(a => !a.disabled) || [];

    const { data: callsData, mutate: refreshCalls, isLoading: callsLoading } = useSWR<{ calls: RecentCall[] }>(user ? "/api/calls?limit=10" : null, fetcher);
    const calls = callsData?.calls || [];

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
            const res = await fetch(`${API_BASE_URL}/api/calls/${callId}/status`);
            if (!res.ok) {
                console.error("Polling failed:", res.status);
                if (res.status === 404) {
                     setLiveCallStatus("Error: Call ended or not found");
                     stopPolling();
                } else {
                     setLiveCallStatus("Error: Status check failed");
                }
                return;
            }
            const data = await res.json();
            console.log("Poll status:", data);
            
            setLiveCallStatus(prevStatus => prevStatus !== data.status ? data.status : prevStatus); 

            if (data.signedUrl && data.status === 'connected') {
                console.log("Signed URL received, WebSocket should connect...");
                setCurrentSignedUrl(data.signedUrl); 
                stopPolling(); 
            } else if (['failed', 'ended', 'completed', 'busy', 'no-answer', 'canceled'].includes(data.status)) {
                console.log(`Call reached terminal state: ${data.status}. Stopping poll.`);
                stopPolling();
                if(isSocketConnected) {
                    stopSocket();
                }
                setCurrentSignedUrl(null); // Clear URL to prevent reconnect attempts
                if (data.failureReason) {
                     setLiveCallStatus(`Failed: ${data.failureReason}`);
                }
                 setLiveCallStatus(data.status); 
                setTimeout(() => refreshCalls(), 1500);
            }
        } catch (err) {
            console.error("Network error during polling:", err);
            setLiveCallStatus("Error: Network issue during polling");
        }
    }, [stopPolling, refreshCalls, isSocketConnected, stopSocket]);


    // --- Call Initiation (UPDATED) ---
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
            const cleanedPhoneNumber = formData.phoneNumber.replace(/[\s()-]/g, '');

            // UPDATED: Calls the new Exotel initiation endpoint
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
    
    // --- Hangup Logic (NEW) ---
     const onHangupCall = async () => {
         const callIdToHangup = currentCallId; 

         if (!callIdToHangup && !isSocketConnected) {
             console.log("No active call identified to hang up.");
             setLiveCallStatus(null);
             return;
         }
         
         console.log("Attempting to hang up call:", callIdToHangup);
         
         setLiveCallStatus('Disconnecting...'); 
         stopPolling(); 
         stopSocket(); 
         setCurrentSignedUrl(null); 
         
         if (callIdToHangup) {
             try {
                // UPDATED: Calls the new hangup endpoint
                const res = await fetch(`${API_BASE_URL}/api/calls/${callIdToHangup}/hangup`, { method: 'POST' });
                if (!res.ok) {
                     const errorData = await res.json().catch(() => ({ message: 'Hangup request failed' }));
                     console.error("Failed to request hangup via backend:", errorData.message);
                     setLiveCallStatus(`Hangup Error`); 
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
             console.warn("No call ID to hang up via API, only disconnected WebSocket.");
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
        if (!agentId) { alert("Please select an agent for the batch first."); return; }

        try {
            setUploading(true);
            const formData = new FormData();
            formData.append("file", file);
            formData.append("agentId", agentId);

            const response = await fetch(`${API_BASE_URL}/api/calls/import-csv`, { 
                method: "POST", 
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: "Failed to upload CSV" }));
                throw new Error(errorData.message);
            }

            const data = await response.json();
            const contacts = data.contacts || data.uploadedContacts;
            const createdCount = data.createdCount ?? contacts?.length ?? 0;
            const agentName = data.agentName || agents.find(a => a.agent_id === agentId)?.name || "Selected agent";

            if (contacts && contacts.length > 0) {
                setImportSummary({ created: createdCount, agentName, uploadedContacts: contacts });
                setShowImportDialog(true);
            } else {
                alert("No new contacts were processed from the uploaded file.");
            }
        } catch (error) {
            console.error("Error uploading CSV:", error);
            alert(`Error uploading CSV: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = ""; 
        }
    };

    const startCallingProcess = async () => {
        if (!importSummary || !importSummary.uploadedContacts.length) return;
        const agentIdForBatch = form.getValues("agentId"); 
        if (!agentIdForBatch) { alert("Agent selection lost, please select again."); return; }

        try {
            setShowImportDialog(false); 
            alert(`Initiating calls for ${importSummary.created} contacts...`);

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

    // --- Helper Functions ---
    const handleDialerButtonClick = (value: string) => {
        const newValue = value === 'backspace' ? dialerValue.slice(0, -1) : dialerValue + value;
        setDialerValue(newValue);
        form.setValue("phoneNumber", newValue, { shouldValidate: true }); 
    };

    const formatPhoneNumber = (number: string) => {
         if (!number) return '';
        const cleaned = ('' + number).replace(/\D/g, '');
        const match = cleaned.match(/^(1|)?(\d{3})(\d{3})(\d{4})$/);
        if (match) {
            const intlCode = (match[1] ? '+1 ' : '');
            return [intlCode, '(', match[2], ') ', match[3], '-', match[4]].join('');
        }
        if (number.startsWith('+')) return number;
        return cleaned; 
    };

    const getStatusBadge = (status: string | null | undefined): JSX.Element => {
        status = status?.toLowerCase() || 'unknown'; 
        switch (status) {
            case 'ended': case 'completed': return <Badge className="bg-green-500/20 text-green-600 border-green-500/20"><CheckCircle className="h-3 w-3 mr-1" /> Completed</Badge>;
            case 'connected': return <Badge className="bg-blue-500/20 text-blue-600 border-blue-500/20">Connected</Badge>;
            case 'in-progress': case 'answered': return <Badge className="bg-yellow-500/20 text-yellow-600 border-yellow-500/20">In Progress</Badge>;
            case 'ringing': return <Badge className="bg-yellow-500/20 text-yellow-600 border-yellow-500/20 animate-pulse">Ringing</Badge>;
            case 'initiating': case 'queued': case 'pending': return <Badge variant="secondary" className="bg-gray-500/20 text-gray-400 border-gray-500/20">Queued</Badge>;
            case 'disconnecting': return <Badge variant="destructive" className="bg-orange-500/20 text-orange-500 border-orange-500/20">Disconnecting</Badge>;
            case 'disconnected': return <Badge variant="destructive" className="bg-gray-600/30 text-gray-500 border-gray-600/30">Disconnected</Badge>;
            case 'failed': case 'busy': case 'no-answer': case 'canceled': return <Badge variant="destructive" className="bg-red-500/20 text-red-600 border-red-500/20 capitalize">{status.replace('-', ' ')}</Badge>;
            default: if (status.startsWith('error')) { return <Badge variant="destructive" className="bg-red-500/20 text-red-600 border-red-500/20">Error</Badge>; } return <Badge variant="outline" className="capitalize">{status}</Badge>;
        }
    };
    // --- ---

    // --- Animation Variants ---
    const fadeInUpVariant = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } };
    
    // --- JSX Render ---
    return (
        <div className="min-h-screen text-foreground flex bg-[#111111]">
            <main className="flex-1 overflow-y-auto h-screen">
                <DashboardHeader />
                <div className="container mx-auto px-4 sm:px-6 py-8">
                    {/* Page Header */}
                    <motion.div initial="hidden" animate="visible" variants={fadeInUpVariant}>
                        <h1 className="text-2xl sm:text-3xl font-bold mb-1 text-[#F3FFD4]">Call Management</h1>
                        <p className="text-[#A7A7A7] mb-8">Make calls or import contacts for bulk outreach.</p>
                    </motion.div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Left Column */}
                        <motion.div className="lg:col-span-2" initial="hidden" animate="visible" variants={fadeInUpVariant}>
                            {/* Tabs */}
                            <Tabs value={callTab} onValueChange={setCallTab} className="w-full">
                                <div className="flex flex-wrap gap-4 justify-between items-center mb-6">
                                    <TabsList className="grid grid-cols-2 bg-[#1a1a1a] border border-[#333333] p-1 h-auto">
                                        <TabsTrigger value="dialer" disabled={isSocketConnected || !!pollingIntervalId}>
                                            <Phone className="h-4 w-4 mr-2" /> Dialer
                                        </TabsTrigger>
                                        <TabsTrigger value="import" disabled={isSocketConnected || !!pollingIntervalId}>
                                            <Upload className="h-4 w-4 mr-2" /> Import
                                        </TabsTrigger>
                                    </TabsList>
                                    <div className="flex gap-3">
                                        <Link href="/dashboard/contacts"><Button type="button" variant="outline" className="border-[#333333] text-[#A7A7A7] hover:bg-[#333333] hover:text-[#F3FFD4]"><LayoutGrid className="h-4 w-4 mr-2" /> Manage Contacts</Button></Link>
                                    </div>
                                </div>
                                
                                {/* Dialer Tab Content */}
                                <TabsContent value="dialer">
                                    <Card className="bg-[#1a1a1a] border border-[#333333]">
                                        <CardHeader>
                                             <CardTitle className="flex items-center gap-2 text-[#F3FFD4]">
                                                 <Phone className="h-5 w-5 text-[#A7B3AC]" /> AI Dialer
                                             </CardTitle>
                                             <CardDescription className="text-[#A7A7A7]">
                                                 Select an agent and enter contact details to start a call.
                                             </CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <Form {...form}>
                                                <form onSubmit={form.handleSubmit(onMakeCall)} className="space-y-6">
                                                    {/* Agent Selector */}
                                                    <FormField
                                                        control={form.control}
                                                        name="agentId"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel className="text-[#A7A7A7]">Choose AI Agent</FormLabel>
                                                                <Select 
                                                                    onValueChange={field.onChange} 
                                                                    value={field.value} // Controlled component
                                                                    disabled={agentsLoading || makingCall || !!pollingIntervalId || isSocketConnected}
                                                                >
                                                                    <FormControl>
                                                                        <SelectTrigger className="bg-[#222222] border-[#333333]">
                                                                            <SelectValue placeholder={agentsLoading ? "Loading..." : "Select an agent"} />
                                                                        </SelectTrigger>
                                                                    </FormControl>
                                                                    <SelectContent className="bg-[#1a1a1a] border-[#333333]">
                                                                        {agentsLoading ? (
                                                                             <SelectItem value="loading" disabled>Loading agents...</SelectItem>
                                                                        ) : agents.length > 0 ? (
                                                                            agents.map(agent => (
                                                                                <SelectItem key={agent.agent_id} value={agent.agent_id}>
                                                                                    {agent.name}
                                                                                </SelectItem>
                                                                            ))
                                                                        ) : (
                                                                            <SelectItem value="no-agents" disabled>No agents available</SelectItem>
                                                                        )}
                                                                    </SelectContent>
                                                                </Select>
                                                                <FormDescription className="text-[#A7A7A7]/80">
                                                                    The selected agent will handle the call.
                                                                </FormDescription>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />

                                                    {/* Contact Name & Phone Number */}
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                        <FormField control={form.control} name="contactName" render={({ field }) => (
                                                             <FormItem>
                                                                <FormLabel className="text-[#A7A7A7]">Contact Name</FormLabel>
                                                                <FormControl><Input placeholder="John Smith" {...field} disabled={makingCall || !!pollingIntervalId || isSocketConnected} className="bg-[#222222] border-[#333333] placeholder:text-[#A7A7A7]/50" /></FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )} />
                                                        <FormField control={form.control} name="phoneNumber" render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel className="text-[#A7A7A7]">Phone Number</FormLabel>
                                                                <FormControl><Input placeholder="+1 555 123 4567" {...field} value={dialerValue} onChange={(e)=>{field.onChange(e); setDialerValue(e.target.value)}} disabled={makingCall || !!pollingIntervalId || isSocketConnected} className="bg-[#222222] border-[#333333] placeholder:text-[#A7A7A7]/50" /></FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )} />
                                                    </div>

                                                    {/* Dialer Pad */}
                                                     <div className="mt-4 p-4 sm:p-6 bg-[#1f1f1f]/60 rounded-lg border border-[#333333]">
                                                        <div className="flex justify-center mb-4">
                                                            <div className="text-center px-3 py-2 rounded-lg bg-[#1a1a1a] shadow-sm min-w-[200px] border border-[#333333]">
                                                                <p className="text-2xl font-mono tracking-wider text-[#F3FFD4]">
                                                                    {formatPhoneNumber(dialerValue) || '—'}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-4 max-w-xs mx-auto">
                                                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, '*', 0, '#'].map((num) => (
                                                                <Button key={num} type="button" variant="outline" className="h-12 sm:h-14 text-lg sm:text-xl font-medium bg-[#2a2a2a] border-[#444] hover:bg-[#3a3a3a] text-[#F3FFD4]" onClick={() => handleDialerButtonClick(num.toString())} disabled={makingCall || !!pollingIntervalId || isSocketConnected}>
                                                                    {num}
                                                                </Button>
                                                            ))}
                                                        </div>
                                                        <div className="flex justify-center gap-3">
                                                            <TooltipProvider> <Tooltip> <TooltipTrigger asChild>
                                                                <Button type="button" variant="outline" className="rounded-full w-10 h-10 sm:w-12 sm:h-12 p-0 bg-[#2a2a2a] border-[#444] hover:bg-[#3a3a3a]" onClick={() => handleDialerButtonClick('+')} disabled={makingCall || !!pollingIntervalId || isSocketConnected}><Plus className="h-4 w-4" /></Button>
                                                            </TooltipTrigger> <TooltipContent>Add +</TooltipContent> </Tooltip> </TooltipProvider>
                                                            
                                                            <TooltipProvider> <Tooltip> <TooltipTrigger asChild>
                                                                <Button type="button" variant="outline" className="rounded-full w-10 h-10 sm:w-12 sm:h-12 p-0 bg-[#2a2a2a] border-[#444] hover:bg-[#3a3a3a]" onClick={() => handleDialerButtonClick('backspace')} disabled={makingCall || !!pollingIntervalId || isSocketConnected}><X className="h-4 w-4" /></Button>
                                                            </TooltipTrigger> <TooltipContent>Delete</TooltipContent> </Tooltip> </TooltipProvider>
                                                        </div>
                                                    </div>

                                                    {/* Custom Message */}
                                                    <FormField control={form.control} name="customMessage" render={({ field }) => ( <FormItem> <FormLabel className="text-[#A7A7A7]">Custom Instructions (Optional)</FormLabel> <FormControl><Textarea placeholder="Specific context or instructions for the agent on this call..." {...field} disabled={makingCall || !!pollingIntervalId || isSocketConnected} className="min-h-[80px] bg-[#222222] border-[#333333] placeholder:text-[#A7A7A7]/50" /></FormControl> <FormMessage /> </FormItem> )} />

                                                    {/* Form Actions */}
                                                    <div className="flex flex-col sm:flex-row gap-4 items-center pt-2">
                                                        <Button
                                                            type="submit"
                                                            className="w-full sm:w-auto bg-[#A7B3AC] text-[#111111] hover:bg-[#A7B3AC]/90 font-bold disabled:opacity-60"
                                                            disabled={makingCall || !!pollingIntervalId || isSocketConnected || uploading || !form.formState.isValid}
                                                        >
                                                            {makingCall ? ( <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Initiating...</> ) 
                                                            : (pollingIntervalId || isSocketConnected) ? ( <><Mic className="h-4 w-4 mr-2" /> Call Active</> ) 
                                                            : ( <><Phone className="h-4 w-4 mr-2" /> Start Call</> )}
                                                        </Button>
                                                        {/* "How it works" Dialog */}
                                                        <Dialog>
                                                            <DialogTrigger asChild><Button variant="outline" size="sm" type="button" className="w-full sm:w-auto sm:ml-auto border-[#333333] text-[#A7A7A7] hover:bg-[#333333] hover:text-[#F3FFD4]"><HelpCircle className="h-4 w-4 mr-2" /> How it works</Button></DialogTrigger>
                                                            <DialogContent className="bg-[#1a1a1a] border-[#333333] text-[#F3FFD4]">
                                                                <DialogHeader>
                                                                    <DialogTitle>How AI Voice Calls Work</DialogTitle>
                                                                    <DialogDescription className="text-[#A7A7A7]">Learn how calls are initiated and handled.</DialogDescription>
                                                                </DialogHeader>
                                                                <div className="space-y-4 py-4 text-sm">
                                                                    <div className="flex gap-4 items-start"><div className="h-8 w-8 rounded-full bg-[#A7B3AC]/10 flex items-center justify-center flex-shrink-0"><Phone className="h-4 w-4 text-[#A7B3AC]" /></div><div><h4 className="font-medium mb-1">1. Initiate</h4><p className="text-[#A7A7A7]">Select agent, enter details, click call. Request goes to our server.</p></div></div>
                                                                    <div className="flex gap-4 items-start"><div className="h-8 w-8 rounded-full bg-[#A7B3AC]/10 flex items-center justify-center flex-shrink-0"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-webhook text-[#A7B3AC]"><path d="M18 16.98h-5.99c-1.1 0-1.95.94-2.48 1.9A4 4 0 0 1 2 17c.01-.7.23-1.37.64-1.93.41-.56 1-1.01 1.7-1.31-.08-.1-.16-.21-.24-.33a5.29 5.29 0 0 1-1.4-4.57c.31-1.15 1.11-2.08 2.22-2.48.9-.33 1.91-.33 2.81 0l.5.18.5-.18c.9-.33 1.91-.33 2.81 0 1.11.4 1.91 1.33 2.22 2.48.47 1.77-.3 3.65-1.4 4.57-.08.12-.16.23-.24.33.7.3 1.29.75 1.7 1.31.41.56.63 1.23.64 1.93a4 4 0 0 1-7.52-1.92c-.53-.97-1.38-1.92-2.48-1.92Z"/><path d="M12 12v-2"/></svg></div><div><h4 className="font-medium mb-1">2. Connect (Exotel)</h4><p className="text-[#A7A7A7]">Our server tells Exotel to call the number and connect to our webhook.</p></div></div>
                                                                    <div className="flex gap-4 items-start"><div className="h-8 w-8 rounded-full bg-[#A7B3AC]/10 flex items-center justify-center flex-shrink-0"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-left-right text-[#A7B3AC]"><path d="M8 3 4 7l4 4"/><path d="M4 7h16"/><path d="m16 21 4-4-4-4"/><path d="M20 17H4"/></svg></div><div><h4 className="font-medium mb-1">3. Bridge (ElevenLabs)</h4><p className="text-[#A7A7A7]">On answer, our webhook gets a secure WebSocket URL from ElevenLabs & instructs Exotel to stream the call audio directly to it.</p></div></div>
                                                                    <div className="flex gap-4 items-start"><div className="h-8 w-8 rounded-full bg-[#A7B3AC]/10 flex items-center justify-center flex-shrink-0"><Mic className="h-4 w-4 text-[#A7B3AC]" /></div><div><h4 className="font-medium mb-1">4. Converse</h4><p className="text-[#A7A7A7]">Your browser connects to the same WebSocket to receive live transcripts, enabling real-time monitoring.</p></div></div>
                                                                </div>
                                                                <DialogFooter>
                                                                    <DialogClose asChild><Button variant="outline" className="border-[#333333]">Got it</Button></DialogClose>
                                                                </DialogFooter>
                                                            </DialogContent>
                                                        </Dialog>
                                                    </div>
                                                </form>
                                            </Form>
                                        </CardContent>
                                    </Card>
                                </TabsContent>
                                <TabsContent value="import">
                                     <Card className="bg-[#1a1a1a] border border-[#333333]">
                                          <CardHeader className="border-b border-[#333333]"><CardTitle className="flex items-center gap-2 text-[#F3FFD4]"><Upload className="h-5 w-5 text-[#A7B3AC]" /> Bulk Import</CardTitle><CardDescription className="text-[#A7A7A7]">Upload CSV for multiple calls.</CardDescription></CardHeader>
                                           <CardContent className="pt-6">
                                                <div className="space-y-6">
                                                 <FormField control={form.control} name="agentId" render={({ field }) => ( <FormItem className="mb-6"> <FormLabel className="text-[#A7A7A7]">Agent for Upload</FormLabel> <Select onValueChange={field.onChange} value={field.value} disabled={agentsLoading || uploading}> <FormControl><SelectTrigger className="bg-[#222222] border-[#333333]"><SelectValue placeholder={agentsLoading ? "Loading..." : "Select agent for batch"} /></SelectTrigger></FormControl> <SelectContent className="bg-[#1a1a1a] border-[#333333]"> {agentsLoading ? ( <SelectItem value="loading" disabled>Loading...</SelectItem> ) : agents.length > 0 ? ( agents.map(agent => ( <SelectItem key={agent.agent_id} value={agent.agent_id}>{agent.name}</SelectItem> )) ) : ( <SelectItem value="no-agents" disabled>No agents</SelectItem> )} </SelectContent> </Select> <FormDescription className="text-[#A7A7A7]/80">This agent will be used for all calls from the uploaded CSV.</FormDescription> <FormMessage /> </FormItem> )} />
                                                <div className="border-2 border-dashed border-[#333333] rounded-lg p-8 text-center bg-[#1f1f1f]/50">
                                                      <div className="mx-auto w-16 h-16 mb-4 rounded-full bg-[#2a2a2a] flex items-center justify-center border border-[#444]"><Upload className="h-8 w-8 text-[#A7A7A7]" /></div><h3 className="text-lg font-medium mb-2 text-[#F3FFD4]">Upload Contact List</h3><p className="text-sm text-[#A7A7A7] mb-4 max-w-md mx-auto">CSV: 'name', 'phoneNumber', optional 'customMessage'.</p><input ref={fileInputRef} type="file" accept=".csv" onChange={handleCSVUpload} className="hidden" /><div className="flex flex-col sm:flex-row justify-center gap-3"><Button type="button" className="bg-[#A7B3AC] text-[#111111] hover:bg-[#A7B3AC]/90 font-bold flex-1 sm:flex-initial" onClick={() => { if(!form.getValues('agentId')) { alert('Please select an agent first.'); return; } fileInputRef.current?.click(); }} disabled={uploading || agentsLoading}>{uploading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Uploading...</> : <><Upload className="h-4 w-4 mr-2" /> Select CSV</>}</Button><Button type="button" variant="outline" asChild className="flex-1 sm:flex-initial border-[#333333] hover:bg-[#333333]"><a href="/templates/contacts_template.csv" download><Download className="h-4 w-4 mr-2" /> Template</a></Button></div>
                                                </div>
                                               </div>
                                           </CardContent>
                                          <CardFooter className="border-t border-[#333333] pt-6"><div className="flex items-start gap-2 text-sm text-[#A7A7A7]"> <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" /> <p>Calls are queued via the backend. Monitor status in Recent Calls.</p> </div></CardFooter>
                                     </Card>
                                </TabsContent>
                            </Tabs>
                        </motion.div>

                        {/* Right Column (Recent Calls) */}
                        <motion.div className="lg:col-span-1" initial="hidden" animate="visible" variants={fadeInUpVariant}>
                            <Card className="h-fit max-h-[calc(100vh-200px)] flex flex-col bg-[#1a1a1a] border border-[#333333]">
                                <CardHeader className="border-b border-[#333333] flex-shrink-0">
                                    <CardTitle className="flex items-center gap-2 text-[#F3FFD4]"><CalendarClock className="h-5 w-5 text-[#A7B3AC]" /> Recent Calls</CardTitle>
                                    <CardDescription className="text-[#A7A7A7]">Latest call activities.</CardDescription>
                                </CardHeader>
                                <CardContent className="p-0 flex-1 overflow-hidden">
                                    {callsLoading ? (
                                         <div className="p-8 text-center text-[#A7A7A7]"><Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />Loading calls...</div>
                                    ) : calls.length > 0 ? (
                                        <ScrollArea className="h-full">
                                            <div className="divide-y divide-[#333333]">
                                                {calls.map((call) => (
                                                    <div key={call._id} className="p-4 hover:bg-[#222222] transition-colors cursor-pointer" onClick={() => setSelectedCall(call)} tabIndex={0} onKeyDown={(e)=>{if(e.key === 'Enter') setSelectedCall(call)}}>
                                                         <div className="flex items-start gap-3">
                                                            <Avatar className="h-10 w-10 flex-shrink-0"><AvatarFallback className="bg-[#A7B3AC]/10 text-[#A7B3AC]">{call.contactName?.charAt(0)?.toUpperCase() || '?'}</AvatarFallback></Avatar>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex justify-between items-start gap-2">
                                                                    <p className="font-medium text-sm text-[#F3FFD4] truncate">{call.contactName || "Unknown"}</p>
                                                                    {getStatusBadge(call.status)}
                                                                </div>
                                                                <p className="text-sm text-[#A7A7A7] truncate">{formatPhoneNumber(call.phoneNumber)}</p>
                                                                <div className="flex items-center gap-2 mt-1 flex-wrap">
                                                                    <p className="text-xs text-[#A7A7A7] whitespace-nowrap">{call.startTime ? formatDistanceToNow(new Date(call.startTime), { addSuffix: true }) : "Scheduled"}</p>
                                                                    {call.duration != null && call.duration > 0 && (<><span className="text-xs text-[#A7A7A7]">•</span><p className="text-xs text-[#A7A7A7] whitespace-nowrap">{Math.floor(call.duration / 60)}m {call.duration % 60}s</p></>)}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </ScrollArea>
                                    ) : (
                                         <div className="p-8 text-center"> <div className="mx-auto w-16 h-16 mb-4 rounded-full bg-[#2a2a2a] flex items-center justify-center border border-[#444]"><PhoneCall className="h-8 w-8 text-[#A7A7A7]" /></div> <h3 className="text-lg font-medium mb-2 text-[#F3FFD4]">No Calls Yet</h3> <p className="text-sm text-[#A7A7A7] mb-6">Use the dialer or import contacts to start.</p> <Button variant="outline" onClick={() => setCallTab("dialer")} disabled={isSocketConnected || !!pollingIntervalId} className="mx-auto border-[#333333] text-[#A7A7A7] hover:bg-[#333333] hover:text-[#F3FFD4]"><Phone className="h-4 w-4 mr-2" /> Make First Call</Button> </div>
                                    )}
                                </CardContent>
                                <CardFooter className="p-4 border-t border-[#333333] flex-shrink-0">
                                    <Link href="/dashboard/calls/history" className="w-full">
                                        <Button variant="outline" className="w-full border-[#333333] text-[#A7A7A7] hover:bg-[#333333] hover:text-[#F3FFD4]">
                                            <CalendarClock className="h-4 w-4 mr-2" /> View Full History
                                        </Button>
                                    </Link>
                                </CardFooter>
                            </Card>
                        </motion.div>
                    </div>

                    {/* Modals */}
                    <Dialog open={!!selectedCall} onOpenChange={(open) => !open && setSelectedCall(null)}>
                         <DialogContent className="bg-[#1a1a1a] border-[#333333] text-[#F3FFD4] max-w-lg">
                             <DialogHeader><DialogTitle>Call Details</DialogTitle><DialogDescription className="text-[#A7A7A7]">Information about this call.</DialogDescription></DialogHeader>
                             {selectedCall && ( <div className="space-y-4 py-2"> 
                                <div className="flex items-center gap-4 pb-2"><Avatar className="h-14 w-14 bg-[#222222]"><AvatarFallback className="bg-[#A7B3AC]/10 text-[#A7B3AC] text-lg">{selectedCall.contactName?.charAt(0)?.toUpperCase() || '?'}</AvatarFallback></Avatar><div><h3 className="font-medium text-lg">{selectedCall.contactName || "Unknown"}</h3><p className="text-[#A7A7A7]">{formatPhoneNumber(selectedCall.phoneNumber)}</p></div></div>
                                <Separator className="bg-[#333333]" /> 
                                <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                                     <div><p className="text-xs text-[#A7A7A7] mb-0.5">Status</p><div>{getStatusBadge(selectedCall.status)}</div></div>
                                     <div><p className="text-xs text-[#A7A7A7] mb-0.5">Agent</p><p className="font-medium truncate">{selectedCall.agentName || "N/A"}</p></div>
                                     <div><p className="text-xs text-[#A7A7A7] mb-0.5">Time</p><p>{selectedCall.startTime ? format(new Date(selectedCall.startTime), "MMM d, h:mm a") : "N/A"}</p></div>
                                     <div><p className="text-xs text-[#A7A7A7] mb-0.5">Duration</p><p>{selectedCall.duration != null && selectedCall.duration >= 0 ? `${Math.floor(selectedCall.duration / 60)}m ${selectedCall.duration % 60}s` : "N/A"}</p></div>
                                </div>
                                <DialogFooter className="pt-4 flex flex-col sm:flex-row gap-2"> 
                                    <Button variant="outline" className="border-[#333333] w-full sm:w-auto" onClick={() => { if (selectedCall.agentId) { form.reset({ agentId: selectedCall.agentId, phoneNumber: selectedCall.phoneNumber, contactName: selectedCall.contactName || "", customMessage: "" }); setDialerValue(selectedCall.phoneNumber); setCallTab("dialer"); setSelectedCall(null); } else { alert("Agent ID missing."); } }} disabled={makingCall || !!pollingIntervalId || isSocketConnected}><Phone className="h-4 w-4 mr-2" /> Call Again</Button> 
                                    <DialogClose asChild><Button variant="default" className="w-full sm:w-auto">Close</Button></DialogClose> 
                                </DialogFooter> 
                            </div> )}
                        </DialogContent>
                    </Dialog>

                    <Dialog open={showImportDialog} onOpenChange={(open) => { if (!open) { setShowImportDialog(false); setImportSummary(null); } }}>
                         <DialogContent className="bg-[#1a1a1a] border-[#333333] text-[#F3FFD4]"> <DialogHeader> <DialogTitle>Contacts Ready</DialogTitle> <DialogDescription className="text-[#A7A7A7]"> How to proceed with imported contacts? </DialogDescription> </DialogHeader> {importSummary && ( <div className="py-4 space-y-4"> <div className="flex items-center gap-2"> <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" /> <p className="font-medium"> Prepared {importSummary.created} contacts </p> </div> <div className="p-3 bg-[#222222] rounded-lg border border-[#333333]"> <p className="text-sm mb-1 text-[#A7A7A7]">Selected Agent:</p> <p className="font-medium">{importSummary.agentName}</p> </div> <div className="grid grid-cols-1 gap-4"> <Card className="border border-[#333333] bg-[#222222]"> <CardContent className="pt-6 pb-4"> <div className="flex justify-between items-start mb-3"> <div><h3 className="font-medium text-[#F3FFD4]">Quick Call Batch</h3><p className="text-sm text-[#A7A7A7] mt-1">Start calling contacts immediately.</p></div> <div className="h-9 w-9 rounded-full bg-[#A7B3AC]/10 flex items-center justify-center flex-shrink-0"><Phone className="h-5 w-5 text-[#A7B3AC]" /></div> </div> <Button className="w-full bg-[#A7B3AC] text-[#111]" onClick={startCallingProcess}>Start Calling Now</Button> </CardContent> </Card> </div> </div> )} <DialogFooter> <DialogClose asChild><Button variant="outline" className="border-[#333333]">Cancel</Button></DialogClose> </DialogFooter> </DialogContent>
                    </Dialog>
                </div>
            </main>
        </div>
    );
}
