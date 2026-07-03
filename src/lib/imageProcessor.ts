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

export function cellToStrokes(blobs: Blob[]): GlyphStrokes {
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

  // Gather all pixels from all blobs in the cell
  // Use a flat push loop — concat() makes O(n²) copies on large blobs.
  const allPixels: Point[] = [];
  blobs.forEach((b) => {
    for (let i = 0; i < b.pixels.length; i++) allPixels.push(b.pixels[i]);
  });

  // 1. Thin the binary image of the cell using Zhang-Suen
  const skeletonPts = thin(allPixels, minX, maxX, minY, maxY);

  // 2. Trace the skeleton into individual strokes
  const rawStrokes = traceSkeleton(skeletonPts);

  const strokes: GlyphStrokes = [];

  // 3. Normalize the traced strokes relative to the combined cell bounds
  rawStrokes.forEach((stroke) => {
    const normalized: Point[] = stroke.map((p) => ({
      x: ((p.x - minX) / cellW) * CANVAS_SIZE * 0.8 + CANVAS_SIZE * 0.1,
      y: ((p.y - minY) / cellH) * CANVAS_SIZE * 0.8 + CANVAS_SIZE * 0.1,
    }));

    if (normalized.length > 0) {
      strokes.push(normalized);
    }
  });

  return strokes;
}

function thin(pixels: Point[], minX: number, maxX: number, minY: number, maxY: number): Point[] {
  const w = maxX - minX + 3;
  const h = maxY - minY + 3;
  const grid = new Uint8Array(w * h);

  pixels.forEach((p) => {
    const x = Math.floor(p.x - minX) + 1;
    const y = Math.floor(p.y - minY) + 1;
    if (x >= 0 && x < w && y >= 0 && y < h) {
      grid[y * w + x] = 1;
    }
  });

  let changed = true;
  const toDelete: number[] = [];

  while (changed) {
    changed = false;

    for (let step = 1; step <= 2; step++) {
      toDelete.length = 0;

      for (let y = 1; y < h - 1; y++) {
        const yw = y * w;
        const yprevw = (y - 1) * w;
        const ynextw = (y + 1) * w;

        for (let x = 1; x < w - 1; x++) {
          const idx = yw + x;
          if (grid[idx] === 0) continue;

          const p2 = grid[yprevw + x];
          const p3 = grid[yprevw + x + 1];
          const p4 = grid[yw + x + 1];
          const p5 = grid[ynextw + x + 1];
          const p6 = grid[ynextw + x];
          const p7 = grid[ynextw + x - 1];
          const p8 = grid[yw + x - 1];
          const p9 = grid[yprevw + x - 1];

          const B = p2 + p3 + p4 + p5 + p6 + p7 + p8 + p9;
          if (B < 2 || B > 6) continue;

          let A = 0;
          if (p2 === 0 && p3 === 1) A++;
          if (p3 === 0 && p4 === 1) A++;
          if (p4 === 0 && p5 === 1) A++;
          if (p5 === 0 && p6 === 1) A++;
          if (p6 === 0 && p7 === 1) A++;
          if (p7 === 0 && p8 === 1) A++;
          if (p8 === 0 && p9 === 1) A++;
          if (p9 === 0 && p2 === 1) A++;

          if (A !== 1) continue;

          if (step === 1) {
            if (p2 * p4 * p6 !== 0) continue;
            if (p4 * p6 * p8 !== 0) continue;
          } else {
            if (p2 * p4 * p8 !== 0) continue;
            if (p2 * p6 * p8 !== 0) continue;
          }

          toDelete.push(idx);
        }
      }

      if (toDelete.length > 0) {
        toDelete.forEach((idx) => {
          grid[idx] = 0;
        });
        changed = true;
      }
    }
  }

  const skeletonPts: Point[] = [];
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      if (grid[y * w + x] === 1) {
        skeletonPts.push({ x: x - 1 + minX, y: y - 1 + minY });
      }
    }
  }

  return skeletonPts;
}

/**
 * Trace a set of skeleton points into ordered polyline strokes.
 *
 * The original implementation used nested O(n²) loops for both endpoint
 * detection and nearest-neighbour tracing. On any image larger than ~800px
 * the skeleton can have tens of thousands of points, turning those loops into
 * billions of comparisons — causing the "Maximum call stack size exceeded"
 * crash (the JS engine running out of internal resources under extreme load).
 *
 * Replaced with O(n) spatial grid buckets: each point is stored in a cell of
 * a fixed-cell-size grid; neighbour lookups only inspect the 9 surrounding
 * cells instead of all n points.
 */
