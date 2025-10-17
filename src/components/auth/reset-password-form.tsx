"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  Loader2, Eye, EyeOff, ArrowRight,
  Lock, AlertCircle, Sparkles,
  ShieldCheck, CheckCircle, ArrowLeftCircle
} from "lucide-react";
import { toast } from "sonner";

// UI Components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function ResetPasswordForm() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isError, setIsError] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const tokenParam = searchParams?.get('token');
    if (!tokenParam) {
      setIsError(true);
      toast.error('Reset token is missing. Please request a new password reset link.');
    } else {
      setToken(tokenParam);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsSuccess(true);
        toast.success(data.message || 'Password reset successful. You can now log in with your new password.');
      } else {
        setIsError(true);
        toast.error(data.message || 'Failed to reset password. Please try again.');
      }
    } catch (error) {
      setIsError(true);
      toast.error('An error occurred. Please try again later.');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Success state
  if (isSuccess) {
    return (
      <Card className="relative border border-primary/20 shadow-xl backdrop-blur-sm bg-black/30">
        {/* Decorative gradient accents */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-primary/30 to-transparent rounded-full filter blur-2xl opacity-20 -z-10 transform translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-gradient-to-tr from-blue-500/30 to-transparent rounded-full filter blur-2xl opacity-20 -z-10 transform -translate-x-1/2 translate-y-1/2"></div>

        <CardContent className="pt-8 pb-6 px-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </div>
          <h3 className="text-xl font-semibold mb-2">Password Reset Complete</h3>
          <p className="text-muted-foreground mb-6">
            Your password has been successfully reset. You can now log in with your new password.
          </p>
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button
              onClick={() => router.push('/login')}
              className="w-full relative overflow-hidden group bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-500"
            >
              <motion.span
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                initial={{ x: '-100%' }}
                animate={{ x: ['100%'] }}
                transition={{
                  repeat: Infinity,
                  duration: 1.5,
                  ease: "linear",
                  repeatDelay: 0.5
                }}
              />
              <div className="flex items-center">
                <span>Sign In</span>
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                <Sparkles className="ml-1 h-3 w-3 opacity-70" />
              </div>
            </Button>
          </motion.div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (isError && !token) {
    return (
      <Card className="relative border border-primary/20 shadow-xl backdrop-blur-sm bg-black/30">
        {/* Decorative gradient accents */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-primary/30 to-transparent rounded-full filter blur-2xl opacity-20 -z-10 transform translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-gradient-to-tr from-blue-500/30 to-transparent rounded-full filter blur-2xl opacity-20 -z-10 transform -translate-x-1/2 translate-y-1/2"></div>

        <CardContent className="pt-8 pb-6 px-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
          </div>
          <h3 className="text-xl font-semibold mb-2">Link Expired or Invalid</h3>
          <p className="text-muted-foreground mb-6">
            The password reset link you clicked is no longer valid. Please request a new password reset link.
          </p>
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button
              onClick={() => router.push('/forgot-password')}
              className="w-full relative overflow-hidden group bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-500"
            >
              <motion.span
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                initial={{ x: '-100%' }}
                animate={{ x: ['100%'] }}
                transition={{
                  repeat: Infinity,
                  duration: 1.5,
                  ease: "linear",
                  repeatDelay: 0.5
                }}
              />
              <div className="flex items-center">
                <span>Request New Link</span>
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Button>
          </motion.div>
        </CardContent>
      </Card>
    );
  }

  // Form state
  return (
    <Card className="relative border border-primary/20 shadow-xl backdrop-blur-sm bg-black/30">
      {/* Decorative gradient accents */}
      <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-primary/30 to-transparent rounded-full filter blur-2xl opacity-20 -z-10 transform translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 left-0 w-40 h-40 bg-gradient-to-tr from-blue-500/30 to-transparent rounded-full filter blur-2xl opacity-20 -z-10 transform -translate-x-1/2 translate-y-1/2"></div>

      <CardHeader className="space-y-1 pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl font-semibold flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <span>Reset Password</span>
          </CardTitle>
        </div>
        <CardDescription>
          Enter and confirm your new password
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground/80 mb-1">
                New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  className="pl-10 pr-10 bg-background/50 border-primary/20 focus:border-primary focus-visible:ring-1 focus-visible:ring-primary transition-all"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={8}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:text-primary hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </Button>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Password must be at least 8 characters long
              </p>
            </div>

            <div>
              <label htmlFor="confirm-password" className="block text-sm font-medium text-foreground/80 mb-1">
                Confirm New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirm-password"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  className="pl-10 pr-10 bg-background/50 border-primary/20 focus:border-primary focus-visible:ring-1 focus-visible:ring-primary transition-all"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:text-primary hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </Button>
              </div>
            </div>
          </div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="pt-2"
          >
            <Button
              type="submit"
              className="w-full relative overflow-hidden group bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-500"
              disabled={isLoading || !token}
            >
              <motion.span
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                initial={{ x: '-100%' }}
                animate={{ x: ['100%'] }}
                transition={{
                  repeat: Infinity,
                  duration: 1.5,
                  ease: "linear",
                  repeatDelay: 0.5
                }}
              />
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Resetting Password...
                </>
              ) : (
                <div className="flex items-center">
                  <span>Reset Password</span>
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  <Sparkles className="ml-1 h-3 w-3 opacity-70" />
                </div>
              )}
            </Button>
          </motion.div>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col space-y-4 border-t border-primary/20 p-6 backdrop-blur-sm bg-black/10">
        <div className="text-center text-sm">
          Remember your password?{" "}
          <Link href="/login" className="text-primary font-medium hover:underline hover:text-primary/80 transition-colors">
            Sign in
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}
