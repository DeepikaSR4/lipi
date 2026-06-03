"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useFontStore } from "@/store/fontStore";
import { CHAR_SETS, type CharSet } from "@/types";
import { ExportCard } from "./ExportCard";
import Link from "next/link";

const TABS: { id: CharSet; label: string }[] = [
  { id: "uppercase", label: "ABC" },
  { id: "lowercase", label: "abc" },
  { id: "numbers", label: "123" },
  { id: "symbols", label: "#!@" },
];

const MILESTONES = [25, 50, 75, 100];

export function CharacterGrid() {
  const [justSaved, setJustSaved] = useState<string | null>(null);
  const [viewGridOverride, setViewGridOverride] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  const {
    selectedChar,
    glyphs,
    switchChar,
    saveCurrentGlyph,
    currentStrokes,
    fontId,
    fontName,
    activeTab,
    setActiveTab
  } = useFontStore();

  const chars = CHAR_SETS[activeTab];
  const totalChars = Object.values(CHAR_SETS).flat().length;
  const doneChars = Object.keys(glyphs).length;
  const progressPct = Math.round((doneChars / totalChars) * 100);

  const handleSave = () => {
    if (hasDrawing) {
      saveCurrentGlyph();
      setJustSaved(selectedChar);
      setTimeout(() => setJustSaved(null), 1200);
    }
  };

  const hasDrawing = currentStrokes.length > 0;
  const isAllDone = doneChars === totalChars;
  const showSuccess = isAllDone && !viewGridOverride;

  if (showSuccess) {
    return (
      <div className="w-full flex flex-col h-full overflow-y-auto">
        {/* Celebration Header */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          {/* Animated celebration graphic */}
          <motion.div
            initial={{ scale: 0.8, rotate: -10 }}
            animate={{ 
              scale: [1, 1.1, 1],
              rotate: [0, 5, -5, 0]
            }}
            transition={{ 
              duration: 2, 
              repeat: Infinity,
              repeatType: "reverse"
            }}
            className="w-24 h-24 bg-lipi-green border-2 border-lipi-border flex items-center justify-center rounded-full shadow-brutal mb-6 relative animate-wiggle"
          >
            <span className="text-4xl">🎉</span>
            {/* Tiny stars / confetti */}
            <motion.span
              animate={{ y: [-10, -20], opacity: [0, 1, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
              className="absolute -top-2 -left-2 text-lg"
            >
              ✨
            </motion.span>
            <motion.span
              animate={{ y: [-5, -15], opacity: [0, 1, 0] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: 0.6 }}
              className="absolute -top-3 -right-2 text-lg"
            >
              ⭐
            </motion.span>
          </motion.div>

          <h2 className="font-[family-name:var(--font-space-grotesk)] text-xl font-bold text-lipi-text mb-2">
            Woohoo! All Done!
          </h2>
          <p className="font-[family-name:var(--font-space-grotesk)] text-xs text-lipi-muted leading-relaxed max-w-[200px] mb-8">
            You have successfully completed drawing all <strong>{totalChars}</strong> characters of <strong>{fontName}</strong>!
          </p>

          {/* Action CTAs */}
          <div className="w-full flex flex-col gap-3 px-2">
            <Link
              href={`/preview/${fontId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full btn-lipi btn-primary text-xs py-2.5 px-4 flex items-center justify-center gap-1.5 shadow-brutal-sm hover:translate-x-[-1px] hover:translate-y-[-1px] active:translate-x-[0px] active:translate-y-[0px] transition-all"
            >
              Preview Font ↗
            </Link>

            <motion.button
              onClick={() => setShowExportModal(true)}
              whileHover={{ x: -1, y: -1 }}
              whileTap={{ x: 1, y: 1 }}
              className="w-full btn-lipi btn-secondary text-xs py-2.5 px-4 flex items-center justify-center gap-1.5 shadow-brutal-sm cursor-pointer"
            >
              Export Font ↓
            </motion.button>
          </div>
        </div>

        {/* Footer actions */}
        <div className="border-t-2 border-lipi-border p-4 bg-white flex flex-col gap-2">
          <button
            onClick={() => setViewGridOverride(true)}
            className="text-xs font-[family-name:var(--font-space-grotesk)] font-bold text-lipi-text hover:text-lipi-green hover:underline flex items-center justify-center gap-1 transition-colors py-1 cursor-pointer"
          >
            ← View / Edit Characters
          </button>
        </div>

        {/* Local Export Card Modal */}
        <AnimatePresence>
          {showExportModal && (
            <div
              className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
              onClick={(e) => e.target === e.currentTarget && setShowExportModal(false)}
            >
              <div className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
                <ExportCard onClose={() => setShowExportModal(false)} />
              </div>
            </div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col">

      {/* All Done celebratory banner (only when viewing grid after completion) */}
      {isAllDone && viewGridOverride && (
        <div className="bg-[#C7F04F]/20 border-b-2 border-lipi-border p-3 flex items-center justify-between">
          <span className="text-xs font-[family-name:var(--font-space-grotesk)] font-bold text-lipi-dark flex items-center gap-1">
            🎉 All {totalChars} chars done!
          </span>
          <button
            onClick={() => setViewGridOverride(false)}
            className="text-[10px] font-[family-name:var(--font-space-grotesk)] font-bold bg-lipi-green px-2 py-1 border-2 border-lipi-border shadow-[2px_2px_0px_#111] hover:translate-x-[-0.5px] hover:translate-y-[-0.5px] active:translate-x-[0px] active:translate-y-[0px] transition-all cursor-pointer"
          >
            Celebrate →
          </button>
        </div>
      )}

      {/* Progress header */}
      <div className="border-b-2 border-lipi-border p-3 bg-lipi-cream">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-[family-name:var(--font-space-grotesk)] font-bold">
            {doneChars}/{totalChars}
          </span>
          <span className="text-xs font-[family-name:var(--font-space-grotesk)] text-lipi-muted">
            {progressPct}% complete
          </span>
        </div>

        {/* Progress bar with milestone pips */}
        <div className="relative h-2 bg-lipi-border/10 border border-lipi-border/20 mb-2">
          <motion.div
            className="h-full bg-lipi-green"
            initial={{ width: 0 }}
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
          {/* Milestone markers */}
          {MILESTONES.map(m => (
            <div
              key={m}
              className={`absolute top-0 bottom-0 w-px ${progressPct >= m ? "bg-lipi-dark" : "bg-lipi-border/30"}`}
              style={{ left: `${m}%` }}
            />
          ))}
        </div>

        {/* Milestone badges */}
        <div className="flex gap-1">
          {MILESTONES.map(m => (
            <div
              key={m}
              className={`text-[10px] font-[family-name:var(--font-space-grotesk)] font-bold px-1.5 py-0.5 border transition-colors ${
                progressPct >= m
                  ? "border-lipi-dark bg-lipi-green text-lipi-dark"
                  : "border-lipi-border/20 text-lipi-muted"
              }`}
            >
              {m}%
            </div>
          ))}
        </div>
      </div>

      {/* Save CTA */}
      <div className="border-b-2 border-lipi-border p-2">
        <motion.button
          onClick={handleSave}
          disabled={!hasDrawing}
          whileHover={hasDrawing ? { x: -2, y: -2 } : {}}
          whileTap={hasDrawing ? { x: 1, y: 1 } : {}}
          className={`w-full py-2 px-3 text-xs font-[family-name:var(--font-space-grotesk)] font-bold border-2 transition-all flex items-center justify-center gap-1.5 ${
            hasDrawing
              ? "bg-lipi-green border-lipi-border text-lipi-dark cursor-pointer"
              : "bg-lipi-border/10 border-lipi-border/20 text-lipi-muted cursor-not-allowed"
          }`}
        >
          <AnimatePresence mode="wait">
            {justSaved ? (
              <motion.span
                key="saved"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-1"
              >
                ✓ Saved!
              </motion.span>
            ) : (
              <motion.span
                key="save"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-1"
              >
                Save Drawing
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>

      {/* Current char callout */}
      <div className="border-b-2 border-lipi-border p-3 bg-white">
        <div className="text-[10px] text-lipi-muted font-[family-name:var(--font-space-grotesk)] mb-1 uppercase tracking-wide">
          Drawing
        </div>
        <div className="flex items-center justify-between">
          <span className="font-[family-name:var(--font-caveat)] text-4xl text-lipi-text leading-none">
            {selectedChar}
          </span>
          <span className={`text-xs font-[family-name:var(--font-space-grotesk)] font-bold px-2 py-1 border-2 ${
            selectedChar in glyphs
              ? "bg-lipi-green border-lipi-dark text-lipi-dark"
              : "bg-lipi-border/10 border-lipi-border/30 text-lipi-muted"
          }`}>
            {selectedChar in glyphs ? "✓ Done" : "Not drawn"}
          </span>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="grid grid-cols-4 border-b-2 border-lipi-border">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`py-2 text-xs font-[family-name:var(--font-space-grotesk)] font-semibold border-r-2 border-lipi-border last:border-r-0 transition-colors ${
              activeTab === id
                ? "bg-lipi-text text-lipi-cream"
                : "bg-lipi-cream text-lipi-muted hover:bg-lipi-green/20"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Character cells — 7 cols fits 26 chars in 4 rows, no scroll */}
      <div className="p-2">
        <div className="grid grid-cols-7 gap-1">
          {chars.map((char) => {
            const isDone = char in glyphs;
            const isSelected = char === selectedChar;
            const isJustSaved = justSaved === char;

            return (
              <motion.button
                key={char}
                onClick={() => switchChar(char)}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.95 }}
                className={`aspect-square text-sm font-[family-name:var(--font-space-grotesk)] font-bold border-2 relative transition-all ${
                  isSelected
                    ? "bg-lipi-green border-lipi-border shadow-[2px_2px_0px_#111] -translate-x-0.5 -translate-y-0.5 z-10"
                    : isDone
                    ? "bg-[#C7F04F]/40 border-lipi-green text-lipi-dark"
                    : "bg-lipi-cream border-lipi-border/30 text-lipi-muted hover:border-lipi-border hover:bg-lipi-lavender/30"
                }`}
                title={isDone ? `"${char}" — done ✓` : `Draw "${char}"`}
              >
                {char}

                {/* Done checkmark overlay */}
                {isDone && !isSelected && (
                  <motion.span
                    initial={isJustSaved ? { scale: 0 } : { scale: 1 }}
                    animate={{ scale: 1 }}
                    className="absolute bottom-0.5 right-0.5 text-[8px] leading-none text-lipi-dark font-bold"
                  >
                    ✓
                  </motion.span>
                )}

                {/* Burst animation on just saved */}
                <AnimatePresence>
                  {isJustSaved && (
                    <motion.div
                      initial={{ scale: 0, opacity: 1 }}
                      animate={{ scale: 2.5, opacity: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.4 }}
                      className="absolute inset-0 bg-lipi-green rounded-sm pointer-events-none"
                    />
                  )}
                </AnimatePresence>
              </motion.button>
            );
          })}
        </div>
      </div>

    </div>
  );
}
