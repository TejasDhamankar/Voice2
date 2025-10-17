"use client";

import { useAuth } from "@/contexts/AuthContext";
import { Wallet, Plus } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@/lib/utils";
import { plans } from "@/lib/utils";

export function WalletDisplay() {
  const { user } = useAuth();
  const router = useRouter();

  // Early return if no user or missing data
  if (!user) return null;

  // Handle legacy "free" plan users by converting to starter
  const userPlan = user.plan === 'free' ? 'starter' : user.plan;

  // Get plan details or use defaults for backward compatibility
  const planDetails = plans[userPlan as keyof typeof plans] || plans.starter;

  // Use the user's values if available, otherwise use plan defaults for backward compatibility
  const totalMinutes = user.totalMinutes || (planDetails.minutes as number) || 0;
  const minutesUsed = user.minutesUsed || 0;
  const walletBalance = user.walletBalance || 0;
  const extraMinuteRate = user.extraMinuteRate ||
    (userPlan !== 'starter' ? planDetails.extraMinuteRate : null);

  // Calculate usage percentage
  const usagePercentage = totalMinutes > 0
    ? Math.min(Math.round((minutesUsed / totalMinutes) * 100), 100)
    : 0;

  // Determine if user can recharge (only non-starter plans)
  const canRecharge = userPlan !== 'starter';

  // Format wallet balance
  const formattedBalance = formatCurrency(walletBalance / 100); // Convert from paise to rupees

  // Minutes remaining
  const minutesRemaining = Math.max(totalMinutes - minutesUsed, 0);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-9 gap-2 px-3 border-border/30 bg-background"
            onClick={() => router.push('/dashboard/billing')}
          >
            <Wallet className="h-4 w-4" />
            <span className="font-medium">
              {formattedBalance}
            </span>
            {canRecharge && (
              <span className="text-primary ml-1">
                <Plus className="h-3 w-3" />
              </span>
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="w-64 p-0">
          <div className="p-3">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium">Plan Minutes</span>
              <span className="text-xs ">
                {minutesUsed} / {totalMinutes} min
              </span>
            </div>
            <Progress value={usagePercentage} className="h-2 mb-3" />

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-">Remaining</span>
                <p className="font-medium">{minutesRemaining} min</p>
              </div>
              <div>
                <span className="text-">Plan</span>
                <p className="font-medium capitalize">{userPlan}</p>
              </div>
              {canRecharge && (
                <>
                  <div>
                    <span className="text-">Wallet Balance</span>
                    <p className="font-medium">{formattedBalance}</p>
                  </div>
                  <div>
                    <span className="text-m">Extra Rate</span>
                    <p className="font-medium">
                      {extraMinuteRate ? `₹${(extraMinuteRate / 100).toFixed(2)}/min` : 'N/A'}
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="p-2 border-t bg-muted/30">
            <Button
              variant="ghost"
              size="sm"
              className="w-full hover:text-white text-xs h-8"
              onClick={() => router.push('/dashboard/billing')}
            >
              View Usage & Billing
            </Button>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
