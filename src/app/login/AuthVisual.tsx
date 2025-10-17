"use client";

import { motion } from "framer-motion";
import { BrainCircuit, Mic, Phone, Waves } from "lucide-react";
import Link from "next/link";

const icons = [
  { icon: <Mic className="h-8 w-8" />, name: "Voice Input" },
  { icon: <BrainCircuit className="h-8 w-8" />, name: "AI Processing" },
  { icon: <Waves className="h-8 w-8" />, name: "Natural Language" },
  { icon: <Phone className="h-8 w-8" />, name: "Telephony" },
];

export function AuthVisual() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2, delayChildren: 0.3 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } },
  };

  return (
    <motion.div
      className="relative hidden h-full flex-col bg-muted p-10 text-white dark:border-r lg:flex"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 to-black" />
      <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] bg-repeat opacity-[0.07]"></div>

      <motion.div
        className="relative z-20 flex items-center text-2xl font-bold"
        variants={itemVariants}
      >
        <Link href="/" className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-primary" />
            <span>Voiceryn</span>
        </Link>
      </motion.div>

      <motion.div className="relative z-20 mt-auto" variants={itemVariants}>
        <blockquote className="space-y-2">
          <p className="text-lg">
            &ldquo;This platform has revolutionized our customer interaction. The AI agents are indistinguishable from humans, handling calls with remarkable efficiency and accuracy.&rdquo;
          </p>
          <footer className="text-sm">Sarah Johnson, CTO</footer>
        </blockquote>
      </motion.div>

      <motion.div
        className="relative z-20 mt-12 grid grid-cols-2 gap-6"
        variants={containerVariants}
      >
        {icons.map((item) => (
          <motion.div
            key={item.name}
            className="flex items-center gap-3 rounded-lg bg-white/5 p-3 backdrop-blur-sm"
            variants={itemVariants}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-md bg-primary/10 text-primary">
              {item.icon}
            </div>
            <span className="font-medium text-primary-foreground">{item.name}</span>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
}