function traceSkeleton(skeletonPts: Point[]): Point[][] {
  if (skeletonPts.length === 0) return [];

  // --- Build a spatial hash grid for O(1) neighbour lookup ---
  const CELL = 3; // cell size in pixels — slightly larger than max gap
  const TRACE_RADIUS_SQ = 8; // max gap between connected skeleton pixels (px²)

  // Bounding box
  let minGX = Infinity, minGY = Infinity;
  for (const p of skeletonPts) {
    if (p.x < minGX) minGX = p.x;
    if (p.y < minGY) minGY = p.y;
  }

  // Map from grid cell key → list of indices into `pts`
  const grid = new Map<number, number[]>();
  const pts = skeletonPts.map((p, i) => ({ ...p, idx: i }));
  // active[i] = true if pts[i] is still unassigned
  const active = new Uint8Array(pts.length).fill(1);

  const cellKey = (p: Point) =>
    Math.floor((p.x - minGX) / CELL) * 1000003 +
    Math.floor((p.y - minGY) / CELL);

  const addToGrid = (i: number) => {
    const k = cellKey(pts[i]);
    const bucket = grid.get(k);
    if (bucket) bucket.push(i);
    else grid.set(k, [i]);
  };

  const removeFromGrid = (i: number) => {
    const k = cellKey(pts[i]);
    const bucket = grid.get(k);
    if (!bucket) return;
    const pos = bucket.indexOf(i);
    if (pos !== -1) bucket.splice(pos, 1);
  };

  for (let i = 0; i < pts.length; i++) addToGrid(i);

  /** Return indices of all active neighbours of point p within TRACE_RADIUS_SQ */
  const neighbours = (p: Point, excludeIdx: number): number[] => {
    const result: number[] = [];
    const cx = Math.floor((p.x - minGX) / CELL);
    const cy = Math.floor((p.y - minGY) / CELL);
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const k = (cx + dx) * 1000003 + (cy + dy);
        const bucket = grid.get(k);
        if (!bucket) continue;
        for (const j of bucket) {
          if (j === excludeIdx || !active[j]) continue;
          const ddx = pts[j].x - p.x;
          const ddy = pts[j].y - p.y;
          if (ddx * ddx + ddy * ddy <= TRACE_RADIUS_SQ) result.push(j);
        }
      }
    }
    return result;
  };

  /** Find a good stroke start: prefer points with exactly 1 neighbour (endpoints) */
  const findStartIdx = (): number => {
    for (let i = 0; i < pts.length; i++) {
      if (!active[i]) continue;
      if (neighbours(pts[i], i).length <= 1) return i;
    }
    // Fall back to first active point
    for (let i = 0; i < pts.length; i++) {
      if (active[i]) return i;
    }
    return -1;
  };

  const strokes: Point[][] = [];

  while (true) {
    const startIdx = findStartIdx();
    if (startIdx === -1) break;

    const stroke: Point[] = [];
    let curIdx = startIdx;

    while (curIdx !== -1) {
      const cur = pts[curIdx];
      stroke.push({ x: cur.x, y: cur.y });
      active[curIdx] = 0;
      removeFromGrid(curIdx);

      const nbrs = neighbours(cur, curIdx);
      if (nbrs.length === 0) break;

      // Pick the closest unvisited neighbour
      let bestJ = -1;
      let bestD = Infinity;
      for (const j of nbrs) {
        const ddx = pts[j].x - cur.x;
        const ddy = pts[j].y - cur.y;
        const d = ddx * ddx + ddy * ddy;
        if (d < bestD) { bestD = d; bestJ = j; }
      }
      curIdx = bestJ;
    }

    if (stroke.length >= 2) {
      strokes.push(stroke);
    } else if (stroke.length === 1) {
      strokes.push([stroke[0], { x: stroke[0].x + 0.1, y: stroke[0].y + 0.1 }]);
    }
  }

  return strokes;
}

