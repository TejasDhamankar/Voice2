"use client";

import { useState, useRef, useEffect, useCallback } from "react"; // Added useEffect, useCallback
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/contexts/AuthContext";
import { format, formatDistanceToNow } from "date-fns"; // Added formatDistanceToNow
import { motion } from "framer-motion";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useSocket } from "@/hooks/useSocket"; // Import the WebSocket hook

// UI Components
import { DashboardHeader } from "@/components/dashboard/header";
// Removed unused DashboardSidebar import
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";

// Icons
import { 
    PhoneCall, Upload, Phone, CalendarClock, Clock, MoreHorizontal, PlayCircle, 
    AlertCircle, CheckCircle, XCircle, Loader2, Mic, Plus, X, FileText, 
    ChevronRight, HelpCircle, Info, LayoutGrid, Download 
} from "lucide-react";

const fetcher = (url: string) => fetch(url).then(r => r.json());

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
    agentId?: string; // Optional: Store the ElevenLabs agent ID used
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
    const [selectedCall, setSelectedCall] = useState<RecentCall | null>(null); // Use RecentCall type
    const [makingCall, setMakingCall] = useState(false); // Tracks the initial API request
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
    const [currentCallId, setCurrentCallId] = useState<string | null>(null); // Your DB Call ID
    const [currentSignedUrl, setCurrentSignedUrl] = useState<string | null>(null); // WebSocket URL
    const [liveCallStatus, setLiveCallStatus] = useState<string | null>(null); // Display status during polling/call

    // --- WebSocket Hook ---
    const { 
        isConnected: isSocketConnected, 
        messages: socketMessages, 
        // callStatus: socketCallStatus, // Status is handled by polling primarily
        // startSocket, // Connection triggered by currentSignedUrl change
        stopSocket 
    } = useSocket(currentSignedUrl); // Pass the dynamic URL

    // --- Data Fetching ---
    const { data: agentsData, isLoading: agentsLoading } = useSWR<{ agents: any[] }>("/api/getAgents", fetcher);
    // Filter out disabled agents once data is loaded
    const agents = agentsData?.agents?.filter(a => !a.disabled) || [];

    const { data: callsData, isLoading: callsLoading, mutate: refreshCalls } = useSWR<{ calls: RecentCall[] }>("/api/calls?limit=10", fetcher);
    const calls = callsData?.calls || [];

    // --- Form Setup ---
    const form = useForm<z.infer<typeof dialerSchema>>({
        resolver: zodResolver(dialerSchema),
        defaultValues: { agentId: "", contactName: "", phoneNumber: "", customMessage: "" } // Ensure agentId has default
    });
     // Set default agent if available after loading
    useEffect(() => {
        if (!form.getValues('agentId') && agents.length > 0) {
            form.setValue('agentId', agents[0].agent_id); // Default to the first agent
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
            const res = await fetch(`/api/calls/${callId}/status`);
            if (!res.ok) {
                console.error("Polling failed:", res.status);
                if (res.status === 404) {
                     setLiveCallStatus("Error: Call not found");
                     stopPolling(); // Stop if call disappears
                } else if (res.status >= 500) {
                     setLiveCallStatus("Error: Server issue during polling");
                     // Maybe don't stop polling immediately on server errors? Or limit retries?
                }
                return;
            }
            const data = await res.json();
            console.log("Poll status:", data);
            
            // Only update status if it has changed to avoid unnecessary re-renders
            setLiveCallStatus(prevStatus => prevStatus !== data.status ? data.status : prevStatus); 

            if (data.signedUrl && data.status === 'connected') {
                console.log("Signed URL received, connecting WebSocket...");
                setCurrentSignedUrl(data.signedUrl); // This will trigger useSocket's useEffect
                stopPolling(); 
            } else if (['failed', 'ended', 'completed', 'busy', 'no-answer'].includes(data.status)) {
                console.log(`Call ${data.status}. Stopping poll.`);
                stopPolling();
                if (data.failureReason) {
                     setLiveCallStatus(`Failed: ${data.failureReason}`);
                }
                // Optionally refresh recent calls after a short delay
                setTimeout(() => refreshCalls(), 1000); 
            }
        } catch (err) {
            console.error("Network error during polling:", err);
            setLiveCallStatus("Error: Network issue during polling");
            // Consider stopping polling after several network errors
        }
    }, [stopPolling, refreshCalls]); // Include refreshCalls if used inside


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

            const response = await fetch("/api/calls/initiate-exotel", { // Use the NEW endpoint
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...formData, phoneNumber: cleanedPhoneNumber }),
            });

            if (!response.ok) {
                 let errorMsg = "Failed to initiate call";
                 try {
                     const errorData = await response.json();
                     errorMsg = errorData.message || errorMsg;
                 } catch {} // Ignore if response is not JSON
                throw new Error(errorMsg);
            }
            
            const result = await response.json();
            console.log("Call initiation request successful:", result);

            if (!result.callId) {
                throw new Error("Backend did not return a Call ID after initiation.");
            }

            setCurrentCallId(result.callId);
            setLiveCallStatus(result.initialStatus || 'ringing'); 
            
            // Start polling
            const intervalId = setInterval(() => pollCallStatus(result.callId), 3000); 
            setPollingIntervalId(intervalId);

            // Don't reset form until call ends/fails? User might want to see the number.
            // form.reset({ agentId: formData.agentId, phoneNumber: "", contactName: "", customMessage: "" });
            // setDialerValue("");
            await refreshCalls(); // Refresh recent calls list

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
         const callIdToHangup = currentCallId; // Get the ID from state

         if (!callIdToHangup && !isSocketConnected) {
             console.log("No active call identified to hang up.");
             // Maybe reset status display if needed
             setLiveCallStatus(null);
             return;
         }
         
         console.log("Attempting to hang up call:", callIdToHangup || "via socket");
         
         // Always stop polling and socket connection attempts/activity
         stopPolling(); 
         stopSocket(); 
         setCurrentSignedUrl(null); // Prevent reconnection attempts
         setLiveCallStatus('Disconnecting...'); // Immediate feedback
         
         if (callIdToHangup) {
             try {
                // Call the backend hangup endpoint
                const res = await fetch(`/api/calls/${callIdToHangup}/hangup`, { method: 'POST' });
                if (!res.ok) {
                     const errorData = await res.json().catch(() => ({ message: 'Hangup request failed' }));
                     console.error("Failed to request hangup via backend:", errorData.message);
                     // Update status even if backend hangup fails, as we've stopped frontend processes
                     setLiveCallStatus('Hangup Failed (Client disconnected)'); 
                     // Show error to user? alert(...)
                } else {
                     console.log("Hangup request sent successfully.");
                     setLiveCallStatus('Disconnected'); // Confirmed hangup initiated
                }
             } catch (err) {
                 console.error("Error sending hangup request:", err);
                 setLiveCallStatus('Error during hangup');
             } finally {
                  // Reset call ID after hangup attempt
                  setCurrentCallId(null); 
                  // Refresh calls after a moment
                   setTimeout(() => refreshCalls(), 1500);
             }
         } else {
             // If we only had a socket connection but lost the callId somehow
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

    // --- CSV Upload and Batch Call Logic (Remains mostly the same, uses different API potentially) ---
    const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
         // ... (keep existing logic, but ensure the /api/calls PUT endpoint works or create a new one) ...
         // This function remains largely the same as it prepares data for batching
          const file = e.target.files?.[0];
        if (!file) return;

        const agentId = form.getValues("agentId");
        if (!agentId) {
            alert("Please select an agent first");
            return;
        }

        try {
            setUploading(true);
            const formData = new FormData();
            formData.append("file", file);
            formData.append("agentId", agentId); // Send agentId with the file

            // Assuming PUT /api/calls handles CSV parsing and DB saving (or create a dedicated endpoint e.g., /api/calls/import-csv)
            const response = await fetch("/api/calls/import-csv", { // *** ADJUST ENDPOINT IF NEEDED ***
                method: "POST", // Use POST for creating resources typically
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: "Failed to upload CSV" }));
                throw new Error(errorData.message);
            }

            const data = await response.json();
            // Assuming the backend returns { createdCount: number, agentName: string, contacts: [...] }
             if (data.contacts && data.contacts.length > 0) {
                setImportSummary({
                    created: data.createdCount,
                    agentName: data.agentName || "Selected agent",
                    uploadedContacts: data.contacts 
                });
                setShowImportDialog(true);
            } else {
                alert("No new contacts were found or processed from the uploaded file.");
            }
        } catch (error) {
            console.error("Error uploading CSV:", error);
            alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = ""; // Reset file input
        }
    };

    const startCallingProcess = async () => {
        // ... (keep existing logic, uses /api/calls/batch POST endpoint) ...
         if (!importSummary || !importSummary.uploadedContacts.length) return;
         const agentIdForBatch = form.getValues("agentId"); // Get agent ID again

        try {
             // Show immediate feedback
             setShowImportDialog(false); // Close the summary dialog
             alert(`Initiating calls for ${importSummary.created} contacts... Check recent calls for status.`);

            const response = await fetch("/api/calls/batch-initiate-exotel", { // *** USE A NEW BATCH ENDPOINT ***
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    agentId: agentIdForBatch, // Use the currently selected agent
                    contacts: importSummary.uploadedContacts // Send the contacts parsed previously
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: "Failed to start batch calls" }));
                throw new Error(errorData.message);
            }
            const result = await response.json();
            console.log("Batch call initiation result:", result);
            // Result might contain { initiatedCount: number }
            alert(`Successfully queued ${result.initiatedCount || 0} calls.`);
            refreshCalls(); // Refresh recent calls list
        } catch (error) {
            console.error("Error starting batch calls:", error);
            alert(`Error starting calls: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            // Reset import summary regardless of success/failure after attempt
            setImportSummary(null);
        }
    };
    // --- ---

    // --- Helper Functions (Remain the same) ---
    const handleDialerButtonClick = (value: string) => {
        // Ensure dialer isn't modified during an active call/polling state? Optional.
        // if (liveCallStatus && !['failed', 'ended', 'completed', null].includes(liveCallStatus)) return; 
        
        const newValue = value === 'backspace' 
            ? dialerValue.slice(0, -1) 
            : dialerValue + value;
        setDialerValue(newValue);
        form.setValue("phoneNumber", newValue, { shouldValidate: true }); // Trigger validation
    };
    const formatPhoneNumber = (number: string) => {
         if (!number) return '';
        // Basic North American formatting, adjust regex for international needs
        const cleaned = ('' + number).replace(/\D/g, '');
        const match = cleaned.match(/^(1|)?(\d{3})(\d{3})(\d{4})$/);
        if (match) {
            const intlCode = (match[1] ? '+1 ' : '');
            return [intlCode, '(', match[2], ') ', match[3], '-', match[4]].join('');
        }
        // Basic international number check
        if (cleaned.startsWith('+') && cleaned.length > 5) {
             return '+' + cleaned.substring(1); // Keep + prefix if present
        }
        return number; // Return original or cleaned if no specific format matches
    };
    const getStatusBadge = (status: string | null | undefined) => {
        status = status?.toLowerCase() || 'unknown'; // Normalize status

        switch (status) {
            case 'ended':
            case 'completed': 
                return <Badge className="bg-green-500/20 text-green-600 border-green-500/20">Completed</Badge>;
            case 'connected': // WebSocket connected state (from our polling)
                 return <Badge className="bg-blue-500/20 text-blue-600 border-blue-500/20">Connected</Badge>;
            case 'in-progress': // Exotel status
            case 'answered':    // Exotel status
                return <Badge className="bg-yellow-500/20 text-yellow-600 border-yellow-500/20">In Progress</Badge>;
            case 'ringing':     // Exotel status or our polled status
                 return <Badge className="bg-yellow-500/20 text-yellow-600 border-yellow-500/20 animate-pulse">Ringing</Badge>;
            case 'initiating':  // Our initial state
            case 'queued':      // Exotel status
            case 'pending':
                return <Badge variant="secondary" className="bg-gray-500/20 text-gray-400 border-gray-500/20">Queued</Badge>;
             case 'disconnecting': // Our transient state during hangup
                 return <Badge variant="destructive" className="bg-orange-500/20 text-orange-500 border-orange-500/20">Disconnecting</Badge>;
            case 'disconnected': // Our state after hangup/socket close
                  return <Badge variant="destructive" className="bg-gray-600/30 text-gray-500 border-gray-600/30">Disconnected</Badge>;
            case 'failed':
            case 'busy':
            case 'no-answer':
                return <Badge variant="destructive" className="bg-red-500/20 text-red-600 border-red-500/20 capitalize">{status.replace('-', ' ')}</Badge>;
            default:
                 if (status.startsWith('error')) {
                     return <Badge variant="destructive" className="bg-red-500/20 text-red-600 border-red-500/20">Error</Badge>;
                 }
                return <Badge variant="outline" className="capitalize">{status}</Badge>;
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
            {/* Sidebar could be conditionally rendered here */}
            <main className="flex-1 overflow-y-auto h-screen"> {/* Allow vertical scroll */}
                <DashboardHeader />

                <div className="container mx-auto px-4 sm:px-6 py-8">
                    <motion.div initial="hidden" animate="visible" variants={fadeInUpVariant}>
                        <h1 className="text-2xl sm:text-3xl font-bold mb-1 text-[#F3FFD4]">Call Management</h1>
                        <p className="text-[#A7A7A7] mb-8">
                            Make direct calls or import contacts for bulk outreach using AI voice agents.
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Dialer/Import Section */}
                        <motion.div
                            className="lg:col-span-2"
                            initial="hidden" animate="visible" variants={fadeInUpVariant}
                        >
                            <Tabs value={callTab} onValueChange={setCallTab} className="w-full">
                                {/* Tab Selection & New Call Button */}
                                <div className="flex flex-wrap gap-4 justify-between items-center mb-6">
                                    <TabsList className="grid grid-cols-2 bg-[#1a1a1a] border border-[#333333] p-1 h-auto">
                                        <TabsTrigger value="dialer" disabled={isSocketConnected || !!pollingIntervalId}>
                                            <Phone className="h-4 w-4 mr-2" /> Voice Dialer
                                        </TabsTrigger>
                                        <TabsTrigger value="import" disabled={isSocketConnected || !!pollingIntervalId}>
                                            <Upload className="h-4 w-4 mr-2" /> Bulk Import
                                        </TabsTrigger>
                                    </TabsList>
                                     {/* Removed New Call button that links away, integrated into dialer */}
                                </div>

                                {/* Dialer Tab Content */}
                                <TabsContent value="dialer">
                                    <Card className="bg-[#1a1a1a] border border-[#333333]">
                                        <CardHeader>
                                             {/* ... Card Title/Description ... */}
                                             <CardTitle className="flex items-center gap-2 text-[#F3FFD4]">
                                                 <Phone className="h-5 w-5 text-[#A7B3AC]" /> AI Voice Dialer
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
                                                        {/* ... (Dialer display and buttons remain the same) ... */}
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
                                                            
                                                            {/* Submit button moved below */}

                                                            <TooltipProvider> <Tooltip> <TooltipTrigger asChild>
                                                                <Button type="button" variant="outline" className="rounded-full w-10 h-10 sm:w-12 sm:h-12 p-0 bg-[#2a2a2a] border-[#444] hover:bg-[#3a3a3a]" onClick={() => handleDialerButtonClick('backspace')} disabled={makingCall || !!pollingIntervalId || isSocketConnected}><X className="h-4 w-4" /></Button>
                                                            </TooltipTrigger> <TooltipContent>Delete</TooltipContent> </Tooltip> </TooltipProvider>
                                                        </div>
                                                    </div>


                                                    {/* Custom Message */}
                                                    <FormField control={form.control} name="customMessage" render={({ field }) => (
                                                         <FormItem>
                                                            <FormLabel className="text-[#A7A7A7]">Custom Instructions (Optional)</FormLabel>
                                                            <FormControl><Textarea placeholder="Specific context or instructions for the agent on this call..." {...field} disabled={makingCall || !!pollingIntervalId || isSocketConnected} className="min-h-[80px] bg-[#222222] border-[#333333] placeholder:text-[#A7A7A7]/50" /></FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )} />

                                                    {/* Call/How it Works Buttons */}
                                                    <div className="flex flex-col sm:flex-row gap-4 items-center pt-2">
                                                        <Button
                                                            type="submit" // Changed from 'button' to 'submit'
                                                            className="w-full sm:w-auto bg-[#A7B3AC] text-[#111111] hover:bg-[#A7B3AC]/90 font-bold"
                                                            disabled={makingCall || !!pollingIntervalId || isSocketConnected || uploading || !form.formState.isValid} // Disable if form invalid
                                                        >
                                                            {makingCall ? ( <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Initiating...</> ) 
                                                            : (pollingIntervalId || isSocketConnected) ? ( <><Mic className="h-4 w-4 mr-2" /> Call Active</> ) 
                                                            : ( <><Phone className="h-4 w-4 mr-2" /> Start Call</> )}
                                                        </Button>
                                                         {/* How it Works Dialog Trigger */}
                                                        <Dialog>
                                                             {/* ... (DialogTrigger and DialogContent remain the same) ... */}
                                                              <DialogTrigger asChild>
                                                                <Button variant="outline" size="sm" className="w-full sm:w-auto sm:ml-auto border-[#333333] text-[#A7A7A7] hover:bg-[#333333] hover:text-[#F3FFD4]">
                                                                    <HelpCircle className="h-4 w-4 mr-2" /> How it works
                                                                </Button>
                                                            </DialogTrigger>
                                                            <DialogContent className="bg-[#1a1a1a] border-[#333333] text-[#F3FFD4]">
                                                                <DialogHeader>
                                                                    <DialogTitle>How AI Voice Calls Work</DialogTitle>
                                                                    <DialogDescription className="text-[#A7A7A7]">Learn how calls are initiated and handled.</DialogDescription>
                                                                </DialogHeader>
                                                                <div className="space-y-4 py-4 text-sm">
                                                                    {/* ... (Steps explanation remains the same) ... */}
                                                                      <div className="flex gap-4 items-start"><div className="h-8 w-8 rounded-full bg-[#A7B3AC]/10 flex items-center justify-center flex-shrink-0"><Phone className="h-4 w-4 text-[#A7B3AC]" /></div><div><h4 className="font-medium mb-1">1. Initiate Call</h4><p className="text-[#A7A7A7]">Select an agent, enter details, and click 'Start Call'. Your request goes to our server.</p></div></div>
                                                                      <div className="flex gap-4 items-start"><div className="h-8 w-8 rounded-full bg-[#A7B3AC]/10 flex items-center justify-center flex-shrink-0"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-webhook text-[#A7B3AC]"><path d="M18 16.98h-5.99c-1.1 0-1.95.94-2.48 1.9A4 4 0 0 1 2 17c.01-.7.23-1.37.64-1.93.41-.56 1-1.01 1.7-1.31-.08-.1-.16-.21-.24-.33a5.29 5.29 0 0 1-1.4-4.57c.31-1.15 1.11-2.08 2.22-2.48.9-.33 1.91-.33 2.81 0l.5.18.5-.18c.9-.33 1.91-.33 2.81 0 1.11.4 1.91 1.33 2.22 2.48.47 1.77-.3 3.65-1.4 4.57-.08.12-.16.23-.24.33.7.3 1.29.75 1.7 1.31.41.56.63 1.23.64 1.93a4 4 0 0 1-7.52-1.92c-.53-.97-1.38-1.92-2.48-1.92Z"/><path d="M12 12v-2"/></svg></div><div><h4 className="font-medium mb-1">2. Connect via Exotel</h4><p className="text-[#A7A7A7]">Our server tells Exotel (our telephony provider) to call the number and connect to our webhook.</p></div></div>
                                                                     <div className="flex gap-4 items-start"><div className="h-8 w-8 rounded-full bg-[#A7B3AC]/10 flex items-center justify-center flex-shrink-0"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-left-right text-[#A7B3AC]"><path d="M8 3 4 7l4 4"/><path d="M4 7h16"/><path d="m16 21 4-4-4-4"/><path d="M20 17H4"/></svg></div><div><h4 className="font-medium mb-1">3. Bridge to ElevenLabs</h4><p className="text-[#A7A7A7]">When the call is answered, our webhook gets a secure WebSocket URL from ElevenLabs and instructs Exotel to stream the call audio directly to ElevenLabs.</p></div></div>
                                                                      <div className="flex gap-4 items-start"><div className="h-8 w-8 rounded-full bg-[#A7B3AC]/10 flex items-center justify-center flex-shrink-0"><Mic className="h-4 w-4 text-[#A7B3AC]" /></div><div><h4 className="font-medium mb-1">4. Live Conversation</h4><p className="text-[#A7A7A7]">Your browser connects to the same WebSocket to receive live transcripts and agent audio, enabling real-time monitoring.</p></div></div>
                                                                </div>
                                                                <DialogFooter>
                                                                    <DialogClose asChild><Button variant="outline" className="border-[#333333]">Got it</Button></DialogClose>
                                                                    {/* Removed Learn More link */}
                                                                </DialogFooter>
                                                            </DialogContent>
                                                        </Dialog>
                                                    </div>
                                                </form>
                                            </Form>
                                        </CardContent>
                                    </Card>
                                </TabsContent>

                                {/* Bulk Import Tab Content */}
                                <TabsContent value="import">
                                    <Card className="bg-[#1a1a1a] border border-[#333333]">
                                        <CardHeader className="border-b border-[#333333]">
                                            {/* ... Card Title/Description ... */}
                                             <CardTitle className="flex items-center gap-2 text-[#F3FFD4]"><Upload className="h-5 w-5 text-[#A7B3AC]" /> Bulk Call Import</CardTitle>
                                             <CardDescription className="text-[#A7A7A7]">Upload a CSV to schedule multiple AI voice calls.</CardDescription>
                                        </CardHeader>
                                        <CardContent className="pt-6">
                                            {/* Form needed here if agent selection is required *before* upload */}
                                            <div className="space-y-6">
                                                 {/* Agent Selector (Similar to Dialer Tab) */}
                                                 <FormField
                                                    control={form.control} // Still using the same form instance
                                                    name="agentId"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className="text-[#A7A7A7]">Choose AI Agent for Upload</FormLabel>
                                                            <Select onValueChange={field.onChange} value={field.value} disabled={agentsLoading || uploading}>
                                                                <FormControl>
                                                                    <SelectTrigger className="bg-[#222222] border-[#333333]">
                                                                        <SelectValue placeholder={agentsLoading ? "Loading..." : "Select agent for batch"} />
                                                                    </SelectTrigger>
                                                                </FormControl>
                                                                 <SelectContent className="bg-[#1a1a1a] border-[#333333]">
                                                                     {/* ... options mapping ... */}
                                                                       {agentsLoading ? ( <SelectItem value="loading" disabled>Loading...</SelectItem> ) 
                                                                       : agents.length > 0 ? ( agents.map(agent => ( <SelectItem key={agent.agent_id} value={agent.agent_id}>{agent.name}</SelectItem> )) ) 
                                                                       : ( <SelectItem value="no-agents" disabled>No agents</SelectItem> )}
                                                                 </SelectContent>
                                                            </Select>
                                                            <FormDescription className="text-[#A7A7A7]/80">This agent will be used for all calls initiated from the uploaded CSV.</FormDescription>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                
                                                {/* File Upload Area */}
                                                <div className="border-2 border-dashed border-[#333333] rounded-lg p-8 text-center bg-[#1f1f1f]/50">
                                                    {/* ... (Upload icon, text, buttons remain the same) ... */}
                                                      <div className="mx-auto w-16 h-16 mb-4 rounded-full bg-[#2a2a2a] flex items-center justify-center border border-[#444]"><Upload className="h-8 w-8 text-[#A7A7A7]" /></div>
                                                      <h3 className="text-lg font-medium mb-2 text-[#F3FFD4]">Upload Contact List</h3>
                                                      <p className="text-sm text-[#A7A7A7] mb-4 max-w-md mx-auto">CSV file needs columns: 'name', 'phoneNumber'. Optional: 'customMessage'.</p>
                                                      <input ref={fileInputRef} type="file" accept=".csv" onChange={handleCSVUpload} className="hidden" />
                                                      <div className="flex flex-col sm:flex-row justify-center gap-3">
                                                           <Button type="button" className="bg-[#A7B3AC] text-[#111111] hover:bg-[#A7B3AC]/90 font-bold flex-1 sm:flex-initial" onClick={() => { if(!form.getValues('agentId')) { alert('Please select an agent first.'); return; } fileInputRef.current?.click(); }} disabled={uploading || agentsLoading}>
                                                               {uploading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Uploading...</> : <><Upload className="h-4 w-4 mr-2" /> Select CSV</>}
                                                           </Button>
                                                           <Button type="button" variant="outline" asChild className="flex-1 sm:flex-initial border-[#333333] hover:bg-[#333333]"><a href="/templates/contacts_template.csv" download><Download className="h-4 w-4 mr-2" /> Template</a></Button>
                                                      </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                        <CardFooter className="border-t border-[#333333] pt-6 flex flex-col gap-3">
                                             {/* ... Footer info ... */}
                                             <div className="flex items-start gap-2 text-sm text-[#A7A7A7]"> <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" /> <p>Calls will be queued via the backend. Monitor status in Recent Calls.</p> </div>
                                        </CardFooter>
                                    </Card>
                                </TabsContent>
                            </Tabs>

                             {/* --- Live Call Status Display --- */}
                            <motion.div variants={fadeInUpVariant} className="mt-6">
                                <Card className="bg-[#1a1a1a] border border-[#333333]">
                                     <CardHeader>
                                        <CardTitle className="text-[#F3FFD4] text-lg flex items-center gap-2">
                                            <Mic className="h-5 w-5 text-[#A7B3AC]" /> Live Call Status
                                        </CardTitle>
                                     </CardHeader>
                                     <CardContent>
                                        {liveCallStatus ? (
                                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                                                {getStatusBadge(liveCallStatus)}
                                                {(isSocketConnected || pollingIntervalId || ['ringing', 'connected', 'initiating', 'in-progress', 'answered'].includes(liveCallStatus.toLowerCase())) && (
                                                    <Button variant="destructive" size="sm" onClick={onHangupCall}>
                                                        <XCircle className="h-4 w-4 mr-2" /> Hang Up
                                                    </Button>
                                                )}
                                            </div>
                                        ) : (
                                            <p className="text-sm text-[#A7A7A7] italic">No active call.</p>
                                        )}

                                        {/* Display conversation if connected */}
                                        {isSocketConnected && (
                                            <div className="mt-4 max-h-60 overflow-y-auto border-t border-[#333333] pt-4 space-y-2">
                                                <h4 className="text-md font-semibold text-[#F3FFD4] mb-2">Live Transcript</h4>
                                                {/* Placeholder for ConversationDisplay component */}
                                                 <div className="text-sm text-[#A7A7A7] space-y-1">
                                                     {socketMessages.filter(msg => msg.type === 'user_transcript' || msg.type === 'agent_response').slice(-10).map((msg, index) => (
                                                        <p key={index} className={cn(msg.type === 'user_transcript' ? "text-blue-300" : "text-green-300")}>
                                                            {msg.type === 'user_transcript' ? `User: ${msg.user_transcript_event?.user_transcript}` : `Agent: ${msg.agent_response_event?.agent_response}`}
                                                        </p>
                                                    ))}
                                                     {socketMessages.length === 0 && <p>Waiting for conversation...</p>}
                                                </div>
                                                {/* <pre className="text-xs text-[#A7A7A7] whitespace-pre-wrap">{JSON.stringify(socketMessages.slice(-5), null, 2)}</pre> */}
                                            </div>
                                        )}
                                     </CardContent>
                                </Card>
                             </motion.div>


                        </motion.div>

                        {/* Recent Calls Section */}
                        <motion.div
                            className="lg:col-span-1"
                            initial="hidden" animate="visible" variants={fadeInUpVariant}
                        >
                            <Card className="h-fit max-h-[calc(100vh-200px)] flex flex-col bg-[#1a1a1a] border border-[#333333]"> {/* Limit height */}
                                <CardHeader className="border-b border-[#333333] flex-shrink-0">
                                    {/* ... Card Title/Description ... */}
                                    <CardTitle className="flex items-center gap-2 text-[#F3FFD4]"><CalendarClock className="h-5 w-5 text-[#A7B3AC]" /> Recent Calls</CardTitle>
                                    <CardDescription className="text-[#A7A7A7]">View latest call activities.</CardDescription>
                                </CardHeader>
                                <CardContent className="p-0 flex-1 overflow-hidden"> {/* Allow content to scroll */}
                                    {callsLoading ? (
                                         <div className="p-8 text-center text-[#A7A7A7]"><Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />Loading calls...</div>
                                    ) : calls.length > 0 ? (
                                        <ScrollArea className="h-full"> {/* Make ScrollArea fill parent */}
                                            <div className="divide-y divide-[#333333]">
                                                {calls.map((call) => (
                                                    <div
                                                        key={call._id}
                                                        className="p-4 hover:bg-[#222222] transition-colors cursor-pointer"
                                                        onClick={() => setSelectedCall(call)} // Open details modal
                                                        tabIndex={0}
                                                        onKeyDown={(e)=>{if(e.key === 'Enter') setSelectedCall(call)}}
                                                    >
                                                        {/* ... (Call item display remains the same) ... */}
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
                                                            {/* Removed DropdownMenu - details shown in modal */}
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
                    </div> {/* End Grid */}

                     {/* Call Details Modal */}
                     <Dialog open={!!selectedCall} onOpenChange={(open) => !open && setSelectedCall(null)}>
                         <DialogContent className="bg-[#1a1a1a] border-[#333333] text-[#F3FFD4] max-w-lg">
                            {/* ... (Dialog Content remains mostly the same, adjusted Call Again button) ... */}
                             <DialogHeader><DialogTitle>Call Details</DialogTitle><DialogDescription className="text-[#A7A7A7]">Information about this call.</DialogDescription></DialogHeader>
                             {selectedCall && ( <div className="space-y-4 py-2">
                                {/* ... Avatar, Name, Number ... */}
                                <div className="flex items-center gap-4 pb-2"><Avatar className="h-14 w-14 bg-[#222222]"><AvatarFallback className="bg-[#A7B3AC]/10 text-[#A7B3AC] text-lg">{selectedCall.contactName?.charAt(0)?.toUpperCase() || '?'}</AvatarFallback></Avatar><div><h3 className="font-medium text-lg">{selectedCall.contactName || "Unknown"}</h3><p className="text-[#A7A7A7]">{formatPhoneNumber(selectedCall.phoneNumber)}</p></div></div>
                                <Separator className="bg-[#333333]" />
                                {/* Grid for Status, Agent, Time, Duration, Cost, Type */}
                                <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                                     <div><p className="text-xs text-[#A7A7A7] mb-0.5">Status</p><div>{getStatusBadge(selectedCall.status)}</div></div>
                                     <div><p className="text-xs text-[#A7A7A7] mb-0.5">Agent</p><p className="font-medium truncate">{selectedCall.agentName || "N/A"}</p></div>
                                     <div><p className="text-xs text-[#A7A7A7] mb-0.5">Time</p><p>{selectedCall.startTime ? format(new Date(selectedCall.startTime), "MMM d, h:mm a") : "N/A"}</p></div>
                                     <div><p className="text-xs text-[#A7A7A7] mb-0.5">Duration</p><p>{selectedCall.duration != null && selectedCall.duration >= 0 ? `${Math.floor(selectedCall.duration / 60)}m ${selectedCall.duration % 60}s` : "N/A"}</p></div>
                                     <div><p className="text-xs text-[#A7A7A7] mb-0.5">Cost</p><p>₹{selectedCall.cost?.toFixed(2) || "0.00"}</p></div>
                                     <div><p className="text-xs text-[#A7A7A7] mb-0.5">Type</p><p>{selectedCall.callType || "Standard"}</p></div>
                                </div>
                                {/* Notes */}
                                {selectedCall.notes && (<div className="space-y-1 pt-2"><p className="text-xs text-[#A7A7A7]">Notes</p><div className="p-3 bg-[#222222] rounded-md text-sm border border-[#333333] max-h-24 overflow-y-auto"><p className="whitespace-pre-wrap">{selectedCall.notes}</p></div></div>)}
                                {/* Transcription */}
                                {selectedCall.transcription && (<div className="space-y-1 pt-2"><p className="text-xs text-[#A7A7A7]">Transcription</p><ScrollArea className="h-40"><div className="p-3 bg-[#222222] rounded-md text-sm border border-[#333333] whitespace-pre-wrap">{selectedCall.transcription}</div></ScrollArea></div>)}
                                {/* Footer Actions */}
                                <DialogFooter className="pt-4 flex flex-col sm:flex-row gap-2">
                                     <Button variant="outline" className="border-[#333333] w-full sm:w-auto" onClick={() => { if (selectedCall.agentId) { form.reset({ agentId: selectedCall.agentId, phoneNumber: selectedCall.phoneNumber, contactName: selectedCall.contactName || "", customMessage: "" }); setDialerValue(selectedCall.phoneNumber); setCallTab("dialer"); setSelectedCall(null); } else { alert("Agent ID missing, cannot call again easily."); } }} disabled={makingCall || !!pollingIntervalId || isSocketConnected}><Phone className="h-4 w-4 mr-2" /> Call Again</Button>
                                     <DialogClose asChild><Button variant="default" className="w-full sm:w-auto">Close</Button></DialogClose>
                                </DialogFooter>
                            </div> )}
                        </DialogContent>
                    </Dialog>

                    {/* Import Confirmation Dialog */}
                    <Dialog open={showImportDialog} onOpenChange={(open) => { if (!open) { setShowImportDialog(false); setImportSummary(null); } }}>
                        {/* ... (Dialog Content remains the same) ... */}
                         <DialogContent className="bg-[#1a1a1a] border-[#333333] text-[#F3FFD4]"> <DialogHeader> <DialogTitle>Contacts Ready for Calling</DialogTitle> <DialogDescription className="text-[#A7A7A7]"> Choose how to proceed with the imported contacts. </DialogDescription> </DialogHeader> {importSummary && ( <div className="py-4 space-y-4"> <div className="flex items-center gap-2"> <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" /> <p className="font-medium"> Successfully prepared {importSummary.created} contacts for calling </p> </div> <div className="p-3 bg-[#222222] rounded-lg border border-[#333333]"> <p className="text-sm mb-1 text-[#A7A7A7]">Selected Agent:</p> <p className="font-medium">{importSummary.agentName}</p> </div> {/* Action Cards */} <div className="grid grid-cols-1 gap-4"> <Card className="border border-[#333333] bg-[#222222]"> <CardContent className="pt-6 pb-4"> <div className="flex justify-between items-start mb-3"> <div><h3 className="font-medium text-[#F3FFD4]">Quick Call Batch</h3><p className="text-sm text-[#A7A7A7] mt-1">Start calling all contacts immediately.</p></div> <div className="h-9 w-9 rounded-full bg-[#A7B3AC]/10 flex items-center justify-center flex-shrink-0"><Phone className="h-5 w-5 text-[#A7B3AC]" /></div> </div> <Button className="w-full bg-[#A7B3AC] text-[#111111]" onClick={startCallingProcess}>Start Calling Now</Button> </CardContent> </Card> {/* <Card className="border border-[#333333] bg-[#222222]"> <CardContent className="pt-6 pb-4"> <div className="flex justify-between items-start mb-3"> <div><h3 className="font-medium text-[#F3FFD4]">Create Campaign</h3><p className="text-sm text-[#A7A7A7] mt-1">Set up scheduling and advanced options.</p></div> <div className="h-9 w-9 rounded-full bg-[#333333] flex items-center justify-center flex-shrink-0"><LayoutGrid className="h-5 w-5 text-[#A7A7A7]" /></div> </div> <Button variant="outline" className="w-full border-[#333333]" onClick={() => { localStorage.setItem('campaignContacts', JSON.stringify(importSummary.uploadedContacts)); localStorage.setItem('campaignAgentId', form.getValues("agentId")); router.push('/dashboard/campaigns/new?from=import'); setShowImportDialog(false); }}>Create Campaign</Button> </CardContent> </Card> */} </div> </div> )} <DialogFooter> <DialogClose asChild><Button variant="outline" className="border-[#333333]">Cancel</Button></DialogClose> </DialogFooter> </DialogContent>
                    </Dialog>

                    {/* Analytics Section - Simplified/Placeholder */}
                    <motion.div className="mt-8" initial="hidden" animate="visible" variants={fadeInUpVariant}>
                         {/* ... (Analytics header and link) ... */}
                         <div className="flex justify-between items-center mb-4 text-[#F3FFD4]"> <h2 className="text-xl font-bold">Call Analytics</h2> <Link href="/dashboard/analytics"><Button variant="ghost" size="sm" className="text-[#A7A7A7] hover:text-[#F3FFD4]">View All <ChevronRight className="ml-1 h-4 w-4" /></Button></Link> </div>
                         {/* ... (Analytics cards can remain the same) ... */}
                         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <Card className="bg-[#1a1a1a] border border-[#333333]"><CardContent className="pt-6 text-[#F3FFD4]"><div className="flex justify-between items-start mb-2"><div className="space-y-1"><p className="text-sm text-[#A7A7A7]">Total Calls</p><p className="text-3xl font-bold">{callsLoading ? '-' : calls.length}</p></div><div className="h-10 w-10 rounded-full bg-[#A7B3AC]/10 flex items-center justify-center"><PhoneCall className="h-5 w-5 text-[#A7B3AC]" /></div></div> {/* Placeholder progress */}<div className="mt-4"><Progress value={0} className="h-1 bg-[#333]" indicatorClassName="bg-[#A7B3AC]" /><p className="text-xs text-[#A7A7A7] mt-2">Usage data unavailable</p></div></CardContent></Card>
                            {/* Other stat cards */}
                            <Card className="bg-[#1a1a1a] border border-[#333333]"><CardContent className="pt-6 text-[#F3FFD4]"><div className="flex justify-between items-start mb-2"><div className="space-y-1"><p className="text-sm text-[#A7A7A7]">Success Rate</p><p className="text-3xl font-bold">{callsLoading ? '-' : calls.length > 0 ? `${Math.round(calls.filter(c => c.status === 'completed' || c.status === 'ended').length / calls.length * 100)}%` : '0%'}</p></div><div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center"><CheckCircle className="h-5 w-5 text-green-500" /></div></div><div className="mt-4"><div className="flex items-center justify-between text-xs text-[#A7A7A7]"><span>Completed</span><span>{callsLoading ? '-' : calls.filter(c => c.status === 'completed' || c.status === 'ended').length}</span></div></div></CardContent></Card>
                            <Card className="bg-[#1a1a1a] border border-[#333333]"><CardContent className="pt-6 text-[#F3FFD4]"><div className="flex justify-between items-start mb-2"><div className="space-y-1"><p className="text-sm text-[#A7A7A7]">Avg. Duration</p><p className="text-3xl font-bold">{callsLoading ? '-' : calls.length > 0 && calls.some(c => c.duration && c.duration > 0) ? `${Math.round(calls.reduce((sum, call) => sum + (call.duration || 0), 0) / calls.filter(c => c.duration && c.duration > 0).length / 60)}m` : '0m'}</p></div><div className="h-10 w-10 rounded-full bg-[#A7B3AC]/10 flex items-center justify-center"><Clock className="h-5 w-5 text-[#A7B3AC]" /></div></div><div className="mt-4"><div className="flex items-center justify-between text-xs text-[#A7A7A7]"><span>Avg. Cost</span><span>₹{callsLoading ? '-' : (calls.reduce((s,c)=> s + (c.cost || 0), 0) / (calls.length || 1)).toFixed(2)}</span></div></div></CardContent></Card>
                            <Card className="bg-[#1a1a1a] border border-[#333333]"><CardContent className="pt-6 text-[#F3FFD4]"><div className="flex justify-between items-start mb-2"><div className="space-y-1"><p className="text-sm text-[#A7A7A7]">Active/Queued</p><p className="text-3xl font-bold">{callsLoading ? '-' : calls.filter(c => ['ringing', 'in-progress', 'connected', 'initiating', 'queued', 'pending'].includes(c.status)).length}</p></div><div className="h-10 w-10 rounded-full bg-yellow-500/10 flex items-center justify-center"><Mic className="h-5 w-5 text-yellow-500" /></div></div><div className="mt-4"><div className="flex items-center justify-between text-xs text-[#A7A7A7]"><span>Failed</span><span>{callsLoading ? '-' : calls.filter(c => c.status === 'failed' || c.status === 'busy' || c.status === 'no-answer').length}</span></div></div></CardContent></Card>

                         </div>
                    </motion.div>

                </div> {/* End Container */}
            </main>
        </div>
    );
}