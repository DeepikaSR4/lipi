// src/lib/pdfConverter.ts
"use client";

import type { GlyphStrokes } from "@/types";
import { ALL_CHARS } from "@/types";
import { CANVAS_SIZE } from "./fontGenerator";
import { cellToStrokes } from "./imageProcessor";
import type { Blob } from "./imageProcessor";

// ── PDF template layout constants (must match pdfConverter generateTemplatePDF) ──
// All in mm on an A4 page (210 × 297 mm)
const PDF_W_MM   = 210;
const PDF_H_MM   = 297;
const GRID_L_MM  = 15;   // grid left edge
const GRID_T_MM  = 22;   // grid top edge
const CELL_W_MM  = 18;   // 10 columns × 18 mm = 180 mm
const CELL_H_MM  = 254.5 / 9; // ≈ 28.28 mm
const COLS       = 10;
const ROWS       = 9;

// ── Rendering scale ──────────────────────────────────────────────────────────
// Scale 4 → ~2380 px wide for an A4 PDF (595 pt × 4 = 2380 px).
// Higher than scale=3 so small punctuation characters have enough pixels.
const RENDER_SCALE = 4;

/** Convert mm→pixels at the chosen render scale (72 dpi PDF units). */
function mmToPx(mm: number): number {
  return (mm / 25.4) * 72 * RENDER_SCALE;
}

/**
 * Renders page 1 of a PDF to a canvas and extracts each template cell as a
 * GlyphStrokes entry, mapped directly by position — no blob detection, no
 * calibration dots required.
 *
 * This is the primary path for Lipi template PDFs edited on a tablet.
 */
export async function extractGlyphsFromTemplatePdf(
  pdfFile: File
): Promise<Record<string, GlyphStrokes>> {
  const canvas = await renderPdfToCanvas(pdfFile);
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  const glyphMap: Record<string, GlyphStrokes> = {};

  // ── DEBUG: log the rendered canvas so we can see if annotations appear ──
  console.log(`[Lipi PDF] Canvas: ${canvas.width}×${canvas.height}px`);
  // Downscale to 25% for a compact preview data URL
  const dbgCanvas = document.createElement("canvas");
  dbgCanvas.width  = Math.round(canvas.width  * 0.25);
  dbgCanvas.height = Math.round(canvas.height * 0.25);
  dbgCanvas.getContext("2d")!.drawImage(canvas, 0, 0, dbgCanvas.width, dbgCanvas.height);
  console.log("[Lipi PDF] Rendered preview (open in new tab):", dbgCanvas.toDataURL("image/jpeg", 0.7));

  let totalDark = 0;

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const idx = r * COLS + c;
      if (idx >= ALL_CHARS.length) continue;

      const char = ALL_CHARS[idx];

      // Cell bounds in pixels
      const x0 = Math.round(mmToPx(GRID_L_MM + c * CELL_W_MM));
      const y0 = Math.round(mmToPx(GRID_T_MM + r * CELL_H_MM));
      const cw = Math.round(mmToPx(CELL_W_MM));
      const ch = Math.round(mmToPx(CELL_H_MM));

      const cellStrokes = extractCellStrokes(ctx, x0, y0, cw, ch);
      const darkCount = cellStrokes[0]?.length ?? 0;
      totalDark += darkCount;
      if (darkCount > 0) console.log(`[Lipi PDF] Cell [${r},${c}]='${char}' → ${darkCount} dark pts`);
      if (cellStrokes.length > 0) {
        glyphMap[char] = cellStrokes;
      }
    }
  }

  console.log(`[Lipi PDF] Done. Total dark pts: ${totalDark}, glyphs found: ${Object.keys(glyphMap).length}`);
  return glyphMap;
}

/**
 * Renders page 1 of a PDF file to an HTMLCanvasElement with full annotation
 * rendering (annotationMode = ENABLE = 1), which is required for tablet ink
 * annotations (GoodNotes, Apple Markup, Samsung Notes, etc.).
 */
export async function renderPdfToCanvas(pdfFile: File): Promise<HTMLCanvasElement> {
  const pdfjsLib = await import("pdfjs-dist");
  pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

  const arrayBuffer = await pdfFile.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const page = await pdf.getPage(1);

  const viewport = page.getViewport({ scale: RENDER_SCALE });
  const canvas = document.createElement("canvas");
  canvas.width  = Math.round(viewport.width);
  canvas.height = Math.round(viewport.height);

  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;

  // AnnotationMode.ENABLE = 1: renders all annotation types including ink
  // annotations drawn with a tablet stylus.
  await page.render({
    canvasContext: ctx,
    viewport,
    canvas,
    intent: "print",
    annotationMode: 1, // ENABLE – includes ink/highlight/stamp annotations
  }).promise;

  return canvas;
}

/**
 * Extract vectorized strokes from a rectangular cell region.
 * Groups dark pixels into separate strokes by detecting vertical gaps,
 * which produces proper multi-stroke glyphs (e.g. dotted i, j) rather
 * than a single filled silhouette.
 */
function extractCellStrokes(
  ctx: CanvasRenderingContext2D,
  x0: number, y0: number,
  cw: number, ch: number
): GlyphStrokes {
  const imageData = ctx.getImageData(x0, y0, cw, ch);
  const data = imageData.data;

  type Pt = { x: number; y: number };
  const darkPts: Pt[] = [];
  let minX = cw, maxX = 0, minY = ch, maxY = 0;

  for (let py = 0; py < ch; py++) {
    for (let px = 0; px < cw; px++) {
      const i = (py * cw + px) * 4;
      if (data[i + 3] < 10) continue; // transparent
      const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      if (lum < 180) {
        darkPts.push({ x: px, y: py });
        if (px < minX) minX = px;
        if (px > maxX) maxX = px;
        if (py < minY) minY = py;
        if (py > maxY) maxY = py;
      }
    }
  }

  if (darkPts.length < 5) return [];

  // Create a synthetic Blob matching what imageProcessor.ts expects
  const syntheticBlob: Blob = {
    minX, maxX, minY, maxY,
    pixels: darkPts
  };

  // Run the full Zhang-Suen thinning + skeleton tracing pipeline
  // cellToStrokes already normalizes the strokes to CANVAS_SIZE with a 10% margin!
  return cellToStrokes([syntheticBlob]);
}


/**
 * Converts a PDF file to a flat PNG File for the existing image-processor
 * pipeline (used in freehand / sequence mode, or as fallback).
 */
export async function pdfToImageFile(pdfFile: File): Promise<File> {
  const canvas = await renderPdfToCanvas(pdfFile);
  return new Promise<File>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) { reject(new Error("Failed to convert PDF page to image")); return; }
      const name = pdfFile.name.replace(/\.pdf$/i, ".png");
      resolve(new File([blob], name, { type: "image/png" }));
    }, "image/png");
  });
}

export function isPdf(file: File): boolean {
  return (
    file.type === "application/pdf" ||
    file.name.toLowerCase().endsWith(".pdf")
  );
}
