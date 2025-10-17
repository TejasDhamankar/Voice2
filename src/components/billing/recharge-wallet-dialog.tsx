import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "@/components/ui/use-toast";

// Form schema for wallet recharge
const rechargeSchema = z.object({
  amount: z
    .string()
    .min(1, "Amount is required")
    .refine(val => !isNaN(parseInt(val)), "Amount must be a number")
    .refine(val => parseInt(val) >= 500, "Minimum recharge amount is ₹500"),
});

interface RechargeWalletDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

export function RechargeWalletDialog({
  open,
  onOpenChange
}: RechargeWalletDialogProps) {
  const [isLoadingRazorpay, setIsLoadingRazorpay] = useState(false);
  const [isRecharging, setIsRecharging] = useState(false);

  const form = useForm<z.infer<typeof rechargeSchema>>({
    resolver: zodResolver(rechargeSchema),
    defaultValues: {
      amount: "1000",
    },
  });

  // Function to load Razorpay script
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => {
        resolve(true);
      };
      script.onerror = () => {
        resolve(false);
      };
      document.body.appendChild(script);
    });
  };

  // Handle wallet recharge
  const onRechargeWallet = async (data: z.infer<typeof rechargeSchema>) => {
    try {
      setIsRecharging(true);

      // 1. Load Razorpay if not already loaded
      if (!window.Razorpay) {
        setIsLoadingRazorpay(true);
        const res = await loadRazorpayScript();
        if (!res) {
          throw new Error("Razorpay SDK failed to load");
        }
        setIsLoadingRazorpay(false);
      }

      // 2. Create an order on the server
      const orderResponse = await fetch("/api/wallet", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ amount: parseInt(data.amount) }),
      });

      if (!orderResponse.ok) {
        const errorData = await orderResponse.json();
        throw new Error(errorData.message || "Failed to create order");
      }

      const { order } = await orderResponse.json();

      // 3. Open Razorpay payment dialog
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: "INR",
        name: "VoiceFlow AI",
        description: "Wallet Recharge",
        order_id: order.id,
        handler: async function (response: any) {
          // 4. Verify payment on successful completion
          const verifyResponse = await fetch("/api/wallet", {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              amount: order.amount,
            }),
          });

          if (!verifyResponse.ok) {
            throw new Error("Payment verification failed");
          }

          // 5. Show success message and close dialog
          toast({
            title: "Wallet recharged successfully",
            description: `₹${parseInt(data.amount)} has been added to your wallet.`,
            variant: "default",
          });

          onOpenChange(false);
        },
        prefill: {
          // You would get these from user context in real app
          name: "User Name",
          email: "user@example.com",
        },
        theme: {
          color: "#6366F1",
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();

    } catch (error: any) {
      console.error("Recharge error:", error);
      toast({
        title: "Recharge failed",
        description: error.message || "An error occurred while processing your payment",
        variant: "destructive",
      });
    } finally {
      setIsRecharging(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Recharge Wallet</DialogTitle>
          <DialogDescription>
            Add funds to your wallet for using services beyond your plan limits.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onRechargeWallet)} className="space-y-6">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount (₹)</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">₹</span>
                      <Input className="pl-8" {...field} />
                    </div>
                  </FormControl>
                  <FormDescription>
                    Minimum recharge amount is ₹500
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isRecharging || isLoadingRazorpay}>
                {isLoadingRazorpay ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Loading Payment...
                  </>
                ) : isRecharging ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Proceed to Payment"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
