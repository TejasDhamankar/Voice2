"use client";

import { useState, useEffect, useRef, JSX } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { DateRange } from "react-day-picker";

// UI Components
import { DashboardHeader } from "@/components/dashboard/header";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious, PaginationEllipsis } from "@/components/ui/pagination";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";

// Icons
import {
  ArrowDownToLine, Phone, Search, X, MoreHorizontal, PlayCircle, Bot, User, ThumbsUp, ThumbsDown, Pause, Volume2, Volume1,
  VolumeX as VolumeMute, RotateCcw, RotateCw, Sparkles, BadgeCheck, BadgeMinus, BadgeX, TimerReset, Info, PhoneOff, Loader2, AlertCircle,
  CheckCircle,
  XCircle,
  Clock
} from "lucide-react";

type Call = {
    _id: string;
    contactName: string;
    phoneNumber: string;
    status: 'completed' | 'failed' | 'in-progress' | 'queued' | 'initiated' | 'no-answer';
    startTime?: string;
    endTime?: string;
    duration?: number;
    agentId: string;
    agentName?: string;
    transcription?: string;
    summary?: string;
    notes?: string;
    cost?: number;
    callType?: string;
    createdAt: string;
    elevenLabsCallId?: string;
    conversationId?: string;
    outcome?: string;
  };
