"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { HandwrittenNote } from "@/components/ui/HandwrittenNote";
import { PillButton } from "@/components/ui/PillButton";
import { analytics } from "@/lib/analytics";
import { useEffect } from "react";

import { type Variants } from "framer-motion";

const containerVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15 } },
};
const itemVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } },
};


// Inline flower SVG doodle
function FlowerDoodle({ className = "", style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} width="60" height="60" viewBox="0 0 60 60" fill="none">
      <circle cx="30" cy="30" r="6" fill="#C7F04F" stroke="#111" strokeWidth="2"/>
      {[0,60,120,180,240,300].map((deg, i) => (
        <ellipse
          key={i}
          cx={30 + 14 * Math.cos((deg * Math.PI) / 180)}
          cy={30 + 14 * Math.sin((deg * Math.PI) / 180)}
          rx="7" ry="5"
          fill="#C9B6F5"
          stroke="#111"
          strokeWidth="1.5"
          transform={`rotate(${deg}, ${30 + 14 * Math.cos((deg * Math.PI) / 180)}, ${30 + 14 * Math.sin((deg * Math.PI) / 180)})`}
        />
      ))}
    </svg>
  );
}


// Mini workspace preview for right card
function WorkspacePreview() {
  return (
    <div className="border-2 border-white/30 bg-[#1a4a30] p-3 rounded-none">
      <div className="bg-[#0d2a1e] border border-white/20 p-2 mb-2 font-[family-name:var(--font-caveat)] text-white text-2xl leading-tight">
        Aa Bb Cc
      </div>
      <div className="flex gap-1">
        {["A","B","C","D","E","F"].map(c => (
          <div key={c} className="w-7 h-7 border border-white/30 flex items-center justify-center text-white/60 text-xs font-[family-name:var(--font-space-grotesk)]">
            {c}
          </div>
        ))}
      </div>
    </div>
  );
}

export function HeroSection() {
  useEffect(() => {
    analytics.trackLandingPageViewed();
  }, []);

  return (
    <section className="px-4 md:px-8 py-6 md:py-6 max-w-7xl mx-auto h-auto md:h-[calc(100dvh-56px)]">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 gap-6 h-auto md:h-full"
      >
        {/* LEFT CARD — Cream */}
        <motion.div
          variants={itemVariants}
          className="bg-lipi-cream px-8 py-6 relative overflow-hidden flex flex-col justify-between border-2 border-lipi-border rounded-[32px] h-auto md:h-full min-h-[440px] md:min-h-0"
        >
          {/* Annotation top */}
          <div className="flex items-center gap-3 mb-4">
            <HandwrittenNote text="✨ newly launched" rotation={-2} color="green" />
            <span className="font-[family-name:var(--font-caveat)] text-sm text-lipi-text/60">
              →
            </span>
            <span className="font-[family-name:var(--font-caveat)] text-sm text-lipi-text/60">
              try for free
            </span>
          </div>

          {/* Main heading */}
          <div className="flex-1 flex flex-col justify-center my-6 md:my-0">
            <h1 className="font-[family-name:var(--font-primary)] font-bold leading-[1] tracking-tight text-lipi-text mb-4"
              style={{ fontSize: "clamp(2rem, 5vw, 4rem)" }}
            >
              Turn your<br />
              handwriting<br />
              <em className="font-[family-name:var(--font-serif)] italic font-normal"
                style={{ fontSize: "clamp(1.6rem, 4vw, 3.2rem)" }}
              >
                into identity.
              </em>
            </h1>
            <p className="font-[family-name:var(--font-primary)] text-lipi-text/70 text-sm mb-6 max-w-xs leading-relaxed">
              Draw your letters. Upload your handwriting. Get a real, downloadable font that's entirely yours.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap gap-3">
              <PillButton
                href="/signup"
                variant="dark"
                size="md"
                onClick={() => analytics.trackCtaClicked("Create your font", "hero")}
              >
                Create your font →
              </PillButton>
              <PillButton
                href="#demo"
                variant="secondary"
                size="md"
                className="border-transparent shadow-none hover:bg-black/5"
                onClick={() => analytics.trackDemoClicked("hero")}
              >
                ▶ Watch demo
              </PillButton>
            </div>
          </div>

          {/* Stats row */}
          <div className="flex gap-6 pt-4 border-t-2 border-lipi-border mt-auto">
            {[
              { val: "12k+", label: "fonts created" },
              { val: "4.9★", label: "rating" },
              { val: "Free", label: "to start" },
            ].map(({ val, label }) => (
              <div key={label} className="font-[family-name:var(--font-primary)]">
                <div className="text-lg font-bold text-lipi-text">{val}</div>
                <div className="text-xs text-lipi-text/60">{label}</div>
              </div>
            ))}
          </div>

          {/* Floating annotation */}
          <div className="absolute top-8 right-8 rotate-6 hidden lg:block">
            <HandwrittenNote text="your letters →" rotation={6} color="cream" />
          </div>
        </motion.div>

        {/* RIGHT CARD — Dark green */}
        <motion.div
          variants={itemVariants}
          className="bg-lipi-dark px-8 py-6 relative overflow-hidden flex flex-col justify-between border-2 border-lipi-border rounded-[32px] h-auto md:h-full min-h-[440px] md:min-h-0"
        >
          {/* Floating doodles */}
          <FlowerDoodle className="absolute top-6 right-10 opacity-80" />
          <FlowerDoodle className="absolute bottom-16 left-6 opacity-50" style={{ width: 40, height: 40 } as React.CSSProperties} />

          {/* Paper note */}
          <div
            className="absolute top-4 left-6 bg-lipi-cream px-4 py-3 shadow-md rounded-md -rotate-2 font-[family-name:var(--font-caveat)] text-lipi-text text-sm max-w-[120px]"
          >
            "Finally a font that's actually mine ✦"
          </div>

          {/* Workspace preview */}
          <div className="mt-14 mb-8 relative z-10 flex-1 flex flex-col justify-center">
            <WorkspacePreview />
          </div>

          {/* Bottom handwriting sample */}
          <div className="relative z-10 mt-auto">
            <div className="font-[family-name:var(--font-primary)] text-lipi-cream/40 text-xs mb-2 tracking-wide uppercase font-semibold">
              Live Preview
            </div>
            <div className="font-[family-name:var(--font-caveat)] text-lipi-green text-2xl leading-tight">
              Hello World.
            </div>
            <div className="font-[family-name:var(--font-caveat)] text-lipi-cream/60 text-base mt-1">
              The quick brown fox jumps...
            </div>
          </div>

          {/* Annotation */}
          <div className="absolute bottom-8 right-8 rotate-3 hidden lg:block">
            <HandwrittenNote text="draw or upload" rotation={3} color="green" />
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
