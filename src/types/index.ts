// ─── User ────────────────────────────────────────────────────────────────────
export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  subscriptionPlan: "free" | "premium";
  createdAt: Date;
}

// ─── Font Project ─────────────────────────────────────────────────────────────
export interface FontProject {
  id: string;
  ownerId: string;
  fontName: string;
  /** Maps glyph character → serialized stroke data (JSON string) */
  glyphs: Record<string, string>;
  previewImage?: string;
  exportUrl?: { ttf?: string; otf?: string };
  createdAt: Date;
  updatedAt: Date;
}

// ─── Upload Record ────────────────────────────────────────────────────────────
export interface UploadRecord {
  id: string;
  ownerId: string;
  originalImage: string;
  processedImage?: string;
  createdAt: Date;
}

// ─── Canvas / Drawing ─────────────────────────────────────────────────────────
export interface Point {
  x: number;
  y: number;
  pressure?: number;
}

export type Stroke = Point[];

export type GlyphStrokes = Stroke[];

export type ToolType = "pen" | "eraser";

// ─── Font Generation ──────────────────────────────────────────────────────────
export type ExportFormat = "ttf" | "otf";

export interface FontMetrics {
  unitsPerEm: number;
  ascender: number;
  descender: number;
  xHeight: number;
  capHeight: number;
}

// ─── Character Sets ───────────────────────────────────────────────────────────
export type CharSet = "uppercase" | "lowercase" | "numbers" | "symbols";

export const CHAR_SETS: Record<CharSet, string[]> = {
  uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split(""),
  lowercase: "abcdefghijklmnopqrstuvwxyz".split(""),
  numbers: "0123456789".split(""),
  symbols: "!@#$%&*().,?;:'\"/-+".split(""),
};

export const ALL_CHARS: string[] = [
  ...CHAR_SETS.uppercase,
  ...CHAR_SETS.lowercase,
  ...CHAR_SETS.numbers,
  ...CHAR_SETS.symbols,
];

// ─── Preview ──────────────────────────────────────────────────────────────────
export type PreviewTab = "heading" | "paragraph" | "poster" | "script";

export const PREVIEW_SAMPLES: Record<PreviewTab, string> = {
  heading: "The quick brown fox",
  paragraph:
    "Typography is the art and technique of arranging type to make written language legible, readable, and appealing when displayed.",
  poster: "Hello World",
  script: "Dear friend,\nI hope this letter finds you well.",
};
