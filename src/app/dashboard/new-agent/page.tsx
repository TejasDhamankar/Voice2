"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardHeader } from "@/components/dashboard/header";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { motion } from "framer-motion";

// UI Components
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import { VariableTextarea } from "@/components/ui/variable-textarea";

// Icons
import {
    Search, ArrowLeft, PlayCircle, PauseCircle, Bot, UserRoundCheck, HelpCircle, Clock, Lightbulb, Sparkles, Mic,
    Settings, Volume2, Wand2, User, Globe, CalendarCheck, Calendar, CheckCircle, Upload, FileText,
    Link as LinkIcon, BookOpen, Trash2, Plus, Calculator, Search as SearchIcon, Mail, Wrench
} from "lucide-react";
import { Label } from "@radix-ui/react-label";


const agentSchema = z.object({
    name: z.string().min(3, "Name must be at least 3 characters"),
    description: z.string().optional(),
    voice_id: z.string().min(1, "Please select a voice"),
    first_message: z.string().min(3, "First message is required"),
    system_prompt: z.string().min(10, "System prompt must be at least 10 characters"),
    template_id: z.string().optional(),
    llm_model: z.string().optional(),
    temperature: z.number().min(0).max(1).optional(),
    language: z.string().optional(),
    max_duration_seconds: z.number().min(60).max(7200).optional(),
    knowledge_documents: z.array(z.object({
        type: z.enum(['file', 'url', 'text']),
        name: z.string(),
        content: z.string().optional(),
        url: z.string().optional(),
        file: z.any().optional(),
    })).optional(),
    tools: z.array(z.string()).optional(),
});

