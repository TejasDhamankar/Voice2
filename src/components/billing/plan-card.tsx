import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface PlanCardProps {
  id: string;
  name: string;
  price: number | null;
  minutes: number | string;
  agents: number | string;
  extraMinuteRate: number | null;
  features: string[];
  isCurrent: boolean;
  isPopular?: boolean;
  theme?: "light" | "dark";
  onSelectPlan: (planId: string) => void;
}

export function PlanCard({
  id,
  name,
  price,
  minutes,
  agents,
  extraMinuteRate,
  features,
  isCurrent,
  isPopular = false,
  theme = "light",
  onSelectPlan
}: PlanCardProps) {
  const isEnterprise = id === 'enterprise';
  const isDark = theme === "dark";

  return (
    <div
    className={cn(
      "border rounded-lg p-5 transition-colors relative flex flex-col h-full shadow-sm",
      isCurrent
        ? isDark
          ? "border-blue-500 bg-blue-900/20 shadow-blue-900/40"
          : "border-blue-500 bg-blue-100 shadow-blue-200/40"
        : isDark
          ? "hover:border-blue-400/50 border-gray-700 bg-gray-850/80 shadow-gray-900/50"
          : "hover:border-blue-500/50 border-gray-200 bg-white shadow-gray-200/50"
    )}
  >
      {isPopular && (
        <div className={cn(
          "absolute -top-3 right-4 px-3 py-1 text-xs rounded-full",
          isDark ? "bg-blue-600 text-white" : "bg-blue-500 text-white"
        )}>
          Popular
        </div>
      )}

      <div className="mb-4">
        <h3 className={cn("font-medium text-lg", isDark ? "text-gray-100" : "text-gray-900")}>{name}</h3>
        <p className={cn("text-xl font-bold mt-2", isDark ? "text-gray-50" : "text-gray-900")}>
          {!isEnterprise ? `₹${price}/mo` : "Custom"}
        </p>
        <p className={cn("text-xs mt-1", isDark ? "text-gray-400" : "text-gray-500")}>
          Billed monthly
        </p>
      </div>

      <div className={cn("space-y-3 mb-6", isDark ? "text-gray-200" : "text-gray-700")}>
        <div className="flex justify-between items-center py-2 border-b border-dashed">
          <span className="text-sm">Minutes</span>
          <span className="font-medium">{minutes}</span>
        </div>
        <div className="flex justify-between items-center py-2 border-b border-dashed">
          <span className="text-sm">Agents</span>
          <span className="font-medium">{agents}</span>
        </div>
        <div className="flex justify-between items-center py-2 border-b border-dashed">
          <span className="text-sm">Extra Rate</span>
          <span className="font-medium">
            {extraMinuteRate ? `₹${(extraMinuteRate / 100).toFixed(2)}/min` : "N/A"}
          </span>
        </div>
      </div>

      <div className={cn("space-y-2 mb-6 flex-1", isDark ? "text-gray-200" : "text-gray-700")}>
        {features.map((feature, index) => (
          <div key={index} className="flex items-start">
            <CheckCircle className={cn("h-4 w-4 mr-2 mt-0.5 flex-shrink-0", isDark ? "text-blue-500" : "text-blue-600")} />
            <span className="text-sm">{feature}</span>
          </div>
        ))}
      </div>

      <Button
        variant={isCurrent ? "secondary" : "default"}
        className="w-full mt-auto"
        disabled={isCurrent}
        onClick={() => onSelectPlan(id)}
      >
        {isCurrent ? "Current Plan" : isEnterprise ? "Contact Sales" : "Select Plan"}
      </Button>
    </div>
  );
}
