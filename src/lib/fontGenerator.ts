// src/lib/fontGenerator.ts
"use client";

import type { GlyphStrokes, FontMetrics } from "@/types";

// ─── Constants ────────────────────────────────────────────────────────────────
export const FONT_METRICS: FontMetrics = {
  unitsPerEm: 1000,
  ascender: 800,
  descender: -200,
  xHeight: 500,
  capHeight: 700,
};

// Canvas coords are 0–CANVAS_SIZE; font units are 0–unitsPerEm
export const CANVAS_SIZE = 500;

// ─── Path Smoothing (Chaikin's Algorithm) ─────────────────────────────────────
function chaikinSmooth(
  points: { x: number; y: number }[],
  iterations = 2
): { x: number; y: number }[] {
  if (points.length < 2) return points;
  let pts = points;
  for (let iter = 0; iter < iterations; iter++) {
    const result: { x: number; y: number }[] = [pts[0]];
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i];
      const p1 = pts[i + 1];
      result.push({
        x: 0.75 * p0.x + 0.25 * p1.x,
        y: 0.75 * p0.y + 0.25 * p1.y,
      });
      result.push({
        x: 0.25 * p0.x + 0.75 * p1.x,
        y: 0.25 * p0.y + 0.75 * p1.y,
      });
    }
    result.push(pts[pts.length - 1]);
    pts = result;
  }
  return pts;
}

// ─── Coordinate Transform ────────────────────────────────────────────────────
/** Convert canvas px to font units; flip Y axis; shift horizontally based on bounding box */
function toFontCoords(
  x: number,
  y: number,
  canvasSize: number,
  metrics: FontMetrics,
  minX: number = 0,
  lsb: number = 40
): { x: number; y: number } {
  const scale = metrics.unitsPerEm / canvasSize;
  return {
    // Shift left by minX, scale, then add left side bearing (LSB)
    x: (x - minX) * scale + lsb,
    // Font Y: 0 is baseline (at descender), ascender at top
    // Canvas Y: 0 is top, canvasSize is bottom
    // Remap: fontY = ascender - (canvasY / canvasSize) * (ascender - descender)
    y:
      metrics.ascender -
      (y / canvasSize) * (metrics.ascender - metrics.descender),
  };
}

// ─── Build opentype.js Path from Strokes ─────────────────────────────────────
function strokesToOpentypePath(
  strokes: GlyphStrokes,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  opentype: any,
  canvasSize: number,
  metrics: FontMetrics,
  strokeWidthPx: number = 8,
  minX: number = 0,
  lsb: number = 40
): unknown {
  const path = new opentype.Path();

  for (const stroke of strokes) {
    if (stroke.length < 2) continue;

    // Smooth the stroke
    const smoothed = chaikinSmooth(stroke, 2);

    // Build outline (offset path) — simplified: use quadratic bezier through centerline
    // For a proper stroke outline, offset each side
    const halfW = (strokeWidthPx / canvasSize) * metrics.unitsPerEm * 0.5;

    // Forward pass
    const forward: { x: number; y: number }[] = [];
    const backward: { x: number; y: number }[] = [];

    for (let i = 0; i < smoothed.length - 1; i++) {
      const p0 = smoothed[i];
      const p1 = smoothed[i + 1];
      const dx = p1.x - p0.x;
      const dy = p1.y - p0.y;
      const len = Math.hypot(dx, dy) || 1;
      const nx = (-dy / len) * halfW;
      const ny = (dx / len) * halfW;

      const fp0 = toFontCoords(p0.x + (nx * canvasSize) / metrics.unitsPerEm, p0.y + (ny * canvasSize) / metrics.unitsPerEm, canvasSize, metrics, minX, lsb);
      const bp0 = toFontCoords(p0.x - (nx * canvasSize) / metrics.unitsPerEm, p0.y - (ny * canvasSize) / metrics.unitsPerEm, canvasSize, metrics, minX, lsb);

      if (i === 0) {
        forward.push(fp0);
        backward.unshift(bp0);
      }

      const fp1 = toFontCoords(p1.x + (nx * canvasSize) / metrics.unitsPerEm, p1.y + (ny * canvasSize) / metrics.unitsPerEm, canvasSize, metrics, minX, lsb);
      const bp1 = toFontCoords(p1.x - (nx * canvasSize) / metrics.unitsPerEm, p1.y - (ny * canvasSize) / metrics.unitsPerEm, canvasSize, metrics, minX, lsb);
      forward.push(fp1);
      backward.unshift(bp1);
    }

    if (forward.length === 0) continue;

    // Draw outline contour
    path.moveTo(forward[0].x, forward[0].y);
    for (let i = 1; i < forward.length; i++) {
      path.lineTo(forward[i].x, forward[i].y);
    }
    for (const bp of backward) {
      path.lineTo(bp.x, bp.y);
    }
    path.close();
  }

  return path;
}

