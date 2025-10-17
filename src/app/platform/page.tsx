"use client";

import React from "react";
import { motion } from "framer-motion";
import { Shield, PhoneCall, BarChart3, Database, Settings } from "lucide-react";
import { Header } from "@/components/ui/header";
import { Footer } from "@/components/footer";
import { useTheme } from "@/components/theme-provider";


const features = [
  {
    title: "Voice AI Agents",
    description:
      "Design, train, and deploy enterprise-grade conversational AI agents with no code.",
    icon: <PhoneCall className="w-8 h-8 text-violet-400" />,
  },
  {
    title: "Analytics Dashboard",
    description:
      "Track performance, analyze call quality, and optimize user interactions in real-time.",
    icon: <BarChart3 className="w-8 h-8 text-blue-400" />,
  },
  {
    title: "Data Integrations",
    description:
      "Seamlessly connect with CRMs, databases, and APIs for intelligent automation.",
    icon: <Database className="w-8 h-8 text-cyan-400" />,
  },
  {
    title: "Security & Compliance",
    description:
      "Built with enterprise security protocols and full compliance for data privacy.",
    icon: <Shield className="w-8 h-8 text-emerald-400" />,
  },
  {
    title: "Customization & Control",
    description:
      "Configure workflows, permissions, and triggers that scale with your business.",
    icon: <Settings className="w-8 h-8 text-pink-400" />,
  },
];

const stats = [
  { label: "Active Agents", value: "42" },
  { label: "Total Calls", value: "18,972" },
  { label: "Response Accuracy", value: "97.3%" },
  { label: "Integrations", value: "15+" },
];

const PlatformPage = () => {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <div>
      {/* NAVBAR */}
      <Header />
      <div
        className={`min-h-screen px-6 md:px-16 py-16 transition-colors duration-500 ${
          isDark ? "bg-[#181223] text-white" : "bg-white text-gray-900"
        }`}
      >
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 mt-10"
        >
          <h1
            className={`text-4xl md:text-6xl font-bold bg-gradient-to-r from-violet-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent`}
          >
            Xseize Platform Overview
          </h1>
          <p
            className={`mt-4 max-w-2xl mx-auto text-lg transition-colors duration-500 ${
              isDark ? "text-gray-400" : "text-gray-600"
            }`}
          >
            Build, deploy, and scale your conversational AI agents from a unified,
            intelligent platform.
          </p>
        </motion.div>

        {/* Stats Section */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.7 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-20"
        >
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              whileHover={{ scale: 1.05 }}
              className={`backdrop-blur-md border rounded-2xl p-6 text-center shadow-md hover:shadow-violet-500/20 transition ${isDark ? "bg-white/5 border-white/10" : "bg-gray-100 border-gray-300"}`}
            >
              <p className="text-3xl font-semibold text-violet-400">{stat.value}</p>
              <p className={isDark ? "text-gray-400" : "text-gray-700 mt-2"}>{stat.label}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Features Section */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="grid md:grid-cols-3 gap-8"
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              whileHover={{ scale: 1.05, y: -5 }}
              transition={{ type: "spring", stiffness: 200 }}
              className={`rounded-2xl p-8 backdrop-blur-lg shadow-lg hover:shadow-violet-500/20 transition ${
                isDark
                  ? "bg-white/5 border border-white/10 hover:border-violet-400/50"
                  : "bg-gray-50 border border-gray-200 hover:border-violet-400/50"
              }`}
            >
              <div className="mb-4">{feature.icon}</div>
              <h3 className={isDark ? "text-xl font-semibold text-white mb-2" : "text-xl font-semibold mb-2"}>{feature.title}</h3>
              <p className={isDark ? "text-gray-400" : "text-gray-700"}>{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Footer CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="text-center mt-24"
        >
          <h2 className={isDark ? "text-3xl font-semibold text-white" : "text-3xl font-semibold text-gray-900"}>
            Start building with{" "}
            <span className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
              Xseize Platform
            </span>
          </h2>
          <p className={isDark ? "text-gray-400 mt-3 mb-6" : "text-gray-600 mt-3 mb-6"}>
            Your AI-powered future starts with one click.
          </p>
          <button
            className={`px-6 py-3 rounded-xl transition-colors duration-300 hover:opacity-90 ${
              isDark ? "bg-gradient-to-r from-violet-500 to-cyan-500" : "bg-gradient-to-r from-violet-600 to-cyan-600 text-white"
            }`}
          >
            <a href="/login">Get Started</a>
          </button>
        </motion.div>
      </div>
      <Footer />
    </div>
  );
};

export default PlatformPage;
