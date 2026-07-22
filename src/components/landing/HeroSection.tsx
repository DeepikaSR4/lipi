"use client";

import { motion } from "framer-motion";
import { PillButton } from "@/components/ui/PillButton";
import { analytics } from "@/lib/analytics";
import { useEffect, useState } from "react";
import { type Variants } from "framer-motion";

const containerVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};
const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

const BrushHighlight = () => (
  <svg className="absolute inset-0 w-[110%] h-[120%] -left-[5%] -top-[10%] -z-10 text-[#C7F04F] drop-shadow-sm" preserveAspectRatio="none" viewBox="0 0 200 60" fill="currentColor">
    <path d="M5 25 Q 50 10 195 20 Q 190 40 5 45 Z" />
    <path d="M2 15 Q 100 0 198 10 Q 185 30 10 25 Z" opacity="0.7"/>
    <path d="M8 35 Q 90 20 192 30 Q 180 55 12 50 Z" opacity="0.5"/>
  </svg>
);

const DownArrow = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-[#C7F04F]">
    <circle cx="12" cy="12" r="12" fill="currentColor" />
    <path d="M12 7V17M12 17L8 13M12 17L16 13" stroke="#111" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const CurvedArrowDown = () => (
  <svg width="40" height="30" viewBox="0 0 40 30" fill="none" stroke="#111" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="ml-1 mt-1">
    <path d="M5,5 Q 30,5 35,25" />
    <path d="M28,23 L35,25 L37,18" />
  </svg>
);

const CurvedArrowSide = () => (
  <svg width="30" height="40" viewBox="0 0 30 40" fill="none" stroke="#111" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="ml-2 mt-1">
    <path d="M5,5 Q 5,30 25,35" />
    <path d="M20,28 L25,35 L18,37" />
  </svg>
);

export function HeroSection() {
  const [totalFonts, setTotalFonts] = useState<number | null>(null);

  useEffect(() => {
    analytics.trackLandingPageViewed();
    
    fetch('/api/stats')
      .then(res => res.json())
      .then(data => {
        if (typeof data.fontCount === 'number' && data.fontCount > 0) {
          setTotalFonts(data.fontCount);
        } else {
          setTotalFonts(12000); // Fallback if 0 or error
        }
      })
      .catch((err) => {
        console.error("Failed to fetch stats:", err);
        setTotalFonts(12000);
      });
  }, []);

  return (
    <section className="relative w-full overflow-hidden bg-lipi-cream min-h-[calc(100vh-64px)] flex items-center py-8 px-6">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-8 lg:gap-8 items-center w-full"
      >
        
        {/* =======================
            LEFT COLUMN (Order 1 on Desktop, 1 on Mobile)
        ======================= */}
        <div className="flex-1 flex flex-col items-center text-center lg:items-start lg:text-left order-1 lg:order-1 w-full z-10">
          
          {/* Main Headline */}
          <motion.h1 
            variants={itemVariants}
            className="font-[family-name:var(--font-primary)] font-bold leading-[1.05] tracking-tight text-lipi-text mb-4"
            style={{ fontSize: "clamp(2.5rem, 6vw, 5.5rem)" }}
          >
            Turn your<br />
            <span className="relative inline-block my-1 md:my-0">
              <span className="relative z-10 text-lipi-dark px-1">handwriting</span>
              <BrushHighlight />
            </span><br />
            into <em className="font-[family-name:var(--font-serif)] italic font-normal">identity.</em>
          </motion.h1>

          {/* Subcopy */}
          <motion.p 
            variants={itemVariants}
            className="font-[family-name:var(--font-primary)] text-[#555] text-base md:text-lg max-w-lg mb-6 leading-relaxed"
          >
            Draw your letters, upload your handwriting, and download a <strong className="font-bold text-lipi-text">real fonts</strong> that's entirely yours.
          </motion.p>

          {/* Desktop CTAs & Stats (Order 2 on Desktop, Hidden on Mobile, moved to below visuals) */}
          <div className="hidden lg:flex flex-col items-start w-full">
            <motion.div variants={itemVariants} className="flex flex-wrap gap-3 mb-6">
              <PillButton
                href="/signup"
                variant="dark"
                size="md"
                onClick={() => analytics.trackCtaClicked("Create your font", "hero")}
                className="bg-[#123524] text-white hover:bg-[#1a4a30] !rounded-xl border-none font-semibold shadow-md"
              >
                Create your font — it's free
              </PillButton>
            </motion.div>
          </div>

        </div>

        {/* =======================
            RIGHT COLUMN (Order 2 on Desktop, 2 on Mobile)
            This contains both top and bottom visuals.
        ======================= */}
        <div className="flex-1 w-full max-w-lg mx-auto flex flex-col items-center gap-6 order-2 lg:order-2 transform lg:scale-95 origin-center">
          
          {/* Top Visual Group */}
          <motion.div variants={itemVariants} className="w-full flex flex-col items-center relative gap-3">
            
            <div className="relative">
              <div className="absolute -top-8 -left-10 flex items-start">
                <span className="font-[family-name:var(--font-caveat)] text-lg text-lipi-text -rotate-6">You write</span>
                <CurvedArrowDown />
              </div>
              
              <div className="bg-white border border-lipi-border/10 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-3 flex justify-center gap-2 w-full">
                {['A', 'a', 'g', 't', 'y'].map((char, i) => (
                  <div key={i} className="w-10 h-12 md:w-14 md:h-14 border border-lipi-border/15 rounded-lg flex items-center justify-center">
                    <span className="font-[family-name:var(--font-caveat)] text-3xl md:text-4xl text-lipi-text">{char}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="scale-75">
              <DownArrow />
            </div>

            <div className="relative w-full">
              <div className="absolute -top-4 -left-16 flex items-start">
                <span className="font-[family-name:var(--font-caveat)] text-base text-lipi-text -rotate-6 w-20 leading-tight">We create your font</span>
                <CurvedArrowSide />
              </div>

              <div className="bg-white border border-lipi-border/10 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] p-4 pt-8 w-full relative">
                {/* Horizontal lines to look like ruled paper */}
                <div className="absolute top-[35%] left-4 right-4 h-[1px] bg-lipi-border/10"></div>
                <div className="absolute top-[60%] left-4 right-4 h-[1px] bg-lipi-border/10"></div>
                
                <div className="flex justify-center items-baseline gap-1 relative z-10 font-[family-name:var(--font-caveat)] text-[4.5rem] md:text-[5.5rem] leading-none tracking-tight">
                  A a g t y
                </div>

                <div className="mt-4">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 border border-lipi-border/10 rounded-md bg-white shadow-sm text-[10px] font-semibold text-lipi-text">
                    MyHandwriting.otf 
                    <span className="text-[#C7F04F] bg-[#123524] rounded-full w-3.5 h-3.5 flex items-center justify-center text-[8px]">✔</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* =======================
              MOBILE ONLY CTAs & Stats (Order 3 on Mobile, hidden on desktop)
          ======================= */}
          <div className="flex flex-col items-center w-full lg:hidden mt-4 gap-8">
            <motion.div variants={itemVariants} className="flex flex-col gap-4 w-full px-4">
              <PillButton
                href="/signup"
                variant="dark"
                size="lg"
                onClick={() => analytics.trackCtaClicked("Create your font", "hero")}
                className="bg-[#123524] text-white hover:bg-[#1a4a30] !rounded-xl border-none font-semibold shadow-md w-full justify-center"
              >
                Create your font — it's free
              </PillButton>
            </motion.div>
          </div>

          {/* Bottom Visual Card */}
          <motion.div variants={itemVariants} className="bg-[#F6F8ED] border border-lipi-border/5 rounded-[20px] p-6 w-full relative mt-2">
            
            {/* Sparkle decorative lines */}
            <div className="absolute -top-3 -right-3 text-[#C7F04F] font-bold text-2xl rotate-12">
              <svg width="30" height="30" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round">
                <path d="M10,20 L30,40 M40,5 L50,30 M70,10 L60,35"/>
              </svg>
            </div>
            
            <h3 className="text-center font-[family-name:var(--font-primary)] font-bold text-2xl text-lipi-dark mb-6 relative inline-block left-1/2 -translate-x-1/2">
              Use it anywhere
              <div className="absolute -bottom-1 left-0 right-0 h-1 bg-[#C7F04F] rounded-full opacity-80"></div>
            </h3>

            <div className="flex justify-between items-center px-2">
              <div className="flex flex-col items-center gap-1.5">
                <div className="w-10 h-10 bg-white rounded-lg shadow-sm border border-black/5 flex items-center justify-center text-[#2b579a] font-bold text-xl font-sans">
                  W
                </div>
                <span className="text-[9px] font-bold">Word</span>
              </div>
              <div className="flex flex-col items-center gap-1.5">
                <div className="w-10 h-10 bg-[#001e36] rounded-lg shadow-sm flex items-center justify-center text-[#31a8ff] font-bold text-lg font-sans border border-[#31a8ff]/30">
                  Ps
                </div>
                <span className="text-[9px] font-bold">Photoshop</span>
              </div>
              <div className="flex flex-col items-center gap-1.5">
                <div className="w-10 h-10 bg-[#330000] rounded-lg shadow-sm flex items-center justify-center text-[#ff9a00] font-bold text-lg font-sans border border-[#ff9a00]/30">
                  Ai
                </div>
                <span className="text-[9px] font-bold">Illustrator</span>
              </div>
              <div className="flex flex-col items-center gap-1.5">
                <div className="w-10 h-10 bg-white rounded-lg shadow-sm border border-black/5 flex items-center justify-center p-2">
                  {/* Figma logo lookalike */}
                  <div className="grid grid-cols-2 grid-rows-3 gap-[2px] w-full h-full">
                    <div className="bg-[#f24e1e] rounded-l-full rounded-tr-full"></div>
                    <div className="bg-[#ff7262] rounded-full"></div>
                    <div className="bg-[#a259ff] rounded-l-full rounded-br-full"></div>
                    <div className="bg-[#1abcfe] rounded-full"></div>
                    <div className="bg-[#0acf83] rounded-bl-full rounded-br-full rounded-tl-full col-start-1 h-3/4"></div>
                  </div>
                </div>
                <span className="text-[9px] font-bold">Figma</span>
              </div>
              <div className="flex flex-col items-center gap-1.5 justify-center h-10">
                <span className="font-bold text-lipi-dark text-xs">& more</span>
              </div>
            </div>

            <div className="text-center text-[#888] font-medium text-[10px] mt-6">
              Install once. Use forever.
            </div>

            <div className="absolute -bottom-5 -right-5 text-[#99b955] rotate-180 opacity-60 scale-75">
              <CurvedArrowSide />
            </div>
          </motion.div>

        </div>
      </motion.div>
    </section>
  );
}
