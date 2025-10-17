"use client";

import { useState, useRef, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { DashboardHeader } from "@/components/dashboard/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  PhoneCall, Bot, MessageSquare, Database, BarChart, CreditCard, Plus, Mic
} from "lucide-react";

// --- Navigation items ---
const navItems = [
  { icon: <PhoneCall className="h-6 w-6" />, label: "Calls", href: "/dashboard/calls", description: "Manage voice calls & history", section: "AI Voice System" },
  { icon: <Bot className="h-6 w-6" />, label: "AI Agents", href: "/dashboard/agents", description: "Create & configure voice AI", section: "AI Voice System" },
  { icon: <MessageSquare className="h-6 w-6" />, label: "Call History", href: "/dashboard/calls/history", description: "Review transcripts & logs", section: "AI Voice System" },
  { icon: <Database className="h-6 w-6" />, label: "Knowledge Base", href: "/dashboard/knowledge", description: "Manage AI training data", section: "Business Management" },
  { icon: <BarChart className="h-6 w-6" />, label: "Analytics", href: "/dashboard/analytics", description: "View usage insights & reports", section: "Business Management" },
  { icon: <CreditCard className="h-6 w-6" />, label: "Billing", href: "/dashboard/billing", description: "Manage subscriptions & payments", section: "Business Management" },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);
  const ws = useRef<WebSocket | null>(null);
  const audioContext = useRef<AudioContext | null>(null);
  const audioQueue = useRef<ArrayBuffer[]>([]);
  const isPlaying = useRef(false);

  // --- Audio Queue Logic ---
  const processAudioQueue = useCallback(() => {
    if (isPlaying.current || audioQueue.current.length === 0) return;
    isPlaying.current = true;
    const audioData = audioQueue.current.shift();

    if (audioData && audioContext.current) {
      audioContext.current.decodeAudioData(
        audioData,
        (buffer) => {
          const source = audioContext.current!.createBufferSource();
          source.buffer = buffer;
          source.connect(audioContext.current!.destination);
          source.onended = () => {
            isPlaying.current = false;
            processAudioQueue();
          };
          source.start();
        },
        (err) => {
          console.error("Error decoding audio:", err);
          isPlaying.current = false;
          processAudioQueue();
        }
      );
    } else {
      isPlaying.current = false;
    }
  }, []);

  // --- Start Conversation (WebSocket + Mic Stream) ---
  const startConversation = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/signed-url`);
      if (!response.ok) throw new Error("Failed to get signed URL");
      const { signedUrl } = await response.json();

      if (!audioContext.current) {
        audioContext.current = new (window.AudioContext ||
          (window as any).webkitAudioContext)();
      }

      ws.current = new WebSocket(signedUrl);
      ws.current.binaryType = "arraybuffer";

      ws.current.onopen = async () => {
        console.log("✅ WebSocket connected to ElevenLabs ConvAI");
        setConnected(true);
        setLoading(false);

        // --- Step 1: Initiate the conversation session ---
        const agentId = process.env.NEXT_PUBLIC_AGENT_ID || "agent_3201k7rd377ve60sdvkgjq5smb5q";
        ws.current!.send(JSON.stringify({
          type: "conversation_initiate",
          conversation_config: {
            agent_id: agentId,
            modalities: ["audio"],
            enable_audio: true
          }
        }));

        // --- Step 2: Capture and send microphone audio ---
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          const input = audioContext.current!.createMediaStreamSource(stream);
          const processor = audioContext.current!.createScriptProcessor(4096, 1, 1);

          input.connect(processor);
          processor.connect(audioContext.current!.destination);

          processor.onaudioprocess = (event) => {
            if (ws.current && ws.current.readyState === WebSocket.OPEN) {
              const inputData = event.inputBuffer.getChannelData(0);
              const buffer = new ArrayBuffer(inputData.length * 2);
              const view = new DataView(buffer);
              for (let i = 0; i < inputData.length; i++) {
                const s = Math.max(-1, Math.min(1, inputData[i]));
                view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
              }
              ws.current.send(buffer);
            }
          };

          console.log("🎤 Microphone streaming started");
        } catch (err) {
          console.error("🎤 Microphone access denied:", err);
          alert("Microphone access denied. Please allow permission and reload.");
        }

        // --- Step 3: Send initial message to start chat ---
        ws.current!.send(JSON.stringify({
          type: "input_text",
          text: "Hello! How are you today?"
        }));
      };

      ws.current.onmessage = async (event) => {
        if (event.data instanceof ArrayBuffer) {
          audioQueue.current.push(event.data);
          processAudioQueue();
        } else {
          const data = JSON.parse(event.data);
          console.log("📨 Server message:", data);
        }
      };

      ws.current.onerror = (err) => console.error("WebSocket error:", err);
      ws.current.onclose = () => {
        console.log("❌ WebSocket disconnected");
        setConnected(false);
        setLoading(false);
        ws.current = null;
      };
    } catch (err) {
      console.error("Failed to start conversation:", err);
      alert(`Error: ${(err as Error).message}`);
      setLoading(false);
    }
  }, [processAudioQueue]);

  const stopConversation = useCallback(() => {
    if (ws.current) ws.current.close();
    audioContext.current?.close();
  }, []);

  // --- UI Rendering ---
  const sections = navItems.reduce((acc, item) => {
    const section = item.section || "General";
    if (!acc[section]) acc[section] = [];
    acc[section].push(item);
    return acc;
  }, {} as Record<string, typeof navItems>);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#111111]">
      <DashboardHeader />
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-4 sm:px-6 py-8">

          {/* --- Header --- */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-wrap justify-between items-center gap-4 mb-8"
          >
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#F3FFD4]">
                Welcome back, {user?.name || "User"}!
              </h1>
              <p className="text-[#A7A7A7] mt-1">
                Here's your command center. What would you like to do today?
              </p>
            </div>
            <Button
              onClick={() => router.push("/dashboard/new-agent")}
              className="gap-2 bg-[#A7B3AC] text-[#111111] hover:bg-[#A7B3AC]/90 font-bold"
            >
              <Plus className="h-4 w-4" /> Create New Agent
            </Button>
          </motion.div>

          {/* --- Cards --- */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-10"
          >
            {Object.entries(sections).map(([sectionTitle, items]) => (
              <section key={sectionTitle}>
                <motion.h2 variants={itemVariants} className="text-xl font-semibold text-[#F3FFD4] mb-4">
                  {sectionTitle}
                </motion.h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {items.map((item) => (
                    <motion.div key={item.href} variants={itemVariants}>
                      <Link href={item.href} className="h-full">
                        <Card className="h-full flex flex-col bg-[#1a1a1a] border-[#333333] hover:border-[#A7B3AC] transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-[#A7B3AC]/10">
                          <CardHeader className="flex flex-row items-center gap-4">
                            <div className="h-12 w-12 rounded-lg bg-[#A7B3AC]/10 flex items-center justify-center flex-shrink-0">
                              <div className="text-[#A7B3AC]">{item.icon}</div>
                            </div>
                            <div>
                              <CardTitle className="text-lg text-[#F3FFD4]">
                                {item.label}
                              </CardTitle>
                            </div>
                          </CardHeader>
                          <CardContent className="flex-1">
                            <CardDescription className="text-[#A7A7A7]">
                              {item.description}
                            </CardDescription>
                          </CardContent>
                        </Card>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </section>
            ))}
          </motion.div>

          <Separator className="my-12 bg-[#333333]" />

          {/* --- Live Conversation Section --- */}
          <motion.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-center mt-12"
          >
            <h2 className="text-xl font-semibold text-[#F3FFD4] mb-6 flex items-center justify-center gap-3">
              <Mic className="h-6 w-6 text-[#A7B3AC]" />
              Live Agent Conversation
            </h2>

            <div className="flex flex-col items-center gap-4">
              <Button
                onClick={startConversation}
                disabled={loading || connected}
                className={cn(
                  "px-8 py-6 text-lg font-bold gap-2 text-[#111111] bg-[#A7B3AC] hover:bg-[#A7B3AC]/90",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
              >
                {loading ? "Connecting..." : connected ? "Connected" : "Start Conversation"}
              </Button>

              {connected && (
                <Button
                  onClick={stopConversation}
                  className="px-8 py-6 text-lg font-bold bg-red-600 text-white hover:bg-red-700"
                >
                  End Conversation
                </Button>
              )}
            </div>
          </motion.section>

          <Separator className="my-12 bg-[#333333]" />

          {/* --- Footer Placeholder --- */}
          <div className="text-center text-[#A7A7A7] pb-12">
            <h3 className="text-lg font-semibold text-[#F3FFD4]">Analytics & Recent Activity</h3>
            <p className="text-sm">
              Future dashboard widgets (charts, stats, etc.) will be displayed here.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
