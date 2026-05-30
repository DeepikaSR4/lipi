"use client";

import { motion } from "framer-motion";

export function WorkspaceSection() {
  const chars = "ABCDEFGHIJ".split("");
  return (
    <section className="bg-lipi-dark py-16 px-4 md:px-8 border-y-2 border-lipi-border">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row gap-4 items-start mb-10">
          <div>
            <span className="tag bg-lipi-green">workspace</span>
            <h2 className="section-heading mt-3 text-lipi-cream">
              Draw each letter,
              <br />
              see it come alive.
            </h2>
          </div>
          <p className="md:ml-auto font-[family-name:var(--font-space-grotesk)] text-lipi-cream/50 text-sm max-w-xs mt-4 md:mt-2">
            Typography guide lines keep your letters consistent. Pen, eraser, undo — everything you need.
          </p>
        </div>

        {/* Faux workspace */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="border-2 border-white/30 bg-[#0d2a1e]"
        >
          {/* Toolbar */}
          <div className="border-b-2 border-white/20 px-4 py-2 flex items-center gap-3">
            {["✏", "⌫", "↩", "↪", "✕"].map((tool, i) => (
              <div key={i} className={`w-8 h-8 border-2 border-white/30 flex items-center justify-center text-sm cursor-pointer ${i === 0 ? "bg-lipi-green border-lipi-green text-lipi-text" : "text-white/60 hover:text-white hover:border-white/60"}`}>
                {tool}
              </div>
            ))}
            <div className="ml-auto text-lipi-green text-xs font-[family-name:var(--font-space-grotesk)]">
              Drawing: <span className="font-bold">A</span>
            </div>
          </div>

          <div className="flex">
            {/* Canvas area */}
            <div className="flex-1 p-4">
              <div className="border-2 border-white/20 bg-white relative" style={{ aspectRatio: "1/1", maxHeight: 300 }}>
                {/* Guide lines */}
                {[15, 35, 70, 85].map((pct, i) => (
                  <div
                    key={i}
                    className="absolute left-0 right-0 border-t border-dashed border-blue-200/50"
                    style={{ top: `${pct}%` }}
                  />
                ))}
                {/* Sample letter */}
                <div className="absolute inset-0 flex items-center justify-center font-[family-name:var(--font-caveat)] text-[120px] text-lipi-text/30">
                  A
                </div>
              </div>
            </div>

            {/* Character grid panel */}
            <div className="w-48 border-l-2 border-white/20 p-3">
              <div className="text-lipi-cream/40 text-xs font-[family-name:var(--font-space-grotesk)] mb-2 uppercase tracking-wide">
                Characters
              </div>
              <div className="grid grid-cols-5 gap-1">
                {chars.map((c, i) => (
                  <div
                    key={c}
                    className={`char-cell border-2 text-xs ${i === 0 ? "selected" : i < 4 ? "has-glyph" : ""}`}
                    style={{
                      borderColor: "rgba(255,255,255,0.2)",
                      backgroundColor: i === 0 ? "#C7F04F" : i < 4 ? "rgba(255,255,255,0.1)" : "transparent",
                      color: i === 0 ? "#111" : "rgba(255,255,255,0.7)",
                    }}
                  >
                    {c}
                  </div>
                ))}
              </div>
              <div className="mt-3 text-lipi-cream/40 text-xs">4 / 26 done</div>
              <div className="mt-1 h-1 bg-white/10 border border-white/20">
                <div className="h-full bg-lipi-green" style={{ width: "15%" }} />
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
