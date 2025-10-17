"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart2, Activity, BrainCircuit, PieChart, CheckCircle } from "lucide-react";

// A unified color palette for a premium, cohesive look
const COLORS = {
  background: "#111111",
  primaryHeadline: "#F3FFD4",
  textSecondary: "#A7A7A7",
  accent: "#A7B3AC",
  border: "#333333",
  white: "#FFFFFF", // Added for active tab color
};

// Rewritten content for a more professional and benefit-driven tone
const dashboardTabs = [
  {
    id: "analytics",
    label: "Analytics",
    icon: <BarChart2 className="h-4 w-4" />,
    // Using a high-quality online placeholder image
    image: "https://images.pexels.com/photos/5926382/pexels-photo-5926382.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
    description: "Get a bird's-eye view of your entire AI operation with real-time performance dashboards.",
  },
  {
    id: "calls",
    label: "Call Logs",
    icon: <Activity className="h-4 w-4" />,
    image: "https://images.pexels.com/photos/5926389/pexels-photo-5926389.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
    description: "Drill down into individual conversations with full transcripts, sentiment analysis, and actionable insights.",
  },
  {
    id: "agents",
    label: "Agent Builder",
    icon: <BrainCircuit className="h-4 w-4" />,
    image: "https://images.pexels.com/photos/160107/pexels-photo-160107.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
    description: "Visually craft and refine the perfect AI persona for any task, from sales outreach to customer support.",
  },
  {
    id: "reporting",
    label: "Insights Engine",
    icon: <PieChart className="h-4 w-4" />,
    image: "https://images.pexels.com/photos/3184431/pexels-photo-3184431.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
    description: "Uncover deep strategic insights and track ROI with powerful, custom-generated reports.",
  },
];

const platformFeatures = [
    { title: "Real-time Dashboards", description: "Monitor every interaction as it happens." },
    { title: "Advanced Persona Crafting", description: "Design AI agents that perfectly match your brand's voice." },
    { title: "Deep Conversation Analysis", description: "Understand sentiment, intent, and outcomes automatically." },
    { title: "Self-Improving Models", description: "Our AI learns and optimizes itself from every call." },
]

export function DashboardPreview() {
  const [activeTab, setActiveTab] = useState("analytics");
  const activeTabData = dashboardTabs.find(tab => tab.id === activeTab) || dashboardTabs[0];

  return (
    <section
      id="dashboard"
      className="relative overflow-hidden py-24 sm:py-32 bg-black"
    >
      {/* Subtle "Aurora" background glow */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[150%] h-[900px] rounded-full"
        style={{
          background: `radial-gradient(circle at center, ${COLORS.accent}1A, transparent 40%)`,
          filter: 'blur(120px)'
        }}
      />

      <div className="container max-w-7xl mx-auto relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.h2
            className="text-4xl sm:text-5xl font-bold tracking-tighter"
            style={{ color: COLORS.primaryHeadline }}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.6 }}
          >
            The Command Center for Your AI Workforce
          </motion.h2>
          <motion.p
            className="mt-6 text-lg sm:text-xl leading-relaxed max-w-2xl mx-auto"
            style={{ color: COLORS.textSecondary }}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            A single, intuitive interface to monitor, manage, and optimize every AI-powered conversation your business has.
          </motion.p>
        </div>

        <div className="grid md:grid-cols-3 gap-12 items-start">

          {/* Left Column: Dashboard Preview */}
          <div className="md:col-span-2">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              {/* Animated Underline Tabs */}
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <TabsList className="relative h-auto p-0 bg-transparent flex justify-start border-b" style={{ borderColor: COLORS.border }}>
                  {dashboardTabs.map((tab) => (
                    <TabsTrigger
                      key={tab.id}
                      value={tab.id}
                      className="relative px-5 py-4 text-sm font-medium transition"
                      style={{
                        color: activeTab === tab.id ? COLORS.primaryHeadline : COLORS.textSecondary,
                        WebkitTapHighlightColor: "transparent"
                      }}
                    >
                      {activeTab === tab.id && (
                        <motion.div
                          layoutId="active-dashboard-tab"
                          className="absolute bottom-[-1px] left-0 right-0 h-0.5"
                          style={{ backgroundColor: COLORS.primaryHeadline }}
                          transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        />
                      )}
                      <span className="relative z-10 flex items-center gap-2">{tab.icon} {tab.label}</span>
                    </TabsTrigger>
                  ))}
                </TabsList>
              </motion.div>

              {/* Tab Content with Animated Image */}
              <div className="relative mt-8 min-h-[450px]">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.4, ease: "easeInOut" }}
                    className="absolute inset-0"
                  >
                    <div className="relative">
                      <div className="absolute -inset-4 rounded-3xl opacity-20 blur-2xl" style={{ backgroundColor: COLORS.accent }}></div>
                      <div className="relative aspect-[16/10] rounded-2xl p-4 overflow-hidden" style={{ backgroundColor: "rgba(255, 255, 255, 0.03)", border: `1px solid ${COLORS.border}`, backdropFilter: 'blur(8px)' }}>
                        <Image
                          src={activeTabData.image}
                          alt={`${activeTabData.label} dashboard preview`}
                          fill
                          className="object-cover rounded-lg"
                          unoptimized // Required for external image URLs
                        />
                      </div>
                    </div>
                    <p className="mt-4 text-center text-sm" style={{ color: COLORS.textSecondary }}>{activeTabData.description}</p>
                  </motion.div>
                </AnimatePresence>
              </div>
            </Tabs>
          </div>

          {/* Right Column: Core Features List */}
          <motion.div
            className="space-y-6"
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <h3 className="text-xl font-bold" style={{ color: COLORS.primaryHeadline }}>Core Platform Features</h3>
            {platformFeatures.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.4 + index * 0.1 }}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-1 flex-shrink-0">
                    <CheckCircle className="h-5 w-5" style={{ color: COLORS.accent }} />
                  </div>
                  <div>
                    <h4 className="font-semibold" style={{ color: COLORS.white }}>{feature.title}</h4>
                    <p className="text-sm mt-1" style={{ color: COLORS.textSecondary }}>{feature.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
} 