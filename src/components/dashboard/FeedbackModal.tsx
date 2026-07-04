"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { analytics } from "@/lib/analytics";

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  source?: "download_prompt" | "dashboard_nudge";
}

export function FeedbackModal({ isOpen, onClose, source = "download_prompt" }: FeedbackModalProps) {
  const [rating, setRating] = useState<number>(0);
  const [nps, setNps] = useState<number | null>(null);
  const [feedback, setFeedback] = useState("");
  const [submitted, setSubmitted] = useState(false);

  // Reset state when opened
  useEffect(() => {
    if (isOpen) {
      setRating(0);
      setNps(null);
      setFeedback("");
      setSubmitted(false);
    }
  }, [isOpen]);

  const handleSubmit = () => {
    // Fire PostHog event
    analytics.trackFeedbackSubmitted({
      rating,
      nps,
      feedback,
      source
    });
    
    // Mark as submitted in localStorage so we don't ask again automatically
    localStorage.setItem("lipi_feedback_submitted", "true");
    
    setSubmitted(true);
    setTimeout(() => {
      onClose();
    }, 2000);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/40 z-[100] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-lipi-cream border-2 border-lipi-border rounded-[32px] p-8 max-w-md w-full relative shadow-brutal"
        >
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-lipi-muted hover:text-lipi-text text-xl font-bold"
          >
            ×
          </button>

          {submitted ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">✨</div>
              <h3 className="font-[family-name:var(--font-cormorant)] text-2xl font-bold mb-2">Thank you!</h3>
              <p className="font-[family-name:var(--font-space-grotesk)] text-sm text-lipi-muted">
                Your feedback means the world to us.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              <div className="text-center">
                <h3 className="font-[family-name:var(--font-cormorant)] text-2xl font-bold mb-1">
                  How are we doing?
                </h3>
                <p className="font-[family-name:var(--font-space-grotesk)] text-xs text-lipi-muted">
                  We'd love to hear your thoughts on Lipi.
                </p>
              </div>

              {/* Star Rating */}
              <div>
                <label className="block font-[family-name:var(--font-space-grotesk)] text-sm font-bold mb-2 text-center">
                  Rate your experience (1-5)
                </label>
                <div className="flex justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRating(star)}
                      className={`text-3xl transition-transform hover:scale-110 ${rating >= star ? "text-yellow-400" : "text-lipi-border/20"}`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>

              {/* NPS Rating */}
              <div className="mt-2">
                <label className="block font-[family-name:var(--font-space-grotesk)] text-sm font-bold mb-3 text-center">
                  How likely are you to recommend Lipi to a friend?
                </label>
                <div className="flex justify-between gap-1">
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                    <button
                      key={num}
                      onClick={() => setNps(num)}
                      className={`w-7 h-7 flex items-center justify-center rounded-full text-xs font-[family-name:var(--font-space-grotesk)] font-bold transition-colors ${
                        nps === num 
                          ? "bg-lipi-dark text-lipi-cream" 
                          : "bg-white border border-lipi-border text-lipi-muted hover:bg-lipi-green/20"
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
                <div className="flex justify-between px-1 mt-1 font-[family-name:var(--font-space-grotesk)] text-[10px] text-lipi-muted">
                  <span>Not likely</span>
                  <span>Very likely</span>
                </div>
              </div>

              {/* Text Feedback */}
              <div className="mt-2">
                <label className="block font-[family-name:var(--font-space-grotesk)] text-sm font-bold mb-2">
                  Anything to let the creator know?
                </label>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Suggestions, bugs, or just say hi!"
                  rows={3}
                  className="input-brutal resize-none w-full"
                />
              </div>

              <button
                onClick={handleSubmit}
                disabled={rating === 0 && nps === null && !feedback.trim()}
                className="btn-lipi btn-primary w-full mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Submit Feedback
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
