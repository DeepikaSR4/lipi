"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { HandwrittenNote } from "@/components/ui/HandwrittenNote";

export function CreateFlowSection() {
  return (
    <section id="create" className="px-4 md:px-8 py-16 max-w-7xl mx-auto">
      <div className="text-center mb-10">
        <span className="tag">how it works</span>
        <h2 className="section-heading mt-3">Two ways to create</h2>
        <p className="font-[family-name:var(--font-space-grotesk)] text-lipi-muted mt-3 text-sm">
          Choose your style — draw digitally or bring your paper handwriting.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Draw it */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          whileHover={{ x: -3, y: -3, }}
          className="border-2 border-lipi-border bg-lipi-lavender p-8 relative cursor-pointer group rounded-[32px]"
          
        >
          <div className="absolute -top-3 -right-3">
            <HandwrittenNote text="most popular" rotation={4} color="green" />
          </div>

          {/* Mini canvas preview */}
          <div className="border-2 border-lipi-border bg-white mb-6 p-4 relative h-32 rounded-[32px]">
            <div className="absolute inset-0 flex items-center justify-center">
              {/* Simulated pen strokes */}
              <svg width="160" height="80" viewBox="0 0 160 80">
                <path d="M 20,60 Q 30,20 50,40 Q 70,60 80,30 Q 90,10 110,35 Q 130,55 140,25" stroke="#111" strokeWidth="3" fill="none" strokeLinecap="round"/>
                <circle cx="22" cy="58" r="4" fill="#C7F04F" stroke="#111" strokeWidth="1.5"/>
              </svg>
            </div>
            <div className="absolute top-2 left-2 text-xs font-[family-name:var(--font-space-grotesk)] text-lipi-muted">canvas</div>
          </div>

          <h3 className="font-[family-name:var(--font-cormorant)] text-3xl font-bold mb-2">Draw it</h3>
          <p className="font-[family-name:var(--font-space-grotesk)] text-sm text-lipi-text/70 mb-6">
            Use your finger, stylus, or mouse to draw each letter directly on the canvas. Typography guides included.
          </p>

          <Link href="/create?method=draw" className="btn-lipi btn-dark text-sm inline-flex">
            Start drawing →
          </Link>
        </motion.div>

        {/* Upload it */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          whileHover={{ x: -3, y: -3, }}
          className="border-2 border-lipi-border bg-lipi-cream p-8 relative cursor-pointer group rounded-[32px]"
          
        >
          {/* Upload preview */}
          <div className="border-2 border-dashed border-lipi-border bg-white mb-6 p-4 h-32 flex items-center justify-center">
            <div className="text-center">
              <div className="text-3xl mb-1">📄</div>
              <div className="text-xs font-[family-name:var(--font-space-grotesk)] text-lipi-muted">PNG · JPG · JPEG</div>
            </div>
          </div>

          <h3 className="font-[family-name:var(--font-cormorant)] text-3xl font-bold mb-2">Upload it</h3>
          <p className="font-[family-name:var(--font-space-grotesk)] text-sm text-lipi-text/70 mb-6">
            Write all 26 letters on paper, photograph it, and upload. We'll detect and vectorize each character automatically.
          </p>

          <Link href="/create?method=upload" className="btn-lipi btn-secondary text-sm inline-flex">
            Upload handwriting →
          </Link>
        </motion.div>
      </div>

      {/* Step indicators */}
      <div className="flex flex-wrap justify-center gap-6 mt-12">
        {[
          { step: "01", label: "Choose method" },
          { step: "02", label: "Fill all characters" },
          { step: "03", label: "Preview live" },
          { step: "04", label: "Export TTF / OTF" },
        ].map(({ step, label }) => (
          <div key={step} className="flex items-center gap-3">
            <span className="w-8 h-8 border-2 border-lipi-border flex items-center justify-center text-xs font-bold bg-lipi-cream rounded-[32px]">
              {step}
            </span>
            <span className="font-[family-name:var(--font-space-grotesk)] text-sm">{label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
