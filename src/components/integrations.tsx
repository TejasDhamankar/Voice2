"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { 
    Brain, 
    Atom, 
    Zap, 
    ArrowRight, 
    HardDrive, 
    Github, 
    Cloud, 
    CodeXml, 
    Layers, 
    MessageSquare, 
    BriefcaseBusiness,
    CalendarDays,
    Asterisk,
    Send,
    LayoutGrid
} from "lucide-react";

// The new color palette
const COLORS = {
    background: "#111111",
    primaryHeadline: "#F3FFD4",
    textSecondary: "#A7A7A7",
    accent: "#A7B3AC",
    border: "#333333",
    white: "#FFFFFF",
};

// Data for the scrolling marquee (no changes)
const integrationsMarquee = [
    { name: "Salesforce", logo: "/logos/salesforce.webp" },
    { name: "HubSpot", logo: "/logos/hubspot.png" },
    { name: "Zendesk", logo: "/logos/zendesk.png" },
    { name: "Intercom", logo: "/logos/intercom.png" },
    { name: "Shopify", logo: "/logos/shopify.png" },
    { name: "Zoom", logo: "/logos/zoom.png" },
    { name: "Google Calendar", logo: "/logos/google.png" },
    { name: "Microsoft Teams", logo: "/logos/teams.png" },
    { name: "Slack", logo: "/logos/slack.png" },
    { name: "Zapier", logo: "/logos/zapier.png" },
    { name: "Twilio", logo: "/logos/twilio.png" },
    { name: "Pipedrive", logo: "/logos/pipedrive.png" },
];

// Data for the grid section (no changes)
const partnerIntegrationsGrid = [
    { name: "Amazon", icon: <Cloud className="w-8 h-8" />, description: "Connect your workflow to scalable cloud power for better performance.", link: "#" },
    { name: "Docker", icon: <HardDrive className="w-8 h-8" />, description: "Deploy and manage containerized apps with flexibility and speed.", link: "#" },
    { name: "GitHub", icon: <Github className="w-8 h-8" />, description: "Protect all your digital activity and data from unwanted.", link: "#" },
    { name: "Google", icon: <CodeXml className="w-8 h-8" />, description: "Integrate with Google tools to boost productivity and connectivity.", link: "#" },
    { name: "Microsoft", icon: <Layers className="w-8 h-8" />, description: "Enhance collaboration with Microsoft's suite of business tools.", link: "#" },
    { name: "Slack", icon: <MessageSquare className="w-8 h-8" />, description: "Streamline communication and team collaboration.", link: "#" },
    { name: "Salesforce", icon: <BriefcaseBusiness className="w-8 h-8" />, description: "Manage customer relationships and sales pipelines efficiently.", link: "#" },
    { name: "Stripe", icon: <Zap className="w-8 h-8" />, description: "Process payments seamlessly and securely.", link: "#" },
];

// Data for the visual integrations section
const visualIntegrations = [
  { name: "Google Calendar", icon: <CalendarDays className="w-8 h-8 text-white" />, position: "bottom-16 left-8 sm:bottom-24 sm:left-20", animationDelay: 0.1 },
  { name: "Workflow Automator", icon: <Asterisk className="w-8 h-8 text-white" />, position: "top-32 left-4 sm:top-40 sm:left-12", animationDelay: 0.2 },
  { name: "Dispatcher", icon: <Send className="w-8 h-8 text-white" />, position: "top-8 left-1/2 -translate-x-1/2", animationDelay: 0.3 },
  { name: "Slack", icon: <MessageSquare className="w-8 h-8 text-white" />, position: "top-32 right-4 sm:top-40 sm:right-12", animationDelay: 0.4 },
  { name: "Jira", icon: <LayoutGrid className="w-8 h-8 text-white" />, position: "bottom-16 right-8 sm:bottom-24 sm:right-20", animationDelay: 0.5 },
];

// Reusable component for the scrolling marquee (no changes)
const Marquee = ({ children, direction = "left" }) => {
    const marqueeVariants = {
        animate: {
            x: direction === "left" ? ["0%", "-100%"] : ["-100%", "0%"],
            transition: { x: { repeat: Infinity, repeatType: "loop", duration: 30, ease: "linear" } },
        },
    };
    return (
        <div className="w-full overflow-hidden">
            <motion.div className="flex" variants={marqueeVariants} animate="animate">{children}</motion.div>
        </div>
    );
};

