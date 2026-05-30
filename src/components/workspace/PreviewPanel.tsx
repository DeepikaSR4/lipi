"use client";

import { useState } from "react";
import { useFontStore } from "@/store/fontStore";
import { PREVIEW_SAMPLES, type PreviewTab } from "@/types";

const TABS: { id: PreviewTab; label: string }[] = [
  { id: "heading", label: "Heading" },
  { id: "paragraph", label: "Para" },
  { id: "poster", label: "Poster" },
  { id: "script", label: "Script" },
];

export function PreviewPanel() {
  const [activeTab, setActiveTab] = useState<PreviewTab>("heading");
  const [customText, setCustomText] = useState("");
  const { fontName, glyphs } = useFontStore();

  const displayText = customText || PREVIEW_SAMPLES[activeTab];
  const hasGlyphs = Object.keys(glyphs).length > 0;

  const fontSize = {
    heading: "text-4xl",
    paragraph: "text-base",
    poster: "text-6xl",
    script: "text-2xl",
  }[activeTab];

  return (
    <div className="w-72 border-r-2 border-lipi-border bg-white flex flex-col">
      {/* Header */}
      <div className="border-b-2 border-lipi-border px-4 py-3">
        <div className="font-[family-name:var(--font-space-grotesk)] font-bold text-sm mb-2">Live Preview</div>

        {/* Tabs */}
        <div className="flex gap-1">
          {TABS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`px-2 py-1 text-xs font-[family-name:var(--font-space-grotesk)] font-medium border transition-colors ${
                activeTab === id
                  ? "border-lipi-border bg-lipi-text text-lipi-cream"
                  : "border-lipi-border/30 bg-transparent text-lipi-muted hover:bg-lipi-green/20"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Preview area */}
      <div className="flex-1 p-4 overflow-auto">
        {hasGlyphs ? (
          <div className={`font-[family-name:var(--font-caveat)] ${fontSize} leading-tight text-lipi-text break-words whitespace-pre-wrap`}>
            {displayText}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center text-lipi-muted">
            <div className="text-3xl mb-2 opacity-30">Aa</div>
            <p className="text-xs font-[family-name:var(--font-space-grotesk)]">
              Draw some characters to see your font preview here.
            </p>
          </div>
        )}
      </div>

      {/* Custom text input */}
      <div className="border-t-2 border-lipi-border p-3">
        <label className="block text-xs font-[family-name:var(--font-space-grotesk)] text-lipi-muted mb-1">
          Type to preview
        </label>
        <textarea
          value={customText}
          onChange={e => setCustomText(e.target.value)}
          placeholder={PREVIEW_SAMPLES[activeTab]}
          rows={2}
          className="input-brutal text-sm resize-none"
        />
      </div>

      {/* Font info */}
      <div className="border-t-2 border-lipi-border px-3 py-2 bg-lipi-cream/50">
        <div className="font-[family-name:var(--font-space-grotesk)] text-xs text-lipi-muted">
          {fontName} · {Object.keys(glyphs).length} glyphs
        </div>
      </div>
    </div>
  );
}
