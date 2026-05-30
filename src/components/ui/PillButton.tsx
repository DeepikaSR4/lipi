"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "dark" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

// Use HTMLMotionProps directly to avoid Framer Motion v12 type conflicts
interface PillButtonProps extends Omit<HTMLMotionProps<"button">, "ref"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  href?: string;
  children: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: "bg-lipi-green text-lipi-text",
  secondary: "bg-lipi-cream text-lipi-text",
  dark: "bg-lipi-text text-lipi-cream",
  ghost: "bg-transparent text-lipi-text",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "px-4 py-2 text-sm",
  md: "px-6 py-3 text-base",
  lg: "px-8 py-4 text-lg",
};

const DEFAULT_SHADOW = "var(--shadow-surface)";
const HOVER_SHADOW = "var(--shadow-elevated)";

export function PillButton({
  variant = "primary",
  size = "md",
  className,
  children,
  href,
  style,
  ...props
}: PillButtonProps) {
  const isGhost = variant === "ghost";

  const classes = cn(
    "inline-flex items-center gap-2 font-semibold border-2 border-lipi-border cursor-pointer",
    "font-[family-name:var(--font-primary)]",
    variantStyles[variant],
    sizeStyles[size],
    isGhost && "border-none shadow-none",
    className
  );

  const motionShared = {
    className: classes,
    style: isGhost ? style : { boxShadow: DEFAULT_SHADOW, ...style },
    whileHover: isGhost 
      ? { scale: 1.02 } 
      : { y: -2, boxShadow: HOVER_SHADOW },
    whileTap: { scale: 0.98 },
    transition: { duration: 0.15, ease: "easeOut" as const },
  } as const;

  if (href) {
    return (
      <motion.a href={href} {...motionShared}>
        {children}
      </motion.a>
    );
  }

  return (
    <motion.button {...motionShared} {...props}>
      {children}
    </motion.button>
  );
}
