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
import type { GlyphStrokes, CharSet } from "@/types";
import { CHAR_SETS } from "@/types";
import { analytics } from "@/lib/analytics";
import { cn } from "@/lib/utils";

const TEMPLATE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

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

  const generateTemplateSvgString = () => {
    const charWidth = 37.6;
    const boxW = 32;
    const boxH = 50;
    const boxY = 40;

    let boxes = "";
    TEMPLATE_CHARS.forEach((char, idx) => {
      const x = idx * charWidth + 12;
      boxes += `
        <!-- Character ${char} -->
        <text x="${x + boxW / 2}" y="28" font-family="sans-serif" font-weight="bold" font-size="12" fill="#111111" text-anchor="middle">${char}</text>
        <rect x="${x}" y="${boxY}" width="${boxW}" height="${boxH}" fill="none" stroke="#111111" stroke-width="2" />
        <line x1="${x}" y1="${boxY + boxH * 0.35}" x2="${x + boxW}" y2="${boxY + boxH * 0.35}" stroke="#b4b4c8" stroke-dasharray="2 2" stroke-width="1" />
        <line x1="${x}" y1="${boxY + boxH * 0.7}" x2="${x + boxW}" y2="${boxY + boxH * 0.7}" stroke="#b4b4c8" stroke-dasharray="3 2" stroke-width="1.5" />
        <text x="${x + boxW / 2}" y="${boxY + boxH * 0.65}" font-family="sans-serif" font-size="18" fill="#e2e8f0" text-anchor="middle">${char}</text>
      `;
    });

    return `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 110" width="1000" height="110" style="background-color: #ffffff;">
        <rect width="1000" height="110" fill="#ffffff" stroke="#111111" stroke-width="4" />
        <text x="500" y="16" font-family="sans-serif" font-weight="bold" font-size="9" fill="#777777" text-anchor="middle">LIPI HANDWRITING TEMPLATE — WRITE INSIDE BOXES IN BLACK INK</text>
        ${boxes}
      </svg>
    `.trim();
  };

  const handleDownloadTemplate = () => {
    const svgStr = generateTemplateSvgString();
    const blob = new Blob([svgStr], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${fontName.toLowerCase().replace(/\s+/g, "_")}_writing_template.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

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
      if (droppedFile.type.startsWith("image/")) {
        setFile(droppedFile);
        setError("");
      } else {
        setError("Please upload an image file (PNG/JPG).");
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

      const glyphMap = await processHandwritingImage(file);
      
      clearTimeout(step1);
      clearTimeout(step2);

      setExtractedGlyphs(glyphMap);
      analytics.trackHandwritingUploadCompleted(fileExt, file.size / (1024 * 1024));
      setFlowState("review");
    } catch (err) {
      console.error(err);
      setError("Failed to extract handwriting. Make sure your image is well-lit, not tilted, and matches the A-Z order.");
      setFlowState("upload");
    }
  };

  const handleImport = async () => {
    if (!user || !fontId) return;
    setImporting(true);
    try {
      // Format the extracted glyphs as serialized JSON dictionary
      const formattedGlyphs: Record<string, string> = {};
      Object.entries(extractedGlyphs).forEach(([char, strokes]) => {
        if (strokes && strokes.length > 0) {
          formattedGlyphs[char] = JSON.stringify(strokes);
        }
      });

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
              {/* Instructions Panel */}
              <div className="border-2 border-lipi-border bg-white p-6 rounded-[32px] shadow-brutal-sm">
                <h3 className="font-bold text-lg mb-3">How it works</h3>
                <ol className="list-decimal pl-5 space-y-2 text-sm text-lipi-text/80 mb-6">
                  <li>
                    Download our guided template or replicate it on blank white paper.
                  </li>
                  <li>
                    Write out the uppercase letters <strong>A through Z</strong> in order from left to right on a single clean row.
                  </li>
                  <li>
                    Write in dark black ink. Make sure letters do not touch each other or the borders.
                  </li>
                  <li>
                    Snap a clear, well-lit photo looking straight down at the paper. Avoid angles or shadows.
                  </li>
                </ol>

                {/* SVG Visual template preview */}
                <div className="mb-6">
                  <div className="text-xs font-bold text-lipi-muted uppercase mb-2">Guided Writing Layout</div>
                  <div className="overflow-x-auto border-2 border-lipi-border bg-white rounded-lg">
                    <div className="min-w-[800px] p-2" dangerouslySetInnerHTML={{ __html: generateTemplateSvgString() }} />
                  </div>
                </div>

                <button
                  onClick={handleDownloadTemplate}
                  className="btn-lipi btn-secondary text-xs px-4 py-2"
                >
                  Download SVG Template ↓
                </button>
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
                    accept="image/*"
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
                      <p className="text-xs text-lipi-muted">Accepts PNG, JPG, or WEBP. Max 10MB.</p>
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
                <h3 className="font-bold text-lg mb-1">Verify extracted letters</h3>
                <p className="text-xs text-lipi-muted mb-6">
                  Review the extracted vector strokes. If some letters are incorrect or empty, don&apos;t worry — you can redraw or fine-tune them inside the drawing editor.
                </p>

                {/* Extracted letter preview grid */}
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-9 gap-3">
                  {TEMPLATE_CHARS.map((char) => {
                    const strokes = extractedGlyphs[char];
                    const hasData = strokes && strokes.length > 0;

                    return (
                      <div
                        key={char}
                        className={cn(
                          "relative border-2 border-lipi-border rounded-xl overflow-hidden aspect-square flex flex-col items-center justify-center p-2 bg-lipi-cream/10",
                          hasData ? "bg-white" : "border-dashed border-red-200"
                        )}
                      >
                        <span className="absolute top-1 left-1.5 text-xs font-bold text-lipi-muted">{char}</span>
                        {hasData ? (
                          <div className="w-10 h-10">
                            <MiniStrokePreview strokes={strokes} />
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
