// src/lib/imageProcessor.ts
"use client";

import type { GlyphStrokes, Point } from "@/types";
import { CANVAS_SIZE } from "./fontGenerator";

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

  // 3. Map blobs to characters (left-to-right ordering, assume single row)
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
  const glyphMap: Record<string, GlyphStrokes> = {};

  blobs.slice(0, chars.length).forEach((blob, idx) => {
    const char = chars[idx];
    const strokes = blobToStrokes(blob, canvas.width, canvas.height);
    if (strokes.length > 0) {
      glyphMap[char] = strokes;
    }
  });

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
