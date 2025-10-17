"use client";

import { motion } from "framer-motion";
import { useTheme } from "@/components/theme-provider"; // Use your theme provider
import { Brain, Zap, Shield, Globe2, Cpu, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

const features = [
  {
    icon: <Brain className="h-8 w-8 text-cyan-400" />,
    title: "Neural Voice Processing",
    description:
      "Advanced neural networks that understand context, emotion, and intent with human-level comprehension",
  },
  {
    icon: <Zap className="h-8 w-8 text-purple-400" />,
    title: "Real-Time Intelligence",
    description:
      "Lightning-fast processing with sub-200ms response times for seamless conversations",
  },
  {
    icon: <Shield className="h-8 w-8 text-blue-400" />,
    title: "Enterprise Security",
    description:
      "Bank-grade encryption and compliance with SOC2, GDPR, and HIPAA standards",
  },
  {
    icon: <Globe2 className="h-8 w-8 text-emerald-400" />,
    title: "Global Scale",
    description:
      "Deploy across 50+ regions with multilingual support and local data residency",
  },
  {
    icon: <Cpu className="h-8 w-8 text-indigo-400" />,
    title: "Adaptive Learning",
    description:
      "Self-improving AI that learns from every interaction to deliver better outcomes",
  },
  {
    icon: <BarChart3 className="h-8 w-8 text-amber-400" />,
    title: "Advanced Analytics",
    description:
      "Deep insights with real-time metrics, sentiment analysis, and performance optimization",
  },
];

// Floating elements like hero
const FloatingElements = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    <motion.div
      className="absolute top-1/4 left-1/4 w-2 h-2 bg-blue-400/40 rounded-full"
      animate={{ y: [-20, 20, -20], x: [-10, 10, -10], opacity: [0.3, 0.8, 0.3] }}
      transition={{ duration: 6, repeat: Infinity }}
    />
    <motion.div
      className="absolute top-1/3 right-1/3 w-1 h-1 bg-violet-400/40 rounded-full"
      animate={{ y: [20, -20, 20], x: [10, -10, 10], opacity: [0.5, 1, 0.5] }}
      transition={{ duration: 8, repeat: Infinity }}
    />
    <motion.div
      className="absolute bottom-1/3 left-1/3 w-1.5 h-1.5 bg-cyan-400/40 rounded-full"
      animate={{ y: [-15, 15, -15], opacity: [0.4, 0.9, 0.4] }}
      transition={{ duration: 7, repeat: Infinity }}
    />
  </div>
);

export function Features() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <section
      className={cn(
        "py-32 relative overflow-hidden transition-colors duration-700",
        isDark
          ? "bg-gradient-to-br from-gray-950 via-gray-900 to-blue-950 text-gray-100"
          : "bg-gradient-to-br from-blue-50 via-blue-100 to-cyan-100 text-gray-900"
      )}
    >
      {/* Floating elements */}
      <FloatingElements />

      {/* Subtle grid overlay */}
      <div
        className={cn(
          "absolute inset-0 bg-[size:60px_60px] opacity-20 pointer-events-none",
          isDark
            ? "bg-[linear-gradient(to_right,rgba(75,85,99,0.2)_1px,transparent_1px),linear-gradient(to_bottom,rgba(75,85,99,0.2)_1px,transparent_1px)]"
            : "bg-[linear-gradient(to_right,rgba(120,130,145,0.2)_1px,transparent_1px),linear-gradient(to_bottom,rgba(120,130,145,0.2)_1px,transparent_1px)]"
        )}
      />

      <div className="container mx-auto relative z-10 px-6 md:px-12">
        {/* Header */}
        <div className="text-center mb-20">
          <motion.div
            className={cn(
              "inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 border backdrop-blur-xl",
              isDark
                ? "bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border-gray-800"
                : "bg-gradient-to-r from-cyan-400/10 to-purple-400/10 border-gray-200"
            )}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Cpu className={cn("h-4 w-4", isDark ? "text-cyan-400" : "text-purple-600")} />
            <span className="font-medium">Advanced Capabilities</span>
          </motion.div>

          <motion.h2
            className="text-5xl font-bold mb-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            viewport={{ once: true }}
          >
            Built for the
            <span
              className={cn(
                "bg-clip-text text-transparent block mt-2 bg-gradient-to-r",
                isDark ? "from-cyan-400 to-purple-400" : "from-cyan-600 to-purple-600"
              )}
            >
              Next Generation
            </span>
          </motion.h2>

          <motion.p
            className={cn(
              "text-xl max-w-3xl mx-auto leading-relaxed",
              isDark ? "text-gray-400" : "text-gray-600"
            )}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            viewport={{ once: true }}
          >
            Xseize combines cutting-edge AI research with enterprise-grade reliability to deliver voice intelligence that transforms how businesses operate.
          </motion.p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              className="group relative"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              {/* Glow on Hover */}
              <div
                className={cn(
                  "absolute -inset-px rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm",
                  isDark ? "bg-gradient-to-r from-cyan-500/20 to-purple-500/20" : "bg-gradient-to-r from-cyan-400/20 to-purple-400/20"
                )}
              />

              <div
                className={cn(
                  "relative p-8 rounded-3xl border backdrop-blur-xl transition-all duration-300 h-full",
                  isDark
                    ? "bg-gray-900/60 border-gray-800 hover:border-cyan-500/30"
                    : "bg-white/70 border-gray-200 hover:border-purple-400/30"
                )}
              >
                <div
                  className={cn(
                    "p-4 rounded-2xl w-fit mb-6 border",
                    isDark
                      ? "bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border-gray-800"
                      : "bg-gradient-to-r from-cyan-400/10 to-purple-400/10 border-gray-200"
                  )}
                >
                  {feature.icon}
                </div>
                <h3 className={cn("text-xl font-bold mb-4")}>{feature.title}</h3>
                <p className={cn("leading-relaxed", isDark ? "text-gray-400" : "text-gray-700")}>
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
