import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Image from "next/image";

const agentTypes = [
  {
    id: "support",
    name: "Support Agent",
    description: "Handle customer inquiries and provide instant solutions to common problems",
    image: "/support-agent.png"
  },
  {
    id: "sales",
    name: "Sales Agent",
    description: "Qualify leads, answer product questions, and guide prospects through the sales funnel",
    image: "/sales-agent.png"
  },
  {
    id: "booking",
    name: "Booking Agent",
    description: "Schedule appointments and manage calendar bookings without human intervention",
    image: "/booking-agent.png"
  },
  {
    id: "qualifier",
    name: "Lead Qualifier",
    description: "Pre-screen potential customers and gather important information before human follow-up",
    image: "/qualifier-agent.png"
  }
];

export function AgentShowcase() {
  return (
    <section className="py-20">
      <div className="text-center mb-16">
        <h2 className="text-4xl font-bold mb-4">Meet Your AI Voice Agents</h2>
        <p className="text-xl text-gray-400 max-w-3xl mx-auto">
          Specialized AI agents designed for different business needs
        </p>
      </div>

      <Tabs defaultValue="support" className="w-full">
        <TabsList className="flex justify-center mb-12 bg-gray-900/50 p-1">
          {agentTypes.map((agent) => (
            <TabsTrigger
              key={agent.id}
              value={agent.id}
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-violet-600 data-[state=active]:text-white px-6 py-3"
            >
              {agent.name}
            </TabsTrigger>
          ))}
        </TabsList>

        {agentTypes.map((agent) => (
          <TabsContent key={agent.id} value={agent.id} className="mt-0">
            <motion.div
              className="flex flex-col lg:flex-row items-center gap-12"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <div className="flex-1">
                <div className="relative h-[400px] w-full">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-violet-500/20 rounded-3xl blur-3xl -z-10" />
                  <Image
                    src={agent.image}
                    alt={agent.name}
                    fill
                    className="object-contain"
                  />
                </div>
              </div>

              <div className="flex-1">
                <h3 className="text-3xl font-bold mb-4">{agent.name}</h3>
                <p className="text-xl text-gray-300 mb-6">{agent.description}</p>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-blue-500" />
                    <span>Natural conversation with context awareness</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-violet-500" />
                    <span>Custom voice and personality matching your brand</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-indigo-500" />
                    <span>Seamless handoff to human agents when needed</span>
                  </li>
                </ul>
                <Button className="bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700">
                  Try {agent.name}
                </Button>
              </div>
            </motion.div>
          </TabsContent>
        ))}
      </Tabs>
    </section>
  );
}
