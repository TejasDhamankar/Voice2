"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Github, Linkedin, Twitter, Disc } from "lucide-react";


// Aurora background component tinted with the new color palette
const AuroraBackground = () => (
  <div
    className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0"
    aria-hidden="true"
  >
    <motion.div
      className="absolute top-1/2 left-1/2 w-[900px] h-[900px] bg-[radial-gradient(circle,rgba(243,255,212,0.07)_0%,rgba(167,179,172,0.05)_50%,transparent_70%)]"
      animate={{
        rotate: [0, 360],
        scale: [1, 1.1, 1],
      }}
      transition={{
        duration: 25,
        repeat: Infinity,
        repeatType: "mirror",
        ease: "easeInOut",
      }}
    />
  </div>
);

export function Footer() {
  const linkSections = [
    {
      title: "Platform",
      links: [
        { name: "AI Models", href: "/models" },
        { name: "API Reference", href: "/docs/api" },
        { name: "Pricing", href: "/pricing" },
        { name: "Use Cases", href: "/use-cases" },
      ],
    },
    {
      title: "Developers",
      links: [
        { name: "Documentation", href: "/docs" },
        { name: "SDKs & Libraries", href: "/docs/sdks" },
        { name: "Changelog", href: "/changelog" },
        { name: "API Status", href: "/status" },
      ],
    },
    {
      title: "Resources",
      links: [
        { name: "Blog", href: "/blog" },
        { name: "Tutorials", href: "/tutorials" },
        { name: "Community", href: "/community" },
        { name: "Contact Sales", href: "/contact-sales" },
      ],
    },
    {
      title: "Company",
      links: [
        { name: "About Us", href: "/about" },
        { name: "Careers", href: "/careers" },
        { name: "Terms of Service", href: "/terms-of-use" },
        { name: "Privacy Policy", href: "/privacy-policy" },
      ],
    },
  ];

  const socialLinks = [
    { icon: Github, href: "https://github.com/", label: "GitHub" },
    { icon: Linkedin, href: "https://linkedin.com/", label: "LinkedIn" },
    { icon: Twitter, href: "https://twitter.com/", label: "Twitter / X" },
    { icon: Disc, href: "https://discord.com/", label: "Community Discord" },
  ];

  return (
    <footer className="relative w-full border-t border-[#333333]  py-16 px-4 sm:px-6 lg:px-8 overflow-hidden bg-[#111111] text-[#A7A7A7]">
      <AuroraBackground />
      <div className="relative container mx-auto z-10">
        
        {/* Top Section: Call to Action */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-[#F3FFD4] mb-4">
            Start Building with AI Today
          </h2>
          <p className="max-w-2xl mx-auto mb-8 text-lg text-[#A7A7A7]">
            Integrate powerful, human-like voice AI into your applications in minutes.
          </p>
          <div className="flex justify-center gap-4">
            <motion.a
              href="/docs/api"
              className="px-6 py-3 font-semibold rounded-lg bg-[#F3FFD4] text-black transition-all transform-gpu hover:bg-opacity-90 hover:shadow-lg hover:shadow-[#F3FFD4]/20 focus:outline-none focus:ring-2 focus:ring-[#A7B3AC] focus:ring-offset-2 focus:ring-offset-[#111111]"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Get API Keys
            </motion.a>
            <motion.a
              href="/docs"
              className="px-6 py-3 font-semibold rounded-lg bg-[#333333]/50 text-[#F3FFD4] backdrop-blur-sm border border-[#333333] transition-colors hover:bg-[#333333]/80"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              View Docs
            </motion.a>
          </div>
        </motion.div>

        {/* Links Grid Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {linkSections.map((section) => (
            <div key={section.title}>
              <h3 className="font-semibold text-[#A7B3AC] mb-4 text-sm tracking-wider uppercase">
                {section.title}
              </h3>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.name}>
                    <Link href={link.href} className="text-[#A7A7A7] hover:text-[#F3FFD4] transition-colors duration-200">
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar: Copyright, Socials, and Status */}
        <div className="border-t border-[#333333] pt-8 flex flex-col sm:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-4">
            <Image src="/logo.png" alt="Xseize Logo" width={32} height={32} className="rounded-lg"/>
            <p className="text-sm text-[#A7A7A7]">
              &copy; {new Date().getFullYear()} XSeize. All rights reserved.
            </p>
          </div>
          
          <div className="flex items-center gap-5 text-[#A7A7A7]">
             <Link href="/status" className="flex items-center gap-2 text-sm font-medium hover:text-green-400 transition-colors">
               <div className="relative flex h-2.5 w-2.5">
                 <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                 <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
               </div>
               All Systems Normal
            </Link>
            <div className="h-6 w-px bg-[#333333]"></div>
            {socialLinks.map(({ icon: Icon, href, label }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="hover:text-[#F3FFD4] transition-colors"
              >
                <Icon size={20} />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}