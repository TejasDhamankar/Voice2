"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Brain, Zap, BarChart3, ArrowRight, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

// The unified color palette for a premium look
const COLORS = {
  background: "#111111",
  primaryHeadline: "#F3FFD4", // For main text
  textSecondary: "#A7A7A7",   // For paragraphs and subtext
  accent: "#A7B3AC",          // For subtle highlights and glows
  border: "#333333",
  white: "#FFFFFF",
};

// Rewritten product data for a more professional tone
const products = [
  {
    id: "intelligence",
    name: "Conversational AI",
    icon: <Brain className="h-5 w-5" />,
    headline: "Engage in conversations that feel genuinely human.",
    description: "Go beyond simple chatbots. Our AI understands nuanced, multi-turn dialogues, enabling truly natural interactions at enterprise scale.",
    features: [
      "Context-aware understanding",
      "Real-time sentiment analysis",
      "Dynamic conversation flows",
      "95% intent accuracy rate",
    ],
    stats: [
      { label: "Customer Satisfaction", value: "+32%" },
      { label: "Resolution Time", value: "-47%" },
    ],
    image: "/intelligence-showcase.png", // UPDATE IMAGE PATH
  },
  {
    id: "automation",
    name: "Autonomous Workflows",
    icon: <Zap className="h-5 w-5" />,
    headline: "Automate complex processes from end to end.",
    description: "Deploy intelligent agents that handle entire workflows, from lead qualification to customer support, fully integrated with your existing systems.",
    features: [
      "CRM & API integration",
      "Dynamic decision-making",
      "24/7 operational capacity",
      "Scales on demand",
    ],
    stats: [
      { label: "Operational Uplift", value: "+84%" },
      { label: "Manual Tasks Reduced", value: "-75%" },
    ],
    image: "/automation-showcase.png", // UPDATE IMAGE PATH
  },
  {
    id: "analytics",
    name: "Predictive Analytics",
    icon: <BarChart3 className="h-5 w-5" />,
    headline: "Turn every conversation into actionable business intelligence.",
    description: "Our platform analyzes 100% of your voice interactions, uncovering trends, predicting outcomes, and providing the data you need to make smarter decisions.",
    features: [
      "Real-time data dashboards",
      "Predictive outcome modeling",
      "Actionable performance insights",
      "Compliance monitoring",
    ],
    stats: [
      { label: "Data-driven Decisions", value: "+60%" },
      { label: "Revenue Opportunities", value: "+22%" },
    ],
    image: "/analytics-showcase.png", // UPDATE IMAGE PATH
  },
];

export function ProductShowcase() {
  const [activeTab, setActiveTab] = useState("intelligence");

  return (
    <section
      id="products"
      className="relative overflow-hidden py-24 sm:py-32 bg-black"
    >
      {/* Subtle background glow effect */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[150%] h-[800px] rounded-full opacity-10 blur-3xl"
        style={{
          backgroundImage: `radial-gradient(circle, ${COLORS.accent} 0%, transparent 60%)`,
        }}
      />

      <div className="container mx-auto relative z-10">
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
            A Unified Platform for Intelligent Growth
          </motion.h2>
          <motion.p
            className="mt-6 text-lg sm:text-xl leading-relaxed max-w-2xl mx-auto"
            style={{ color: COLORS.textSecondary }}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            Our suite of AI-powered tools works in harmony to transform your business operations, from customer interactions to data-driven strategy.
          </motion.p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* Animated Tabs List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <TabsList className="relative h-auto p-2 rounded-full bg-transparent flex justify-center max-w-md mx-auto" style={{ backgroundColor: "rgba(51,51,51,0.5)" }}>
              {products.map((product) => (
                <TabsTrigger
                  key={product.id}
                  value={product.id}
                  className="relative w-full rounded-full px-4 py-3 text-sm font-medium transition"
                  style={{ color: activeTab === product.id ? COLORS.white : COLORS.textSecondary, WebkitTapHighlightColor: "transparent" }}
                >
                  {activeTab === product.id && (
                    <motion.div
                      layoutId="active-tab-pill"
                      className="absolute inset-0 rounded-full"
                      style={{ backgroundColor: COLORS.border }}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-2">{product.icon} {product.name}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </motion.div>

          {/* Tab Content */}
          <div className="relative mt-16">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
              >
                {products.filter(p => p.id === activeTab).map(product => (
                  <div key={product.id} className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">

                    {/* Left Column: Text Content */}
                    <div className="space-y-8">
                      <h3 className="text-4xl font-bold tracking-tight" style={{ color: COLORS.primaryHeadline }}>
                        {product.headline}
                      </h3>
                      <p className="text-lg" style={{ color: COLORS.textSecondary }}>
                        {product.description}
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                        {product.features.map(feature => (
                          <div key={feature} className="flex items-center gap-3">
                            <CheckCircle className="h-5 w-5 flex-shrink-0" style={{ color: COLORS.accent }} />
                            <span style={{ color: COLORS.textSecondary }}>{feature}</span>
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-8 pt-4">
                        {product.stats.map(stat => (
                          <div key={stat.label}>
                            <p className="text-3xl font-bold" style={{ color: COLORS.primaryHeadline }}>{stat.value}</p>
                            <p className="text-sm" style={{ color: COLORS.textSecondary }}>{stat.label}</p>
                          </div>
                        ))}
                      </div>
                      <Button asChild size="lg" className="rounded-full bg-transparent group" variant="outline" style={{ borderColor: COLORS.accent, color: COLORS.primaryHeadline }}>
                        <Link href={`/products/${product.id}`}>
                          Learn More
                          <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </Link>
                      </Button>
                    </div>

                    {/* Right Column: "Glass" Image Display */}
                    <div className="relative">
                      <div className="absolute -inset-4 rounded-3xl opacity-30 blur-2xl" style={{ backgroundColor: COLORS.accent }}></div>
                      <div className="relative aspect-[4/3] rounded-2xl p-4 overflow-hidden" style={{ backgroundColor: "rgba(255, 255, 255, 0.05)", border: `1px solid ${COLORS.border}`, backdropFilter: 'blur(12px)' }}>
                        <Image
                          src={product.image}
                          alt={`${product.name} showcase`}
                          fill
                          className="object-cover rounded-lg"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </motion.div>
            </AnimatePresence>
          </div>
        </Tabs>
      </div>
    </section>
  );
}