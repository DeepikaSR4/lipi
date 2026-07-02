"use client";

import { useEffect, useRef, useState } from "react";
import { use } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { getFontProject, saveFontProject } from "@/lib/firestore";
import { useFontStore } from "@/store/fontStore";
import { processHandwritingImage } from "@/lib/imageProcessor";
import { pdfToImageFile, isPdf } from "@/lib/pdfConverter";
import type { GlyphStrokes } from "@/types";
import { ALL_CHARS } from "@/types";
import { analytics } from "@/lib/analytics";
import { cn } from "@/lib/utils";
import { jsPDF } from "jspdf";

const TEMPLATE_CHARS = ALL_CHARS;

function TemplateMockup() {
  const previewCells = [
    { char: "A", written: true, strokes: "M 5 15 L 10 3 L 15 15 M 7 10 L 13 10" },
    { char: "B", written: true, strokes: "M 6 3 L 6 17 C 12 17, 12 10, 6 10 C 12 10, 12 3, 6 3" },
    { char: "C", written: true, strokes: "M 15 5 C 7 5, 5 9, 5 12 C 5 15, 7 17, 15 17" },
    { char: "D", written: true, strokes: "M 6 3 L 6 17 C 14 17, 14 3, 6 3" },
    { char: "E", written: false },
    { char: "F", written: false },
    { char: "G", written: false },
    { char: "H", written: false },
    { char: "I", written: false },
    { char: "J", written: false },
  ];

  return (
    <div className="border-2 border-lipi-border bg-white rounded-[24px] p-4 shadow-inner overflow-hidden max-w-full">
      <div className="flex justify-between items-center text-[10px] text-lipi-muted font-bold mb-3 uppercase tracking-wide">
        <span>Template Preview (A4 Page Grid)</span>
        <span className="text-lipi-green font-bold">10 columns × 9 rows</span>
      </div>
      <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5 opacity-90">
        {previewCells.map((cell, idx) => (
          <div key={idx} className="border border-gray-200 aspect-[18/25] rounded-md relative p-1 flex flex-col items-center justify-between bg-lipi-cream/10">
            <span className="text-[8px] font-bold text-gray-400 self-start leading-none">{cell.char}</span>
            {cell.written ? (
              <svg viewBox="0 0 20 20" className="w-8 h-8 text-lipi-text">
                <path d={cell.strokes} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : (
              <span className="text-[14px] text-gray-100 font-bold select-none">{cell.char}</span>
            )}
            <div className="absolute left-0 right-0 border-t border-dashed border-gray-100 h-0 pointer-events-none" style={{ top: "35%" }} />
            <div className="absolute left-0 right-0 border-t border-dashed border-gray-200 h-0 pointer-events-none" style={{ top: "70%" }} />
          </div>
        ))}
      </div>
    </div>
  );
}

function MiniStrokePreview({ strokes }: { strokes: GlyphStrokes }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear previous drawing
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#111111";
    ctx.lineWidth = 3.5;

    const scale = canvas.width / 512; // Normalize from 512 coord space

    for (const stroke of strokes) {
      if (stroke.length < 2) continue;
      ctx.beginPath();
      ctx.moveTo(stroke[0].x * scale, stroke[0].y * scale);
      for (let i = 1; i < stroke.length; i++) {
        ctx.lineTo(stroke[i].x * scale, stroke[i].y * scale);
      }
      ctx.stroke();
    }
  }, [strokes]);

  return (
    <canvas
      ref={canvasRef}
      width={120}
      height={120}
      className="w-full h-full bg-white pointer-events-none"
    />
  );
}

