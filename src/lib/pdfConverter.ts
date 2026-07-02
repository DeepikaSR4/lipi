// src/lib/pdfConverter.ts
"use client";

/**
 * Renders the first page of a PDF file to a PNG File object using PDF.js.
 * Used so users can upload the filled Lipi handwriting template directly as a
 * PDF without needing to screenshot or photograph it.
 *
 * Scale = 3 → ~2480px wide for an A4 PDF, which is ideal for the image
 * processor pipeline (MAX_PROCESS_DIM = 1200px will downscale from here).
 */
export async function pdfToImageFile(pdfFile: File, scale = 3): Promise<File> {
  // Dynamic import keeps PDF.js out of the main bundle
  const pdfjsLib = await import("pdfjs-dist");

  // Point the worker at the local static file served from public/
  pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

  const arrayBuffer = await pdfFile.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const page = await pdf.getPage(1); // Only need page 1 (the template)

  const viewport = page.getViewport({ scale });

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(viewport.width);
  canvas.height = Math.round(viewport.height);

  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  await page.render({ canvasContext: ctx, viewport, canvas }).promise;

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
