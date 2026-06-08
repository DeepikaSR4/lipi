// src/lib/imageProcessor.ts
"use client";

import type { GlyphStrokes, Point } from "@/types";
import { ALL_CHARS } from "@/types";
import { CANVAS_SIZE } from "./fontGenerator";

interface DotCentroid {
  blob: Blob;
  index: number;
  cx: number;
  cy: number;
}

function getBilinearCoords(
  x: number,
  y: number,
  tl: DotCentroid,
  tr: DotCentroid,
  bl: DotCentroid,
  br: DotCentroid
): { px: number; py: number } {
  // Linear interpolation parameters accounting for tilt/shear
  const y_top = tl.cy + ((x - tl.cx) * (tr.cy - tl.cy)) / (tr.cx - tl.cx || 1);
  const y_bottom = bl.cy + ((x - bl.cx) * (br.cy - bl.cy)) / (br.cx - bl.cx || 1);
  const x_left = tl.cx + ((y - tl.cy) * (bl.cx - tl.cx)) / (bl.cy - tl.cy || 1);
  const x_right = tr.cx + ((y - tr.cy) * (br.cx - tr.cx)) / (br.cy - tr.cy || 1);

  const px = (x - x_left) / (x_right - x_left || 1);
  const py = (y - y_top) / (y_bottom - y_top || 1);

  return { px, py };
}

function cellToStrokes(blobs: Blob[]): GlyphStrokes {
  if (blobs.length === 0) return [];

  // Find combined bounding box of all blobs in the cell
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  blobs.forEach((b) => {
    minX = Math.min(minX, b.minX);
    maxX = Math.max(maxX, b.maxX);
    minY = Math.min(minY, b.minY);
    maxY = Math.max(maxY, b.maxY);
  });

  const cellW = maxX - minX || 1;
  const cellH = maxY - minY || 1;

  const strokes: GlyphStrokes = [];

  blobs.forEach((b) => {
    // Normalize each blob's pixels relative to the combined cell bounds
    const normalized: Point[] = b.pixels.map((p) => ({
      x: ((p.x - minX) / cellW) * CANVAS_SIZE * 0.8 + CANVAS_SIZE * 0.1,
      y: ((p.y - minY) / cellH) * CANVAS_SIZE * 0.8 + CANVAS_SIZE * 0.1,
    }));

    if (normalized.length === 0) return;

    // Sort to create a rough stroke order
    normalized.sort((a, b) => a.y - b.y || a.x - b.x);

    // Subsample
    const step = Math.max(1, Math.floor(normalized.length / 80));
    const sampled = normalized.filter((_, i) => i % step === 0);

    if (sampled.length > 0) {
      strokes.push(sampled);
    }
  });

  return strokes;
}

/** Convert an image file containing handwriting into glyph strokes */
export async function processHandwritingImage(
  file: File
): Promise<Record<string, GlyphStrokes>> {
  const img = await loadImage(file);
  const { canvas, ctx } = createOffscreenCanvas(img);

  // 1. Grayscale + threshold to binary
  binarize(ctx, canvas.width, canvas.height);

  // 2. Detect character blobs
  const blobs = detectBlobs(ctx, canvas.width, canvas.height);

  // Filter out blobs that are too small to be characters or dots (noise)
  const filteredBlobs = blobs.filter((b) => b.pixels.length >= 40);

  if (filteredBlobs.length < 4) {
    throw new Error("Could not find calibration markers. Make sure the page is fully visible and has 4 black corner dots.");
  }

  // 3. Find calibration markers (4 corner dots)
  const centroids: DotCentroid[] = filteredBlobs.map((b, i) => {
    const cx = (b.minX + b.maxX) / 2;
    const cy = (b.minY + b.maxY) / 2;
    return { blob: b, index: i, cx, cy };
  });

  // Helper to find and extract the closest blob to a coordinate
  const extractClosest = (x: number, y: number, list: DotCentroid[]) => {
    let minD = Infinity;
    let bestIdx = -1;
    list.forEach((item, idx) => {
      const d = (item.cx - x) ** 2 + (item.cy - y) ** 2;
      if (d < minD) {
        minD = d;
        bestIdx = idx;
      }
    });
    return list.splice(bestIdx, 1)[0];
  };

  // Corners of the global bounding box of all centroids
  const minCx = Math.min(...centroids.map((c) => c.cx));
  const maxCx = Math.max(...centroids.map((c) => c.cx));
  const minCy = Math.min(...centroids.map((c) => c.cy));
  const maxCy = Math.max(...centroids.map((c) => c.cy));

  const tlDot = extractClosest(minCx, minCy, centroids);
  const trDot = extractClosest(maxCx, minCy, centroids);
  const blDot = extractClosest(minCx, maxCy, centroids);
  const brDot = extractClosest(maxCx, maxCy, centroids);

  // 4. Map remaining blobs to cells
  const cellBlobs: Blob[][][] = Array.from({ length: 9 }, () =>
    Array.from({ length: 10 }, () => [])
  );

  centroids.forEach((item) => {
    const { px, py } = getBilinearCoords(item.cx, item.cy, tlDot, trDot, blDot, brDot);

    // Calibration dots in PDF: x = 10, 200 (width=190). Grid starts x = 15, ends 195 (width=180).
    // Rel Left = 5 / 190 = 0.0263, Rel Width = 180 / 190 = 0.9474
    // Calibration dots in PDF: y = 12, 285 (height=273). Grid starts y = 22, ends 276.5 (height=254.5).
    // Rel Top = 10 / 273 = 0.0366, Rel Height = 254.5 / 273 = 0.9323
    const colFrac = (px - 0.0263) / 0.9474;
    const rowFrac = (py - 0.0366) / 0.9323;

    const c = Math.floor(colFrac * 10);
    const r = Math.floor(rowFrac * 9);

    if (c >= 0 && c < 10 && r >= 0 && r < 9) {
      cellBlobs[r][c].push(item.blob);
    }
  });

  // 5. Generate glyph map
  const glyphMap: Record<string, GlyphStrokes> = {};

  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 10; c++) {
      const idx = r * 10 + c;
      if (idx >= ALL_CHARS.length) continue;
      const char = ALL_CHARS[idx];

      const cellBlobsList = cellBlobs[r][c];
      if (cellBlobsList.length > 0) {
        const strokes = cellToStrokes(cellBlobsList);
        if (strokes.length > 0) {
          glyphMap[char] = strokes;
        }
      }
    }
  }

  return glyphMap;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

