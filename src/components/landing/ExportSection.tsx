"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { HandwrittenNote } from "@/components/ui/HandwrittenNote";

export function ExportSection() {
  return (
    <section id="export" className="px-4 md:px-8 py-16 max-w-7xl mx-auto">
      <div className="text-center mb-10">
        <span className="tag">export</span>
        <h2 className="section-heading mt-3">
          Ready to use.
          <br />
          <em className="font-[family-name:var(--font-cormorant)] italic">Instantly.</em>
        </h2>
      </div>

      {/* Export success card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="max-w-lg mx-auto relative"
      >
        {/* Floating annotation */}
        <div className="absolute -top-4 -right-4 z-10">
          <HandwrittenNote text="your font!" rotation={5} color="lavender" />
        </div>

        {/* Card content container */}
        <div className="border-2 border-lipi-border bg-white rounded-[32px] overflow-hidden relative">
          {/* Card header */}
          <div className="border-b-2 border-lipi-border bg-lipi-green px-6 py-3 flex items-center gap-2">
          <span className="text-xl">✓</span>
          <span className="font-[family-name:var(--font-space-grotesk)] font-bold text-sm">
            Your font is ready.
          </span>
        </div>

        {/* Font preview */}
        <div className="px-6 py-8 border-b-2 border-lipi-border">
          <div className="font-[family-name:var(--font-caveat)] text-5xl text-lipi-text leading-tight mb-2">
            MyHandwriting
          </div>
          <div className="font-[family-name:var(--font-caveat)] text-xl text-lipi-muted">
            The quick brown fox jumps over the lazy dog.
          </div>
        </div>

        {/* Download buttons */}
        <div className="px-6 py-6 flex flex-col sm:flex-row gap-3">
          <Link
            href="/signup"
            className="btn-lipi btn-primary flex-1 justify-center"
          >
            ↓ Download TTF
          </Link>
          <Link
            href="/signup"
            className="btn-lipi btn-secondary flex-1 justify-center"
          >
            ↓ Download OTF
          </Link>
        </div>

        {/* Metadata */}
        <div className="px-6 pb-6 flex gap-6 text-xs font-[family-name:var(--font-space-grotesk)] text-lipi-muted">
          <span>62 glyphs</span>
          <span>·</span>
          <span>~48 KB</span>
          <span>·</span>
          <span>TTF + OTF</span>
        </div>
        </div>
      </motion.div>

      {/* Bottom CTA */}
      <div className="text-center mt-16">
        <p className="font-[family-name:var(--font-cormorant)] text-2xl italic text-lipi-muted mb-6">
          "The most personal thing ever made — by you."
        </p>
        <Link href="/signup" className="btn-lipi btn-primary text-lg px-10 py-4">
          Start for free →
        </Link>
      </div>
    </section>
  );
}
