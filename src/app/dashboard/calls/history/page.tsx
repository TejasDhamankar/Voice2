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

// --- Base URL for API calls ---
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';

type Call = {
    _id: string;
    contactName: string;
    phoneNumber: string;
    status: 'completed' | 'failed' | 'in-progress' | 'queued' | 'initiated' | 'no-answer' | 'ringing' | 'connected' | 'ended' | 'busy' | 'canceled';
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
    
    const getStatusBadge = (status: Call['status']) => {
      switch (status) {
          case "completed": case "ended": return (<Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/20"><CheckCircle className="h-3 w-3 mr-1" /> Completed</Badge>);
          case "failed": return (<Badge variant="outline" className="bg-red-500/10 text-red-400 border-red-500/20"><XCircle className="h-3 w-3 mr-1" /> Failed</Badge>);
          case "in-progress": case "connected": return (<Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20"><PlayCircle className="h-3 w-3 mr-1 animate-pulse" /> In Progress</Badge>);
          case "queued": return (<Badge variant="outline" className="bg-yellow-500/10 text-yellow-400 border-yellow-500/20"><Clock className="h-3 w-3 mr-1" /> Queued</Badge>);
          case "initiated": case "ringing": return (<Badge variant="outline" className="bg-gray-500/10 text-gray-400 border-gray-500/20"><Loader2 className="h-3 w-3 mr-1 animate-spin" /> Ringing</Badge>);
          case "no-answer": return (<Badge variant="outline" className="bg-gray-500/10 text-gray-400 border-gray-500/20"><AlertCircle className="h-3 w-3 mr-1" /> No Answer</Badge>);
          default: return (<Badge variant="outline" className="capitalize">{status}</Badge>);
      }
    };

    useEffect(() => {
        if(user) {
            fetchCalls();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, currentPage, searchTerm, statusFilter, dateRange]);

    useEffect(() => {
        const audioElement = audioRef.current;
        if (!audioElement) return;

        audioElement.volume = audioVolume;
    }, [audioVolume]);

     useEffect(() => {
        const audioElement = audioRef.current;
        if(isPlaying) {
            audioElement?.play().catch(e => console.error("Audio play error:", e));
        } else {
            audioElement?.pause();
        }
     }, [isPlaying]);

    useEffect(() => {
        const audioElement = new Audio();
        audioRef.current = audioElement;

        const onTimeUpdate = () => setAudioTime(audioElement.currentTime);
        const onLoadedMetadata = () => setAudioDuration(audioElement.duration);
        const onPlay = () => setIsPlaying(true);
        const onPause = () => setIsPlaying(false);
        const onEnded = () => setIsPlaying(false);
        
        audioElement.addEventListener('timeupdate', onTimeUpdate);
        audioElement.addEventListener('loadedmetadata', onLoadedMetadata);
        audioElement.addEventListener('play', onPlay);
        audioElement.addEventListener('pause', onPause);
        audioElement.addEventListener('ended', onEnded);

        return () => {
            audioElement.removeEventListener('timeupdate', onTimeUpdate);
            audioElement.removeEventListener('loadedmetadata', onLoadedMetadata);
            audioElement.removeEventListener('play', onPlay);
            audioElement.removeEventListener('pause', onPause);
            audioElement.removeEventListener('ended', onEnded);
            audioElement.pause();
            audioElement.src = '';
        };
    }, []);

    const fetchCalls = async () => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams({ page: currentPage.toString(), limit: '20' });
            if (searchTerm) params.append('search', searchTerm);
            if (statusFilter) params.append('status', statusFilter);
            if (dateRange?.from) params.append('startDate', dateRange.from.toISOString());
            if (dateRange?.to) params.append('endDate', dateRange.to.toISOString());

            const response = await fetch(`${API_BASE_URL}/api/calls/history?${params.toString()}`);
            if (!response.ok) throw new Error("Failed to fetch call history.");

            const data = await response.json();
            setCalls(data.calls);
            setTotalPages(data.pagination.totalPages); // Assuming backend returns totalPages
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };
    
    const handleViewDetails = async (call: Call) => {
        setSelectedCall(call);
        setAudioError(null);
        setIsAudioLoading(false);
        
        const audioElement = audioRef.current;
        if(audioElement) {
           audioElement.pause();
           audioElement.src = '';
           setAudioTime(0);
           setAudioDuration(0);
        }
    
        if (call.conversationId && !call.summary && call.status === 'completed') {
            setIsDetailsLoading(true);
            try {
                const response = await fetch(`${API_BASE_URL}/api/calls/details/${call.conversationId}`);
                
                if (!response.ok) {
                    throw new Error('Could not fetch latest call details.');
                }
                const details = await response.json();
                
                const formattedDetails = {
                    ...details,
                    transcription: details.messages 
                        ? details.messages.map((m: any) => `${m.role}: ${m.text}`).join('\n') 
                        : (details.transcription || ''),
                    outcome: details.outcome || call.outcome,
                    summary: details.summary || call.summary
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
    
    // This effect handles loading the audio source when a call is selected
    useEffect(() => {
        if (selectedCall?.conversationId && (selectedCall.status === 'completed' || selectedCall.status === 'in-progress' || selectedCall.status === 'ended')) {
            const audioUrl = `${API_BASE_URL}/api/calls/audio/${selectedCall.conversationId}`;
            const audioElement = audioRef.current;
            
            if (audioElement && audioElement.src !== audioUrl) {
                setIsAudioLoading(true);
                setAudioError(null);

                // Polling for audio availability
                let attempts = 0;
                const maxAttempts = 15; // Poll for 30 seconds
                const pollForAudio = setInterval(async () => {
                    attempts++;
                    try {
                        const response = await fetch(audioUrl, { method: 'HEAD' });
                        if (response.ok && response.status === 200) { // Check for 200 OK
                            clearInterval(pollForAudio);
                            if(audioRef.current) {
                                audioRef.current.src = audioUrl;
                                setIsAudioLoading(false);
                            }
                        } else if (attempts >= maxAttempts) {
                            clearInterval(pollForAudio);
                            setAudioError("Audio recording not available. Please try again later.");
                            setIsAudioLoading(false);
                        }
                    } catch (err) {
                        clearInterval(pollForAudio);
                        setAudioError("Error loading audio.");
                        setIsAudioLoading(false);
                        console.error("Audio polling error:", err);
                    }
                }, 2000);
            }
        }
    }, [selectedCall]);


    const handleExportCalls = async () => {
        setIsExporting(true);
        try {
            const params = new URLSearchParams();
            if (searchTerm) params.append('search', searchTerm);
            if (statusFilter) params.append('status', statusFilter);
            if (dateRange?.from) params.append('startDate', dateRange.from.toISOString());
            if (dateRange?.to) params.append('endDate', dateRange.to.toISOString());

            const response = await fetch(`${API_BASE_URL}/api/calls/export?${params.toString()}`);
            if (!response.ok) throw new Error("Failed to export calls.");

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `call_history_${format(new Date(), "yyyy-MM-dd")}.csv`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
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
        setCurrentPage(1); // Reset to first page
    };

    const getOutcomeBadge = (outcome?: string) => {
        if (!outcome) return <Badge variant="outline" className="border-transparent text-[#A7A7A7]">-</Badge>;
        const normalized = outcome.toLowerCase().replace(/\s+/g, '_');
        const config = outcomeTypes[normalized];
        if (config) {
            return <Badge className={cn("capitalize font-normal text-xs", config.color)}>{config.icon} {config.label}</Badge>;
        }
        return <Badge variant="secondary" className="font-normal capitalize">{outcome}</Badge>;
    };

    // --- Audio player controls ---
    const togglePlayPause = () => setIsPlaying(!isPlaying);
    const handleTimeChange = (value: number[]) => { if (audioRef.current) audioRef.current.currentTime = value[0]; };
    const handleVolumeChange = (value: number[]) => { if(audioRef.current) audioRef.current.volume = value[0]; setAudioVolume(value[0]);};
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
            <main className="flex-1 overflow-y-auto h-screen">
                <DashboardHeader />
                <div className="container mx-auto px-4 sm:px-6 py-8">
                    {/* ... (Header, Filters remain the same) ... */}
                    {/* Table and Modal */}
                    <motion.div initial="hidden" animate="visible" variants={fadeInUpVariant}>
                        <Card className="bg-[#1a1a1a] border-[#333333]">
                            {loading ? (
                                <CardContent className="p-6">{[...Array(10)].map((_, i) => (<div key={i} className="flex gap-4 items-center py-4 border-b border-[#333333] last:border-0"><Skeleton className="h-10 w-10 rounded-full bg-[#333333]" /><div className="space-y-2 flex-1"><Skeleton className="h-5 w-1/3 bg-[#333333]" /><Skeleton className="h-4 w-1/4 bg-[#333333]" /></div><Skeleton className="h-6 w-24 bg-[#333333] rounded-md" /><Skeleton className="h-6 w-28 bg-[#333333] rounded-md hidden lg:block" /></div>))}</CardContent>
                            ) : error ? (
                                <CardContent className="p-6 text-center py-12"><AlertCircle className="mx-auto h-8 w-8 text-red-500 mb-2" /> <p className="text-red-400">Error: {error}</p></CardContent>
                            ) : calls.length === 0 ? (
                                <CardContent className="p-6 text-center py-12"><PhoneOff className="mx-auto h-10 w-10 text-[#A7A7A7] mb-3" /> <h3 className="text-xl font-medium text-[#F3FFD4] mb-1">No Calls Found</h3><p className="text-[#A7A7A7]">Try adjusting filters or make a new call.</p></CardContent>
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
                                                        <DropdownMenu><DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}><Button variant="ghost" size="icon" className="h-8 w-8 text-[#A7A7A7] hover:bg-[#333333]"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end" className="bg-[#1a1a1a] border-[#333]"><DropdownMenuItem onClick={() => handleViewDetails(call)}><Info className="h-4 w-4 mr-2" />View Details</DropdownMenuItem><DropdownMenuItem onClick={e => { e.stopPropagation(); router.push(`/dashboard/calls?phone=${call.phoneNumber}&name=${encodeURIComponent(call.contactName || 'Unknown')}&agent=${call.agentId}`); }}><Phone className="h-4 w-4 mr-2" />Call Again</DropdownMenuItem></DropdownMenuContent></DropdownMenu>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                    {totalPages > 1 && (<div className="p-4 border-t border-[#333333]">
                                        <Pagination>
                                            <PaginationContent>
                                                <PaginationItem><PaginationPrevious href="#" onClick={(e) => { e.preventDefault(); setCurrentPage(p => Math.max(1, p - 1)); }} /></PaginationItem>
                                                {/* Add page number logic here */}
                                                <PaginationItem><PaginationLink href="#">{currentPage}</PaginationLink></PaginationItem>
                                                <PaginationItem><PaginationNext href="#" onClick={(e) => { e.preventDefault(); setCurrentPage(p => Math.min(totalPages, p + 1)); }} /></PaginationItem>
                                            </PaginationContent>
                                        </Pagination>
                                    </div>)}
                                </>
                            )}
                        </Card>
                    </motion.div>
                </div>
            </main>
            
            <Dialog open={!!selectedCall} onOpenChange={(open) => { if (!open) setSelectedCall(null); }}>
                <DialogContent className="sm:max-w-[600px] h-fit max-h-[90vh] flex flex-col bg-[#1a1a1a] border-[#333333]">
                    <DialogHeader>
                        <DialogTitle className="text-[#F3FFD4]">Call Details</DialogTitle>
                        <DialogDescription className="text-[#A7A7A7]">Complete information about this call</DialogDescription>
                    </DialogHeader>
                    {isDetailsLoading ? (
                        <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 text-[#A7B3AC] animate-spin" /><p className="ml-4 text-[#A7A7A7]">Fetching latest details...</p></div>
                    ) : selectedCall && (
                        <ScrollArea className="pr-2 -mr-4">
                            <div className="space-y-6 py-2 text-[#F3FFD4] pr-4">
                                {/* ... (Call Details content remains the same) ... */}
                            </div>
                        </ScrollArea>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
