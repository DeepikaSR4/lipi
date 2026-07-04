"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useFontStore } from "@/store/fontStore";
import { generateFont, downloadFont } from "@/lib/fontGenerator";
import { useAuth } from "@/hooks/useAuth";
import { analytics } from "@/lib/analytics";

export function ExportCard({ onClose }: { onClose?: () => void }) {
  const { glyphs, fontName, setExportStatus, exportStatus } = useFontStore();
  const { user } = useAuth();
  const [error, setError] = useState("");

  const handleExport = useCallback(async (format: "ttf" | "otf") => {
    if (Object.keys(glyphs).length === 0) {
      setError("Draw at least one character before exporting.");
      return;
    }
    setExportStatus("generating");
    setError("");
    analytics.trackFontExportStarted(format === "ttf" ? "TTF" : "OTF");
    try {
      const buffer = await generateFont(glyphs, fontName, format);
      downloadFont(buffer, fontName, format);
      setExportStatus("ready");
      analytics.trackFontExportCompleted(format === "ttf" ? "TTF" : "OTF", Math.round(buffer.byteLength / 1024));
    } catch (e) {
      console.error(e);
      setError("Export failed. Please try again.");
      setExportStatus("error");
    }
  }, [glyphs, fontName, setExportStatus]);

  const glyphCount = Object.keys(glyphs).length;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 20 }}
      className="border-2 border-lipi-border bg-white rounded-[32px] overflow-hidden"
    >
      {/* Header */}
      <div className={`border-b-2 border-lipi-border px-6 py-3 flex items-center justify-between ${exportStatus === "ready" ? "bg-lipi-green" : "bg-lipi-cream"}`}>
        <div className="flex items-center gap-2">
          {exportStatus === "ready" && <span className="text-lg">✓</span>}
          <span className="font-[family-name:var(--font-space-grotesk)] font-bold text-sm">
            {exportStatus === "ready" ? "Your font is ready!" : "Export Font"}
          </span>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-lipi-muted hover:text-lipi-text text-lg">✕</button>
        )}
      </div>

      {/* Font preview */}
      <div className="px-6 py-6 border-b-2 border-lipi-border">
        <div className="font-[family-name:var(--font-caveat)] text-4xl text-lipi-text mb-1 leading-tight">
          {fontName}
        </div>
        <div className="font-[family-name:var(--font-caveat)] text-lg text-lipi-muted">
          ABCDEFGHIJKLM
        </div>
        <div className="mt-3 text-xs font-[family-name:var(--font-space-grotesk)] text-lipi-muted flex gap-4">
          <span>{glyphCount} glyphs</span>
          <span>·</span>
          <span>TTF + OTF</span>
        </div>
      </div>

      {/* Export status / generating */}
      {exportStatus === "generating" && (
        <div className="px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 border-2 border-lipi-border border-t-lipi-green animate-spin rounded-[32px]" />
            <span className="text-sm font-[family-name:var(--font-space-grotesk)]">Generating font...</span>
          </div>
          <div className="mt-2 h-1 bg-lipi-border/10 overflow-hidden">
            <motion.div
              className="h-full bg-lipi-green"
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 4, ease: "easeInOut" as const }}
            />
          </div>
        </div>
      )}

      {error && (
        <div className="px-6 py-3 bg-red-50 border-b-2 border-red-200 text-xs text-red-600 font-[family-name:var(--font-space-grotesk)]">
          {error}
        </div>
      )}

      {/* Buttons */}
      <div className="px-6 py-5 flex flex-col sm:flex-row gap-3">
        <button
          onClick={() => {
            analytics.trackFontDownloadRequested("TTF");
            handleExport("ttf");
          }}
          disabled={exportStatus === "generating"}
          className="btn-lipi btn-primary flex-1 justify-center disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ↓ Download TTF
        </button>
        <button
          onClick={() => {
            analytics.trackFontDownloadRequested("OTF");
            handleExport("otf");
          }}
          disabled={exportStatus === "generating"}
          className="btn-lipi btn-secondary flex-1 justify-center disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ↓ Download OTF
        </button>
      </div>
    </motion.div>
  );
}
