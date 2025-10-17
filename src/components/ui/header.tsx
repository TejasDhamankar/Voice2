"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, useSpring, useMotionTemplate } from "framer-motion";

import { Menu as MenuIcon } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";




// The color palette you're using
const COLORS = {
  background: "#111111",
  primaryHeadline: "#F3FFD4",
  textSecondary: "#A7A7A7",
  accent: "#A7B3AC",
  border: "#333333",
};

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const navRef = useRef<HTMLElement>(null);

  // --- START: HOVER EFFECT LOGIC ---
  const mouseX = useSpring(0, { stiffness: 400, damping: 40 });

  function handleMouseMove({ currentTarget, clientX }: React.MouseEvent) {
    if (!currentTarget) return;
    const { left } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
  }
  // --- END: HOVER EFFECT LOGIC ---

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Use Cases", href: "/solution" },
    { name: "Product", href: "/platform" },
    { name: "Subscriptions", href: "/pricing" },
    { name: "Connectors", href: "/Integrations" }, // Corrected link from /pricing to /integration
  ];

  return (
    <motion.header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-[#111111]/80 backdrop-blur-lg border-b"
          : "bg-transparent border-b border-transparent"
      )}
      style={{
        borderColor: scrolled ? COLORS.border : "transparent",
      }}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <nav
        ref={navRef}
        onMouseMove={handleMouseMove}
        className="container mx-auto px-4 h-20 flex justify-between items-center relative"
      >
        {/* HOVER EFFECT SPOTLIGHT */}
        <motion.div
          className="absolute inset-0 z-0" // Removed rounded-full to make the effect span the whole navbar width
          style={{
            background: useMotionTemplate`
              radial-gradient(
                250px circle at ${mouseX}px,
                rgba(243, 255, 212, 0.1),
                transparent 80%
              )
            `,
          }}
        />

        {/* Left Side: Logo */}
        <div className="flex-1 flex justify-start z-10">
          <Link href="/" className="flex items-center gap-3">
            <div
              className="h-9 w-9 rounded-full"
              style={{ backgroundColor: COLORS.accent }}
            />
            <span
              className="text-2xl font-bold tracking-tight"
              style={{ color: COLORS.primaryHeadline }}
            >
              Voiceryn
            </span>
          </Link>
        </div>

        {/* Center: Simple Navigation Links */}
        <div className="hidden md:flex flex-1 justify-center z-10">
          <div className="flex items-center gap-4 p-1 rounded-full" style={{backgroundColor: "rgba(51, 51, 51, 0.5)"}}>
             {navLinks.map((link) => (
               <Link
                 key={link.name}
                 href={link.href}
                 className="px-4 py-2 rounded-full text-sm font-medium transition-colors duration-300 hover:text-[#F3FFD4] hover:scale-105" // Added hover text color change
                 style={{ color: COLORS.textSecondary }}
               >
                 {link.name}
               </Link>
             ))}
          </div>
        </div>


        {/* Right Side: Sign In Button */}
        <div className="hidden md:flex flex-1 justify-end z-10">
          <Button
            asChild
            className="rounded-full font-semibold transition-all duration-300 hover:bg-[#F3FFD4] hover:text-[#111111]"
            style={{
              backgroundColor: "transparent",
              border: `1px solid ${COLORS.accent}`, // <-- FIX 1: Corrected JS syntax for the border style
              color: COLORS.primaryHeadline,
              padding: "10px 24px",
            }}
          >
            <Link href="/login">Sign In</Link>
          </Button>
        </div>

        {/* Mobile Menu */}
        <div className="md:hidden z-10">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <MenuIcon style={{ color: COLORS.primaryHeadline }} /> {/* <-- FIX 2: Used a valid color */}
              </Button>
            </SheetTrigger>
            <SheetContent
              style={{
                backgroundColor: COLORS.background,
                borderColor: COLORS.border,
              }}
            >
              <nav className="flex flex-col space-y-6 mt-8">
                {navLinks.map((link) => (
                  <Link
                    key={link.name}
                    href={link.href}
                    className="text-xl"
                    style={{ color: COLORS.textSecondary }}
                  >
                    {link.name}
                  </Link>
                ))}
                <Button
                  asChild
                  variant="outline"
                  className="w-full rounded-full font-semibold mt-4"
                  style={{
                    borderColor: COLORS.primaryHeadline,
                    color: COLORS.primaryHeadline,
                  }}
                >
                  <Link href="/signin">Sign In</Link>
                </Button>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </motion.header>
  );
}