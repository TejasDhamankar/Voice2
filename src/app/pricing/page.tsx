'use client';

import { Header } from '@/components/ui/header';
import { Footer } from '@/components/footer';
import { motion } from 'framer-motion';
import React, { useState, useEffect } from 'react';
import { PlanCard } from '@/components/billing/plan-card';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/components/theme-provider';
import { plans, Plan } from '@/lib/utils'; // import from your utils
import { Link } from 'lucide-react';

export default function Pricing() {
  const router = useRouter();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [currentPlan, setCurrentPlan] = useState<string>(() => {
    return typeof window !== "undefined" ? localStorage.getItem("selectedPlan") || "pro" : "pro";
  });

  const [selectedAction, setSelectedAction] = useState<string | null>(null);

  const handleSelectPlan = (planId: string) => {
    setCurrentPlan(planId);
    setSelectedAction(null);
    if (typeof window !== "undefined") {
      localStorage.setItem("selectedPlan", planId);
    }
  };

  const handleSelectOption = (action: string) => {
    setSelectedAction(action);
  };

  const handleProceed = () => {
    router.push('/login');
  };

  return (
    <div className={isDark ? "min-h-screen bg-[#0e0b16]" : "min-h-screen bg-[#f6f6fb]"}>
      <Header />

      <section className="relative py-24 overflow-hidden">
        <div className="container mx-auto px-4 text-center">
          <motion.h2
            className={isDark
              ? "text-4xl md:text-5xl font-bold text-gray-100 mb-4"
              : "text-4xl md:text-5xl font-bold text-gray-900 mb-4"
            }
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            Available Plans
          </motion.h2>

          <motion.p
            className={isDark
              ? "text-gray-400 mb-16 max-w-2xl mx-auto"
              : "text-gray-600 mb-16 max-w-2xl mx-auto"
            }
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            Choose the plan that fits your workflow and team size.
          </motion.p>

          {/* Pricing Cards */}
          <div className="grid gap-8 md:grid-cols-4">
            {Object.values(plans)
              .filter((plan) => plan.id !== 'enterprise') // hide enterprise here if not ready
              .map((plan, i) => (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: i * 0.2 }}
                >
                  <PlanCard
                    id={plan.id}
                    name={plan.name}
                    price={plan.price}
                    minutes={plan.minutes}
                    agents={plan.agents}
                    extraMinuteRate={plan.extraMinuteRate}
                    features={plan.features}
                    isCurrent={currentPlan === plan.id}
                    onSelectPlan={handleSelectPlan}
                    onSelectOption={handleSelectOption}
                    theme={theme}
                  />
                </motion.div>
              ))}
          </div>

          {selectedAction && (
            <div
              className={isDark
                ? "mt-12 text-lg text-violet-400"
                : "mt-12 text-lg text-violet-600"
              }
            >
              You selected: <strong>{selectedAction}</strong>
            </div>
          )}

          {/* Proceed Button */}
          <button
            onClick={handleProceed}
            className={
              isDark
                ? "mt-8 px-6 py-3 bg-gradient-to-r from-blue-600 to-violet-600 text-white rounded-lg hover:from-blue-700 hover:to-violet-700 transition"
                : "mt-8 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 transition"
            }
          >
            Proceed with {currentPlan} Plan
          </button>
        </div>

        {/* Floating background shapes */}
        <motion.div
          className={
            isDark
              ? "absolute top-0 -left-24 w-72 h-72 bg-gradient-to-tr from-violet-700 to-purple-900 rounded-full opacity-30 blur-3xl"
              : "absolute top-0 -left-24 w-72 h-72 bg-gradient-to-tr from-pink-300 to-blue-300 rounded-full opacity-30 blur-3xl"
          }
          animate={{ y: [0, 20, 0], x: [0, 15, 0] }}
          transition={{ duration: 10, repeat: Infinity }}
        />

        <motion.div
          className={
            isDark
              ? "absolute bottom-0 -right-24 w-72 h-72 bg-gradient-to-tr from-fuchsia-700 to-indigo-900 rounded-full opacity-30 blur-3xl"
              : "absolute bottom-0 -right-24 w-72 h-72 bg-gradient-to-tr from-purple-300 to-indigo-300 rounded-full opacity-30 blur-3xl"
          }
          animate={{ y: [0, -20, 0], x: [0, -15, 0] }}
          transition={{ duration: 12, repeat: Infinity }}
        />
      </section>

      <Footer />
    </div>
  );
}