function createOffscreenCanvas(img: HTMLImageElement) {
  const canvas = document.createElement("canvas");
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0);
  return { canvas, ctx };
}

function binarize(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const imageData = ctx.getImageData(0, 0, w, h);
  const data = imageData.data;
  const threshold = 128;

  for (let i = 0; i < data.length; i += 4) {
    const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    const val = gray < threshold ? 0 : 255;
    data[i] = data[i + 1] = data[i + 2] = val;
    data[i + 3] = 255;
  }

  ctx.putImageData(imageData, 0, 0);
}

interface Blob {
  pixels: Point[];
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

function detectBlobs(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number
): Blob[] {
  const imageData = ctx.getImageData(0, 0, w, h);
  const data = imageData.data;
  const visited = new Uint8Array(w * h);
  const blobs: Blob[] = [];

  const getPixel = (x: number, y: number) => {
    const idx = (y * w + x) * 4;
    return data[idx]; // 0 = dark (ink), 255 = white (background)
  };

  const floodFill = (startX: number, startY: number): Blob | null => {
    const stack: Point[] = [{ x: startX, y: startY }];
    const pixels: Point[] = [];
    let minX = startX, maxX = startX, minY = startY, maxY = startY;

    while (stack.length > 0) {
      const { x, y } = stack.pop()!;
      if (x < 0 || x >= w || y < 0 || y >= h) continue;
      const idx = y * w + x;
      if (visited[idx] || getPixel(x, y) > 64) continue;

      visited[idx] = 1;
      pixels.push({ x, y });
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);

      stack.push({ x: x + 1, y }, { x: x - 1, y }, { x, y: y + 1 }, { x, y: y - 1 });
    }

    if (pixels.length < 50) return null; // Filter noise
    return { pixels, minX, maxX, minY, maxY };
  };

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = y * w + x;
      if (!visited[idx] && getPixel(x, y) < 64) {
        const blob = floodFill(x, y);
        if (blob) blobs.push(blob);
      }
    }
  }

  // Sort left-to-right by centroid X
  blobs.sort((a, b) => (a.minX + a.maxX) / 2 - (b.minX + b.maxX) / 2);

  return blobs;
}

function blobToStrokes(
  blob: Blob,
  imgW: number,
  imgH: number
): GlyphStrokes {
  const { pixels, minX, maxX, minY, maxY } = blob;
  const blobW = maxX - minX || 1;
  const blobH = maxY - minY || 1;

  // Normalize pixels to CANVAS_SIZE coordinate space
  const normalized: Point[] = pixels.map((p) => ({
    x: ((p.x - minX) / blobW) * CANVAS_SIZE * 0.8 + CANVAS_SIZE * 0.1,
    y: ((p.y - minY) / blobH) * CANVAS_SIZE * 0.8 + CANVAS_SIZE * 0.1,
  }));

  // Simple: group nearby pixels into a single stroke (approximation)
  // Real implementation would trace skeleton paths
  if (normalized.length === 0) return [];

  // Sort by Y then X to create a rough stroke order
  normalized.sort((a, b) => a.y - b.y || a.x - b.x);

  // Subsample to reduce stroke point count
  const step = Math.max(1, Math.floor(normalized.length / 100));
  const sampled = normalized.filter((_, i) => i % step === 0);

  return [sampled]; // Return as single stroke (simplified)
}