const outcomeTypes: { [key: string]: { icon: JSX.Element; label: string; color: string } } = {
  highly_interested: { icon: <Sparkles className="h-3 w-3 mr-1" />, label: "Highly Interested", color: "bg-green-500/10 text-green-400 border-green-500/20" },
  appointment_scheduled: { icon: <BadgeCheck className="h-3 w-3 mr-1" />, label: "Appointment Set", color: "bg-green-500/10 text-green-400 border-green-500/20" },
  needs_follow_up: { icon: <RotateCw className="h-3 w-3 mr-1" />, label: "Needs Follow-up", color: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" },
  not_interested: { icon: <ThumbsDown className="h-3 w-3 mr-1" />, label: "Not Interested", color: "bg-red-500/10 text-red-400 border-red-500/20" },
  do_not_call: { icon: <PhoneOff className="h-3 w-3 mr-1" />, label: "Do Not Call", color: "bg-red-500/10 text-red-400 border-red-500/20" },
  neutral: { icon: <BadgeMinus className="h-3 w-3 mr-1" />, label: "Neutral", color: "bg-gray-500/10 text-gray-400 border-gray-500/20" },
  unqualified: { icon: <BadgeX className="h-3 w-3 mr-1" />, label: "Unqualified", color: "bg-red-500/10 text-red-400 border-red-500/20" },
  call_back_later: { icon: <TimerReset className="h-3 w-3 mr-1" />, label: "Call Back Later", color: "bg-blue-500/10 text-blue-400 border-blue-500/20" }
};

export default function CallHistoryPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [calls, setCalls] = useState<Call[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<string | null>(null);
    const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
    const [selectedCall, setSelectedCall] = useState<Call | null>(null);
    const [isExporting, setIsExporting] = useState(false);
    const [isDetailsLoading, setIsDetailsLoading] = useState(false);

    const [isPlaying, setIsPlaying] = useState(false);
    const [audioTime, setAudioTime] = useState(0);
    const [audioDuration, setAudioDuration] = useState(0);
    const [audioVolume, setAudioVolume] = useState(0.8);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [isAudioLoading, setIsAudioLoading] = useState(false);
    const [audioError, setAudioError] = useState<string | null>(null);
    
    const getStatusBadge = (status: string) => {
        switch (status) {
          case "completed":
            return (<Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/20"><CheckCircle className="h-3 w-3 mr-1" /> Completed</Badge>);
          case "failed":
            return (<Badge variant="outline" className="bg-red-500/10 text-red-400 border-red-500/20"><XCircle className="h-3 w-3 mr-1" /> Failed</Badge>);
          case "in-progress":
            return (<Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20"><PlayCircle className="h-3 w-3 mr-1 animate-pulse" /> In Progress</Badge>);
          case "queued":
            return (<Badge variant="outline" className="bg-yellow-500/10 text-yellow-400 border-yellow-500/20"><Clock className="h-3 w-3 mr-1" /> Queued</Badge>);
          case "initiated":
            return (<Badge variant="outline" className="bg-gray-500/10 text-gray-400 border-gray-500/20"><Loader2 className="h-3 w-3 mr-1 animate-spin" /> Initiated</Badge>);
          case "no-answer":
            return (<Badge variant="outline" className="bg-gray-500/10 text-gray-400 border-gray-500/20"><AlertCircle className="h-3 w-3 mr-1" /> No Answer</Badge>);
          default:
            return (<Badge variant="outline">{status}</Badge>);
        }
    };

    useEffect(() => {
        fetchCalls();
    }, [currentPage, searchTerm, statusFilter, dateRange]);

    useEffect(() => {
        const audioElement = audioRef.current;
        if (!audioElement) return;

        // Reset states for the new call
        setIsPlaying(false);
        setIsAudioLoading(false);
        setAudioError(null);
        setAudioTime(0);
        setAudioDuration(0);
        if (audioElement.src) {
            audioElement.src = '';
        }

        // Polling logic for audio
        if (selectedCall?.conversationId && (selectedCall.status === 'completed' || selectedCall.status === 'in-progress')) {
            const audioUrl = `/api/calls/audio/${selectedCall.conversationId}`;
            let attempts = 0;
            const maxAttempts = 10;
            setIsAudioLoading(true);

            const pollForAudio = setInterval(async () => {
                attempts++;
                try {
                    const response = await fetch(audioUrl, { method: 'HEAD' });
                    if (response.ok) {
                        clearInterval(pollForAudio);
                        audioElement.src = audioUrl;
                        setIsAudioLoading(false);
                    } else if (attempts >= maxAttempts) {
                        clearInterval(pollForAudio);
                        setAudioError("Audio recording is not yet available. It may still be processing.");
                        setIsAudioLoading(false);
                    }
                } catch (err) {
                    clearInterval(pollForAudio);
                    setAudioError("An error occurred while loading the audio.");
                    setIsAudioLoading(false);
                }
            }, 2000); // Check every 2 seconds
        }

        const onTimeUpdate = () => setAudioTime(audioElement.currentTime);
        const onLoadedMetadata = () => setAudioDuration(audioElement.duration);
        const onEnded = () => setIsPlaying(false);
        audioElement.addEventListener('timeupdate', onTimeUpdate);
        audioElement.addEventListener('loadedmetadata', onLoadedMetadata);
        audioElement.addEventListener('ended', onEnded);

        return () => {
            audioElement.removeEventListener('timeupdate', onTimeUpdate);
            audioElement.removeEventListener('loadedmetadata', onLoadedMetadata);
            audioElement.removeEventListener('ended', onEnded);
        };
    }, [selectedCall]);

    const fetchCalls = async () => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams({ page: currentPage.toString(), limit: '20' });
            if (searchTerm) params.append('search', searchTerm);
            if (statusFilter) params.append('status', statusFilter);
            if (dateRange?.from) params.append('startDate', dateRange.from.toISOString());
            if (dateRange?.to) params.append('endDate', dateRange.to.toISOString());

            const response = await fetch(`/api/calls/history?${params.toString()}`);
            if (!response.ok) throw new Error("Failed to fetch call history.");

            const data = await response.json();
            setCalls(data.calls);
            setTotalPages(data.pagination.pages);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };
    
    const handleViewDetails = async (call: Call) => {
        setSelectedCall(call);
    
        // This logic remains the same: only fetch if needed
        if (call.conversationId && !call.summary && call.status === 'completed') {
            setIsDetailsLoading(true);
            try {
                // ✅ THIS LINE IS THE FIX
                // It now calls the new URL with the correct ID
                const response = await fetch(`/api/calls/details/${call.conversationId}`);
                
                if (!response.ok) {
                    throw new Error('Could not fetch call details.');
                }
                const details = await response.json();
                
                const formattedDetails = {
                    ...details,
                    transcription: details.messages 
                        ? details.messages.map((m: any) => `${m.role}: ${m.text}`).join('\n') 
                        : (details.transcription || '')
                };
    
                const updatedCallData = { ...call, ...formattedDetails };
                
                setSelectedCall(updatedCallData);
                setCalls(prevCalls => prevCalls.map(c => 
                    c._id === call._id ? updatedCallData : c
                ));
            } catch (error) {
                console.error("Failed to fetch details:", error);
            } finally {
                setIsDetailsLoading(false);
            }
        }
    };

    const handleExportCalls = async () => {
        setIsExporting(true);
        try {
            const params = new URLSearchParams();
            if (searchTerm) params.append('search', searchTerm);
            if (statusFilter) params.append('status', statusFilter);
            if (dateRange?.from) params.append('startDate', dateRange.from.toISOString());
            if (dateRange?.to) params.append('endDate', dateRange.to.toISOString());

            const response = await fetch(`/api/calls/export?${params.toString()}`);
            if (!response.ok) throw new Error("Failed to export calls.");

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `call_history_${format(new Date(), "yyyy-MM-dd")}.csv`;
            document.body.appendChild(a);
            a.click();
            a.remove();
        } catch (error: any) {
            alert("Export failed: " + error.message);
        } finally {
            setIsExporting(false);
        }
    };

    const clearFilters = () => {
        setSearchTerm("");
        setStatusFilter(null);
        setDateRange(undefined);
    };

    const getOutcomeBadge = (outcome?: string) => {
        if (!outcome) return <Badge variant="outline" className="border-transparent text-[#A7A7A7]">-</Badge>;
        const normalized = outcome.toLowerCase().replace(/\s+/g, '_');
        const config = outcomeTypes[normalized];
        if (config) {
            return <Badge className={cn("capitalize font-normal", config.color)}>{config.icon} {config.label}</Badge>;
        }
        return <Badge variant="secondary" className="font-normal">{outcome}</Badge>;
    };

    const togglePlayPause = () => setIsPlaying(!isPlaying);
    const handleTimeChange = (value: number[]) => { if (audioRef.current) audioRef.current.currentTime = value[0]; };
    const handleVolumeChange = (value: number[]) => setAudioVolume(value[0]);
    const handleRewind = () => { if (audioRef.current) audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 10); };
    const handleForward = () => { if (audioRef.current) audioRef.current.currentTime = Math.min(audioDuration, audioRef.current.currentTime + 10); };
    const formatTime = (seconds: number) => {
        if (isNaN(seconds) || seconds === Infinity) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    const fadeInUpVariant = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

    return (
        <div className="min-h-screen text-foreground flex bg-[#111111]">    
            <main className="flex-1 overflow-y-auto h-fit max-h-screen">
                <DashboardHeader />
                <div className="container mx-auto px-4 sm:px-6 py-8">
                    <motion.div initial="hidden" animate="visible" variants={fadeInUpVariant} className="mb-8">
                        <div className="flex flex-wrap justify-between items-center gap-4">
                            <div>
                                <h1 className="text-2xl sm:text-3xl font-bold text-[#F3FFD4]">Call History</h1>
                                <p className="text-[#A7A7A7] mt-1">Complete record of all AI voice calls</p>
                            </div>
                            <div className="flex flex-wrap gap-3">
                                <Button variant="outline" onClick={handleExportCalls} disabled={isExporting} className="gap-2">
                                    {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowDownToLine className="h-4 w-4" />}
                                    Export
                                </Button>
                                <Button onClick={() => router.push('/dashboard/calls')} className="gap-2">
                                    <Phone className="h-4 w-4" /> New Call
                                </Button>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div initial="hidden" animate="visible" variants={fadeInUpVariant} className="mb-6">
                        <Card className="p-4 bg-[#1a1a1a] border-[#333333]">
                            <div className="flex flex-wrap gap-4 items-center">
                                <div className="relative flex-1 min-w-[240px]">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#A7A7A7]" />
                                    <Input placeholder="Search by contact or phone..." className="pl-10" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                                </div>
                                <Select value={statusFilter || "All"} onValueChange={val => setStatusFilter(val === 'All' ? null : val)}>
                                    <SelectTrigger className="w-[180px]"><SelectValue placeholder="Filter by status" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="All">All Statuses</SelectItem>
                                        <SelectItem value="completed">Completed</SelectItem>
                                        <SelectItem value="in-progress">In Progress</SelectItem>
                                        <SelectItem value="failed">Failed</SelectItem>
                                        <SelectItem value="queued">Queued</SelectItem>
                                        <SelectItem value="no-answer">No Answer</SelectItem>
                                    </SelectContent>
                                </Select>
                                <div className="flex-shrink-0"><DateRangePicker value={dateRange} onChange={setDateRange} /></div>
                                {(searchTerm || statusFilter || dateRange?.from) && (<Button variant="ghost" size="sm" onClick={clearFilters} className="h-10"><X className="h-4 w-4 mr-2" /> Clear Filters</Button>)}
                            </div>
                        </Card>
                    </motion.div>

                    <motion.div initial="hidden" animate="visible" variants={fadeInUpVariant}>
                        <Card className="bg-[#1a1a1a] border-[#333333]">
                            {loading ? (
                                <CardContent className="p-6">{[...Array(5)].map((_, i) => (<div key={i} className="flex gap-4 items-center py-4 border-b border-[#333333] last:border-0"><Skeleton className="h-10 w-10 rounded-full bg-[#333333]" /><div className="space-y-2 flex-1"><Skeleton className="h-5 w-1/3 bg-[#333333]" /><Skeleton className="h-4 w-1/4 bg-[#333333]" /></div><Skeleton className="h-6 w-24 bg-[#333333] rounded-md" /><Skeleton className="h-6 w-28 bg-[#333333] rounded-md hidden lg:block" /></div>))}</CardContent>
                            ) : error ? (
                                <CardContent className="p-6 text-center py-12"><AlertCircle className="mx-auto h-8 w-8 text-red-500 mb-2" /> <p className="text-red-400">Error: {error}</p></CardContent>
                            ) : calls.length === 0 ? (
                                <CardContent className="p-6 text-center py-12"><PhoneOff className="mx-auto h-10 w-10 text-[#A7A7A7] mb-3" /> <h3 className="text-xl font-medium text-[#F3FFD4] mb-1">No Calls Found</h3><p className="text-[#A7A7A7]">Try adjusting your filters or make a new call.</p></CardContent>
                            ) : (
                                <>
                                    <Table>
                                        <TableHeader><TableRow className="border-b-[#333333] hover:bg-transparent"><TableHead className="text-[#A7A7A7]">Contact</TableHead><TableHead className="text-[#A7A7A7]">Status</TableHead><TableHead className="text-[#A7A7A7] hidden lg:table-cell">Outcome</TableHead><TableHead className="text-[#A7A7A7] hidden md:table-cell">Agent</TableHead><TableHead className="text-[#A7A7A7] hidden lg:table-cell">Date</TableHead><TableHead className="text-right text-[#A7A7A7]">Actions</TableHead></TableRow></TableHeader>
                                        <TableBody>
                                            {calls.map(call => (
                                                <TableRow key={call._id} className="border-b-[#333333] cursor-pointer hover:bg-[#222222]" onClick={() => handleViewDetails(call)}>
                                                    <TableCell><div className="font-medium text-[#F3FFD4]">{call.contactName}</div><div className="text-xs text-[#A7A7A7]">{call.phoneNumber}</div></TableCell>
                                                    <TableCell>{getStatusBadge(call.status)}</TableCell>
                                                    <TableCell className="hidden lg:table-cell">{getOutcomeBadge(call.outcome)}</TableCell>
                                                    <TableCell className="hidden md:table-cell text-[#A7A7A7]">{call.agentName || "-"}</TableCell>
                                                    <TableCell className="hidden lg:table-cell text-[#A7A7A7]">{call.startTime ? format(new Date(call.startTime), "MMM d, h:mm a") : "-"}</TableCell>
                                                    <TableCell className="text-right">
                                                        <DropdownMenu><DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}><Button variant="ghost" size="icon" className="h-8 w-8 text-[#A7A7A7] hover:bg-[#333333]"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onClick={() => handleViewDetails(call)}><Info className="h-4 w-4 mr-2" />View Details</DropdownMenuItem><DropdownMenuItem onClick={e => { e.stopPropagation(); router.push(`/dashboard/calls/new?phone=${call.phoneNumber}&name=${encodeURIComponent(call.contactName || 'Unknown')}&agent=${call.agentId}`); }}><Phone className="h-4 w-4 mr-2" />Call Again</DropdownMenuItem></DropdownMenuContent></DropdownMenu>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                    {totalPages > 1 && (<div className="py-4 border-t border-[#333333]"><Pagination><PaginationContent>{/* ... Pagination JSX ... */}</PaginationContent></Pagination></div>)}
                                </>
                            )}
                        </Card>
                    </motion.div>
                </div>
            </main>
            <Dialog open={!!selectedCall} onOpenChange={(open) => { if (!open) setSelectedCall(null); }}>
                <DialogContent className="sm:max-w-[600px] h-fit max-h-[90vh] overflow-y-auto bg-[#1a1a1a] border-[#333333]">
                    <DialogHeader>
                        <DialogTitle className="text-[#F3FFD4]">Call Details</DialogTitle>
                        <DialogDescription className="text-[#A7A7A7]">Complete information about this call</DialogDescription>
                    </DialogHeader>
                    {isDetailsLoading ? (
                        <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 text-[#A7B3AC] animate-spin" /><p className="ml-4 text-[#A7A7A7]">Fetching latest call details...</p></div>
                    ) : selectedCall && (
                        <div className="space-y-6 py-2 text-[#F3FFD4]">
                            <div className="flex items-center gap-4 pb-2"><Avatar className="h-14 w-14"><AvatarFallback className="bg-[#A7B3AC]/10 text-[#A7B3AC] text-lg">{(selectedCall.contactName?.charAt(0) || 'U')}</AvatarFallback></Avatar><div><h3 className="font-medium text-lg">{selectedCall.contactName}</h3><p className="text-[#A7A7A7]">{selectedCall.phoneNumber}</p></div><div className="ml-auto">{getStatusBadge(selectedCall.status)}</div></div>
                            {selectedCall.outcome && (<Card className="bg-[#222222] border-[#333333]"><CardContent className="pt-6"><div className="flex items-center justify-between"><div className="space-y-1"><p className="text-sm text-[#A7A7A7]">Call Outcome</p><div>{getOutcomeBadge(selectedCall.outcome)}</div></div></div></CardContent></Card>)}
                            <Separator className="bg-[#333333]" />
                            <div className="grid grid-cols-2 gap-4 text-sm"><div className="space-y-1"><p className="text-xs text-[#A7A7A7]">Agent</p><p className="font-medium">{selectedCall.agentName || "—"}</p></div><div className="space-y-1"><p className="text-xs text-[#A7A7A7]">Call Type</p><p>{selectedCall.callType || "Standard"}</p></div><div className="space-y-1"><p className="text-xs text-[#A7A7A7]">Start Time</p><p>{selectedCall.startTime ? format(new Date(selectedCall.startTime), "MMM d, yyyy h:mm a") : "—"}</p></div><div className="space-y-1"><p className="text-xs text-[#A7A7A7]">End Time</p><p>{selectedCall.endTime ? format(new Date(selectedCall.endTime), "MMM d, yyyy h:mm a") : "—"}</p></div><div className="space-y-1"><p className="text-xs text-[#A7A7A7]">Duration</p><p>{selectedCall.duration ? `${Math.floor(selectedCall.duration / 60)}m ${selectedCall.duration % 60}s` : "—"}</p></div></div>
                            {selectedCall.notes && (<div className="space-y-1 pt-2"><p className="text-xs text-[#A7A7A7]">Notes</p><div className="p-3 bg-[#222222] rounded-md text-sm border border-[#333333]">{selectedCall.notes}</div></div>)}
                            <Tabs defaultValue="transcript" className="space-y-4">
                                <TabsList className="w-full grid grid-cols-3 bg-[#222222] border-[#333333]"><TabsTrigger value="transcript">Transcript</TabsTrigger><TabsTrigger value="summary">Summary</TabsTrigger><TabsTrigger value="recording">Recording</TabsTrigger></TabsList>
                                <TabsContent value="transcript">{selectedCall.transcription ? (<ScrollArea className="h-[240px]"><div className="p-3 bg-[#222222] rounded-md space-y-4 border border-[#333333]">{selectedCall.transcription.split('\n').filter(Boolean).map((segment, index) => { const isAgent = segment.startsWith('agent:'); return (<div key={index} className={cn("flex gap-3", isAgent ? "justify-start" : "justify-end")}>{isAgent && (<div className="h-8 w-8 rounded-full bg-[#A7B3AC]/10 flex items-center justify-center flex-shrink-0"><Bot className="h-4 w-4 text-[#A7B3AC]" /></div>)}<div className={cn("rounded-2xl px-4 py-2 text-sm max-w-[80%]", isAgent ? "bg-[#333333] rounded-tl-none" : "bg-[#A7B3AC] text-[#111111] rounded-tr-none")}><p>{segment.replace(/user:|agent:/, '').trim()}</p></div>{!isAgent && (<div className="h-8 w-8 rounded-full bg-gray-500/10 flex items-center justify-center flex-shrink-0"><User className="h-4 w-4 text-gray-400" /></div>)}</div>); })}</div></ScrollArea>) : (<p className="text-[#A7A7A7] text-sm text-center py-4">Transcript not available.</p>)}</TabsContent>
                                <TabsContent value="summary">{selectedCall.summary ? (<div className="p-3 bg-[#222222] rounded-md text-sm whitespace-pre-wrap border border-[#333333]">{selectedCall.summary}</div>) : (<p className="text-[#A7A7A7] text-sm text-center py-4">Summary not available.</p>)}</TabsContent>
                                <TabsContent value="recording">
                                    {isAudioLoading ? (
                                        <div className="flex flex-col items-center justify-center py-8 bg-[#222222] rounded-md border border-[#333333]"><Loader2 className="h-10 w-10 text-[#A7B3AC] animate-spin mb-3" /><p className="text-[#A7A7A7] text-sm">Loading audio recording...</p></div>
                                    ) : audioError ? (
                                        <div className="flex flex-col items-center justify-center py-8 bg-[#222222] rounded-md border border-[#333333]"><AlertCircle className="h-10 w-10 text-yellow-500 mb-3" /><p className="text-yellow-400 text-sm">{audioError}</p></div>
                                    ) : selectedCall.conversationId ? (
                                        <div className="space-y-4"><audio ref={audioRef} preload="metadata" className="hidden" /><div className="bg-[#222222] rounded-lg p-4 space-y-4 border border-[#333333]"><div className="flex items-center justify-between"><div className="text-sm font-medium">{formatTime(audioTime)} / {formatTime(audioDuration)}</div></div><Slider value={[audioTime]} max={audioDuration || 100} step={0.1} onValueChange={handleTimeChange} /><div className="flex items-center justify-center gap-2 py-2"><Button variant="ghost" size="icon" onClick={handleRewind}><RotateCcw className="h-4 w-4" /></Button><Button variant="outline" size="icon" className="h-12 w-12 rounded-full" onClick={togglePlayPause}>{isPlaying ? <Pause className="h-6 w-6" /> : <PlayCircle className="h-6 w-6" />}</Button><Button variant="ghost" size="icon" onClick={handleForward}><RotateCw className="h-4 w-4" /></Button></div></div></div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-8 bg-[#222222] rounded-md border border-[#333333]"><VolumeMute className="h-10 w-10 text-[#A7A7A7] mb-2" /><p className="text-[#A7A7A7] text-sm">Audio recording not available.</p></div>
                                    )}
                                </TabsContent>
                            </Tabs>
                            <DialogFooter className="flex flex-wrap gap-3 sm:gap-2 pt-4">
                                <Button variant="outline" onClick={() => { router.push(`/dashboard/calls/new?phone=${selectedCall.phoneNumber}&name=${encodeURIComponent(selectedCall.contactName || 'Unknown')}&agent=${selectedCall.agentId}`); setSelectedCall(null); }}><Phone className="h-4 w-4 mr-2" />Call Again</Button>
                                <DialogClose asChild><Button onClick={() => setSelectedCall(null)}>Close</Button></DialogClose>
                            </DialogFooter>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}