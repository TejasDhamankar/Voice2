"use client";

import { motion } from "framer-motion";
import {
  LineChart,
  Line,
  BarChart as BarChartRecharts,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { ArrowUpRight, ArrowDownRight, PhoneCall, Clock, Users, BarChart as BarChartIcon } from "lucide-react";

// Sample data for charts
const callData = [
  { name: "Mon", value: 42 },
  { name: "Tue", value: 63 },
  { name: "Wed", value: 52 },
  { name: "Thu", value: 78 },
  { name: "Fri", value: 91 },
  { name: "Sat", value: 45 },
  { name: "Sun", value: 35 },
];

const conversionData = [
  { name: "Mon", value: 12 },
  { name: "Tue", value: 18 },
  { name: "Wed", value: 15 },
  { name: "Thu", value: 22 },
  { name: "Fri", value: 28 },
  { name: "Sat", value: 14 },
  { name: "Sun", value: 10 },
];

const chartColors = {
  calls: "#3b82f6",
  conversion: "#8b5cf6",
  gradient: ["#3b82f6", "#8b5cf6"]
};

export function DashboardStats() {
  // Stats data
  const stats = [
    {
      title: "Total Calls",
      value: "1,458",
      change: "+12.5%",
      status: "up",
      icon: <PhoneCall className="h-5 w-5 text-blue-500" />,
      chart: (
        <ResponsiveContainer width="100%" height={50}>
          <LineChart data={callData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
            <Line
              type="monotone"
              dataKey="value"
              stroke={chartColors.calls}
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      ),
    },
    {
      title: "Avg. Call Duration",
      value: "4:32",
      change: "-1:12",
      status: "down",
      icon: <Clock className="h-5 w-5 text-indigo-500" />,
      chart: (
        <ResponsiveContainer width="100%" height={50}>
          <BarChartRecharts data={callData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
            <Bar dataKey="value" fill={chartColors.calls} radius={[4, 4, 0, 0]}>
              {callData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={chartColors.gradient[index % chartColors.gradient.length]}
                />
              ))}
            </Bar>
          </BarChartRecharts>
        </ResponsiveContainer>
      ),
    },
    {
      title: "Conversions",
      value: "342",
      change: "+24.3%",
      status: "up",
      icon: <Users className="h-5 w-5 text-violet-500" />,
      chart: (
        <ResponsiveContainer width="100%" height={50}>
          <LineChart data={conversionData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
            <Line
              type="monotone"
              dataKey="value"
              stroke={chartColors.conversion}
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      ),
    },
    {
      title: "Conversion Rate",
      value: "23.5%",
      change: "+3.2%",
      status: "up",
      icon: <BarChartIcon className="h-5 w-5 text-purple-500" />,
      chart: (
        <ResponsiveContainer width="100%" height={50}>
          <BarChartRecharts data={conversionData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
            <Bar dataKey="value" fill={chartColors.conversion} radius={[4, 4, 0, 0]}>
              {conversionData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={chartColors.gradient[index % chartColors.gradient.length]}
                />
              ))}
            </Bar>
          </BarChartRecharts>
        </ResponsiveContainer>
      ),
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.title}
          className="bg-gray-900/50 border border-gray-800 rounded-xl p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.1 }}
        >
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="text-sm text-gray-400">{stat.title}</p>
              <h3 className="text-2xl font-bold">{stat.value}</h3>
            </div>
            <div className="h-10 w-10 rounded-full bg-gray-800 flex items-center justify-center">
              {stat.icon}
            </div>
          </div>

          <div className="flex items-center gap-2 mb-2">
            {stat.status === "up" ? (
              <div className="flex items-center text-green-500">
                <ArrowUpRight className="h-4 w-4" />
                <span className="text-sm font-medium">{stat.change}</span>
              </div>
            ) : (
              <div className="flex items-center text-red-500">
                <ArrowDownRight className="h-4 w-4" />
                <span className="text-sm font-medium">{stat.change}</span>
              </div>
            )}
            <span className="text-xs text-gray-500">vs last week</span>
          </div>

          <div className="mt-4">
            {stat.chart}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
