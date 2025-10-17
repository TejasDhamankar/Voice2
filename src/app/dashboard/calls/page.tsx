"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { motion } from "framer-motion";
import Link from "next/link";
import { cn } from "@/lib/utils";

// UI Components
import { DashboardHeader } from "@/components/dashboard/header";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
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

// Icons
import { PhoneCall, Upload, Phone, CalendarClock, Clock, MoreHorizontal, PlayCircle, AlertCircle, CheckCircle, XCircle, Loader2, Mic, Plus, X, FileText, ChevronRight, HelpCircle, Info, LayoutGrid, Download } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const fetcher = (url: string) => fetch(url).then(r => r.json());

const dialerSchema = z.object({
    agentId: z.string().min(1, "Please select an agent"),
    phoneNumber: z.string()
        .min(8, "Enter a valid phone number")
        .regex(/^[+\d\s()-]+$/, "Enter a valid phone number"),
    contactName: z.string().min(1, "Contact name is required"),
    customMessage: z.string().optional(),
});

export default function CallsPage() {
    const { user } = useAuth();
    const [callTab, setCallTab] = useState("dialer");
    const [uploading, setUploading] = useState(false);
    const [selectedCall, setSelectedCall] = useState<any>(null);
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

    const { data: agentsData } = useSWR<{ agents: any[] }>("/api/getAgents", fetcher);
    const agents = agentsData?.agents?.filter(a => !a.disabled) || [];

    const { data: callsData, mutate: refreshCalls } = useSWR<{ calls: any[] }>("/api/calls?limit=10", fetcher);
    const calls = callsData?.calls || [];

    const form = useForm<z.infer<typeof dialerSchema>>({
        resolver: zodResolver(dialerSchema),
        defaultValues: {
            contactName: "",
            phoneNumber: "",
            customMessage: "",
        }
    });

    const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
            formData.append("agentId", agentId);

            const response = await fetch("/api/calls", {
                method: "PUT",
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Failed to upload CSV");
            }

            const data = await response.json();
            if (data.uploadedContacts && data.uploadedContacts.length > 0) {
                const agent = agents.find(agent => agent.agentId === agentId);
                setImportSummary({
                    created: data.results.created,
                    agentName: agent?.name || "Selected agent",
                    uploadedContacts: data.uploadedContacts
                });
                setShowImportDialog(true);
            } else {
                alert("No new contacts were found in the uploaded file.");
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

        try {
            const response = await fetch("/api/calls/batch", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    agentId: form.getValues("agentId"),
                    contacts: importSummary.uploadedContacts
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Failed to start calls");
            }
            const result = await response.json();
            alert(`Successfully initiated ${result.initiated || 0} calls.`);
            refreshCalls();
        } catch (error) {
            console.error("Error starting calls:", error);
            alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setShowImportDialog(false);
            setImportSummary(null);
        }
    };

    const onMakeCall = async (formData: z.infer<typeof dialerSchema>) => {
        try {
            setMakingCall(true);
            const cleanedPhoneNumber = formData.phoneNumber.replace(/\D/g, '');

            const response = await fetch("/api/calls", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...formData, phoneNumber: cleanedPhoneNumber }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || "Failed to initiate call");
            }
            
            await response.json();
            await refreshCalls();
            form.reset({ agentId: formData.agentId, phoneNumber: "", contactName: "", customMessage: "" });
            setDialerValue("");
        } catch (error) {
            console.error("Error making call:", error);
            alert("Error initiating call. Please check the console.");
        } finally {
            setMakingCall(false);
        }
    };

    // (Helper functions like handleDialerButtonClick, formatPhoneNumber, getStatusBadge remain the same)
    const handleDialerButtonClick = (value: string) => {
        const newValue = value === 'backspace' ? dialerValue.slice(0, -1) : dialerValue + value;
        setDialerValue(newValue);
        form.setValue("phoneNumber", newValue);
    };
    const formatPhoneNumber = (number: string) => {
        if (!number) return '';
        const cleaned = ('' + number).replace(/\D/g, '');
        const match = cleaned.match(/^(\d{1,3})?(\d{3})?(\d{3})?(\d{4})?$/);
        if (!match) return number;

        const parts = match.slice(1).filter(Boolean);
        if (parts.length <= 1) return cleaned;
        if (parts.length === 2) return `(${parts[0]}) ${parts[1]}`;
        if (parts.length === 3) return `(${parts[0]}) ${parts[1]}-${parts[2]}`;
        if (parts.length === 4) return `+${parts[0]} (${parts[1]}) ${parts[2]}-${parts[3]}`;
        return number;
    };
 
    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'ended':
            case 'completed': // Keep for backward compatibility if needed
                return <Badge  className="bg-green-500/20 text-green-600 border-green-500/20">Completed</Badge>;
            case 'in_progress':
            case 'in-progress': // Keep for backward compatibility if needed
                return <Badge  className="bg-yellow-500/20 text-yellow-600 border-yellow-500/20">In Progress</Badge>;
            case 'ending':
                return <Badge  className="bg-yellow-500/20 text-yellow-600 border-yellow-500/20">Ending</Badge>;
            case 'failed':
                return <Badge variant="destructive" className="bg-red-500/20 text-red-600 border-red-500/20">Failed</Badge>;
            case 'pending':
            case 'queued':
                return <Badge variant="secondary" className="bg-blue-500/20 text-blue-600 border-blue-500/20">Queued</Badge>;
            default:
                return <Badge variant="outline">Unknown</Badge>;
        }
    };
 const fadeInUpVariant = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
    };
    
    // The rest of your JSX from the prompt goes here...
    return (
        <div className="min-h-screen text-foreground flex bg-[#111111]">
      <main className="flex-1 overflow-y-auto h-fit max-h-screen">
        <DashboardHeader />

        <div className=" mx-auto px-4 sm:px-6 py-8">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeInUpVariant}
          >
            <h1 className="text-2xl sm:text-3xl font-bold mb-1 text-[#F3FFD4]">Call Management</h1>
            <p className="text-[#A7A7A7] mb-8">
              Make direct calls with your AI voice agents or import contact lists for bulk outreach
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <motion.div
              className="lg:col-span-2"
              initial="hidden"
              animate="visible"
              variants={fadeInUpVariant}
            >
              <Tabs value={callTab} onValueChange={setCallTab} className="w-full">
                <div className="flex gap-4 justify-between items-center mb-6">
                  <TabsList className="grid grid-cols-2 bg-[#1a1a1a] border border-[#333333] p-1 h-auto">
                    <TabsTrigger value="dialer">
                      <Phone className="h-4 w-4 mr-2" /> Voice Dialer
                    </TabsTrigger>
                    <TabsTrigger value="import">
                      <Upload className="h-4 w-4 mr-2" /> Bulk Import
                    </TabsTrigger>
                  </TabsList>
                  <Link href='/dashboard/calls/new'>
                    <Button className="gap-2 bg-[#A7B3AC] text-[#111111] hover:bg-[#A7B3AC]/90 font-bold">
                      <Plus className="h-4 w-4" /> New Call
                    </Button>
                  </Link>
                </div>
                <TabsContent value="dialer">
                  <Card>
                    <CardHeader>
                      <div className="flex justify-between items-center">
                        <div>
                          <CardTitle className="flex items-center gap-2 text-[#F3FFD4]">
                            <Phone className="h-5 w-5 text-[#A7B3AC]" />
                            AI Voice Dialer
                          </CardTitle>
                          <CardDescription className="text-[#A7A7A7]">
                            Select an agent and enter contact details to initiate a voice call
                          </CardDescription>
                        </div>
                       
                      </div>
                    </CardHeader>
                    <CardContent className="text-[#F3FFD4]">
                      <Form {...form}>
                        <form onSubmit={form.handleSubmit(onMakeCall)} className="space-y-6">
                          <FormField
                            control={form.control}
                            name="agentId"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-[#A7A7A7]">Choose your AI Agent</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select an agent" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {agents.length > 0 ? (
                                      agents.map(agent => (
                                        <SelectItem key={agent.agent_id} value={agent.agent_id}>
                                          <div className="flex items-center">
                                            <span className="w-2 h-2 rounded-full bg-success mr-2" />
                                            {agent.name}
                                          </div>
                                        </SelectItem>
                                      ))
                                    ) : (
                                      <SelectItem value="loading" disabled>
                                        Loading agents...
                                      </SelectItem>
                                    )}
                                  </SelectContent>
                                </Select>
                                <FormDescription className="text-[#A7A7A7]/80">
                                  The AI agent will handle the conversation during the call
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                              control={form.control}
                              name="contactName"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-[#A7A7A7]">Contact Name</FormLabel>
                                  <FormControl>
                                    <Input placeholder="John Smith" {...field} className="bg-[#222222] border-[#333333] placeholder:text-[#A7A7A7]/50" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="phoneNumber"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-[#A7A7A7]">Phone Number</FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder="+1 555 123 4567"
                                      className="bg-[#222222] border-[#333333] placeholder:text-[#A7A7A7]/50"
                                      value={dialerValue}
                                      onChange={(e) => {
                                        setDialerValue(e.target.value);
                                        field.onChange(e.target.value);
                                      }}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          {/* Mobile-inspired Dialer */}
                          <div className="mt-4 p-6 bg-[#1a1a1a]/60 rounded-lg border border-[#333333]">
                            <div className="flex justify-center mb-4">
                              <div className="text-center px-3 py-2 rounded-lg bg-[#1a1a1a] shadow-sm min-w-[200px] border border-[#333333]">
                                <p className="text-2xl font-mono tracking-wider">
                                  {formatPhoneNumber(dialerValue) || '—'}
                                </p>
                              </div>
                            </div>

                            <div className="grid grid-cols-3 gap-3 mb-4">
                              {[1, 2, 3, 4, 5, 6, 7, 8, 9, '*', 0, '#'].map((num) => (
                                <Button
                                  key={num}
                                  type="button"
                                  variant="outline" 
                                  className="h-14 text-xl font-medium bg-[#222222] border-[#333333] hover:bg-[#333333] hover:text-[#F3FFD4]"
                                  onClick={() => handleDialerButtonClick(num.toString())}
                                >
                                  {num}
                                </Button>
                              ))}
                            </div>

                            <div className="flex justify-center gap-3">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      type="button" 
                                      variant="outline" 
                                      className="rounded-full w-12 h-12 p-0"
                                      onClick={() => handleDialerButtonClick('+')}
                                    >
                                      <Plus className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Add + prefix</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>

                              <Button
                                type="button"
                                variant="default"
                                className="bg-green-500 hover:bg-green-600 text-white rounded-full h-14 w-14"
                                onClick={() => form.handleSubmit(onMakeCall)()}
                                disabled={makingCall}
                              >
                                <Phone className="h-6 w-6" />
                              </Button>

                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      type="button" 
                                      variant="outline" 
                                      className="rounded-full w-12 h-12 p-0"
                                      onClick={() => handleDialerButtonClick('backspace')}
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Delete</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          </div>

                          <FormField
                            control={form.control}
                            name="customMessage"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-[#A7A7A7]">Custom Instructions (Optional)</FormLabel>
                                <FormControl>
                                  <Textarea
                                    placeholder="Enter custom instructions for your AI agent to follow during this call..."
                                    className="min-h-[80px] bg-[#222222] border-[#333333] placeholder:text-[#A7A7A7]/50"
                                    {...field}
                                  />
                                </FormControl>
                                <FormDescription>
                                  Specific message or instructions for your agent to deliver during this call
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="flex flex-col sm:flex-row gap-4 items-center pt-2">
                            <Button
                              type="submit"
                              className="w-full sm:w-auto bg-[#A7B3AC] text-[#111111] hover:bg-[#A7B3AC]/90 font-bold"
                              disabled={makingCall || uploading}
                            >
                              {makingCall ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Initiating Call...
                                </>
                              ) : (
                                <>
                                  <Phone className="h-4 w-4 mr-2" />
                                  Start AI Voice Call
                                </>
                              )}
                            </Button>

                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm" className="w-full sm:w-auto sm:ml-auto border-[#333333] text-[#A7A7A7] hover:bg-[#333333] hover:text-[#F3FFD4]">
                                  <HelpCircle className="h-4 w-4 mr-2" />
                                  How it works
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>How AI Voice Calls Work</DialogTitle>
                                  <DialogDescription>
                                    Learn how our AI agents make natural-sounding calls
                                  </DialogDescription>
                                </DialogHeader>

                                <div className="space-y-4 py-4">
                                  <div className="flex gap-4 items-start">
                                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                      <Phone className="h-4 w-4 text-primary" />
                                    </div>
                                    <div>
                                      <h4 className="text-sm font-medium mb-1">Initiate Call</h4>
                                      <p className="text-sm text-muted-foreground">
                                        Select an AI agent, enter contact details, and press call.
                                      </p>
                                    </div>
                                  </div>

                                  <div className="flex gap-4 items-start">
                                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                      <Mic className="h-4 w-4 text-primary" />
                                    </div>
                                    <div>
                                      <h4 className="text-sm font-medium mb-1">Natural Conversation</h4>
                                      <p className="text-sm text-muted-foreground">
                                        Our AI handles the call, speaking naturally with your contact.
                                      </p>
                                    </div>
                                  </div>

                                  <div className="flex gap-4 items-start">
                                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                      <FileText className="h-4 w-4 text-primary" />
                                    </div>
                                    <div>
                                      <h4 className="text-sm font-medium mb-1">Get Results</h4>
                                      <p className="text-sm text-muted-foreground">
                                        Review call transcripts, summaries, and outcomes in your call history.
                                      </p>
                                    </div>
                                  </div>
                                </div>

                                <DialogFooter>
                                  <Button variant="outline" className="w-full">
                                    <Link href="/dashboard/guides/voice-calls">
                                      Learn More <ChevronRight className="h-4 w-4 ml-1" />
                                    </Link>
                                  </Button>
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
                  <Card>
                    <CardHeader className="border-b border-[#333333]">
                      <CardTitle className="flex items-center gap-2 text-[#F3FFD4]">
                        <Upload className="h-5 w-5 text-[#A7B3AC]" />
                        Bulk Call Import
                      </CardTitle>
                      <CardDescription className="text-[#A7A7A7]">
                        Upload a CSV file with contact details to schedule multiple AI voice calls
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <Form {...form}>
                        <div className="space-y-6">
                          <FormField
                            control={form.control}
                            name="agentId"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-[#A7A7A7]">Choose your AI Agent</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select an agent" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {agents.length > 0 ? (
                                      agents.map(agent => (
                                        <SelectItem key={agent.agent_id} value={agent.agent_id}>
                                          <div className="flex items-center">
                                            <span className="w-2 h-2 rounded-full bg-success mr-2" />
                                            {agent.name}
                                          </div>
                                        </SelectItem>
                                      ))
                                    ) : (
                                      <SelectItem value="loading" disabled>
                                        Loading agents...
                                      </SelectItem>
                                    )}
                                  </SelectContent>
                                </Select>
                                <FormDescription className="text-[#A7A7A7]/80">
                                  This agent will handle all conversations for contacts in the uploaded file
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="border-2 border-dashed border-[#333333] rounded-lg p-8 text-center bg-[#1a1a1a]/50">
                            <div className="mx-auto w-16 h-16 mb-4 rounded-full bg-[#222222] flex items-center justify-center border border-[#333333]">
                              <Upload className="h-8 w-8 text-[#A7A7A7]" />
                            </div>
                            <h3 className="text-lg font-medium mb-2 text-[#F3FFD4]">Upload Contact List</h3>
                            <p className="text-sm text-[#A7A7A7] mb-4 max-w-md mx-auto">
                              CSV file should include columns for name, phone number, and optional custom message
                            </p>

                            <input
                              ref={fileInputRef}
                              type="file"
                              accept=".csv"
                              onChange={handleCSVUpload}
                              className="hidden"
                            />

                            <div className="flex flex-col sm:flex-row justify-center gap-3">
                              <Button
                                type="button" 
                                className="bg-[#A7B3AC] text-[#111111] hover:bg-[#A7B3AC]/90 font-bold flex-1 sm:flex-initial"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploading}
                               
                              >
                                {uploading ? (
                                  <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Uploading...
                                  </>
                                ) : (
                                  <>
                                    <Upload className="h-4 w-4 mr-2" />
                                    Select CSV File
                                  </>
                                )}
                              </Button>

                              <Button
                                type="button"
                                variant="outline" 
                                asChild
                                className="flex-1 sm:flex-initial"
                              >
                                <a href="/templates/contacts_template.csv" download>
                                  <Download className="h-4 w-4 mr-2" />
                                  Download Template
                                </a>
                              </Button>

                            </div>
                            <div className="flex flex-col gap-2 mt-4 text-center">
                              <p className="text-sm text-[#A7A7A7]">
                                Need to make many calls at once?
                              </p>
                              <Link href="/dashboard/campaigns/new">
                                <Button variant="link" size="sm" className="mx-auto">
                                  Create a Campaign Instead <ChevronRight className="h-3 w-3 ml-1" />
                                </Button>
                              </Link>
                            </div>
                            {importSummary && (
                              <div className="mt-6 p-4 rounded-lg bg-[#222222] text-left border border-[#333333]">
                                <p className="text-sm font-medium mb-3 flex items-center">
                                  <Info className="h-4 w-4 mr-2 text-[#A7B3AC]" />
                                  {`Successfully imported ${importSummary.created} contacts.`}
                                </p>
                                <div className="grid grid-cols-3 gap-3 text-sm">
                                  <div className="rounded-md bg-success/10 p-3 text-center">
                                    <p className="text-success font-medium">{importSummary.created}</p>
                                    <p className="text-xs text-[#A7A7A7]">Successful</p>
                                  </div>
                                  <div className="rounded-md bg-warning/10 p-3 text-center">
                                    <p className="text-warning font-medium">0</p>
                                    <p className="text-xs text-[#A7A7A7]">Skipped</p>
                                  </div>
                                  <div className="rounded-md bg-destructive/10 p-3 text-center">
                                    <p className="text-destructive font-medium">0</p>
                                    <p className="text-xs text-[#A7A7A7]">Failed</p>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </Form>
                    </CardContent>
                    <CardFooter className="border-t border-[#333333] pt-6 flex flex-col gap-3">
                      <div className="flex items-start gap-2 text-sm text-[#A7A7A7]">
                        <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                        <p>
                          Calls will be queued and made in sequence. You can monitor progress and results in the call history.
                        </p>
                      </div>
                    </CardFooter>
                  </Card>
                </TabsContent>
              </Tabs>
            </motion.div>

            <motion.div
              className="lg:col-span-1"
              initial="hidden"
              animate="visible"
              variants={fadeInUpVariant}
            >
              <Card className="h-fit max-h-3xl bg-[#1a1a1a] border border-[#333333]">
                <CardHeader className="border-b border-[#333333]">
                  <CardTitle className="flex items-center gap-2 text-[#F3FFD4]">
                    <CalendarClock className="h-5 w-5 text-[#A7B3AC]" />
                    Recent Calls
                  </CardTitle>
                  <CardDescription className="text-[#A7A7A7]">
                    View your latest call activities
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  {calls.length > 0 ? (
                    <ScrollArea className="h-[500px]">
                      <div className="divide-y">
                        {calls.map((call) => (
                          <div
                            key={call._id}
                            className="p-4 hover:bg-[#222222] transition-colors cursor-pointer"
                            onClick={() => setSelectedCall(call)}
                          >
                            <div className="flex items-start gap-3">
                              <Avatar className="h-10 w-10">
                                <AvatarFallback className="bg-[#A7B3AC]/10 text-[#A7B3AC]">
                                  {(call.contactName?.charAt(0) || 'U')}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start">
                                  <p className="font-medium text-sm text-[#F3FFD4]">{call.contactName || "Unknown"}</p>
                                  {getStatusBadge(call.status)}
                                </div>
                                <p className="text-sm text-[#A7A7A7] truncate">{call.phoneNumber}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <p className="text-xs text-[#A7A7A7]">
                                    {call.startTime ? format(new Date(call.startTime), "MMM d, h:mm a") : "Scheduled"}
                                  </p>
                                  {call.duration && (
                                    <>
                                      <span className="text-xs text-[#A7A7A7]">•</span>
                                      <p className="text-xs text-[#A7A7A7]">
                                        {Math.floor(call.duration / 60)}m {call.duration % 60}s
                                      </p>
                                    </>
                                  )}
                                </div>
                              </div>
                              <Dialog open={selectedCall?._id === call._id} onOpenChange={(open) => !open && setSelectedCall(null)}>
                                <DialogContent className="bg-[#1a1a1a] border-[#333333]">
                                  <DialogHeader>
                                    <DialogTitle>Call Details</DialogTitle>
                                    <DialogDescription>
                                      Complete information about this call
                                    </DialogDescription>
                                  </DialogHeader>
                                  {selectedCall && (
                                    <div className="space-y-4 py-2">
                                      <div className="flex items-center gap-4 pb-2">
                                        <Avatar className="h-14 w-14 bg-[#222222]">
                                          <AvatarFallback className="bg-primary/10 text-primary text-lg">
                                            {(selectedCall.contactName?.charAt(0) || 'U')}
                                          </AvatarFallback>
                                        </Avatar>
                                        <div>
                                          <h3 className="font-medium text-lg">{selectedCall.contactName || "Unknown"}</h3>
                                          <p className="text-muted-foreground">{selectedCall.phoneNumber}</p>
                                        </div>
                                      </div>

                                      <Separator className="bg-[#333333]" />

                                      <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                          <p className="text-xs text-muted-foreground">Status</p>
                                          <div>{getStatusBadge(selectedCall.status)}</div>
                                        </div>

                                        <div className="space-y-1">
                                          <p className="text-xs text-muted-foreground">Agent</p>
                                          <p className="font-medium text-sm">{selectedCall.agentName || "—"}</p>
                                        </div>

                                        <div className="space-y-1">
                                          <p className="text-xs text-muted-foreground">Start Time</p>
                                          <p className="text-sm">
                                            {selectedCall.startTime
                                              ? format(new Date(selectedCall.startTime), "MMM d, yyyy h:mm a")
                                              : "—"}
                                          </p>
                                        </div>

                                        <div className="space-y-1">
                                          <p className="text-xs text-muted-foreground">Duration</p>
                                          <p className="text-sm">
                                            {selectedCall.duration
                                              ? `${Math.floor(selectedCall.duration / 60)}m ${selectedCall.duration % 60}s`
                                              : "—"}
                                          </p>
                                        </div>

                                        <div className="space-y-1">
                                          <p className="text-xs text-muted-foreground">Cost</p>
                                          <p className="text-sm">₹{selectedCall.cost?.toFixed(2) || "0.00"}</p>
                                        </div>

                                        <div className="space-y-1">
                                          <p className="text-xs text-muted-foreground">Call Type</p>
                                          <p className="text-sm">{selectedCall.callType || "Standard"}</p>
                                        </div>
                                      </div>

                                      {selectedCall.notes && (
                                        <div className="space-y-1 pt-2">
                                          <p className="text-xs text-muted-foreground">Notes</p>
                                          <div className="p-3 bg-muted rounded-md text-sm">
                                            {selectedCall.notes}
                                          </div>
                                        </div>
                                      )}

                                      {selectedCall.transcription && (
                                        <div className="space-y-1 pt-2">
                                          <p className="text-xs text-muted-foreground">Transcription</p>
                                          <ScrollArea className="h-40">
                                            <div className="p-3 bg-muted rounded-md text-sm">
                                              {selectedCall.transcription}
                                            </div>
                                          </ScrollArea>
                                        </div>
                                      )}

                                      <div className="pt-4 flex gap-3 justify-end">
                                        <Button
                                          variant="outline"
                                          onClick={() => {
                                            if (selectedCall.agentId) {
                                              form.reset({
                                                agentId: selectedCall.agentId,
                                                phoneNumber: selectedCall.phoneNumber,
                                                contactName: selectedCall.contactName || "",
                                                customMessage: ""
                                              });
                                              setDialerValue(selectedCall.phoneNumber);
                                              setCallTab("dialer");
                                              setSelectedCall(null);
                                            }
                                          }}
                                        >
                                          <Phone className="h-4 w-4 mr-2" />
                                          Call Again
                                        </Button>
                                        <DialogClose>
                                          <Button variant="default">
                                            Close
                                          </Button>
                                        </DialogClose>
                                      </div>
                                    </div>
                                  )}
                                </DialogContent>
                              </Dialog>

                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full">
                                    <MoreHorizontal className="h-4 w-4 text-[#A7A7A7]" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => setSelectedCall(call)}>
                                    View Details
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => {
                                      if (call.agentId) {
                                        form.reset({
                                          agentId: call.agentId,
                                          phoneNumber: call.phoneNumber,
                                          contactName: call.contactName || "",
                                          customMessage: ""
                                        });
                                        setDialerValue(call.phoneNumber);
                                        setCallTab("dialer");
                                      }
                                    }}
                                  >
                                    Call Again
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  ) : (
                    <div className="p-8 text-center">
                      <div className="mx-auto w-16 h-16 mb-4 rounded-full bg-[#222222] flex items-center justify-center border border-[#333333]">
                        <PhoneCall className="h-8 w-8 text-[#A7A7A7]" />
                      </div>
                      <h3 className="text-lg font-medium mb-2 text-[#F3FFD4]">No Calls Yet</h3>
                      <p className="text-sm text-[#A7A7A7] mb-6">
                        Use the dialer or import contacts to start making AI voice calls
                      </p>
                      <Button variant="outline" onClick={() => setCallTab("dialer")} className="mx-auto border-[#333333] text-[#A7A7A7] hover:bg-[#333333] hover:text-[#F3FFD4]">
                        <Phone className="h-4 w-4 mr-2" />
                        Make Your First Call
                      </Button>
                    </div>
                  )}

                  <CardFooter className="p-4 border-t border-[#333333]">
                    <Link href="/dashboard/calls/history" className="w-full">
                      <Button variant="outline" className="w-full border-[#333333] text-[#A7A7A7] hover:bg-[#333333] hover:text-[#F3FFD4]">
                        <PhoneCall className="h-4 w-4 mr-2" />
                        View Full Call History
                      </Button>
                    </Link>
                  </CardFooter>
                </CardContent>
              </Card>
            </motion.div>
          </div>
          {/* Confirmation Dialog */}
          <Dialog
            open={showImportDialog}
            onOpenChange={(open) => {
              if (!open) {
                console.log("Dialog closed without action");
                setShowImportDialog(false);
                setImportSummary(null);
              }
            }}
          > 
            <DialogContent className="h-fit max-h-screen overflow-y-auto scrollbar-hidden">
              <DialogHeader>
                <DialogTitle>Contacts Imported Successfully</DialogTitle>
                <DialogDescription>
                  Choose how you'd like to handle these contacts
                </DialogDescription>
              </DialogHeader>

              {importSummary && (
                <div className="py-4">
                  <div className="flex items-center gap-2 mb-4">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <p className="text-lg font-medium">
                      Successfully imported {importSummary.created} contacts
                    </p>
                  </div>
 
                  <div className="p-4 bg-muted rounded-lg mb-4">
                    <p className="text-sm mb-2">
                      These contacts will use the agent:
                    </p>
                    <p className="font-medium">{importSummary.agentName}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                    <Card className="border-2 border-[#A7B3AC]/20">
                      <CardContent className="pt-6 pb-4">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="font-medium">Quick Call</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                              Start calling all contacts immediately
                            </p>
                          </div>
                          <div className="h-9 w-9 rounded-full bg-[#A7B3AC]/10 flex items-center justify-center">
                            <Phone className="h-5 w-5 text-[#A7B3AC]" />
                          </div>
                        </div>
                        <Button
                          className="w-full"
                          onClick={() => {
                            setShowImportDialog(false);
                            startCallingProcess();
                          }}
                        >
                          Start Calling Now
                        </Button>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="pt-6 pb-4">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="font-medium">Create Campaign</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                              Set up scheduling and advanced options
                            </p>
                          </div>
                          <div className="h-9 w-9 rounded-full bg-[#222222] flex items-center justify-center border border-[#333333]">
                            <LayoutGrid className="h-5 w-5 text-[#A7A7A7]" />
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => {
                            // Save data to localStorage to retrieve in campaign creation
                            localStorage.setItem('campaignContacts', JSON.stringify(importSummary.uploadedContacts));
                            localStorage.setItem('campaignAgentId', form.getValues("agentId"));
                            // Redirect to campaign creation
                            router.push('/dashboard/campaigns/new?from=import');
                            setShowImportDialog(false);
                          }}
                        >
                          Create Campaign
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}

              <DialogFooter className="flex justify-between gap-4">
                <DialogClose asChild>
                  <Button variant="outline">
                    Cancel
                  </Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          {/* Call Stats Section */}
          <motion.div
            className="mt-8"
            initial="hidden"
            animate="visible"
            variants={fadeInUpVariant}
          >
            <div className="flex justify-between items-center mb-4 text-[#F3FFD4]">
              <h2 className="text-xl font-bold">Call Analytics</h2>
              <Link href="/dashboard/analytics">
                <Button variant="ghost" size="sm" className="text-[#A7A7A7] hover:text-[#F3FFD4]">
                  View All <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6 text-[#F3FFD4]">
                  <div className="flex justify-between items-start mb-2">
                    <div className="space-y-1">
                      <p className="text-sm text-[#A7A7A7]">Total Calls</p>
                      <p className="text-3xl font-bold">{calls.length}</p>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-[#A7B3AC]/10 flex items-center justify-center">
                      <PhoneCall className="h-5 w-5 text-[#A7B3AC]" />
                    </div>
                  </div>

                  <div className="mt-4">
                    <Progress value={75} className="h-1" />
                    <p className="text-xs text-[#A7A7A7] mt-2">
                      75% of monthly quota used
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6 text-[#F3FFD4]">
                  <div className="flex justify-between items-start mb-2">
                    <div className="space-y-1">
                      <p className="text-sm text-[#A7A7A7]">Success Rate</p>
                      <p className="text-3xl font-bold">
                        {calls.length > 0
                          ? Math.round((calls.filter(c => c.status === 'completed').length / calls.length) * 100)
                          : 0}%
                      </p>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-success/10 flex items-center justify-center">
                      <CheckCircle className="h-5 w-5 text-success" />
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="flex items-center justify-between text-xs text-[#A7A7A7]">
                      <span>Completed</span>
                      <span>{calls.filter(c => c.status === 'completed').length} calls</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6 text-[#F3FFD4]">
                  <div className="flex justify-between items-start mb-2">
                    <div className="space-y-1">
                      <p className="text-sm text-[#A7A7A7]">Avg. Duration</p>
                      <p className="text-3xl font-bold">
                        {calls.length > 0 && calls.some(c => c.duration)
                          ? Math.round(calls.reduce((sum, call) => sum + (call.duration || 0), 0) /
                            calls.filter(c => c.duration).length / 60)
                          : 0}m
                      </p>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-[#A7B3AC]/10 flex items-center justify-center">
                      <Clock className="h-5 w-5 text-[#A7B3AC]" />
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="flex items-center justify-between text-xs text-[#A7A7A7]">
                      <span>Last 7 days</span>
                      <span>{calls.filter(c => c.startTime && new Date(c.startTime) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length} calls</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6 text-[#F3FFD4]">
                  <div className="flex justify-between items-start mb-2">
                    <div className="space-y-1">
                      <p className="text-sm text-[#A7A7A7]">Active Now</p>
                      <p className="text-3xl font-bold">
                        {calls.filter(c => c.status === 'in-progress').length}
                      </p>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-warning/10 flex items-center justify-center">
                      <Mic className="h-5 w-5 text-warning" />
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="flex items-center justify-between text-xs text-[#A7A7A7]">
                      <span>Queued calls</span>
                      <span>{calls.filter(c => c.status === 'queued').length}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        </div>
      </main>
        </div>
    );
}