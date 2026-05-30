"use client";

import { motion } from "framer-motion";

const tools = [
  { name: "Canva", symbol: "◈" },
  { name: "Figma", symbol: "◆" },
  { name: "Photoshop", symbol: "◉" },
  { name: "Procreate", symbol: "✦" },
  { name: "Illustrator", symbol: "◈" },
  { name: "Notion", symbol: "▣" },
  { name: "Word", symbol: "◆" },
  { name: "Keynote", symbol: "◉" },
];

const repeated = [...tools, ...tools]; // Double for infinite loop

export function CompatibilityStrip() {
  return (
    <div id="features" className="bg-lipi-green border-y-2 border-lipi-border py-4 overflow-hidden">
      <div className="flex items-center gap-2 mb-2 px-6">
        <span className="font-[family-name:var(--font-caveat)] text-lipi-text text-sm font-bold">
          works everywhere you design →
        </span>
      </div>

      <div className="relative overflow-hidden">
        <div className="marquee-track">
          {repeated.map((tool, i) => (
            <span
              key={i}
              className="flex items-center gap-2 font-[family-name:var(--font-space-grotesk)] font-bold text-lipi-text text-lg tracking-tight whitespace-nowrap"
            >
              <span className="text-sm opacity-50">{tool.symbol}</span>
              {tool.name}
              <span className="mx-4 opacity-30">—</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
