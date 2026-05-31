"use client";

import { motion } from "framer-motion";

const features = [
  { icon: "✑", label: "Fonts that feel like you" },
  { icon: "✦", label: "AI cleanup" },
  { icon: "↗", label: "Easy export" },
  { icon: "∞", label: "Yours forever" },
  { icon: "◈", label: "Personal & unique" },
];

export function FeatureStrip() {
  return (
    <div className="bg-lipi-dark border-y-2 border-lipi-border py-8 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {features.map(({ icon, label }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="flex items-center gap-3 p-3 bg-white/5 border-2 border-white/10 hover:border-lipi-green/45 transition-colors duration-200 group rounded-none"
            >
              <span className="w-10 h-10 border-2 border-white/30 flex items-center justify-center text-lipi-green text-lg font-bold group-hover:bg-lipi-green group-hover:border-lipi-green group-hover:text-lipi-text transition-all duration-150 shrink-0">
                {icon}
              </span>
              <span className="font-[family-name:var(--font-space-grotesk)] font-medium text-white/90 text-sm">
                {label}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
