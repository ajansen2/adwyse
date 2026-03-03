"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface InteractiveGlobeProps {
  className?: string;
  dotColor?: string;
  lineColor?: string;
  size?: number;
}

export function InteractiveGlobe({
  className,
  dotColor = "#f59e0b",
  lineColor = "rgba(245, 158, 11, 0.3)",
  size = 400,
}: InteractiveGlobeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    canvas.width = size;
    canvas.height = size;

    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size * 0.4;

    // Create dots on the globe
    const dots: { lat: number; lon: number; size: number }[] = [];
    for (let i = 0; i < 200; i++) {
      dots.push({
        lat: Math.random() * Math.PI - Math.PI / 2,
        lon: Math.random() * Math.PI * 2,
        size: Math.random() * 2 + 1,
      });
    }

    // Connection lines between key points
    const connections = [
      { from: { lat: 0.7, lon: -2.1 }, to: { lat: 0.5, lon: 0.1 } }, // US to Europe
      { from: { lat: 0.5, lon: 0.1 }, to: { lat: 0.2, lon: 2.0 } }, // Europe to Asia
      { from: { lat: -0.5, lon: 2.5 }, to: { lat: 0.2, lon: 2.0 } }, // Australia to Asia
    ];

    let rotation = 0;

    const draw = () => {
      ctx.clearRect(0, 0, size, size);

      // Draw globe outline
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.strokeStyle = lineColor;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw latitude lines
      for (let i = -2; i <= 2; i++) {
        const lat = (i / 3) * Math.PI / 2;
        const y = centerY - Math.sin(lat) * radius;
        const lineRadius = Math.cos(lat) * radius;

        ctx.beginPath();
        ctx.ellipse(centerX, y, lineRadius, lineRadius * 0.3, 0, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(245, 158, 11, 0.1)";
        ctx.stroke();
      }

      // Draw dots
      dots.forEach((dot) => {
        const lon = dot.lon + rotation;
        const x = centerX + Math.cos(dot.lat) * Math.sin(lon) * radius;
        const y = centerY - Math.sin(dot.lat) * radius;
        const z = Math.cos(dot.lat) * Math.cos(lon);

        // Only draw if on the visible side
        if (z > 0) {
          ctx.beginPath();
          ctx.arc(x, y, dot.size * z, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(245, 158, 11, ${0.3 + z * 0.7})`;
          ctx.fill();
        }
      });

      // Draw connections
      connections.forEach((conn) => {
        const fromLon = conn.from.lon + rotation;
        const toLon = conn.to.lon + rotation;

        const fromX = centerX + Math.cos(conn.from.lat) * Math.sin(fromLon) * radius;
        const fromY = centerY - Math.sin(conn.from.lat) * radius;
        const fromZ = Math.cos(conn.from.lat) * Math.cos(fromLon);

        const toX = centerX + Math.cos(conn.to.lat) * Math.sin(toLon) * radius;
        const toY = centerY - Math.sin(conn.to.lat) * radius;
        const toZ = Math.cos(conn.to.lat) * Math.cos(toLon);

        if (fromZ > 0 && toZ > 0) {
          ctx.beginPath();
          ctx.moveTo(fromX, fromY);

          // Draw curved line
          const midX = (fromX + toX) / 2;
          const midY = (fromY + toY) / 2 - 30;
          ctx.quadraticCurveTo(midX, midY, toX, toY);

          ctx.strokeStyle = dotColor;
          ctx.lineWidth = 2;
          ctx.stroke();

          // Draw endpoint dots
          ctx.beginPath();
          ctx.arc(fromX, fromY, 4, 0, Math.PI * 2);
          ctx.fillStyle = dotColor;
          ctx.fill();

          ctx.beginPath();
          ctx.arc(toX, toY, 4, 0, Math.PI * 2);
          ctx.fillStyle = dotColor;
          ctx.fill();
        }
      });

      rotation += 0.003;
      requestAnimationFrame(draw);
    };

    const animationId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animationId);
  }, [size, dotColor, lineColor]);

  return (
    <motion.div
      className={cn("relative", className)}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1, ease: "easeOut" }}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ maxWidth: size, maxHeight: size }}
      />
      {/* Glow effect */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(circle at center, ${dotColor}20 0%, transparent 70%)`,
        }}
      />
    </motion.div>
  );
}
