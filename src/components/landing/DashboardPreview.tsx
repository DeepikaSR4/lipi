"use client";

import { motion } from "framer-motion";

const fonts = [
  { name: "Roseline", preview: "Aa", style: "italic", color: "#C9B6F5" },
  { name: "WildStroke", preview: "Bb", style: "normal", color: "#C7F04F" },
  { name: "Softypen", preview: "Cc", style: "italic", color: "#F5F2EA" },
];

export function DashboardPreview() {
  return (
    <section className="px-4 md:px-8 py-16 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row gap-4 items-start mb-8">
        <div>
          <span className="tag text-sm">preview</span>
          <h2 className="section-heading mt-3">
            Your creative studio,
            <br />
            always ready.
          </h2>
        </div>
        <p className="md:ml-auto font-[family-name:var(--font-space-grotesk)] text-lipi-muted text-sm max-w-xs mt-4 md:mt-2">
          All your handwriting projects in one place. Revisit, edit, and export anytime.
        </p>
      </div>

      {/* Faux Dashboard */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="border-2 border-lipi-border bg-lipi-cream rounded-[32px]"
        
      >
        {/* Dashboard header bar */}
        <div className="border-b-2 border-lipi-border px-6 py-3 flex items-center justify-between">
          <span className="font-[family-name:var(--font-space-grotesk)] font-bold text-sm">My Fonts</span>
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-red-400 border border-lipi-border" />
            <div className="w-3 h-3 rounded-full bg-yellow-400 border border-lipi-border" />
            <div className="w-3 h-3 rounded-full bg-green-400 border border-lipi-border" />
          </div>
        </div>

        <div className="flex">
          {/* Sidebar strip */}
          <div className="w-12 border-r-2 border-lipi-border flex flex-col items-center py-4 gap-3">
            {["⌂", "+", "⊙", "⚙"].map((ic, i) => (
              <div key={i} className={`w-8 h-8 flex items-center justify-center text-sm border-2 border-lipi-border ${i === 0 ? "bg-lipi-green" : "bg-transparent"}`}>
                {ic}
              </div>
            ))}
          </div>

          {/* Main content */}
          <div className="flex-1 p-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {fonts.map(({ name, preview, color }, i) => (
                <motion.div
                  key={name}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="border-2 border-lipi-border p-4 bg-white rounded-[32px]"
                  
                >
                  <div
                    className="text-5xl font-[family-name:var(--font-caveat)] mb-3 h-20 flex items-center justify-center border-2 border-lipi-border rounded-[32px]"
                    style={{ backgroundColor: color }}
                  >
                    {preview}
                  </div>
                  <div className="font-[family-name:var(--font-space-grotesk)] font-bold text-sm">{name}</div>
                  <div className="text-lipi-muted text-xs mt-1">26 / 62 glyphs</div>
                </motion.div>
              ))}

              {/* New font CTA card */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="border-2 border-dashed border-lipi-border p-4 flex flex-col items-center justify-center min-h-[140px] cursor-pointer hover:bg-lipi-green/20 transition-colors"
              >
                <span className="text-3xl mb-2">+</span>
                <span className="font-[family-name:var(--font-space-grotesk)] text-sm font-medium">New font</span>
              </motion.div>
            </div>

            {/* Upgrade card */}
            <div className="mt-4 bg-lipi-lavender border-2 border-lipi-border p-4 flex items-center justify-between rounded-[32px]"
              
            >
              <div>
                <div className="font-[family-name:var(--font-space-grotesk)] font-bold text-sm">Upgrade to Premium</div>
                <div className="text-xs text-lipi-text/60 mt-1">Unlimited fonts · AI cleanup · Cloud saves</div>
              </div>
              <div className="btn-lipi btn-dark text-xs px-3 py-2">Upgrade ↗</div>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
