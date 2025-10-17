"use client";

import { motion, useScroll, useTransform, useMotionValue, useSpring } from "framer-motion";
import Link from "next/link";
import { Button } from "./ui/button";
import { ArrowRight, CheckCircle } from "lucide-react";


// The unified color palette for a premium, cohesive look
const COLORS = {
  background: "#111111",
  primaryHeadline: "#F3FFD4",
  textSecondary: "#A7A7A7",
  accent: "#A7B3AC",
  border: "#333333",
};

export function CTASection() {
  // --- START: 3D Hover Effect Logic ---
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseX = useSpring(x, { stiffness: 300, damping: 30 });
  const mouseY = useSpring(y, { stiffness: 300, damping: 30 });

  const rotateX = useTransform(mouseY, [-0.5, 0.5], ["12.5deg", "-12.5deg"]);
  const rotateY = useTransform(mouseX, [-0.5, 0.5], ["-12.5deg", "12.5deg"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
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
  // --- END: 3D Hover Effect Logic ---

  // Content has been rewritten for a stronger impact
  const features = [
    "14-day free trial, no credit card required",
    "Instant access to all platform features",
    "Cancel anytime with no long-term contracts",
  ];

  return (
    <section
      className="relative overflow-hidden py-24 sm:py-32 bg-black"
    >
      {/* Subtle "Aurora" background glow */}
      <div 
        className="absolute -bottom-1/2 left-1/2 -translate-x-1/2 w-[150%] h-[900px] rounded-full"
        style={{
            background: `radial-gradient(circle at center, ${COLORS.accent}1A, transparent 40%)`,
            filter: 'blur(120px)'
        }}
      />

      <div className="container mx-auto relative z-10" style={{ perspective: "1000px" }}>
        <motion.div
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="max-w-4xl mx-auto text-center p-8 sm:p-12 rounded-3xl group"
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.03)",
            border: `1px solid ${COLORS.border}`,
            backdropFilter: 'blur(12px)',
            rotateX,
            rotateY,
            transformStyle: "preserve-3d",
          }}
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <div style={{ transform: "translateZ(50px)", transformStyle: "preserve-3d" }}>
          <h2
            className="text-4xl sm:text-5xl font-bold tracking-tighter"
            style={{ color: COLORS.primaryHeadline }}
          >
            Ready to Revolutionize Your Business?
          </h2>
          
          <p
            className="mt-6 text-lg sm:text-xl leading-relaxed max-w-2xl mx-auto"
            style={{ color: COLORS.textSecondary }}
          >
            Join hundreds of forward-thinking companies transforming their operations with our AI workforce. Get started today and experience the future of business communication.
          </p>

          <div className="my-10 flex flex-col sm:flex-row justify-center items-center gap-x-8 gap-y-4">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                className="flex items-center gap-3"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 0.6, delay: 0.2 + index * 0.1 }}
              >
                <CheckCircle className="h-5 w-5 flex-shrink-0" style={{ color: COLORS.accent }} />
                <span style={{ color: COLORS.textSecondary }}>{feature}</span>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <Button asChild size="lg" className="rounded-full font-semibold group transition-all duration-300 text-[#111111] hover:scale-105 text-lg" 
              style={{
                backgroundColor: COLORS.primaryHeadline,
                padding: "16px 36px",
              }}
            >
              <Link href="/signup">
                Start Your Free Trial
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}