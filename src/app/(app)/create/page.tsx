"use client";

import { useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { createFontProject } from "@/lib/firestore";
import { useFontStore } from "@/store/fontStore";
import { analytics } from "@/lib/analytics";

type Method = "draw" | "upload" | null;

export default function CreatePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { setFontId, setFontName } = useFontStore();

  const initialMethod = (searchParams.get("method") as Method) ?? null;
  const [method, setMethod] = useState<Method>(initialMethod);
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const nameSectionRef = useRef<HTMLDivElement>(null);

  const selectMethod = (m: Method) => {
    setMethod(m);
    // Scroll the name-input section into view on the next paint
    setTimeout(() => {
      nameSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  };

  const handleCreate = async () => {
    if (!user || !name || !method) return;
    setCreating(true);
    setError("");
    try {
      analytics.trackFontNameAdded(name);
      analytics.trackFontCreationStarted(method);
      const id = await createFontProject(user.uid, name);
      setFontId(id);
      setFontName(name);
      if (method === "upload") {
        router.push(`/workspace/${id}/upload`);
      } else {
        router.push(`/workspace/${id}`);
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Failed to create font. Check console.");
      setCreating(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <div className="font-[family-name:var(--font-caveat)] text-lipi-muted text-sm mb-1">let&apos;s make</div>
        <h1 className="font-[family-name:var(--font-cormorant)] text-4xl font-bold">Create a new font</h1>
      </motion.div>

      {/* Step 1: Method */}
      <div className="mb-10">
        <div className="font-[family-name:var(--font-space-grotesk)] font-semibold text-sm mb-4 flex items-center gap-3">
          <span className="w-6 h-6 border-2 border-lipi-border flex items-center justify-center text-xs bg-lipi-green rounded-[32px]">1</span>
          Choose your method
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Draw */}
          <motion.div
            whileHover={{ x: -3, y: -3, }}
            onClick={() => {
              selectMethod("draw");
              analytics.trackFontCreationMethodSelected("draw");
            }}
            className={`border-2 border-lipi-border p-6 cursor-pointer transition-colors ${method === "draw" ? "bg-lipi-green" : "bg-white hover:bg-lipi-green/10"}`}
            
          >
            <div className="text-4xl mb-3">✏️</div>
            <h3 className="font-[family-name:var(--font-space-grotesk)] font-bold text-lg mb-1">Draw it</h3>
            <p className="font-[family-name:var(--font-space-grotesk)] text-sm text-lipi-text/60">
              Draw each letter digitally using your mouse, finger, or stylus.
            </p>
            {method === "draw" && (
              <div className="mt-3 font-[family-name:var(--font-caveat)] text-sm font-bold">✓ Selected</div>
            )}
          </motion.div>

          {/* Upload */}
          <motion.div
            whileHover={{ x: -3, y: -3, }}
            onClick={() => {
              selectMethod("upload");
              analytics.trackFontCreationMethodSelected("upload");
            }}
            className={`border-2 border-lipi-border p-6 cursor-pointer transition-colors ${method === "upload" ? "bg-lipi-green" : "bg-white hover:bg-lipi-green/10"}`}
            
          >
            <div className="text-4xl mb-3">📄</div>
            <h3 className="font-[family-name:var(--font-space-grotesk)] font-bold text-lg mb-1">Upload it</h3>
            <p className="font-[family-name:var(--font-space-grotesk)] text-sm text-lipi-text/60">
              Download the template, write over it, and re-upload the PDF.
            </p>
            {method === "upload" && (
              <div className="mt-3 font-[family-name:var(--font-caveat)] text-sm font-bold">✓ Selected</div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Step 2: Name */}
      <AnimatePresence>
        {method && (
          <motion.div
            ref={nameSectionRef}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-10 scroll-mt-8"
          >
            <div className="font-[family-name:var(--font-space-grotesk)] font-semibold text-sm mb-4 flex items-center gap-3">
              <span className="w-6 h-6 border-2 border-lipi-border flex items-center justify-center text-xs bg-lipi-green rounded-[32px]">2</span>
              Name your font
            </div>

            <div className="max-w-sm">
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Roseline, WildStroke..."
                className="input-brutal"
                maxLength={40}
              />
              {error && (
                <div className="mt-2 px-3 py-2 bg-red-50 border-2 border-red-200 text-xs text-red-600 font-[family-name:var(--font-space-grotesk)] rounded-md">
                  {error}
                </div>
              )}
              <p className="text-xs text-lipi-muted font-[family-name:var(--font-space-grotesk)] mt-2">
                This will be the font family name when you export.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create button */}
      <AnimatePresence>
        {method && name.trim() && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <button
              onClick={handleCreate}
              disabled={creating}
              className="btn-lipi btn-primary text-base px-8 py-4"
            >
              {creating
                ? "Creating..."
                : method === "upload"
                ? `Start uploading "${name}" →`
                : `Start drawing "${name}" →`}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