export function Integrations() {
    const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } } };
    const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };
    const iconVariants = {
        hidden: { opacity: 0, scale: 0.5 },
        visible: (delay) => ({ opacity: 1, scale: 1, transition: { type: "spring", stiffness: 260, damping: 20, delay } }),
    };
    const floatingAnimation = { y: ["-6px", "6px"], transition: { repeat: Infinity, repeatType: "reverse", duration: 3, ease: "easeInOut" } };

    return (
        <section
            id="integrations"
            className="relative w-full overflow-hidden py-24 sm:py-32 bg-[#111111] text-[#A7A7A7]"
        >
            {/* Background decorative gradient */}
            <div 
                aria-hidden="true" 
                className="absolute top-0 left-1/2 -translate-x-1/2 w-[150%] h-[150%] sm:w-[80rem] sm:h-[80rem] -z-10 bg-[radial-gradient(circle_at_center,_#1A202C_0,_#111111_50%)]"
            />
            
            <motion.div
                className="container max-w-5xl mx-auto px-4 text-center"
                initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} variants={containerVariants}
            >
                <motion.div
                    className="inline-flex items-center gap-2 px-4 py-1.5 mb-6 text-sm font-medium rounded-full border border-[#333333] bg-white/5"
                    variants={itemVariants}
                >
                    <Brain className="inline h-4 w-4 text-[#A7B3AC]" />
                    Powered by AI, Connected to Your World
                </motion.div>
                <motion.h2
                    className="text-4xl sm:text-6xl font-bold tracking-tighter mb-6 text-[#F3FFD4]"
                    variants={itemVariants}
                >
                    Smart Integrations.<br />Infinite Possibilities.
                </motion.h2>
                <motion.p
                    className="max-w-2xl mx-auto text-lg sm:text-xl leading-relaxed mb-16"
                    variants={itemVariants}
                >
                    Leverage AI to seamlessly connect your essential tools. Automate workflows and keep your data intelligent and synchronized across every platform you use.
                </motion.p>
            </motion.div>

            {/* Scrolling Marquee Section */}
            <div className="relative py-12 space-y-6">
                <div className="absolute inset-y-0 left-0 w-24 z-10 bg-gradient-to-r from-[#111111] to-transparent" />
                <div className="absolute inset-y-0 right-0 w-24 z-10 bg-gradient-to-l from-[#111111] to-transparent" />
                <Marquee direction="left">
                    {[...integrationsMarquee, ...integrationsMarquee].map((integration, i) => (
                        <div key={`marquee-1-${i}`} className="flex-shrink-0 flex items-center justify-center w-48 h-24 mx-4 rounded-xl border border-[#333333] bg-white/5 p-4">
                            <Image src={integration.logo} alt={integration.name} width={100} height={40} className="h-10 w-auto object-contain brightness-0 invert" />
                        </div>
                    ))}
                </Marquee>
                <Marquee direction="right">
                    {[...integrationsMarquee, ...integrationsMarquee].reverse().map((integration, i) => (
                        <div key={`marquee-2-${i}`} className="flex-shrink-0 flex items-center justify-center w-48 h-24 mx-4 rounded-xl border border-[#333333] bg-white/5 p-4">
                            <Image src={integration.logo} alt={integration.name} width={100} height={40} className="h-10 w-auto object-contain brightness-0 invert" />
                        </div>
                    ))}
                </Marquee>
            </div>

            {/* API CTA */}
            <motion.div
                className="container max-w-4xl mx-auto px-4 mt-24"
                initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.5 }} transition={{ duration: 0.6 }}
            >
                <div className="relative flex flex-col md:flex-row items-center justify-between gap-8 p-8 md:p-12 rounded-2xl border border-[#333333] bg-white/5 backdrop-blur-sm">
                    <div className="text-center md:text-left">
                        <Atom className="h-8 w-8 mx-auto md:mx-0 mb-4 text-[#A7B3AC]" />
                        <h3 className="text-2xl font-bold mb-2 text-[#F3FFD4]">Power Your AI with Our API</h3>
                        <p className="text-[#A7A7A7]">Our flexible API lets you customize and extend AI capabilities.</p>
                    </div>
                    <a href="/developers" className="inline-flex items-center justify-center px-6 py-3 font-semibold rounded-lg transition-all group bg-[#A7B3AC] text-[#111111] hover:bg-opacity-90">
                        Explore Developer Docs
                        <Zap className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </a>
                </div>
            </motion.div>

            {/* Partner Integrations Grid */}
            <section className="py-24 sm:py-32">
                <div className="container max-w-6xl mx-auto px-4 text-center">
                    <h2 className="text-4xl sm:text-5xl font-bold mb-4 tracking-tighter text-[#F3FFD4]">Partnering With Leading<br />Software Firms Worldwide</h2>
                    <p className="text-lg sm:text-xl mb-16 text-[#A7A7A7]">Learn about all available integrations.</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                        {partnerIntegrationsGrid.map((integration, index) => (
                            <motion.a
                                key={integration.name} href={integration.link}
                                className="relative flex flex-col justify-start text-left p-6 rounded-2xl transition-all duration-300 group bg-white/5 border border-[#333333] hover:border-[#A7B3AC]/50 hover:bg-white/10"
                                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.3 }} transition={{ duration: 0.5, delay: index * 0.1 }} whileHover={{ y: -8, transition: { duration: 0.2 } }}>
                                {/* eslint-disable-next-line tailwindcss/no-custom-classname */}
                                <div className="absolute -inset-px rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                                    style={{ boxShadow: '0 0 2rem -0.5rem rgba(167, 179, 172, 0.5)', border: '1px solid rgba(167, 179, 172, 0.3)' }} />
                                <div className="absolute top-4 right-4 text-[#A7A7A7] group-hover:text-[#A7B3AC] transition-colors"><ArrowRight className="w-5 h-5" /></div>
                                <div className="mb-4 text-[#A7B3AC]">{integration.icon}</div>
                                <h3 className="text-xl font-semibold mb-2 text-[#F3FFD4]">{integration.name}</h3>
                                <p className="text-sm leading-relaxed text-[#A7A7A7]">{integration.description}</p>
                            </motion.a>
                        ))}
                    </div>
                </div>
            </section>
            
            {/* Visual Showcase Section */}
            <motion.div 
                className="container max-w-5xl mx-auto px-4 mt-16 sm:mt-0"
                initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} transition={{ staggerChildren: 0.2 }}
            >
                <motion.div variants={itemVariants} className="text-center">
                    <div className="inline-block px-4 py-1.5 mb-4 text-sm rounded-full border border-[#333333] bg-white/5 text-[#A7A7A7]">Integrations</div>
                    <h2 className="text-4xl sm:text-5xl font-bold tracking-tighter mb-4 text-[#F3FFD4]">Works With Tools You Already Use</h2>
                    <p className="max-w-xl mx-auto text-lg text-[#A7A7A7]">Nexum connects with your favorite apps, so you don&apos;t have to start from scratch or change your flow.</p>
                </motion.div>
        
                <motion.div 
                    className="relative mt-16 sm:mt-20 p-8 rounded-3xl bg-white/5 border border-[#333333] backdrop-blur-lg"
                    variants={itemVariants}
                >
                    <div className="relative aspect-[16/9] w-full">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/5 h-3/5 bg-[#A7B3AC]/10 rounded-full blur-3xl -z-10" />
                        <svg aria-hidden="true" className="absolute inset-0 w-full h-full text-[#333333]/80" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 762 433">
                            {/* --- FIX START --- */}
                            {/* The original 'd' attribute contained corrupted data for the last few paths. */}
                            {/* It has been replaced with a corrected string to render all connecting lines properly. */}
                            <path stroke="currentColor" strokeDasharray="4 4" strokeLinecap="round" d="M381 216.5C282.97 216.5 204 153.323 204 77.5M381 216.5c98.03 0 177-63.177 177-139M381 216.5c-44.183 0-80 77.165-80 172.5M381 216.5c44.183 0 80 77.165 80 172.5M381 216.5C461 44 539.97 129.823 539.97 205.677" />
                            {/* --- FIX END --- */}
                        </svg>
                        
                        <motion.div 
                            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center text-center w-48 h-32 sm:w-60 sm:h-40 p-4 rounded-2xl bg-black/20 border border-[#333333] backdrop-blur-md z-10"
                            custom={0} variants={iconVariants} animate={floatingAnimation}
                        >
                            <p className="text-2xl sm:text-3xl font-bold text-[#A7B3AC]">+18</p>
                            <p className="font-semibold text-[#F3FFD4] mt-1">Smooth-running integrations</p>
                            <p className="text-xs text-[#A7A7A7] mt-2">Your favorite tools, finally working together</p>
                        </motion.div>
        
                        {visualIntegrations.map((item) => (
                            <motion.div
                                key={item.name}
                                className={`absolute w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center rounded-2xl bg-white/10 border border-white/20 backdrop-blur-lg z-10 ${item.position}`}
                                custom={item.animationDelay} variants={iconVariants} animate={floatingAnimation}
                            >
                                {item.icon}
                            </motion.div>
                        ))}
                    </div>
                    <div className="mt-6 text-center">
                        <a href="#" className="inline-block px-4 py-1.5 text-sm rounded-full border border-[#333333] bg-white/5 text-[#A7A7A7] hover:border-[#A7B3AC]/50">
                            Integrations
                        </a>
                    </div>
                </motion.div>
            </motion.div>
        </section>
    );
}