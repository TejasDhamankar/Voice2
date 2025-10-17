"use client";

  import { useState, useRef, useEffect } from "react";
  import { cn } from "@/lib/utils";
  import { useTheme } from "next-themes";
  import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
  import Image from "next/image";
 
  import Link from "next/link";
  import {
    PlayCircle,
    BarChart3,
    Bot,
    Globe,
    Headphones,
    PhoneCall,
    Wand2,
    LucideIcon,
    Brain,
    ZapIcon,
    BadgeCheck,
    Sparkles,
    ArrowRight,
    Star,
    Users,
    Clock,
    Shield,
    TrendingUp,
    MessageSquare
  } from "lucide-react"; 
import { Button } from "./ui/button";


  // Feature badge component for the hero section
  interface FeatureBadgeProps {
    icon: LucideIcon;
    text: string;
    gradient: string;
    delay?: number;
    className?: string;
  }

  const FeatureBadge = ({ icon: Icon, text, gradient, delay = 0, className }: FeatureBadgeProps) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay + 1.2, duration: 0.5 }}
      className={cn(
        "flex items-center gap-3 px-4 py-2 rounded-full backdrop-blur-sm border transition-all duration-300 group cursor-pointer",
        "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20",
        className
      )}
    >
      <div className="p-1.5 bg-white/5 rounded-full">
        <Icon className="h-4 w-4 text-gray-300 group-hover:text-white transition-colors" />
      </div>
      <span className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors">{text}</span>
    </motion.div>
  );

  // Audio wave animation component
  const AudioWave = ({ className }: { className?: string }) => {
    return (
      <div className={cn("flex items-center gap-1 h-8", className)}>
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="w-1 bg-gradient-to-t from-blue-500 to-violet-400 rounded-full"
            animate={{
              height: ["20%", "80%", "40%", "90%", "30%"],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              repeatType: "reverse",
              delay: i * 0.1,
            }}
          />
        ))}
      </div>
    );
  };

  // Floating particle animation
  const FloatingElements = () => {
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Floating geometric shapes */}
        <motion.div
          className="absolute top-1/4 left-1/4 w-2 h-2 bg-blue-400/60 rounded-full"
          animate={{
            y: [-20, 20, -20],
            x: [-10, 10, -10],
            opacity: [0.3, 0.8, 0.3]
          }}
          transition={{ duration: 6, repeat: Infinity }}
        />
        <motion.div
          className="absolute top-1/3 right-1/3 w-1 h-1 bg-violet-400/60 rounded-full"
          animate={{
            y: [20, -20, 20],
            x: [10, -10, 10],
            opacity: [0.5, 1, 0.5]
          }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-1/3 left-1/3 w-1.5 h-1.5 bg-cyan-400/60 rounded-full"
          animate={{
            y: [-15, 15, -15],
            opacity: [0.4, 0.9, 0.4]
          }}
          transition={{ duration: 7, repeat: Infinity }}
        />
      </div>
    );
  };


  // ... (keep all your existing imports: useState, motion, Image, Button, lucide-react icons, etc.)
  // ... (keep your existing FeatureBadge, AudioWave, and FloatingElements components as they are)

  // The color palette to be used for styling
  const COLORS = {
    background: "#111111",
    primaryHeadline: "#F3FFD4", // For main text
    textSecondary: "#A7A7A7",   // For paragraphs and subtext
    accent: "#A7B3AC",         // For subtle highlights
    border: "#333333",
    white: "#FFFFFF",
  };

  export function HeroSection() {
    // We keep the state for the demo video if you plan to use a modal later
    const [isPlaying, setIsPlaying] = useState(false);
    const { theme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const { scrollYProgress } = useScroll();
    const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);

    useEffect(() => {
      setMounted(true);
    }, []);

    if (!mounted) return null;

    return (
      <section
        className="relative min-h-screen flex items-center justify-center overflow-hidden py-24"
        // style={{ backgroundColor: COLORS.background }}
      >
        {/* Background Video */}
        <motion.div
          className="absolute top-0 left-0 w-full h-full overflow-hidden z-0"
          style={{ y }}
        >
          <video
            src="https://media.istockphoto.com/id/2166587003/video/bright-3d-sphere-with-wavy-pixelated-surface-on-black-background-abstract-concept-of-sound.mp4?s=mp4-640x640-is&k=20&c=272VatC0XD0C-6iyotfSQ-V0VQpkoim8BJJ3D6mnc80="
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover opacity-100"
          ></video>
        </motion.div>
        
        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-black/50 z-10"></div>

        {/* Centered Content Wrapper */}
        <div className="container mx-auto px-4 relative z-20">
          <div className="max-w-4xl mx-auto text-center flex flex-col items-center">
            
            {/* Badge (Content Preserved, Style Updated) */}
            {/* <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border shadow-sm"
              style={{
                backgroundColor: ${COLORS.border}80, // semi-transparent
                borderColor: ${COLORS.border},
                backdropFilter: 'blur(8px)',
              }}
            >
              <Wand2 className="h-4 w-4" style={{ color: COLORS.accent }} />
              <span className="text-sm font-medium" style={{ color: COLORS.textSecondary }}>
                Revolutionary AI Technology
              </span>
            </motion.div> */}

            {/* Main Heading (Content Preserved, Style Updated) */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="mt-6 text-5xl md:text-6xl xl:text-7xl font-bold leading-tight tracking-tighter"
              style={{ color: COLORS.primaryHeadline }}
            >
              Engage Customers with Lifelike Voice AI
            </motion.h1>

            {/* Paragraph (Content Preserved, Style Updated) */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="mt-6 text-lg md:text-xl leading-relaxed max-w-2xl"
              style={{ color: COLORS.textSecondary }}
            >
              Our advanced AI voice agents automate your calls, qualify leads, and deliver exceptional customer support with remarkably natural, human-like conversations.
            </motion.p>

            {/* CTA Buttons (Content Preserved, Style Updated) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.8 }}
              className="mt-10 flex flex-col sm:flex-row gap-4"
            >
              <Button
                asChild
                size="lg"
                className="rounded-full font-semibold group transition-all duration-300 text-[#111111] hover:scale-105"
                style={{
                  backgroundColor: COLORS.primaryHeadline,
                  padding: "14px 32px",
                }}
              >
                <Link href="/signup">
                  Start Free Trial
                  <Sparkles className="ml-2 h-5 w-5 group-hover:rotate-12 transition-transform" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => setIsPlaying(true)}
                className="rounded-full font-semibold group bg-transparent transition-all duration-300 hover:bg-[#F3FFD4]/10 hover:scale-105"
                style={{
                  borderColor: COLORS.primaryHeadline,
                  color: COLORS.primaryHeadline,
                  padding: "14px 32px",
                }}
              >
                <PlayCircle className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                Watch Demo
              </Button>
            </motion.div>

            {/* Trust Indicators (Content Preserved, Layout Updated) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1, duration: 0.8 }}
              className="mt-12 flex flex-wrap justify-center items-center gap-6 text-sm"
              style={{ color: COLORS.textSecondary }}
            >
              <div className="flex items-center gap-2"><Users className="h-4 w-4" /><span>Trusted by 10k+ businesses</span></div>
              <div className="flex items-center gap-2"><Clock className="h-4 w-4" /><span>Setup in minutes</span></div>
              <div className="flex items-center gap-2"><Shield className="h-4 w-4" /><span>Enterprise-grade security</span></div>
            </motion.div>

            {/* Feature Badges (Content and Component Preserved) */}
            <motion.div
              className="flex flex-wrap justify-center gap-4 mt-16"
            >
              {/* These will use their internal animation delays */}
              <FeatureBadge icon={Clock} text="Always-On Support" />
              <FeatureBadge icon={Bot} text="Natural Conversations" />
              <FeatureBadge icon={Globe} text="Global Reach" />
              <FeatureBadge icon={BadgeCheck} text="High-Fidelity AI" />
            </motion.div>

            {/* Company Logos (Content Preserved) */}
            <motion.div
              className="w-full mt-20"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.6, duration: 0.8 }}
            >
              <p className="text-sm font-medium mb-8 uppercase tracking-widest" style={{ color: COLORS.textSecondary }}>
                Powering conversations for leading brands
              </p>
              <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12 opacity-60">
                {['Google', 'Microsoft', 'Amazon', 'Salesforce', 'Slack'].map((company) => (
                  <div key={company} className="text-lg font-semibold" style={{ color: COLORS.textSecondary }}>
                    {company}
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    );
  } 