export default function UploadPage({
  params,
}: {
  params: Promise<{ fontId: string }>;
}) {
  const { fontId } = use(params);
  const { user } = useAuth();
  const router = useRouter();
  const { setFontId, setFontName, loadGlyphs, fontName } = useFontStore();

  const [loading, setLoading] = useState(true);
  const [flowState, setFlowState] = useState<"upload" | "processing" | "review">("upload");
  const [processingStep, setProcessingStep] = useState<"binarizing" | "detecting" | "mapping">("binarizing");
  const [uploadMode, setUploadMode] = useState<"template" | "sequence">("template");
  const [sequenceLayout, setSequenceLayout] = useState<"block" | "pairs">("block");
  // null slots represent intentionally removed glyphs; index stability is critical for correct mapping
  const [rawGlyphs, setRawGlyphs] = useState<(GlyphStrokes | null)[]>([]);
  
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [extractedGlyphs, setExtractedGlyphs] = useState<Record<string, GlyphStrokes>>({});
  const [error, setError] = useState("");
  const [importing, setImporting] = useState(false);

  // Load project metadata on mount
  useEffect(() => {
    if (!user || !fontId) return;
    getFontProject(fontId)
      .then((project) => {
        if (!project) {
          router.push("/dashboard");
          return;
        }
        setFontId(fontId);
        setFontName(project.fontName);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [fontId, user]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type.startsWith("image/") || isPdf(droppedFile)) {
        setFile(droppedFile);
        setError("");
      } else {
        setError("Please upload an image (PNG/JPG) or PDF file.");
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError("");
    }
  };

  const handleExtract = async () => {
    if (!file) return;
    setFlowState("processing");
    setProcessingStep("binarizing");
    const fileExt = file.name.split('.').pop() || "png";
    analytics.trackHandwritingUploadStarted(fileExt);

    try {
      // Simulate sequential visual steps for premium loading experience
      const step1 = setTimeout(() => setProcessingStep("detecting"), 700);
      const step2 = setTimeout(() => setProcessingStep("mapping"), 1400);

      // Convert PDF to image if the user uploaded the template directly
      const processFile = isPdf(file) ? await pdfToImageFile(file) : file;

      const result = await processHandwritingImage(processFile, uploadMode);
      
      clearTimeout(step1);
      clearTimeout(step2);

      setExtractedGlyphs(result.glyphs);
      if (result.rawGlyphs) {
        setRawGlyphs(result.rawGlyphs as (GlyphStrokes | null)[]);
      } else {
        setRawGlyphs([]);
      }
      
      analytics.trackHandwritingUploadCompleted(fileExt, file.size / (1024 * 1024));
      setFlowState("review");
    } catch (err: any) {
      const defaultErr = uploadMode === "template"
        ? "Could not find calibration markers. Make sure all 4 corner dots are visible and the page is flat and well-lit."
        : "Failed to extract handwriting. Make sure the image is well-lit and characters are written in clear rows.";
      setError(err?.message || defaultErr);
      setFlowState("upload");
    }
  };

  const getTargetSequence = () => {
    if (sequenceLayout === "pairs") {
      const pairs: string[] = [];
      for (let i = 0; i < 26; i++) {
        pairs.push(ALL_CHARS[i]);
        pairs.push(ALL_CHARS[i + 26]);
      }
      ALL_CHARS.slice(52).forEach(c => pairs.push(c));
      return pairs;
    }
    return ALL_CHARS;
  };

  /** Generate and download a calibration-dot grid PDF.
   *  Dot / grid positions MUST match the constants in imageProcessor.ts. */
  const downloadTemplate = () => {
    const doc = new jsPDF({ unit: "mm", format: "a4" });

    // White background
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, 210, 297, "F");

    // Header
    doc.setFontSize(7);
    doc.setTextColor(120, 120, 120);
    doc.text(
      "Lipi Handwriting Template — fill every box in order, then photograph and upload",
      105, 6.5, { align: "center" }
    );

    // ── 4 calibration corner dots ──────────────────────────────────────
    // These exact coordinates are parsed by imageProcessor.ts — do not move them.
    doc.setFillColor(0, 0, 0);
    doc.circle(10,  12,  2, "F"); // top-left
    doc.circle(200, 12,  2, "F"); // top-right
    doc.circle(10,  285, 2, "F"); // bottom-left
    doc.circle(200, 285, 2, "F"); // bottom-right

    // ── Character grid (10 cols × 9 rows = 90 cells) ──────────────────
    const gridLeft = 15;
    const gridTop  = 22;
    const cellW    = 18;       // 180mm / 10
    const cellH    = 254.5 / 9; // ≈ 28.28mm

    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 10; c++) {
        const idx = r * 10 + c;
        const x   = gridLeft + c * cellW;
        const y   = gridTop  + r * cellH;

        // Cell border
        doc.setDrawColor(180, 180, 180);
        doc.setLineWidth(0.25);
        doc.rect(x, y, cellW, cellH);

        // Baseline guide (70% down)
        doc.setDrawColor(210, 220, 255);
        doc.setLineWidth(0.15);
        doc.line(x + 1, y + cellH * 0.7, x + cellW - 1, y + cellH * 0.7);

        // Character label (top-left corner, greyed out as guide)
        if (idx < ALL_CHARS.length) {
          doc.setFontSize(4.5);
          doc.setTextColor(190, 190, 190);
          doc.text(ALL_CHARS[idx], x + 1.2, y + 3.8);
        }
      }
    }

    doc.save("lipi-handwriting-template.pdf");
  };

  // Mark slot as null instead of splicing — preserves all subsequent indices
  // so the character labels stay correctly aligned after a removal.
  const handleRemoveGlyph = (index: number) => {
    setRawGlyphs((prev) => prev.map((g, idx) => (idx === index ? null : g)));
  };

  const handleImport = async () => {
    if (!user || !fontId) return;
    setImporting(true);
    try {
      // Format the extracted glyphs as serialized JSON dictionary
      const formattedGlyphs: Record<string, string> = {};
      
      if (uploadMode === "template") {
        Object.entries(extractedGlyphs).forEach(([char, strokes]) => {
          if (strokes && strokes.length > 0) {
            formattedGlyphs[char] = JSON.stringify(strokes);
          }
        });
      } else {
        const targetSeq = getTargetSequence();
        rawGlyphs.forEach((strokes, idx) => {
          // null = user deliberately removed this slot; skip it
          if (idx < targetSeq.length && strokes !== null && strokes && strokes.length > 0) {
            const char = targetSeq[idx];
            formattedGlyphs[char] = JSON.stringify(strokes);
          }
        });
      }

      // Save to cloud & load store
      await saveFontProject(user.uid, fontId, { glyphs: formattedGlyphs });
      loadGlyphs(formattedGlyphs);

      analytics.trackCharacterDetectionCompleted(Object.keys(formattedGlyphs).length);
      router.push(`/workspace/${fontId}`);
    } catch (err) {
      console.error(err);
      setError("Failed to import font. Check network connection.");
      setImporting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-lipi-cream">
        <div className="border-2 border-lipi-border px-8 py-6 font-[family-name:var(--font-space-grotesk)] text-sm rounded-[32px]">
          Loading workspace...
        </div>
      </div>
    );
  }

  const targetSequence = getTargetSequence();

  return (
    <div className="min-h-screen bg-lipi-cream p-4 sm:p-8 font-[family-name:var(--font-space-grotesk)]">
      <div className="max-w-4xl mx-auto">
        
        {/* Header navigation */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link href="/dashboard" className="text-xs text-lipi-muted hover:text-lipi-text flex items-center gap-1 mb-2">
              ← Dashboard
            </Link>
            <h1 className="font-[family-name:var(--font-cormorant)] text-3xl sm:text-4xl font-bold">
              Upload handwriting: {fontName}
            </h1>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {/* STATE 1: UPLOAD & INSTRUCTIONS */}
          {flowState === "upload" && (
            <motion.div
              key="upload"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              {/* Mode selector */}
              <div className="border-2 border-lipi-border bg-white p-5 rounded-[32px] shadow-brutal-sm">
                <h3 className="font-bold text-lg mb-4">Choose upload method</h3>
                <div className="grid grid-cols-2 gap-3 mb-5">
                  <button
                    onClick={() => setUploadMode("template")}
                    className={cn(
                      "p-4 rounded-2xl border-2 text-left transition-all cursor-pointer",
                      uploadMode === "template"
                        ? "border-lipi-border bg-lipi-green shadow-[2px_2px_0_#111]"
                        : "border-lipi-border/30 bg-lipi-cream/20 hover:bg-lipi-cream/50"
                    )}
                  >
                    <div className="text-xl mb-1">📄</div>
                    <div className="font-bold text-sm">Template <span className="text-[10px] font-normal bg-lipi-border text-white px-1.5 py-0.5 rounded-full ml-1">Recommended</span></div>
                    <div className="text-xs text-lipi-muted mt-1">Download a grid template, fill it in, photograph and upload. Most accurate.</div>
                  </button>
                  <button
                    onClick={() => setUploadMode("sequence")}
                    className={cn(
                      "p-4 rounded-2xl border-2 text-left transition-all cursor-pointer",
                      uploadMode === "sequence"
                        ? "border-lipi-border bg-lipi-green shadow-[2px_2px_0_#111]"
                        : "border-lipi-border/30 bg-lipi-cream/20 hover:bg-lipi-cream/50"
                    )}
                  >
                    <div className="text-xl mb-1">✍️</div>
                    <div className="font-bold text-sm">Freehand Sequence</div>
                    <div className="text-xs text-lipi-muted mt-1">Write all characters in rows on plain paper. Works best on a white background.</div>
                  </button>
                </div>

                {uploadMode === "template" ? (
                  <div className="space-y-4">
                    <ol className="list-decimal pl-5 space-y-1.5 text-sm text-lipi-text/80">
                      <li><strong>Download</strong> the template PDF below.</li>
                      <li><strong>Print</strong> it on plain white paper.</li>
                      <li><strong>Fill in</strong> each box with the character shown in its corner — write clearly, stay inside the box.</li>
                      <li><strong>Photograph</strong> the filled sheet flat and well-lit — all 4 corner dots must be visible.</li>
                      <li><strong>Upload</strong> the photo below.</li>
                    </ol>
                    <button
                      onClick={downloadTemplate}
                      className="btn-lipi btn-dark text-sm px-5 py-2.5 w-full justify-center"
                    >
                      ⬇ Download Handwriting Template PDF
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <ol className="list-decimal pl-5 space-y-1.5 text-sm text-lipi-text/80">
                      <li><strong>Write in Order:</strong> All 81 characters in exact sequence (A–Z, a–z, 0–9, symbols) in horizontal rows on a white background.</li>
                      <li><strong>Keep separated:</strong> Strokes must not touch adjacent characters.</li>
                      <li><strong>Multi-stroke letters</strong> (i, j, ?, !, =) — keep dots/accents close to their base.</li>
                      <li><strong>Photograph clearly:</strong> Flat, white background, good lighting, all rows visible.</li>
                    </ol>
                    <div className="text-xs font-mono break-all bg-lipi-cream p-3 rounded-lg border border-gray-100 max-h-[60px] overflow-y-auto leading-relaxed">
                      {ALL_CHARS.join(" ")}
                    </div>
                  </div>
                )}
              </div>

              {/* Upload Dropzone */}
              <div className="border-2 border-lipi-border bg-white p-6 rounded-[32px] shadow-brutal-sm">
                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  className={cn(
                    "border-2 border-dashed border-lipi-border/30 rounded-[20px] p-8 flex flex-col items-center justify-center text-center transition-colors min-h-[220px]",
                    dragActive ? "bg-lipi-green/10 border-lipi-green" : "bg-lipi-cream/20 hover:bg-lipi-cream/40"
                  )}
                >
                  <input
                    type="file"
                    id="handwriting-image-upload"
                    accept="image/*,application/pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  {file ? (
                    <div className="space-y-4">
                      <div className="text-4xl">📄</div>
                      <div>
                        <p className="font-bold text-sm">{file.name}</p>
                        <p className="text-xs text-lipi-muted">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                      <button
                        onClick={() => setFile(null)}
                        className="text-xs text-red-500 underline cursor-pointer"
                      >
                        Remove file
                      </button>
                    </div>
                  ) : (
                    <label
                      htmlFor="handwriting-image-upload"
                      className="cursor-pointer space-y-3 flex flex-col items-center"
                    >
                      <div className="text-4xl text-lipi-border/40">📸</div>
                      <div>
                        <span className="font-bold text-sm text-lipi-text underline">Click to upload image</span>
                        <span className="text-sm text-lipi-text/60"> or drag and drop</span>
                      </div>
                      <p className="text-xs text-lipi-muted">Accepts PNG, JPG, WEBP, or PDF. Max 10MB.</p>
                    </label>
                  )}
                </div>

                {error && (
                  <div className="mt-4 p-3 bg-red-50 border-2 border-red-200 text-xs text-red-600 font-medium rounded-xl">
                    {error}
                  </div>
                )}

                {file && (
                  <div className="mt-6 flex justify-end">
                    <button
                      onClick={handleExtract}
                      className="btn-lipi btn-primary text-sm px-6 py-3"
                    >
                      Extract Font →
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* STATE 2: PROCESSING (LOADING SCREEN) */}
          {flowState === "processing" && (
            <motion.div
              key="processing"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center min-h-[400px]"
            >
              <div className="border-2 border-lipi-border bg-white p-8 rounded-[32px] shadow-brutal text-center max-w-sm w-full space-y-6">
                {/* Custom animation circle */}
                <div className="flex justify-center">
                  <div className="w-16 h-16 border-4 border-lipi-border border-t-lipi-green rounded-full animate-spin" />
                </div>

                <div className="space-y-2">
                  <h3 className="font-bold text-lg">Processing handwriting</h3>
                  <div className="text-sm text-lipi-muted min-h-[20px] font-medium">
                    {processingStep === "binarizing" && "Optimizing image threshold..."}
                    {processingStep === "detecting" && "Detecting character segments..."}
                    {processingStep === "mapping" && "Extracting vector stroke paths..."}
                  </div>
                </div>

                {/* Progress bar animation */}
                <div className="h-2 bg-lipi-border/10 border border-lipi-border/20 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-lipi-green"
                    initial={{ width: "10%" }}
                    animate={
                      processingStep === "binarizing"
                        ? { width: "35%" }
                        : processingStep === "detecting"
                        ? { width: "70%" }
                        : { width: "95%" }
                    }
                    transition={{ duration: 0.8 }}
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* STATE 3: REVIEW EXTRACTED GLYPHS */}
          {flowState === "review" && (
            <motion.div
              key="review"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <div className="border-2 border-lipi-border bg-white p-6 rounded-[32px] shadow-brutal-sm">
                {/* Low detection warning */}
                {rawGlyphs.length < ALL_CHARS.length && (
                  <div className="mb-4 p-3 bg-amber-50 border-2 border-amber-300 text-xs text-amber-800 font-medium rounded-xl">
                    ⚠️ Only <strong>{rawGlyphs.length}</strong> characters were detected (expected <strong>{ALL_CHARS.length}</strong>).
                    {" "}This usually means some characters were too small, merged together, or the image contrast was low.
                    {" "}Review the grid below and remove any noise blobs so the mapping stays correct.
                  </div>
                )}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                  <div>
                    <h3 className="font-bold text-lg mb-1">Verify extracted letters</h3>
                    <p className="text-xs text-lipi-muted">
                      Review the extracted vector strokes. Click ❌ on any noise blob to mark that slot as empty — subsequent characters stay correctly aligned.
                    </p>
                  </div>
                  <div className="flex gap-1.5 bg-lipi-cream/15 p-1 rounded-xl border-2 border-lipi-border shadow-brutal-xs">
                    <button
                      onClick={() => setSequenceLayout("pairs")}
                      className={cn(
                        "px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-all",
                        sequenceLayout === "pairs" ? "bg-lipi-green text-white" : "text-lipi-muted hover:text-lipi-text"
                      )}
                    >
                      Aa Bb Cc (Pairs)
                    </button>
                    <button
                      onClick={() => setSequenceLayout("block")}
                      className={cn(
                        "px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-all",
                        sequenceLayout === "block" ? "bg-lipi-green text-white" : "text-lipi-muted hover:text-lipi-text"
                      )}
                    >
                      A-Z, a-z (Block)
                    </button>
                  </div>
                </div>

                {/* Extracted letter preview grid */}
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-9 gap-3">
                  {targetSequence.map((char, idx) => {
                    const strokes = rawGlyphs[idx];
                    // null = intentionally removed by user; undefined = not yet detected
                    const isRemoved = strokes === null;
                    const hasData = !isRemoved && strokes && strokes.length > 0;

                    return (
                      <div
                        key={`${char}-${idx}`}
                        className={cn(
                          "relative border-2 rounded-xl overflow-hidden aspect-square flex flex-col items-center justify-center p-2",
                          isRemoved
                            ? "border-dashed border-amber-300 bg-amber-50"
                            : hasData
                            ? "border-lipi-border bg-white"
                            : "border-dashed border-red-200 bg-lipi-cream/10"
                        )}
                      >
                        <span className="absolute top-1 left-1.5 text-xs font-bold text-lipi-muted">{char}</span>

                        {/* Remove / restore controls */}
                        {hasData && (
                          <button
                            onClick={() => handleRemoveGlyph(idx)}
                            className="absolute top-1 right-1 w-4 h-4 bg-red-100 hover:bg-red-200 text-red-700 rounded-full flex items-center justify-center text-[8px] font-bold cursor-pointer transition-colors"
                            title="Mark as empty — keeps subsequent letters correctly aligned"
                          >
                            ✕
                          </button>
                        )}
                        {isRemoved && (
                          <button
                            onClick={() => setRawGlyphs((prev) => prev.map((g, i) => i === idx ? [] : g))}
                            className="absolute top-1 right-1 w-4 h-4 bg-green-100 hover:bg-green-200 text-green-700 rounded-full flex items-center justify-center text-[8px] font-bold cursor-pointer transition-colors"
                            title="Restore slot"
                          >
                            ↩
                          </button>
                        )}

                        {isRemoved ? (
                          <span className="text-[10px] text-amber-600 font-bold uppercase tracking-wider">Skipped</span>
                        ) : hasData ? (
                          <div className="w-10 h-10 mt-2">
                            <MiniStrokePreview strokes={strokes!} />
                          </div>
                        ) : (
                          <span className="text-[10px] text-red-500 font-bold uppercase tracking-wider">Empty</span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {error && (
                  <div className="mt-6 p-3 bg-red-50 border-2 border-red-200 text-xs text-red-600 font-medium rounded-xl">
                    {error}
                  </div>
                )}

                {/* Actions */}
                <div className="mt-8 flex justify-between items-center">
                  <button
                    onClick={() => setFlowState("upload")}
                    className="btn-lipi btn-secondary text-xs px-4 py-2"
                  >
                    ← Re-upload image
                  </button>
                  <button
                    onClick={handleImport}
                    disabled={importing}
                    className="btn-lipi btn-primary text-sm px-6 py-3"
                  >
                    {importing ? "Importing..." : "Import & Open Workspace →"}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
