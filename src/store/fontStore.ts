// src/store/fontStore.ts
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { Point, Stroke, GlyphStrokes, ToolType } from "@/types";

interface FontStore {
  // ── Project ──────────────────────────────────────────────────────────────
  fontId: string | null;
  fontName: string;

  // ── Glyph storage ─────────────────────────────────────────────────────────
  /** char → JSON-serialized GlyphStrokes */
  glyphs: Record<string, string>;

  // ── Active drawing ────────────────────────────────────────────────────────
  selectedChar: string;
  /** The strokes currently on the canvas for selectedChar */
  currentStrokes: GlyphStrokes;
  undoStack: GlyphStrokes[];
  redoStack: GlyphStrokes[];

  // ── Tool state ────────────────────────────────────────────────────────────
  activeTool: ToolType;
  strokeWidth: number;
  zoom: number;

  // ── Export ────────────────────────────────────────────────────────────────
  exportStatus: "idle" | "generating" | "ready" | "error";
  exportUrls: { ttf?: string; otf?: string };

  // ── Actions ───────────────────────────────────────────────────────────────
  setFontId: (id: string) => void;
  setFontName: (name: string) => void;
  setSelectedChar: (char: string) => void;

  /** Called when user picks a new character — saves current strokes into glyphs map */
  switchChar: (char: string) => void;

  /** Add a completed stroke to the current session */
  addStroke: (stroke: Stroke) => void;

  /** Undo last stroke */
  undo: () => void;

  /** Redo last undone stroke */
  redo: () => void;

  /** Clear all strokes for current char */
  clearCanvas: () => void;

  /** Commit currentStrokes to glyphs map */
  saveCurrentGlyph: () => void;

  /** Load glyphs from Firestore data */
  loadGlyphs: (glyphs: Record<string, string>) => void;

  setActiveTool: (tool: ToolType) => void;
  setStrokeWidth: (w: number) => void;
  setZoom: (z: number) => void;
  setExportStatus: (s: FontStore["exportStatus"]) => void;
  setExportUrls: (urls: { ttf?: string; otf?: string }) => void;

  /** Erase strokes that intersect a point (for eraser tool) */
  eraseAt: (point: Point, radius: number) => void;

  reset: () => void;
}

const initialState = {
  fontId: null,
  fontName: "My Font",
  glyphs: {},
  selectedChar: "A",
  currentStrokes: [],
  undoStack: [],
  redoStack: [],
  activeTool: "pen" as ToolType,
  strokeWidth: 3,
  zoom: 1,
  exportStatus: "idle" as const,
  exportUrls: {},
};

export const useFontStore = create<FontStore>()(
  immer((set, get) => ({
    ...initialState,

    setFontId: (id) => set((s) => { s.fontId = id; }),
    setFontName: (name) => set((s) => { s.fontName = name; }),
    setSelectedChar: (char) => set((s) => { s.selectedChar = char; }),

    switchChar: (char) =>
      set((s) => {
        // Save current strokes
        if (s.currentStrokes.length > 0) {
          s.glyphs[s.selectedChar] = JSON.stringify(s.currentStrokes);
        }
        // Load new char strokes
        s.selectedChar = char;
        const stored = s.glyphs[char];
        s.currentStrokes = stored ? JSON.parse(stored) : [];
        s.undoStack = [];
        s.redoStack = [];
      }),

    addStroke: (stroke) =>
      set((s) => {
        s.undoStack.push([...s.currentStrokes]);
        s.redoStack = [];
        s.currentStrokes.push(stroke);
      }),

    undo: () =>
      set((s) => {
        if (s.undoStack.length === 0) return;
        s.redoStack.push([...s.currentStrokes]);
        s.currentStrokes = s.undoStack.pop()!;
      }),

    redo: () =>
      set((s) => {
        if (s.redoStack.length === 0) return;
        s.undoStack.push([...s.currentStrokes]);
        s.currentStrokes = s.redoStack.pop()!;
      }),

    clearCanvas: () =>
      set((s) => {
        s.undoStack.push([...s.currentStrokes]);
        s.redoStack = [];
        s.currentStrokes = [];
      }),

    saveCurrentGlyph: () =>
      set((s) => {
        if (s.currentStrokes.length > 0) {
          s.glyphs[s.selectedChar] = JSON.stringify(s.currentStrokes);
        } else {
          delete s.glyphs[s.selectedChar];
        }
      }),

    loadGlyphs: (glyphs) =>
      set((s) => {
        s.glyphs = glyphs;
        const stored = glyphs[s.selectedChar];
        s.currentStrokes = stored ? JSON.parse(stored) : [];
        s.undoStack = [];
        s.redoStack = [];
      }),

    setActiveTool: (tool) => set((s) => { s.activeTool = tool; }),
    setStrokeWidth: (w) => set((s) => { s.strokeWidth = w; }),
    setZoom: (z) => set((s) => { s.zoom = Math.max(0.5, Math.min(3, z)); }),
    setExportStatus: (status) => set((s) => { s.exportStatus = status; }),
    setExportUrls: (urls) => set((s) => { s.exportUrls = urls; }),

    eraseAt: (point, radius) =>
      set((s) => {
        const filtered = s.currentStrokes.filter((stroke) => {
          // Keep strokes that have NO point within eraser radius
          return !stroke.some(
            (p) => Math.hypot(p.x - point.x, p.y - point.y) < radius
          );
        });
        if (filtered.length !== s.currentStrokes.length) {
          s.undoStack.push([...s.currentStrokes]);
          s.redoStack = [];
          s.currentStrokes = filtered;
        }
      }),

    reset: () => set(() => ({ ...initialState })),
  }))
);
