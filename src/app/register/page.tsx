"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import {
    Loader2, Eye, EyeOff, ArrowRight, Mail, Lock, User, AlertCircle
} from "lucide-react";

// UI Components
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
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Color Palette
const COLORS = {
    background: "#111111",
    primaryHeadline: "#F3FFD4",
    textSecondary: "#A7A7A7",
    accent: "#A7B3AC",
    border: "#333333",
    cardBackground: "#1a1a1a",
};

// Form schema with password confirmation
const registerSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters."),
    email: z.string().email("Please enter a valid email address."),
    password: z.string().min(6, "Password must be at least 6 characters."),
    confirmPassword: z.string(),
    agreeTerms: z.boolean().refine(val => val === true, {
        message: "You must agree to the terms and conditions.",
    }),
}).refine(data => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"], // Attach error to the confirmPassword field
});

type FormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
    const { register: registerUser, error, loading } = useAuth();
    const [showPassword, setShowPassword] = useState(false);

    const form = useForm<FormValues>({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            name: "",
            email: "",
            password: "",
            confirmPassword: "",
            agreeTerms: false,
        }
    });

    // We only send necessary data to the backend
    const onSubmit = async (data: FormValues) => {
        const { confirmPassword, agreeTerms, ...userData } = data;
        await registerUser(userData);
    };

    // Animation variants for Framer Motion
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1, delayChildren: 0.2 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
    };

    return (
        <main
            className="flex flex-col lg:flex-row min-h-screen w-full"
            style={{ backgroundColor: COLORS.background }}
        >
            {/* Left Panel: Branding & Welcome Message */}
            <div className="relative hidden lg:flex flex-col items-center justify-center w-full lg:w-1/2 p-10 text-center border-r border-transparent lg:border-r-[#333333]">
                <div
                    aria-hidden="true"
                    className="absolute inset-0 z-0 bg-gradient-to-br from-[#111111] via-[#1A1A1A] to-[#0A0A0A]"
                />
                <motion.div
                    className="relative z-10"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
                >
                    <h1 className="text-5xl font-bold tracking-tight mb-4" style={{ color: COLORS.primaryHeadline }}>
                        Join Our Community
                    </h1>
                    <p className="text-lg max-w-md" style={{ color: COLORS.textSecondary }}>
                        Create an account to unlock exclusive features and start your journey with us.
                    </p>
                    {/* You can add an illustration or logo here */}
                    {/*  */}
                </motion.div>
            </div>

            {/* Right Panel: Registration Form */}
            <div className="flex items-center justify-center w-full lg:w-1/2 p-4 sm:p-6 lg:p-8">
                <motion.div
                    className="w-full max-w-md space-y-8"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    {/* Header */}
                    <motion.div className="text-center" variants={itemVariants}>
                        <h1 className="text-3xl font-bold" style={{ color: COLORS.primaryHeadline }}>
                            Create an Account
                        </h1>
                        <p className="mt-2" style={{ color: COLORS.textSecondary }}>
                            Let's get you started.
                        </p>
                    </motion.div>

                    {/* Error Alert */}
                    {error && (
                        <motion.div variants={itemVariants}>
                            <Alert variant="destructive" className="border-red-500/30 bg-red-500/10 text-red-400">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        </motion.div>
                    )}

                    {/* Form */}
                    <motion.div variants={itemVariants}>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel style={{ color: COLORS.textSecondary }}>Full Name</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: COLORS.textSecondary }} />
                                                    <Input
                                                        placeholder="John Doe"
                                                        className="pl-10 h-11 text-[#F3FFD4] bg-[#222222] border border-[#333333] rounded-lg focus:border-[#A7B3AC] focus:ring-1 focus:ring-[#A7B3AC]/50 transition-all duration-300 placeholder:text-[#A7A7A7]/40 hover:border-[#A7B3AC]/50"
                                                        {...field} />
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel style={{ color: COLORS.textSecondary }}>Email Address</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: COLORS.textSecondary }} />
                                                    <Input
                                                        placeholder="you@example.com"
                                                        className="pl-10 h-11 text-[#F3FFD4] bg-[#222222] border border-[#333333] rounded-lg focus:border-[#A7B3AC] focus:ring-1 focus:ring-[#A7B3AC]/50 transition-all duration-300 placeholder:text-[#A7A7A7]/40 hover:border-[#A7B3AC]/50"
                                                        {...field} />
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="password"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel style={{ color: COLORS.textSecondary }}>Password</FormLabel>
                                                <FormControl>
                                                    <div className="relative">
                                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: COLORS.textSecondary }} />
                                                        <Input
                                                            type={showPassword ? "text" : "password"}
                                                            placeholder="••••••••"
                                                            className="pl-10 pr-10 h-11 text-[#F3FFD4] bg-[#222222] border border-[#333333] rounded-lg focus:border-[#A7B3AC] focus:ring-1 focus:ring-[#A7B3AC]/50 transition-all duration-300 placeholder:text-[#A7A7A7]/40 hover:border-[#A7B3AC]/50"
                                                            {...field} />
                                                        <Button type="button" variant="ghost" size="icon" className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 text-[#A7A7A7]/70 hover:bg-[#333333]/50 hover:text-[#F3FFD4] rounded-md" onClick={() => setShowPassword(!showPassword)}>
                                                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                                        </Button>
                                                    </div>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="confirmPassword"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel style={{ color: COLORS.textSecondary }}>Confirm</FormLabel>
                                                <FormControl>
                                                    <div className="relative">
                                                         <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: COLORS.textSecondary }} />
                                                        <Input
                                                            type={showPassword ? "text" : "password"}
                                                            placeholder="••••••••"
                                                            className="pl-10 h-11 text-[#F3FFD4] bg-[#222222] border border-[#333333] rounded-lg focus:border-[#A7B3AC] focus:ring-1 focus:ring-[#A7B3AC]/50 transition-all duration-300 placeholder:text-[#A7A7A7]/40 hover:border-[#A7B3AC]/50"
                                                            {...field} />
                                                    </div>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <FormField
                                    control={form.control}
                                    name="agreeTerms"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 pt-2">
                                            <FormControl>
                                                <Checkbox
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
                                                    id="agreeTerms"
                                                    className="border-[#333333] data-[state=checked]:bg-[#A7B3AC] data-[state=checked]:text-[#111111]" />
                                            </FormControl>
                                            <div className="space-y-1 leading-none">
                                                <label htmlFor="agreeTerms" className="text-sm font-medium" style={{ color: COLORS.textSecondary }}>
                                                    I agree to the{" "}
                                                    <Link href="/terms" className="underline-offset-4 hover:underline" style={{ color: COLORS.accent, '--hover-color': COLORS.primaryHeadline }} onMouseOver={e => e.currentTarget.style.color = COLORS.primaryHeadline} onMouseOut={e => e.currentTarget.style.color = COLORS.accent}>Terms</Link> & <Link href="/privacy" className="underline-offset-4 hover:underline" style={{ color: COLORS.accent, '--hover-color': COLORS.primaryHeadline }} onMouseOver={e => e.currentTarget.style.color = COLORS.primaryHeadline} onMouseOut={e => e.currentTarget.style.color = COLORS.accent}>Policy</Link>
                                                </label>
                                                <FormMessage />
                                            </div>
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
                                            <> <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating Account... </>
                                        ) : (
                                            <div className="flex items-center justify-center">
                                                <span>Create Account</span>
                                                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                                            </div>
                                        )}
                                    </Button>
                                </motion.div>
                            </form>
                        </Form>
                    </motion.div>

                    {/* Footer */}
                    <motion.div className="text-center text-sm" variants={itemVariants}>
                        <span style={{ color: COLORS.textSecondary }}>Already have an account? </span>
                        <Link href="/login" className="font-medium underline-offset-4 hover:underline" style={{ color: COLORS.accent, '--hover-color': COLORS.primaryHeadline }} onMouseOver={e => e.currentTarget.style.color = COLORS.primaryHeadline} onMouseOut={e => e.currentTarget.style.color = COLORS.accent}>
                            Sign In
                        </Link>
                    </motion.div>
                </motion.div>
            </div>
        </main>
    );
}