const agentTemplates = [
    { id: "sales-assistant", title: "Sales Assistant", icon: UserRoundCheck, description: "A friendly agent that helps qualify leads and schedule sales meetings", category: "Sales & Lead Generation", prompt: "You are a professional and friendly sales assistant. Your task is to engage with potential customers, understand their needs, answer product questions, and help schedule meetings with our sales team if they're interested. Be conversational but efficient. Avoid making promises about pricing or features you're unsure about - instead, acknowledge the question and offer to connect them with a sales representative who can provide accurate information. Always maintain a helpful, understanding tone.", firstMessage: "Hi there! I'm your sales assistant from [Company]. I'd be happy to tell you about our products and services. What brings you here today?" },
    { id: "customer-support", title: "Customer Support", icon: HelpCircle, description: "An empathetic agent that handles customer inquiries and resolves issues", category: "Customer Service", prompt: "You are a patient and empathetic customer support agent. Your goal is to help users resolve their issues efficiently while showing genuine concern for their problems. Listen carefully to their issues, ask clarifying questions, and provide clear step-by-step solutions when possible. If you don't know the answer, don't make one up - instead, acknowledge the complexity of their issue and offer to escalate it to a specialist. Use a reassuring and professional tone throughout the conversation.", firstMessage: "Hello! I'm your customer support assistant. I'm here to help resolve any issues you're experiencing. Could you please describe what's happening?" },
    { id: "appointment-scheduler", title: "Appointment Scheduler", icon: Clock, description: "An efficient agent that helps book and manage appointments", category: "Scheduling & Booking", prompt: "You are an efficient appointment scheduling assistant. Your primary role is to help callers book, reschedule, or cancel appointments. Maintain a professional and friendly demeanor while being direct and efficient with the caller's time. Ask for essential information needed for appointments, such as name, preferred date and time, contact information, and reason for the appointment. Confirm details before finalizing, and clearly communicate next steps. If the requested time is not available, offer alternatives.", firstMessage: "Hello! I'm the appointment scheduling assistant. I'd be happy to help you book, reschedule, or cancel an appointment. How can I assist you today?" },
    { id: "lead-qualification", title: "Lead Qualification", icon: User, description: "A strategic agent that qualifies leads based on specific criteria", category: "Sales & Lead Generation", prompt: "You are a lead qualification specialist. Your goal is to determine if the person you're speaking with is a good fit for our products/services based on specific qualification criteria. Ask thoughtful, strategic questions to understand their needs, budget, timeline, decision-making authority, and current pain points. Be conversational rather than interrogative. Look for signals that indicate whether they're a high-quality lead worth pursuing. When appropriate, explain how our solution addresses their specific needs. Remain professional and avoid being pushy. For qualified leads, offer to connect them with a sales representative for more detailed information.", firstMessage: "Hi there! Thanks for your interest in [Company]. I'd like to learn a bit about your needs to see how we might be able to help. Could you tell me what brought you to us today?" },
    { id: "followup-scheduler", title: "Followup Scheduler", icon: Calendar, description: "A persistent agent that schedules follow-up calls and nurtures leads", category: "Sales & Lead Generation", prompt: "You are a follow-up scheduling specialist. Your role is to re-engage with prospects who have previously shown interest but haven't converted yet. Be friendly but persistent, reminding them of previous interactions without being pushy. Your main objective is to schedule a follow-up call or meeting with the appropriate team member. Ask about any changes in their situation or needs since the last contact. Address any concerns or objections tactfully. If they're not ready to schedule, identify when it would be appropriate to follow up again. Be helpful and professional throughout, focusing on providing value rather than just making a sale.", firstMessage: "Hello! I'm following up regarding your previous interest in [Company/Product]. I wanted to check in and see if you'd like to schedule some time to discuss how we can help you achieve your goals. How have things progressed since we last spoke?" },
    { id: "booking-agent", title: "Booking Agent", icon: CalendarCheck, description: "A specialized agent focused on seamless booking experiences", category: "Scheduling & Booking", prompt: "You are a booking agent specializing in seamless reservation experiences. Your primary responsibility is to help customers make, modify, or cancel bookings efficiently. Guide callers through the booking process step by step, asking for all necessary information in a logical order. Clearly explain all options, availability, pricing, and policies. Suggest appropriate alternatives if first choices aren't available. Confirm all details before finalizing any booking. When dealing with changes or cancellations, be sympathetic yet clear about any applicable policies or fees. Maintain a professional, helpful attitude throughout the conversation, ensuring the customer feels valued regardless of the complexity of their request.", firstMessage: "Hello! I'm your booking assistant at [Company]. Whether you're looking to make a new reservation, modify an existing one, or have questions about our availability, I'm here to help. What type of booking would you like to discuss today?" },
];
const availableTools = [
    { id: "web_search", name: "Web Search", description: "Search the internet for current information", icon: SearchIcon },
    { id: "calculator", name: "Calculator", description: "Perform mathematical calculations", icon: Calculator },
    { id: "calendar", name: "Calendar", description: "Access calendar and scheduling functions", icon: Calendar },
    { id: "email", name: "Email", description: "Send and manage email communications", icon: Mail }
];
const llmModels = [
    { id: "gpt-4o-mini", name: "GPT-4O Mini (Recommended)", description: "Best for most use cases" },
    { id: "gpt-4o", name: "GPT-4O", description: "Most capable model" },
    { id: "gpt-4-turbo", name: "GPT-4 Turbo", description: "Fast and capable" },
    { id: "gpt-3.5-turbo", name: "GPT-3.5 Turbo", description: "Fast and cost-effective" }
];
const languages = [
    { id: "en", name: "English" }, { id: "es", name: "Spanish" }, { id: "fr", name: "French" },
    { id: "de", name: "German" }, { id: "it", name: "Italian" }, { id: "pt", name: "Portuguese" },
    { id: "hi", name: "Hindi" }, { id: "ja", name: "Japanese" }, { id: "ko", name: "Korean" }, { id: "zh", name: "Chinese" }
];

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function NewAgent() {
    const router = useRouter();
    const { user } = useAuth();
    const { data, error, isLoading } = useSWR<{ voices: { id: string, name: string, tags: string, demo: string }[] }>("/api/voices", fetcher);

    const [creatingAgent, setCreatingAgent] = useState(false);
    const [voiceSearch, setVoiceSearch] = useState("");
    const [playingVoice, setPlayingVoice] = useState<string | null>(null);
    const [audioRef, setAudioRef] = useState<HTMLAudioElement | null>(null);
    const [newDocumentType, setNewDocumentType] = useState<'file' | 'url' | 'text'>('text');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const allVoices = data?.voices || [];

    const form = useForm<z.infer<typeof agentSchema>>({
        resolver: zodResolver(agentSchema),
        defaultValues: {
            name: "",
            description: "",
            voice_id: "",
            first_message: "Hello! I'm here to assist you today. How can I help you?",
            system_prompt: "You are a friendly and professional AI assistant. Your goal is to provide helpful, accurate information and assist users with their queries in a conversational manner.",
            template_id: "",
            llm_model: "gpt-4o-mini",
            temperature: 0.3,
            language: "en",
            max_duration_seconds: 1800,
            knowledge_documents: [],
            tools: [],
        }
    });

    const selectedTemplate = form.watch("template_id");
    const knowledgeDocuments = form.watch("knowledge_documents") || [];
    const maxDuration = form.watch("max_duration_seconds") || 1800;

    const handlePlayVoice = (voiceId: string, demoUrl: string) => {
        if (playingVoice === voiceId) {
            audioRef?.pause();
            setPlayingVoice(null);
        } else {
            audioRef?.pause();
            const audio = new Audio(demoUrl);
            audio.onended = () => setPlayingVoice(null);
            audio.play().catch(err => console.error("Error playing audio:", err));
            setAudioRef(audio);
            setPlayingVoice(voiceId);
        }
    };

    const applyTemplate = (templateId: string) => {
        const template = agentTemplates.find(t => t.id === templateId);
        if (template) {
            form.setValue("system_prompt", template.prompt);
            form.setValue("first_message", template.firstMessage);
            form.setValue("template_id", templateId);
            if (!form.getValues("name").trim()) {
                form.setValue("name", template.title);
            }
        }
    };

    const addKnowledgeDocument = () => {
        const currentDocs = form.getValues("knowledge_documents") || [];
        if (newDocumentType === 'file') {
            fileInputRef.current?.click();
        } else {
            form.setValue("knowledge_documents", [...currentDocs, {
                type: newDocumentType,
                name: newDocumentType === 'url' ? 'New Website URL' : 'New Text Document',
                content: newDocumentType === 'text' ? '' : undefined,
                url: newDocumentType === 'url' ? '' : undefined,
            }]);
        }
    };

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const currentDocs = form.getValues("knowledge_documents") || [];
            form.setValue("knowledge_documents", [...currentDocs, { type: 'file', name: file.name, file: file }]);
        }
    };
    
    const updateKnowledgeDocument = (index: number, field: string, value: string) => {
        const currentDocs = form.getValues("knowledge_documents") || [];
        const updatedDocs = currentDocs.map((doc, i) => (i === index ? { ...doc, [field]: value } : doc));
        form.setValue("knowledge_documents", updatedDocs);
    };

    const removeKnowledgeDocument = (index: number) => {
        const currentDocs = form.getValues("knowledge_documents") || [];
        form.setValue("knowledge_documents", currentDocs.filter((_, i) => i !== index));
    };

    const onSubmit = async (payload: z.infer<typeof agentSchema>) => {
        try {
          setCreatingAgent(true);
      
          // Transform to camelCase
          const agentData = {
            name: payload.name,
            description: payload.description,
            voiceId: payload.voice_id,       // ✅ camelCase
            firstMessage: payload.first_message, // ✅ camelCase
            systemPrompt: payload.system_prompt, // ✅ camelCase
            templateId: payload.template_id,  // optional
            llmModel: payload.llm_model,      // optional
            temperature: payload.temperature, // optional
            language: payload.language,       // optional
            maxDurationSeconds: payload.max_duration_seconds, // optional
            tools: payload.tools,             // optional
            knowledgeDocuments: (payload.knowledge_documents || []).map(doc => ({
              type: doc.type,
              name: doc.name,
              content: doc.content,
              url: doc.url,
            })),
          };
      
          const formData = new FormData();
          formData.append('agentData', JSON.stringify(agentData));
      
          // Append any files separately
          (payload.knowledge_documents || []).forEach((doc, index) => {
            if (doc.type === 'file' && doc.file) {
              formData.append(`file_${index}`, doc.file, doc.name);
            }
          });
      
          const response = await fetch("/api/createAgent", {
            method: "POST",
            body: formData,
          });
      
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Failed to create agent");
          }
      
          const result = await response.json();
          console.log("Agent created successfully:", result);
          router.push("/dashboard/agents");
      
        } catch (error) {
          console.error("Error creating agent:", error);
        } finally {
          setCreatingAgent(false);
        }
      };
      

    const templatesByCategory = agentTemplates.reduce((acc, template) => {
        if (!acc[template.category]) acc[template.category] = [];
        acc[template.category].push(template);
        return acc;
    }, {} as { [key: string]: typeof agentTemplates });

    const containerVariant = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };
    const fadeInUpVariant = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
    };

    return (
        <div className="min-h-screen text-foreground flex">
            <main className="flex-1 h-screen overflow-y-auto bg-[#111111]">
                <DashboardHeader />
                <div className="container mx-auto px-4 sm:px-6 py-8">
                    <div className="max-w-6xl mx-auto">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
                            <div>
                                <Button variant="ghost" size="sm" className="mb-2 -ml-2 text-[#A7A7A7] hover:text-[#F3FFD4]" onClick={() => router.push('/dashboard/agents')}>
                                    <ArrowLeft className="h-4 w-4 mr-1" /> Back to Agents
                                </Button>
                                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#F3FFD4]">Create AI Voice Agent</h1>
                                <p className="text-[#A7A7A7] mt-2 text-lg">Design your conversational AI assistant with advanced capabilities.</p>
                            </div>
                        </div>

                        <motion.div initial="hidden" animate="visible" variants={containerVariant}>
                            <motion.div variants={fadeInUpVariant} className="mb-12">
                                <div className="flex items-center gap-2 mb-6">
                                    <Wand2 className="h-5 w-5 text-[#A7B3AC]" />
                                    <h2 className="text-xl font-semibold text-[#F3FFD4]">Choose a Template</h2>
                                    <Badge variant="secondary" className="text-xs bg-[#A7B3AC]/20 text-[#A7B3AC] border-[#A7B3AC]/30">Recommended</Badge>
                                </div>
                                <div className="space-y-6">
                                    {Object.entries(templatesByCategory).map(([category, templates]) => (
                                        <div key={category}>
                                            <h3 className="text-sm font-medium text-[#A7A7A7] mb-3 uppercase tracking-wide">{category}</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                {templates.map((template) => (
                                                    <Card key={template.id} onClick={() => applyTemplate(template.id)} className={cn(
                                                        "cursor-pointer transition-all bg-[#1a1a1a] border-[#333333] hover:border-[#A7B3AC]/50",
                                                        selectedTemplate === template.id && "ring-2 ring-[#A7B3AC] border-[#A7B3AC]"
                                                    )}>
                                                        <CardHeader className="pb-3">
                                                            <div className="flex justify-between items-start">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="h-12 w-12 rounded-lg bg-[#A7B3AC]/10 flex items-center justify-center"><template.icon className="h-6 w-6 text-[#A7B3AC]" /></div>
                                                                    <CardTitle className="text-lg text-[#F3FFD4]">{template.title}</CardTitle>
                                                                </div>
                                                                {selectedTemplate === template.id && <CheckCircle className="h-5 w-5 text-[#A7B3AC]" />}
                                                            </div>
                                                        </CardHeader>
                                                        <CardContent><p className="text-sm text-[#A7A7A7] line-clamp-2">{template.description}</p></CardContent>
                                                    </Card>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>

                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-12">
                                    <motion.div variants={fadeInUpVariant}>
                                        <Tabs defaultValue="basic" className="w-full">
                                            <TabsList className="grid w-full grid-cols-4 bg-[#1a1a1a] border border-[#333333] p-1 h-auto">
                                                <TabsTrigger value="basic">Basic</TabsTrigger>
                                                <TabsTrigger value="behavior">Behavior</TabsTrigger>
                                                <TabsTrigger value="knowledge">Knowledge</TabsTrigger>
                                                <TabsTrigger value="advanced">Advanced</TabsTrigger>
                                            </TabsList>
                                            <div className="mt-6">
                                                <TabsContent value="basic" className="m-0">
                                                    <Card className="border-[#333333] bg-[#1a1a1a] shadow-md">
                                                        <CardHeader><CardTitle className="text-[#F3FFD4]">Agent Identity</CardTitle><CardDescription className="text-[#A7A7A7]">Define your AI assistant's name and purpose.</CardDescription></CardHeader>
                                                        <CardContent className="space-y-6">
                                                            <FormField control={form.control} name="name" render={({ field }) => (
                                                                <FormItem>
                                                                    <FormLabel className="text-[#A7A7A7]">Agent Name</FormLabel>
                                                                    <FormControl><Input placeholder="e.g., Sales Assistant" {...field} /></FormControl>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )} />
                                                            <FormField control={form.control} name="voice_id" render={({ field }) => (
                                                                <FormItem>
                                                                    <FormLabel className="text-[#A7A7A7]">Voice Selection</FormLabel>
                                                                    <Input placeholder="Search voices..." value={voiceSearch} onChange={(e) => setVoiceSearch(e.target.value)} />
                                                                    <FormControl>
                                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto p-1">
                                                                            {isLoading ? <p className="text-[#A7A7A7]">Loading voices...</p> : allVoices.filter(v => v.name.toLowerCase().includes(voiceSearch.toLowerCase())).map(voice => (
                                                                                <div key={voice.id} onClick={() => field.onChange(voice.id)} className={cn("border rounded-lg p-3 cursor-pointer flex justify-between items-center border-[#333333] hover:bg-white/5", field.value === voice.id && "ring-2 ring-[#A7B3AC] border-[#A7B3AC]")}>
                                                                                    <div><p className="font-medium text-[#F3FFD4]">{voice.name}</p><p className="text-xs text-[#A7A7A7]">{voice.tags}</p></div>
                                                                                    <Button type="button" variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handlePlayVoice(voice.id, voice.demo); }}>
                                                                                        {playingVoice === voice.id ? <PauseCircle className="h-5 w-5 text-[#A7B3AC]" /> : <PlayCircle className="h-5 w-5 text-[#A7A7A7]" />}
                                                                                    </Button>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    </FormControl>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )} />
                                                        </CardContent>
                                                    </Card>
                                                </TabsContent>
                                                <TabsContent value="behavior" className="m-0">
                                                    <Card className="border-[#333333] bg-[#1a1a1a] shadow-md">
                                                        <CardHeader><CardTitle className="text-[#F3FFD4]">Agent Behavior</CardTitle><CardDescription className="text-[#A7A7A7]">Define how your agent communicates and responds.</CardDescription></CardHeader>
                                                        <CardContent className="space-y-6">
                                                            <FormField control={form.control} name="system_prompt" render={({ field }) => (
                                                                <FormItem>
                                                                    <FormLabel className="text-[#A7A7A7]">System Prompt</FormLabel>
                                                                    <FormControl><Textarea rows={8} placeholder="You are a friendly AI assistant..." {...field} /></FormControl>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )} />
                                                            <FormField control={form.control} name="first_message" render={({ field }) => (
                                                                <FormItem>
                                                                    <FormLabel className="text-[#A7A7A7]">First Message</FormLabel>
                                                                    <FormControl><Textarea rows={3} placeholder="Hello! How can I help you today?" {...field} /></FormControl>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )} />
                                                        </CardContent>
                                                    </Card>
                                                </TabsContent>
                                                <TabsContent value="knowledge" className="m-0">
                                                    <Card className="border-[#333333] bg-[#1a1a1a] shadow-md">
                                                        <CardHeader><CardTitle className="text-[#F3FFD4]">Knowledge & Tools</CardTitle><CardDescription className="text-[#A7A7A7]">Enhance your agent's capabilities.</CardDescription></CardHeader>
                                                        <CardContent className="space-y-6">
                                                            <div>
                                                                <Label className="text-[#A7A7A7] font-semibold">Knowledge Base</Label>
                                                                <p className="text-sm text-[#A7A7A7]/80 mb-4">Provide information via text, URLs, or documents.</p>
                                                                <div className="flex items-center gap-2 mb-4">
                                                                    <Select value={newDocumentType} onValueChange={(value: 'file' | 'url' | 'text') => setNewDocumentType(value)}>
                                                                        <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                                                                        <SelectContent>
                                                                            <SelectItem value="text"><div className="flex items-center gap-2"><FileText className="h-4 w-4" /> Text</div></SelectItem>
                                                                            <SelectItem value="url"><div className="flex items-center gap-2"><LinkIcon className="h-4 w-4" /> URL</div></SelectItem>
                                                                            <SelectItem value="file"><div className="flex items-center gap-2"><Upload className="h-4 w-4" /> File</div></SelectItem>
                                                                        </SelectContent>
                                                                    </Select>
                                                                    <Button type="button" variant="outline" onClick={addKnowledgeDocument} className="border-[#333333] hover:bg-white/5 text-[#A7A7A7]"><Plus className="h-4 w-4 mr-2" /> Add</Button>
                                                                    <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".pdf,.doc,.docx,.txt" className="hidden" />
                                                                </div>
                                                                <div className="space-y-3">{knowledgeDocuments.map((doc, index) => (
                                                                    <div key={index} className="border border-[#333333] rounded-lg p-3 space-y-2 bg-[#111111]/50">
                                                                        <div className="flex justify-between items-center"><p className="font-medium text-sm text-[#F3FFD4]">{doc.name}</p><Button type="button" variant="ghost" size="icon" onClick={() => removeKnowledgeDocument(index)}><Trash2 className="h-4 w-4 text-red-500" /></Button></div>
                                                                        {doc.type === 'url' && <Input value={doc.url || ''} onChange={(e) => updateKnowledgeDocument(index, 'url', e.target.value)} placeholder="https://example.com" />}
                                                                        {doc.type === 'text' && <Textarea value={doc.content || ''} onChange={(e) => updateKnowledgeDocument(index, 'content', e.target.value)} placeholder="Paste text here..." />}
                                                                    </div>
                                                                ))}</div>
                                                            </div>
                                                            <Separator className="bg-[#333333]" />
                                                            <div>
                                                                <Label className="text-[#A7A7A7] font-semibold">Tools</Label>
                                                                <p className="text-sm text-[#A7A7A7]/80 mb-4">Enable tools for your agent to perform actions.</p>
                                                                <FormField control={form.control} name="tools" render={({ field }) => (
                                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                                        {availableTools.map((tool) => (
                                                                            <div key={tool.id} onClick={() => { const current = field.value || []; const updated = current.includes(tool.id) ? current.filter(t => t !== tool.id) : [...current, tool.id]; field.onChange(updated); }} className={cn("border rounded-lg p-3 cursor-pointer flex items-center gap-3 border-[#333333] hover:bg-white/5", field.value?.includes(tool.id) && "ring-2 ring-[#A7B3AC] border-[#A7B3AC]")}>
                                                                                <tool.icon className="h-5 w-5 text-[#A7B3AC]" />
                                                                                <div><p className="font-medium text-sm text-[#F3FFD4]">{tool.name}</p><p className="text-xs text-[#A7A7A7]">{tool.description}</p></div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                )} />
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                </TabsContent>
                                                <TabsContent value="advanced" className="m-0">
                                                    <Card className="border-[#333333] bg-[#1a1a1a] shadow-md">
                                                        <CardHeader><CardTitle className="text-[#F3FFD4]">Advanced Settings</CardTitle><CardDescription className="text-[#A7A7A7]">Fine-tune the technical parameters of your agent.</CardDescription></CardHeader>
                                                        <CardContent className="space-y-6">
                                                            <FormField control={form.control} name="llm_model" render={({ field }) => (
                                                                <FormItem>
                                                                    <FormLabel className="text-[#A7A7A7]">Language Model</FormLabel>
                                                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                                                        <SelectContent>{llmModels.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}</SelectContent>
                                                                    </Select>
                                                                </FormItem>
                                                            )} />
                                                            <FormField control={form.control} name="temperature" render={({ field }) => (
                                                                <FormItem>
                                                                    <FormLabel className="text-[#A7A7A7]">Temperature: {field.value}</FormLabel>
                                                                    <FormControl><Slider min={0} max={1} step={0.1} value={[field.value || 0.3]} onValueChange={(v) => field.onChange(v[0])} /></FormControl>
                                                                </FormItem>
                                                            )} />
                                                            <FormField control={form.control} name="language" render={({ field }) => (
                                                                <FormItem>
                                                                    <FormLabel className="text-[#A7A7A7]">Primary Language</FormLabel>
                                                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                                                        <SelectContent>{languages.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}</SelectContent>
                                                                    </Select>
                                                                </FormItem>
                                                            )} />
                                                            <FormField control={form.control} name="max_duration_seconds" render={({ field }) => (
                                                                <FormItem>
                                                                    <FormLabel className="text-[#A7A7A7]">Max Call Duration: {Math.floor(maxDuration / 60)} minutes</FormLabel>
                                                                    <FormControl><Slider min={60} max={7200} step={60} value={[field.value || 1800]} onValueChange={(v) => field.onChange(v[0])} /></FormControl>
                                                                </FormItem>
                                                            )} />
                                                        </CardContent>
                                                    </Card>
                                                </TabsContent>
                                            </div>
                                        </Tabs>
                                    </motion.div>
                                    
                                    <motion.div variants={fadeInUpVariant} className="flex justify-end space-x-4">
                                        <Button type="button" variant="outline" className="border-[#333333] hover:bg-white/5 text-[#A7A7A7] hover:text-[#F3FFD4]" onClick={() => router.push('/dashboard/agents')}>Cancel</Button>
                                        <Button type="submit" disabled={creatingAgent} className="gap-2 min-w-[160px] bg-[#A7B3AC] text-[#111111] hover:bg-[#A7B3AC]/90 font-bold">
                                            {creatingAgent ? (<><motion.div animate={{ rotate: 360 }} 
                                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }} 
                                            className="h-4 w-4 border-2 border-[#111111]/20 border-t-[#111111] rounded-full" />
                                                Creating Agent...</>) : (<><Sparkles className="h-4 w-4" />Create Voice Agent</>)}
                                        </Button>
                                    </motion.div>
                                </form>
                            </Form>
                        </motion.div>
                    </div>
                </div>
            </main>
        </div>
    );
}