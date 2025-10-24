'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardHeader } from '@/components/dashboard/header';
import { Conversation } from '@/components/dashboard/Conversation';
import { Plus, Users, Phone, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.5,
      ease: "easeOut"
    },
  }),
};

const ActionCard = ({ href, icon: Icon, title, description, index }: { href: string; icon: React.ElementType; title: string; description: string; index: number }) => (
  <motion.div
    variants={cardVariants}
    initial="hidden"
    animate="visible"
    custom={index}
    whileHover={{ y: -5, boxShadow: "0px 10px 20px rgba(167, 179, 172, 0.1)" }}
    transition={{ duration: 0.2 }}
  >
    <Link href={href} className="block h-full">
      <div className="bg-[#1a1a1a] p-6 rounded-xl border border-[#333333] h-full flex flex-col items-start transition-colors duration-300 ease-in-out hover:border-[#A7B3AC]">
        <div className="bg-[#A7B3AC]/10 p-3 rounded-lg mb-4">
          <Icon className="h-6 w-6 text-[#A7B3AC]"/>
        </div>
        <h2 className="text-[#F3FFD4] font-semibold text-lg mb-1">{title}</h2>
        <p className="text-[#A7A7A7] text-sm flex-grow">{description}</p>
        <div className="text-[#A7B3AC] text-sm font-medium flex items-center mt-4 group">
          Go to {title}
          <ArrowRight className="h-4 w-4 ml-2 transform group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </Link>
  </motion.div>
);

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="flex flex-col min-h-screen bg-[#111111] text-foreground">
      <DashboardHeader />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
        <motion.div 
          className="max-w-7xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-[#F3FFD4]">AI Voice Dashboard</h1>
            <p className="text-[#A7A7A7] mt-2 text-lg">
              Welcome back, {user?.name || 'User'}! Here's your command center.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <ActionCard href="/dashboard/agents" icon={Users} title="Agents" description="Configure, test, and deploy your AI voice agents." index={1} />
            <ActionCard href="/dashboard/calls" icon={Phone} title="Calls" description="Review call logs, analyze performance, and listen to recordings." index={2} />
            <ActionCard href="/dashboard/new-agent" icon={Plus} title="Create Agent" description="Build a new, specialized AI voice agent from scratch." index={3} />
          </div>

          {/* Conversation component */}
          <Card className="bg-[#1a1a1a] border border-[#333333] shadow-lg">
            <CardHeader>
              <CardTitle className="text-[#F3FFD4]">Live Conversation</CardTitle>
              <CardDescription className="text-[#A7A7A7]">Interact with your agents in real-time to test and refine them.</CardDescription>
            </CardHeader>
            <CardContent>
              <Conversation/>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
}
