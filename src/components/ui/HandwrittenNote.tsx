"use client";

import { motion } from "framer-motion";

interface HandwrittenNoteProps {
  text: string;
  rotation?: number;
  color?: "green" | "lavender" | "cream" | "white";
  className?: string;
  animate?: boolean;
}

const colorMap = {
  green: "#C7F04F",
  lavender: "#C9B6F5",
  cream: "#F5F2EA",
  white: "#ffffff",
};

export function HandwrittenNote({
  text,
  rotation = -3,
  color = "green",
  className = "",
  animate = false,
}: HandwrittenNoteProps) {
  return (
    <motion.span
      className={`inline-block px-3 py-1 font-[family-name:var(--font-caveat)] font-semibold text-sm leading-tight rounded-md ${className}`}
      style={{
        backgroundColor: colorMap[color],
        transform: `rotate(${rotation}deg)`,
      }}
      animate={
        animate
          ? { rotate: [rotation - 1, rotation + 1, rotation - 1] }
          : undefined
      }
      transition={
        animate
          ? { duration: 3, repeat: Infinity, ease: "easeInOut" as const }
          : undefined
      }
    >
      {text}
    </motion.span>
  );
}

