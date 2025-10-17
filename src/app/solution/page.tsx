'use client';

// FIX 2: Removed unused 'React' import.
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  MotionValue,
} from "framer-motion";
import {
  CheckCircle2,
  PhoneCall,
  Headphones,
  CalendarClock,
  Layers,
  Database,
} from "lucide-react";
import { Header } from "@/components/ui/header";
import { Footer } from "@/components/footer";
import { useTheme } from "@/components/theme-provider";

// COLORS
const COLORS = {
  background: "#111111",
  primaryHeadline: "#F3FFD4", // For main text
  textSecondary: "#A7A7A7",   // For paragraphs and subtext
  accent: "#A7B3AC",          // For subtle highlights
  border: "#333333",
  white: "#FFFFFF",
};

const solutionDetails = [
  {
    // FIX 3: Changed hardcoded color to use the color palette for consistency.
    icon: <PhoneCall className="w-12 h-12 text-blue-500" />,
    title: "Sales Outreach",
    description:
      "Automate lead qualification and follow-ups using intelligent AI voice agents that engage customers 24/7. Increase conversions while saving time and resources.",
    features: ["CRM Integration", "Personalized conversations", "Real-time analytics", "Automatic follow-ups"],
  },
  {
    icon: <Headphones className="w-12 h-12 text-green-500" />,
    title: "Customer Support",
    description:
      "Handle common support queries instantly with AI voice responses. Free up human agents for complex issues while maintaining 24/7 support coverage.",
    features: ["Natural language understanding", "Smart escalation logic", "Sentiment detection", "Multilingual support"],
  },
  {
    icon: <CalendarClock className="w-12 h-12 text-purple-500" />,
    title: "Appointment Scheduling",
    description:
      "Let your AI schedule, confirm, or reschedule appointments automatically — synced directly to your business calendar.",
    features: ["Calendar integration", "Custom reminders", "Rescheduling logic", "Multi-language support"],
  },
  {
    icon: <CheckCircle2 className="w-12 h-12 text-indigo-500" />,
    title: "AI Agents",
    description:
      "Manage your intelligent voice AI assistants and monitor their activity in one unified dashboard.",
    features: ["Multi-agent management", "Activity tracking", "Performance analytics", "AI learning improvements"],
  },
  {
    icon: <Layers className="w-12 h-12 text-orange-500" />,
    title: "Call History",
    description:
      "Access all call logs and transcripts easily. Analyze customer interactions for better insights and decision-making.",
    features: ["Full transcript access", "Search & filter options", "Performance tracking", "Exportable call logs"],
  },
  {
    icon: <Database className="w-12 h-12 text-teal-500" />,
    title: "Leads & CRM",
    description:
      "Centralize your leads, automate pipeline stages, and maintain a detailed customer database — all connected with your AI agents.",
    features: ["Lead management dashboard", "Pipeline automation", "Customer segmentation", "Real-time updates"],
  },
];

const SolutionCard = ({ solution, index }: { solution: (typeof solutionDetails)[0], index: number }) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseX = useSpring(x, { stiffness: 300, damping: 30 });
  const mouseY = useSpring(y, { stiffness: 300, damping: 30 });

  const rotateX = useTransform(mouseY, [-0.5, 0.5], ["10deg", "-10deg"]);
  const rotateY = useTransform(mouseX, [-0.5, 0.5], ["-10deg", "10deg"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const mouseXPercent = (e.clientX - left) / width - 0.5;
    const mouseYPercent = (e.clientY - top) / height - 0.5;
    x.set(mouseXPercent);
    y.set(mouseYPercent);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      viewport={{ once: true }}
      style={{
        backgroundColor: "rgba(17, 17, 17, 0.5)",
        borderColor: COLORS.border,
        color: COLORS.primaryHeadline,
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
      }}
      className="rounded-2xl p-8 shadow-lg border backdrop-blur-xl"
    >
      <div style={{ transform: "translateZ(20px)" }} className="flex flex-col md:flex-row md:items-start md:gap-10">
        <div className="mb-6 md:mb-0 flex-shrink-0">{solution.icon}</div>
        <div>
          <h2 style={{ color: COLORS.primaryHeadline }} className="text-3xl font-semibold mb-4">{solution.title}</h2>
          <p style={{ color: COLORS.textSecondary }} className="mb-6 leading-relaxed">{solution.description}</p>
          <ul className="space-y-3">
            {solution.features.map((feature, i) => (
              <li key={i} className="flex items-center gap-2" style={{ color: COLORS.textSecondary }}>
                <CheckCircle2 className="w-5 h-5" style={{ color: COLORS.accent }} />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </motion.div>
  );
};

const SolutionsPage = () => {
  // FIX 2: Removed unused `isDark` variable.
  const { theme } = useTheme();

  return (
    <section>
      <Header />
      <div
        className="min-h-screen relative overflow-hidden transition-colors duration-300"
        style={{ backgroundColor: COLORS.background, color: COLORS.primaryHeadline }}
      >
        {/* Background effects */}
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute top-1/4 left-1/4 w-[400px] h-[400px] rounded-full blur-[100px]"
            style={{ backgroundColor: COLORS.accent + "33" }} // 20% opacity
          />
          <div
            className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full blur-[100px]"
            style={{ backgroundColor: COLORS.accent + "33" }}
          />
        </div>

        {/* Hero Section */}
        <section className="text-center py-20 px-6">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            style={{ color: COLORS.primaryHeadline }}
            className="text-5xl font-bold mb-12"
          >
            Smart AI Voice Assistants for Your Business
          </motion.h1>
          <p
            style={{ color: COLORS.textSecondary }}
            className="max-w-2xl mx-auto text-lg mb-12"
          >
            See how AI voice assistants can streamline every aspect of your business from sales and support to managing leads.
          </p>
        </section>

        {/* Scrollable Detailed Sections */}
        <div className="space-y-16 px-6 lg:px-20 pb-20" style={{ perspective: "1000px" }}>
          {solutionDetails.map((solution, index) => (
            <SolutionCard key={index} solution={solution} index={index} />
          ))}
        </div>

        {/* CTA Section */}
        <motion.section
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          style={{
            backgroundColor: COLORS.background,
            borderColor: COLORS.border,
          }}
          className="text-center py-20 border-t transition-colors"
        >
          <h2
            style={{ color: COLORS.primaryHeadline }}
            className="text-3xl font-semibold mb-4"
          >
            Empower Your Team with Intelligent Automation
          </h2>
          <p
            style={{ color: COLORS.textSecondary }}
            className="max-w-xl mx-auto mb-8"
          >
            Boost your team’s productivity with AI voice automation and manage customer interactions seamlessly from a single platform.
          </p>
        </motion.section>
      </div>
      <Footer />
    </section>
  );
};

export default SolutionsPage;