"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export function FloatingLetters() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const letters = [
    { char: "Aa", font: "font-[family-name:var(--font-caveat)]", size: "text-9xl", top: "15%", left: "8%", delay: 0, blur: "blur-md", opacity: "opacity-20", duration: 12, yRange: -40, rotateRange: 10 },
    { char: "g", font: "font-[family-name:var(--font-caveat)]", size: "text-7xl", top: "60%", left: "12%", delay: 2, blur: "blur-sm", opacity: "opacity-30", duration: 15, yRange: -20, rotateRange: -15 },
    { char: "Bb", font: "font-[family-name:var(--font-caveat)]", size: "text-8xl", top: "75%", left: "85%", delay: 1, blur: "blur-none", opacity: "opacity-40", duration: 10, yRange: -30, rotateRange: 5 },
    { char: "y", font: "font-[family-name:var(--font-caveat)]", size: "text-9xl", top: "25%", left: "75%", delay: 0.5, blur: "blur-md", opacity: "opacity-25", duration: 14, yRange: -35, rotateRange: -10 },
    { char: "Cc", font: "font-[family-name:var(--font-caveat)]", size: "text-8xl", top: "85%", left: "30%", delay: 2.5, blur: "blur-sm", opacity: "opacity-30", duration: 11, yRange: -25, rotateRange: -5 },
    { char: "m", font: "font-[family-name:var(--font-caveat)]", size: "text-6xl", top: "10%", left: "50%", delay: 1.5, blur: "blur-md", opacity: "opacity-20", duration: 13, yRange: -30, rotateRange: 15 },
  ];

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {letters.map((l, i) => (
        <motion.div
          key={i}
          className={`absolute ${l.font} ${l.size} text-lipi-text ${l.blur} ${l.opacity}`}
          style={{ top: l.top, left: l.left }}
          initial={{ y: 0, rotate: 0 }}
          animate={{
            y: [0, l.yRange, 0],
            rotate: [0, l.rotateRange, 0],
          }}
          transition={{
            duration: l.duration,
            repeat: Infinity,
            delay: l.delay,
            ease: "easeInOut",
          }}
        >
          {l.char}
        </motion.div>
      ))}
    </div>
  );
}