/** Convert an image file containing handwriting into glyph strokes */
export async function processHandwritingImage(
  file: File,
  mode: "template" | "sequence" = "template"
): Promise<{ glyphs: Record<string, GlyphStrokes>; rawGlyphs?: GlyphStrokes[] }> {
  const img = await loadImage(file);
  const { canvas, ctx } = createOffscreenCanvas(img);

  // 1. Grayscale + threshold to binary
  binarize(ctx, canvas.width, canvas.height);

  // 2. Detect character blobs
  const blobs = detectBlobs(ctx, canvas.width, canvas.height);

  // Filter out blobs too small to be real characters (noise).
  // The canvas is already downscaled to ≤1500px, so a simple absolute minimum
  // works reliably. 30px covers fine writing; 50 is the noise floor.
  const filteredBlobs = blobs.filter((b) => b.pixels.length >= 30);

  if (mode === "sequence") {
    // 2. Group blobs into text lines
    const linesOfBlobs = groupBlobsIntoLines(filteredBlobs);

    // 3. For each line, merge component blobs (e.g. for i, j, =, ?, etc.)
    const finalBlobs: Blob[] = [];
    linesOfBlobs.forEach((line) => {
      const mergedLine = mergeNearbyBlobs(line);
      mergedLine.forEach(b => finalBlobs.push(b));
    });

    // 4. Trace thinned centerline strokes for raw glyphs
    const rawGlyphs = finalBlobs.map((blob) => cellToStrokes([blob]));

    // 5. Map sequential blobs to ALL_CHARS for default mapping compatibility
    const glyphMap: Record<string, GlyphStrokes> = {};
    for (let i = 0; i < finalBlobs.length; i++) {
      if (i >= ALL_CHARS.length) break;
      const char = ALL_CHARS[i];
      if (rawGlyphs[i].length > 0) {
        glyphMap[char] = rawGlyphs[i];
      }
    }
    return { glyphs: glyphMap, rawGlyphs };
  }

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
  const minCx = centroids.reduce((min, c) => Math.min(min, c.cx), Infinity);
  const maxCx = centroids.reduce((max, c) => Math.max(max, c.cx), -Infinity);
  const minCy = centroids.reduce((min, c) => Math.min(min, c.cy), Infinity);
  const maxCy = centroids.reduce((max, c) => Math.max(max, c.cy), -Infinity);

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

  return { glyphs: glyphMap };
}

function groupBlobsIntoLines(blobs: Blob[]): Blob[][] {
  if (blobs.length === 0) return [];

  const centroids = blobs.map((b) => {
    const cx = (b.minX + b.maxX) / 2;
    const cy = (b.minY + b.maxY) / 2;
    const height = b.maxY - b.minY;
    return { blob: b, cx, cy, height };
  });

  // Sort by Y coordinate (top-to-bottom)
  centroids.sort((a, b) => a.cy - b.cy);

  const lines: typeof centroids[] = [];

  centroids.forEach((item) => {
    let foundLine = false;
    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i];
      const avgY = line.reduce((sum, c) => sum + c.cy, 0) / line.length;
      const avgH = line.reduce((sum, c) => sum + c.height, 0) / line.length;

      // Group if the vertical distance is small compared to typical character height
      const verticalDist = Math.abs(item.cy - avgY);
      if (verticalDist < avgH * 0.8) {
        line.push(item);
        foundLine = true;
        break;
      }
    }

    if (!foundLine) {
      lines.push([item]);
    }
  });

  // Sort lines top-to-bottom based on their average cy
  lines.sort((a, b) => {
    const avgA = a.reduce((sum, c) => sum + c.cy, 0) / a.length;
    const avgB = b.reduce((sum, c) => sum + c.cy, 0) / b.length;
    return avgA - avgB;
  });

  // Within each line, sort elements left-to-right (by cx)
  lines.forEach((line) => {
    line.sort((a, b) => a.cx - b.cx);
  });

  return lines.map((line) => line.map((item) => item.blob));
}

