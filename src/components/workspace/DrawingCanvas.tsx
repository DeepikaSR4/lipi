"use client";

import { useEffect, useRef } from "react";
import { useCanvas } from "@/hooks/useCanvas";
import { useFontStore } from "@/store/fontStore";
import { CANVAS_SIZE } from "@/lib/fontGenerator";

export function DrawingCanvas() {
  const { canvasRef, guideRef, onPointerDown, onPointerMove, onPointerUp } = useCanvas();
  const { zoom } = useFontStore();
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Prevent scroll on touch devices
  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    const preventScroll = (e: TouchEvent) => e.preventDefault();
    wrapper.addEventListener("touchstart", preventScroll, { passive: false });
    wrapper.addEventListener("touchmove", preventScroll, { passive: false });
    return () => {
      wrapper.removeEventListener("touchstart", preventScroll);
      wrapper.removeEventListener("touchmove", preventScroll);
    };
  }, []);

  return (
    <div
      ref={wrapperRef}
      className="flex-1 flex items-center justify-center p-6 bg-lipi-cream"
    >
      <div
        className="canvas-wrapper"
        style={{
          width: CANVAS_SIZE,
          height: CANVAS_SIZE,
          transform: `scale(${zoom})`,
          transformOrigin: "center center",
          maxWidth: "100%",
        }}
      >
        {/* Guide lines canvas (bottom layer) */}
        <canvas
          ref={guideRef}
          width={CANVAS_SIZE}
          height={CANVAS_SIZE}
          className="absolute inset-0 pointer-events-none"
          style={{ zIndex: 1 }}
        />

        {/* Drawing canvas (top layer) */}
        <canvas
          ref={canvasRef}
          id="lipi-drawing-canvas"
          width={CANVAS_SIZE}
          height={CANVAS_SIZE}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
          className="absolute inset-0 touch-none"
          style={{ zIndex: 2, cursor: "crosshair" }}
        />
      </div>
    </div>
  );
}
