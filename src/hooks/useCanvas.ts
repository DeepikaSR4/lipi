// src/hooks/useCanvas.ts
"use client";

import { useRef, useCallback, useEffect } from "react";
import { useFontStore } from "@/store/fontStore";
import type { Point, Stroke } from "@/types";
import { CANVAS_SIZE } from "@/lib/fontGenerator";

const GUIDE_COLOR = "rgba(180,180,200,0.5)";

interface UseCanvasReturn {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  guideRef: React.RefObject<HTMLCanvasElement | null>;
  onPointerDown: (e: React.PointerEvent<HTMLCanvasElement>) => void;
  onPointerMove: (e: React.PointerEvent<HTMLCanvasElement>) => void;
  onPointerUp: (e: React.PointerEvent<HTMLCanvasElement>) => void;
  redrawCanvas: () => void;
}

export function useCanvas(): UseCanvasReturn {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const guideRef = useRef<HTMLCanvasElement | null>(null);

  const isDrawing = useRef(false);
  const currentStroke = useRef<Stroke>([]);

  const { currentStrokes, activeTool, strokeWidth, zoom, addStroke, eraseAt } =
    useFontStore();

  // ── Coordinate helpers ─────────────────────────────────────────────────────
  const getCanvasPoint = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>): Point => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();
      const scaleX = CANVAS_SIZE / rect.width;
      const scaleY = CANVAS_SIZE / rect.height;
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
        pressure: e.pressure ?? 0.5,
      };
    },
    []
  );

  // ── Redraw all strokes ─────────────────────────────────────────────────────
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    for (const stroke of currentStrokes) {
      if (stroke.length < 2) continue;
      ctx.beginPath();
      ctx.strokeStyle = "#111111";
      ctx.lineWidth = strokeWidth;
      ctx.moveTo(stroke[0].x, stroke[0].y);
      for (let i = 1; i < stroke.length; i++) {
        const prev = stroke[i - 1];
        const curr = stroke[i];
        const midX = (prev.x + curr.x) / 2;
        const midY = (prev.y + curr.y) / 2;
        ctx.quadraticCurveTo(prev.x, prev.y, midX, midY);
      }
      ctx.lineTo(
        stroke[stroke.length - 1].x,
        stroke[stroke.length - 1].y
      );
      ctx.stroke();
    }
  }, [currentStrokes, strokeWidth]);

  // ── Draw guide lines ───────────────────────────────────────────────────────
  const drawGuides = useCallback(() => {
    const canvas = guideRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    ctx.setLineDash([8, 6]);
    ctx.lineWidth = 1;

    const lines = [
      { y: CANVAS_SIZE * 0.15, label: "cap" },
      { y: CANVAS_SIZE * 0.35, label: "x-height" },
      { y: CANVAS_SIZE * 0.7, label: "baseline" },
      { y: CANVAS_SIZE * 0.85, label: "descender" },
    ];

    for (const { y, label } of lines) {
      ctx.beginPath();
      ctx.strokeStyle = GUIDE_COLOR;
      ctx.moveTo(0, y);
      ctx.lineTo(CANVAS_SIZE, y);
      ctx.stroke();

      ctx.setLineDash([]);
      ctx.font = "11px Space Grotesk, sans-serif";
      ctx.fillStyle = "rgba(150,150,180,0.8)";
      ctx.fillText(label, 4, y - 3);
      ctx.setLineDash([8, 6]);
    }
  }, []);

  // ── Event handlers ─────────────────────────────────────────────────────────
  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      e.currentTarget.setPointerCapture(e.pointerId);
      isDrawing.current = true;
      const pt = getCanvasPoint(e);
      currentStroke.current = [pt];

      if (activeTool === "pen") {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d")!;
        ctx.beginPath();
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.strokeStyle = "#111111";
        ctx.lineWidth = strokeWidth;
        ctx.moveTo(pt.x, pt.y);
      }
    },
    [activeTool, getCanvasPoint, strokeWidth]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!isDrawing.current) return;
      const pt = getCanvasPoint(e);

      if (activeTool === "pen") {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d")!;
        const prev = currentStroke.current[currentStroke.current.length - 1];
        const midX = (prev.x + pt.x) / 2;
        const midY = (prev.y + pt.y) / 2;
        ctx.quadraticCurveTo(prev.x, prev.y, midX, midY);
        ctx.stroke();
        currentStroke.current.push(pt);
      } else if (activeTool === "eraser") {
        eraseAt(pt, strokeWidth * 4);
        redrawCanvas();
      }
    },
    [activeTool, eraseAt, getCanvasPoint, redrawCanvas, strokeWidth]
  );

  const onPointerUp = useCallback(() => {
    if (!isDrawing.current) return;
    isDrawing.current = false;

    if (activeTool === "pen" && currentStroke.current.length > 1) {
      addStroke(currentStroke.current);
    }
    currentStroke.current = [];
  }, [activeTool, addStroke]);

  // ── Redraw when store changes ───────────────────────────────────────────────
  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  // ── Draw guides on mount ───────────────────────────────────────────────────
  useEffect(() => {
    drawGuides();
  }, [drawGuides]);

  return { canvasRef, guideRef, onPointerDown, onPointerMove, onPointerUp, redrawCanvas };
}