function mergeNearbyBlobs(lineBlobs: Blob[]): Blob[] {
  if (lineBlobs.length <= 1) return lineBlobs;

  // Sort by minX
  lineBlobs.sort((a, b) => a.minX - b.minX);

  const merged: Blob[] = [];

  lineBlobs.forEach((next) => {
    if (merged.length === 0) {
      merged.push(next);
      return;
    }

    const last = merged[merged.length - 1];

    // Calculate horizontal overlap / gap
    const overlapX = Math.min(last.maxX, next.maxX) - Math.max(last.minX, next.minX);
    const widthL = last.maxX - last.minX || 1;
    const widthN = next.maxX - next.minX || 1;
    const avgW = (widthL + widthN) / 2;

    // Merge if overlapping OR horizontal gap is within 75% of average character width.
    // The old 25% threshold was too tight — dotted letters (i, j) and accented
    // characters (!, ?) have components that can be 40-70% of char width apart.
    const isCloseX = overlapX >= 0 || Math.abs(overlapX) < avgW * 0.75;

    // Guard: don't merge two blobs if the result would be unreasonably wide
    // (wider than 2.5× the average width). This prevents adjacent narrow
    // characters like l+i being collapsed into one glyph.
    const combinedW =
      Math.max(last.maxX, next.maxX) - Math.min(last.minX, next.minX);
    const wouldBeTooWide = combinedW > avgW * 2.5;

    // Check vertical overlap or closeness
    const overlapY = Math.min(last.maxY, next.maxY) - Math.max(last.minY, next.minY);
    const heightL = last.maxY - last.minY || 1;
    const heightN = next.maxY - next.minY || 1;
    const avgH = (heightL + heightN) / 2;
    const isCloseY = overlapY >= 0 || Math.abs(overlapY) < avgH * 1.5;

    if (isCloseX && isCloseY && !wouldBeTooWide) {
      // Merge next into last
      last.pixels = last.pixels.concat(next.pixels);
      last.minX = Math.min(last.minX, next.minX);
      last.maxX = Math.max(last.maxX, next.maxX);
      last.minY = Math.min(last.minY, next.minY);
      last.maxY = Math.max(last.maxY, next.maxY);
    } else {
      merged.push(next);
    }
  });

  return merged;
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

// Maximum working resolution. Phone photos at 4K+ resolution blow up the
// O(n) skeleton arrays to millions of points — cap them here before any
// pixel-level processing. 1500px on the longest side is more than enough
// resolution for handwriting detection.
// 1200px is plenty for handwriting recognition and keeps skeleton arrays
// to a manageable size even for dense/noisy phone photos.
const MAX_PROCESS_DIM = 1200;

function createOffscreenCanvas(img: HTMLImageElement) {
  const canvas = document.createElement("canvas");
  const scale = Math.min(1, MAX_PROCESS_DIM / Math.max(img.width, img.height));
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return { canvas, ctx };
}

/**
 * Compute Otsu's optimal binarization threshold from the pixel luminance histogram.
 * Much more accurate than a fixed 128 for photos with shadows or off-white paper.
 */
function computeOtsuThreshold(data: Uint8ClampedArray): number {
  const hist = new Int32Array(256);
  for (let i = 0; i < data.length; i += 4) {
    const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
    hist[gray]++;
  }

  const total = data.length / 4;
  let sum = 0;
  for (let t = 0; t < 256; t++) sum += t * hist[t];

  let sumB = 0;
  let wB = 0;
  let maxVar = 0;
  let threshold = 128;

  for (let t = 0; t < 256; t++) {
    wB += hist[t];
    if (wB === 0) continue;
    const wF = total - wB;
    if (wF === 0) break;
    sumB += t * hist[t];
    const mB = sumB / wB;
    const mF = (sum - sumB) / wF;
    const varBetween = wB * wF * (mB - mF) ** 2;
    if (varBetween > maxVar) {
      maxVar = varBetween;
      threshold = t;
    }
  }

  return threshold;
}

function binarize(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const imageData = ctx.getImageData(0, 0, w, h);
  const data = imageData.data;

  // --- Step 1: Contrast stretch ---
  // Find the actual min/max luminance in the image so dim/faded ink
  // is spread across the full 0-255 range before thresholding.
  let minGray = 255;
  let maxGray = 0;
  const grays = new Uint8Array(data.length / 4);
  for (let i = 0; i < data.length; i += 4) {
    const g = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
    grays[i >> 2] = g;
    if (g < minGray) minGray = g;
    if (g > maxGray) maxGray = g;
  }
  const range = maxGray - minGray || 1;

  // Apply stretch back into data for Otsu computation
  for (let i = 0; i < data.length; i += 4) {
    const stretched = Math.round(((grays[i >> 2] - minGray) / range) * 255);
    data[i] = data[i + 1] = data[i + 2] = stretched;
    data[i + 3] = 255;
  }

  // --- Step 2: Otsu auto-threshold ---
  const threshold = computeOtsuThreshold(data);

  // --- Step 3: Binarize ---
  for (let i = 0; i < data.length; i += 4) {
    const val = data[i] < threshold ? 0 : 255;
    data[i] = data[i + 1] = data[i + 2] = val;
    data[i + 3] = 255;
  }

  ctx.putImageData(imageData, 0, 0);
}

export interface Blob {
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

  // Min: a character (or calibration dot/punctuation) can be very small.
  // 0.00005 ensures even periods and the 2mm calibration dots survive.
  // Max: blobs larger than 5% of the image are almost certainly background
  //      noise (patterned wallpaper, table surface, etc.) — drop them early
  //      so they never reach the expensive thin()/traceSkeleton() pipeline.
  const minBlobSize = Math.max(15, Math.floor(w * h * 0.00005));
  const maxBlobSize = Math.floor(w * h * 0.05);

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

      // Early exit: if this blob is already larger than any real character
      // could ever be, mark all remaining pixels as visited and discard.
      // This prevents building a stack of 100k+ entries for background blobs
      // (e.g. a dark wallpaper region), which is the root cause of the
      // "maximum call stack size exceeded" crash.
      if (pixels.length > maxBlobSize) {
        // Drain remaining stack, marking visited so we don't re-enter
        while (stack.length > 0) {
          const p = stack.pop()!;
          if (p.x < 0 || p.x >= w || p.y < 0 || p.y >= h) continue;
          visited[p.y * w + p.x] = 1;
        }
        return null;
      }

      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);

      stack.push({ x: x + 1, y }, { x: x - 1, y }, { x, y: y + 1 }, { x, y: y - 1 });
    }

    // Drop blobs that are too small (noise).
    if (pixels.length < minBlobSize) return null;
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
