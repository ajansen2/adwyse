"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface StatItem {
  value: string;
  label: string;
}

interface StatsMarqueeProps {
  stats: StatItem[];
  className?: string;
  speed?: number;
}

export function StatsMarquee({ stats, className, speed = 30 }: StatsMarqueeProps) {
  const duplicatedStats = [...stats, ...stats];

  return (
    <div className={cn("relative overflow-hidden py-4", className)}>
      <motion.div
        className="flex gap-12"
        animate={{
          x: ["0%", "-50%"],
        }}
        transition={{
          duration: speed,
          ease: "linear",
          repeat: Infinity,
        }}
      >
        {duplicatedStats.map((stat, index) => (
          <div
            key={index}
            className="flex items-center gap-3 shrink-0 px-6 py-3 rounded-full"
            style={{
              background: "rgba(245, 158, 11, 0.1)",
              border: "1px solid rgba(245, 158, 11, 0.2)",
            }}
          >
            <span
              className="text-2xl md:text-3xl font-bold"
              style={{
                background: "linear-gradient(135deg, #f59e0b, #ef4444)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              {stat.value}
            </span>
            <span className="text-gray-400 text-sm md:text-base whitespace-nowrap">
              {stat.label}
            </span>
          </div>
        ))}
      </motion.div>
    </div>
  );
}
