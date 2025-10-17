import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Wallet, Plus, AlertCircle } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { RechargeWalletDialog } from "./recharge-wallet-dialog";
import { cn } from "@/lib/utils";

interface WalletBalanceProps {
  walletBalance: number;
  minutesUsed: number;
  totalMinutes: number;
  plan: string;
  extraMinuteRate?: number;
}

export function WalletBalance({
  walletBalance,
  minutesUsed,
  totalMinutes,
  plan,
  extraMinuteRate
}: WalletBalanceProps) {
  const [showRechargeDialog, setShowRechargeDialog] = useState(false);

  // Calculate usage percentage
  const usagePercentage = totalMinutes > 0
    ? Math.min(Math.round((minutesUsed / totalMinutes) * 100), 100)
    : 0;

  // Minutes remaining
  const minutesRemaining = Math.max(totalMinutes - minutesUsed, 0);

  // Determine if user can recharge (only non-starter plans)
  const canRecharge = plan !== 'starter';

  // Calculate potential extra minutes based on wallet balance
  const potentialExtraMinutes = extraMinuteRate
    ? Math.floor(walletBalance / extraMinuteRate)
    : 0;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-primary" />
            Wallet & Usage
          </CardTitle>
          <CardDescription>
            Manage your minutes and wallet balance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-5">
            {/* Plan minutes usage */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-medium">Plan Minutes</h3>
                <span className="text-sm text-muted-foreground">
                  {minutesUsed} / {totalMinutes} minutes used
                </span>
              </div>
              <Progress value={usagePercentage} className="h-2 mb-2" />
              <div className="flex justify-between items-center text-sm">
                <span>{minutesRemaining} minutes remaining</span>
                <span className={cn(
                  usagePercentage >= 90 ? "text-destructive" : "text-muted-foreground"
                )}>
                  {usagePercentage}% used
                </span>
              </div>
            </div>

            {/* Wallet balance */}
            <div className="pt-4 border-t">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-medium">Wallet Balance</h3>
                <span className="text-xl font-bold">{formatCurrency(walletBalance / 100)}</span>
              </div>

              {!canRecharge ? (
                <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-md mb-4 text-sm">
                  <AlertCircle className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <div>
                    <p>The Starter plan does not support extra minutes beyond your plan's allocation.</p>
                    <p className="mt-1">Upgrade to Growth or higher plans to unlock the wallet feature.</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Extra Minutes Rate</p>
                    <p className="font-medium">
                      {extraMinuteRate
                        ? `₹${(extraMinuteRate / 100).toFixed(2)}/min`
                        : "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Potential Extra Minutes</p>
                    <p className="font-medium">{potentialExtraMinutes} minutes</p>
                  </div>
                </div>
              )}

              <Button
                className="w-full"
                onClick={() => setShowRechargeDialog(true)}
                disabled={!canRecharge}
              >
                <Plus className="h-4 w-4 mr-2" />
                Recharge Wallet
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recharge Dialog */}
      <RechargeWalletDialog
        open={showRechargeDialog}
        onOpenChange={setShowRechargeDialog}
      />
    </>
  );
}
