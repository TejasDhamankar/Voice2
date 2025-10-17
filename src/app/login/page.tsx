"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import {
    Loader2, Eye, EyeOff, ArrowRight, Mail, Lock, AlertCircle
} from "lucide-react";

// UI Components
// NOTE: AuthVisual is no longer imported or used.
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";


// Form schema for validation (unchanged)
const loginSchema = z.object({
    email: z.string().email("Please enter a valid email address."),
    password: z.string().min(6, "Password must be at least 6 characters."),
});

export default function LoginPage() {
    const { login, error, loading } = useAuth();
    const [showPassword, setShowPassword] = useState(false);

    const form = useForm<z.infer<typeof loginSchema>>({
        resolver: zodResolver(loginSchema),
        defaultValues: { email: "", password: "" },
    });

    const onSubmit = (data: z.infer<typeof loginSchema>) => login(data.email, data.password);

    // Animation variants
    const staggerContainer = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                staggerChildren: 0.08, // Slightly faster stagger
                delayChildren: 0.1,
                ease: "easeOut"
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } }
    };

    return (
        // Entire page as a flex container to center the card
        <div className="flex items-center justify-center min-h-screen bg-[#111111] p-4 sm:p-6 lg:p-8">
            {/* Subtle radial gradient background */}
            <div
                aria-hidden="true"
                className="absolute inset-0 z-0 bg-gradient-to-br from-[#111111] via-[#1A1A1A] to-[#0A0A0A]"
            />

            {/* Premium Login Card Container */}
            <motion.div
                className="relative z-10 w-full max-w-sm p-8 sm:p-10 rounded-2xl border border-[#333333] bg-[#1a1a1a] shadow-xl transition-all duration-500 ease-out"
                style={{ boxShadow: '0 4px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)' }} // Soft, premium shadow
                initial="hidden"
                animate="visible"
                variants={staggerContainer}
                whileHover={{ scale: 1.01, boxShadow: '0 6px 70px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.1)' }} // Lift and slightly expand on hover
            >
                {/* Animated Border Glow Effect */}
                <div className="absolute inset-0 rounded-2xl p-[2px] opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-[#A7B3AC] via-[#F3FFD4] to-[#A7B3AC] animate-border-spin" />
                    <div className="absolute inset-0 rounded-2xl bg-[#1a1a1a]" /> {/* Inner background to mask gradient */}
                </div>


                {/* Card Content */}
                <div className="relative z-10 grid gap-6"> {/* z-10 to ensure content is above animated border */}
                    {/* Header Section */}
                    <motion.div className="grid gap-2 text-center" variants={itemVariants}>
                        <h1 className="text-3xl font-bold text-[#F3FFD4]">
                            Access Your Account
                        </h1>
                        <p className="text-balance text-[#A7A7A7]">
                            Welcome back! Please sign in to continue.
                        </p>
                    </motion.div>

                    {/* Form Section */}
                    <motion.div className="grid gap-6" variants={itemVariants}>
                        {error && (
                            <Alert variant="destructive" className="border-red-500/30 bg-red-500/10 text-red-400">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                <FormField
                                    control={form.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-[#A7A7A7] font-medium">Email Address</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#A7A7A7]/60" />
                                                    <Input
                                                        placeholder="you@example.com"
                                                        className="pl-10 h-11 text-[#F3FFD4] bg-[#222222] border border-[#333333] rounded-lg focus:border-[#A7B3AC] focus:ring-1 focus:ring-[#A7B3AC]/50 transition-all duration-300 placeholder:text-[#A7A7A7]/40 hover:border-[#A7B3AC]/50"
                                                        {...field}
                                                    />
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="password"
                                    render={({ field }) => (
                                        <FormItem>
                                            <div className="flex items-center justify-between">
                                                <FormLabel className="text-[#A7A7A7] font-medium">Password</FormLabel>
                                                <Link href="/forgot-password" className="text-xs font-medium text-[#A7B3AC] hover:text-[#F3FFD4] transition-colors underline-offset-4 hover:underline">
                                                    Forgot password?
                                                </Link>
                                            </div>
                                            <FormControl>
                                                <div className="relative">
                                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#A7A7A7]/60" />
                                                    <Input
                                                        type={showPassword ? "text" : "password"}
                                                        placeholder="••••••••"
                                                        className="pl-10 pr-10 h-11 text-[#F3FFD4] bg-[#222222] border border-[#333333] rounded-lg focus:border-[#A7B3AC] focus:ring-1 focus:ring-[#A7B3AC]/50 transition-all duration-300 placeholder:text-[#A7A7A7]/40 hover:border-[#A7B3AC]/50"
                                                        {...field}
                                                    />
                                                    <Button
                                                        type="button" variant="ghost" size="icon"
                                                        className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 text-[#A7A7A7]/70 hover:bg-[#333333]/50 hover:text-[#F3FFD4] rounded-md transition-colors"
                                                        onClick={() => setShowPassword(!showPassword)}
                                                    >
                                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                                    </Button>
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <motion.div whileTap={{ scale: 0.98 }}>
                                    <Button
                                        type="submit"
                                        className="w-full h-11 group bg-gradient-to-br from-[#A7B3AC] to-[#8C9B90] text-[#111111] font-bold rounded-lg shadow-md hover:from-[#A7B3AC]/90 hover:to-[#8C9B90]/90 transition-all duration-300 ease-in-out"
                                        disabled={loading || !form.formState.isValid}
                                    >
                                        {loading ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Signing In...
                                            </>
                                        ) : (
                                            <div className="flex items-center justify-center">
                                                <span>Sign In</span>
                                                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                                            </div>
                                        )}
                                    </Button>
                                </motion.div>
                            </form>
                        </Form>
                    </motion.div>

                    <motion.div className="text-center text-sm" variants={itemVariants}>
                        <span className="text-[#A7A7A7]">Don&apos;t have an account? </span>
                        <Link href="/register" className="font-medium text-[#A7B3AC] hover:text-[#F3FFD4] transition-colors underline-offset-4 hover:underline">
                            Create One
                        </Link>
                    </motion.div>
                </div>
            </motion.div>
        </div>
    );
}