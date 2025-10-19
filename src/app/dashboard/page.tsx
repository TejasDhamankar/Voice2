'use client';

import { DashboardHeader } from '@/components/dashboard/header';
import { Button } from '@/components/ui/button';
import { Conversation } from '@/components/dashboard/Conversation';
import { Plus, Mic } from 'lucide-react';

export default function DashboardPage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#111]">
      <DashboardHeader />
      <main className="flex-1 overflow-y-auto p-6">
        <h1 className="text-2xl font-bold text-[#F3FFD4] mb-4">AI Voice Dashboard</h1>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-[#222] p-4 rounded-lg border border-[#333] flex flex-col items-start">
            <Plus className="h-6 w-6 mb-2 text-green-400"/>
            <h2 className="text-[#F3FFD4] font-semibold">Create Agent</h2>
            <p className="text-[#A7A7A7] text-sm">Create & configure new AI voice agents</p>
            <Button className="mt-2 bg-[#A7B3AC] text-[#111]">Create</Button>
          </div>

          <div className="bg-[#222] p-4 rounded-lg border border-[#333] flex flex-col items-start">
            <Mic className="h-6 w-6 mb-2 text-blue-400"/>
            <h2 className="text-[#F3FFD4] font-semibold">Live Conversation</h2>
            <p className="text-[#A7A7A7] text-sm">Start or stop conversation with your agent</p>
          </div>

          <div className="bg-[#222] p-4 rounded-lg border border-[#333] flex flex-col items-start">
            <Mic className="h-6 w-6 mb-2 text-yellow-400"/>
            <h2 className="text-[#F3FFD4] font-semibold">Agent Status</h2>
            <p className="text-[#A7A7A7] text-sm">View agent connection and call status</p>
          </div>
        </div>

        {/* Conversation component */}
        <Conversation/>
      </main>
    </div>
  );
}
