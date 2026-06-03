"use client";

import { motion } from "framer-motion";
import { useFontStore } from "@/store/fontStore";
import { analytics } from "@/lib/analytics";

type ToolId = "pen" | "eraser" | "undo" | "redo" | "clear" | "zoom-in" | "zoom-out";

interface ToolDef {
  id: ToolId;
  label: string;
  symbol: string;
  divider?: boolean;
}

const tools: ToolDef[] = [
  { id: "pen", label: "Pen", symbol: "✏" },
  { id: "eraser", label: "Eraser", symbol: "⌫" },
  { id: "undo", label: "Undo", symbol: "↩", divider: true },
  { id: "redo", label: "Redo", symbol: "↪" },
  { id: "clear", label: "Clear", symbol: "✕", divider: true },
  { id: "zoom-in", label: "Zoom In", symbol: "⊕", divider: true },
  { id: "zoom-out", label: "Zoom Out", symbol: "⊖" },
];

export function Toolbar() {
  const {
    activeTool,
    strokeWidth,
    zoom,
    selectedChar,
    fontName,
    setActiveTool,
    setStrokeWidth,
    setZoom,
    undo,
    redo,
    clearCanvas,
    saveCurrentGlyph,
    saveAndNext,
  } = useFontStore();

  const handleTool = (id: ToolId) => {
    switch (id) {
      case "pen":
      case "eraser":
        setActiveTool(id);
        analytics.trackCanvasToolSelected(id === "pen" ? "Pen" : "Eraser");
        break;
      case "undo":
        undo();
        analytics.trackCanvasToolSelected("Undo");
        break;
      case "redo":
        redo();
        analytics.trackCanvasToolSelected("Redo");
        break;
      case "clear":
        clearCanvas();
        analytics.trackCanvasCleared(selectedChar);
        break;
      case "zoom-in":
        setZoom(zoom + 0.25);
        break;
      case "zoom-out":
        setZoom(zoom - 0.25);
        break;
    }
  };

  return (
    <div className="border-b-2 border-lipi-border bg-lipi-cream px-4 py-2 flex items-center gap-2 flex-wrap">
      {/* Font name */}
      <div className="hidden md:block font-[family-name:var(--font-space-grotesk)] font-bold text-sm mr-4">
        {fontName}
        <span className="text-lipi-muted font-normal ml-2">/ Drawing: {selectedChar}</span>
      </div>
      <div className="md:hidden font-[family-name:var(--font-space-grotesk)] font-bold text-sm mr-1">
        Drawing: {selectedChar}
      </div>

      {/* Tools */}
      {tools.map(({ id, label, symbol, divider }) => (
        <div key={id} className="flex items-center gap-2">
          {divider && <div className="w-px h-6 bg-lipi-border/30 mx-1" />}
          <motion.button
            title={label}
            onClick={() => handleTool(id)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`h-8 px-2 sm:px-3 border-2 flex items-center justify-center gap-1 sm:gap-2 text-sm font-[family-name:var(--font-space-grotesk)] font-medium transition-colors ${
              (id === "pen" || id === "eraser") && activeTool === id
                ? "border-lipi-border bg-lipi-green text-lipi-text"
                : "border-lipi-border bg-white text-lipi-text hover:bg-lipi-green/20"
            }`}
          >
            <span>{symbol}</span>
            <span className="hidden sm:inline">{label}</span>
          </motion.button>
        </div>
      ))}

      {/* Stroke width */}
      <div className="ml-2 flex items-center gap-2">
        <div className="w-px h-6 bg-lipi-border/30" />
        <span className="text-xs font-[family-name:var(--font-space-grotesk)] text-lipi-muted">Size</span>
        <input
          type="range"
          min={1}
          max={12}
          value={strokeWidth}
          onChange={e => setStrokeWidth(Number(e.target.value))}
          className="w-20 accent-[#111]"
        />
        <span className="text-xs font-[family-name:var(--font-space-grotesk)] w-4">{strokeWidth}</span>
      </div>

      {/* Zoom indicator */}
      <div className="ml-2 text-xs font-[family-name:var(--font-space-grotesk)] text-lipi-muted">
        {Math.round(zoom * 100)}%
      </div>

      {/* Save & Next */}
      <div className="ml-auto">
        <motion.button
          onClick={saveAndNext}
          whileHover={{ x: -1, y: -1, }}
          whileTap={{ x: 1, y: 1, }}
          className="btn-lipi btn-primary text-xs px-3 sm:px-4 py-1.5"
        >
          <span className="hidden sm:inline">Save &amp; Next →</span>
          <span className="sm:hidden">Next →</span>
        </motion.button>
      </div>
    </div>
  );
}
