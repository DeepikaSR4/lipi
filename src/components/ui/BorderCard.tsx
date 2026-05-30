"use client";

import { motion, HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

type CardVariant = "cream" | "lavender" | "dark" | "acid" | "white";

interface BorderCardProps extends HTMLMotionProps<"div"> {
  variant?: CardVariant;
  hoverable?: boolean;
  className?: string;
  children: React.ReactNode;
}

const variantClasses: Record<CardVariant, string> = {
  cream: "bg-lipi-cream",
  lavender: "bg-lipi-lavender",
  dark: "bg-lipi-dark text-lipi-cream",
  acid: "bg-lipi-green",
  white: "bg-white",
};

export function BorderCard({
  variant = "cream",
  hoverable = false,
  className,
  children,
  ...props
}: BorderCardProps) {
  return (
    <motion.div
      className={cn(
        "border-2 border-lipi-border rounded-[32px]",
        variantClasses[variant],
        hoverable && "cursor-pointer",
        className
      )}
      whileHover={
        hoverable
          ? {
              y: -4,
              
              transition: { duration: 0.2, ease: "easeOut" },
            }
          : undefined
      }
      whileTap={hoverable ? { scale: 0.98 } : undefined}
      {...props}
    >
      {children}
    </motion.div>
  );
}