// ─── Main Generator ───────────────────────────────────────────────────────────
export async function generateFont(
  glyphs: Record<string, string>,
  fontName: string,
  _format: "ttf" | "otf"
): Promise<ArrayBuffer> {
  // Dynamic import to avoid SSR issues
  const opentype = await import("opentype.js");

  const glyphList: opentype.Glyph[] = [];
  const metrics = FONT_METRICS;

  // Always add .notdef first
  const notdefGlyph = new opentype.Glyph({
    name: ".notdef",
    unicode: 0,
    advanceWidth: 500,
    path: new opentype.Path(),
  });
  glyphList.push(notdefGlyph);

  // Always add space character (Unicode 32)
  const spaceGlyph = new opentype.Glyph({
    name: "space",
    unicode: 32,
    advanceWidth: 300,
    path: new opentype.Path(),
  });
  glyphList.push(spaceGlyph);

  // Process each drawn glyph
  for (const [char, strokesJson] of Object.entries(glyphs)) {
    const strokes: GlyphStrokes = JSON.parse(strokesJson);
    if (strokes.length === 0) continue;

    const unicode = char.charCodeAt(0);

    // Calculate horizontal bounding box to eliminate huge side bearing gaps
    let minX = Infinity;
    let maxX = -Infinity;
    for (const stroke of strokes) {
      for (const pt of stroke) {
        if (pt.x < minX) minX = pt.x;
        if (pt.x > maxX) maxX = pt.x;
      }
    }

    // Default bounds if not found
    if (minX === Infinity) {
      minX = 0;
      maxX = 0;
    }

    const lsb = 40; // 40 font units Left Side Bearing
    const rsb = 40; // 40 font units Right Side Bearing
    const widthInFontUnits = ((maxX - minX) / CANVAS_SIZE) * metrics.unitsPerEm;
    const advanceWidth = Math.max(
      200, // Safe minimum width for thin characters (e.g. 'i', 'l')
      lsb + widthInFontUnits + rsb
    );

    const path = strokesToOpentypePath(strokes, opentype, CANVAS_SIZE, metrics, 8, minX, lsb);

    const glyph = new opentype.Glyph({
      name: `glyph_${unicode}`,
      unicode,
      advanceWidth,
      path: path as opentype.Path,
    });
    glyphList.push(glyph);
  }

  const font = new opentype.Font({
    familyName: fontName,
    styleName: "Regular",
    unitsPerEm: metrics.unitsPerEm,
    ascender: metrics.ascender,
    descender: metrics.descender,
    glyphs: glyphList,
  });

  return font.toArrayBuffer();
}


/** Trigger browser download of font buffer */
export function downloadFont(
  buffer: ArrayBuffer,
  fontName: string,
  format: "ttf" | "otf"
) {
  const blob = new Blob([buffer], { type: "font/sfnt" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${fontName.replace(/\s+/g, "_")}.${format}`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

/** Inject a custom font face into the document for live preview */
export async function injectFontFace(
  buffer: ArrayBuffer,
  fontName: string
): Promise<void> {
  const blob = new Blob([buffer], { type: "font/sfnt" });
  const url = URL.createObjectURL(blob);

  // Remove old face if exists
  const existing = document.getElementById(`lipi-font-${fontName}`);
  if (existing) existing.remove();

  const style = document.createElement("style");
  style.id = `lipi-font-${fontName}`;
  style.textContent = `
    @font-face {
      font-family: '${fontName}';
      src: url('${url}') format('truetype');
    }
  `;
  document.head.appendChild(style);
}
