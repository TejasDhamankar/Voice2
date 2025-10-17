'use client'
import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { HeroSection } from "@/components/hero-section";
import { ProductShowcase } from "@/components/product-showcase";
import { DashboardPreview } from "@/components/dashboard-preview";
import { Integrations } from "@/components/integrations";
import { CTASection } from "@/components/cta-section";
import { Footer } from "@/components/footer"; // Assuming Testimonials will be added back later
import { motion, AnimatePresence, useMotionValue, useSpring, useMotionTemplate } from "framer-motion";
import {
  MenuIcon,
  X,
  ChevronRight,
  Globe,
  Brain,
  BarChart,
  Zap,
  ArrowRight
} from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose
} from "@/components/ui/sheet";
import { Header } from "@/components/ui/header";
import ElevenLabsWidget from "@/components/ElevenLabsWidget";

export default function Home() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // --- START: Background Hover Effect Logic ---
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springX = useSpring(mouseX, { stiffness: 500, damping: 50 });
  const springY = useSpring(mouseY, { stiffness: 500, damping: 50 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    mouseX.set(e.clientX);
    mouseY.set(e.clientY);
  };
  // --- END: Background Hover Effect Logic ---

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navItems = [
    { href: "/solution", label: "Solutions", icon: <Brain className="h-4 w-4" /> },
    { href: "#platform", label: "Platform", icon: <BarChart className="h-4 w-4" /> },
    { href: "#integrations", label: "Integrations", icon: <Globe className="h-4 w-4" /> },
    { href: "/pricing", label: "Pricing", icon: <Zap className="h-4 w-4" /> }
  ];

  return (
    <div 
      className="min-h-screen bg-background text-foreground overflow-hidden relative"
      onMouseMove={handleMouseMove}
    >
      {/* Premium dark background with subtle patterns */}
      <div className="fixed inset-0 z-[-1] bg-[#111111]">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#333333_1px,transparent_1px),linear-gradient(to_bottom,#333333_1px,transparent_1px)] bg-[size:40px_40px] opacity-10"></div>
        <div className="absolute left-0 top-0 h-[500px] w-[500px] rounded-full bg-gradient-to-r from-[#F3FFD4]/5 to-[#A7B3AC]/5 blur-[150px]"></div>
        <div className="absolute right-0 bottom-0 h-[400px] w-[400px] rounded-full bg-gradient-to-l from-[#A7B3AC]/5 to-transparent blur-[120px]"></div>
      </div>
      {/* Spotlight Hover Effect */}
      <motion.div
        className="pointer-events-none fixed inset-0 z-30"
        style={{
          background: useMotionTemplate`
            radial-gradient(600px circle at ${springX}px ${springY}px, rgba(167, 179, 172, 0.20), transparent 80%)
          `,
        }}
      />
      <Header />
      <ElevenLabsWidget />
      <main className="relative z-10">
        <HeroSection />
        <ProductShowcase />
        <DashboardPreview />
        <CTASection />
         
      </main>
 <Footer />
   
    </div>
  );
}