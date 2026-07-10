const fs = require('fs');
const { createCanvas, loadImage } = require('canvas');

async function test() {
  const imgPath = 'C:/Users/deepi/.gemini/antigravity-ide/brain/e5fa569d-2509-4a16-bd0b-41bd6bd7fb9b/media__1783655086735.png';
  const img = await loadImage(imgPath);
  
  const MAX_PROCESS_DIM = 1200;
  const scale = Math.min(1, MAX_PROCESS_DIM / Math.max(img.width, img.height));
  const canvas = createCanvas(Math.round(img.width * scale), Math.round(img.height * scale));
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  const w = canvas.width;
  const h = canvas.height;
  
  const imageData = ctx.getImageData(0, 0, w, h);
  const data = imageData.data;
  
  let minGray = 255, maxGray = 0;
  const grays = new Uint8Array(data.length / 4);
  for (let i = 0; i < data.length; i += 4) {
    const alpha = data[i + 3] / 255;
    const r = data[i] * alpha + 255 * (1 - alpha);
    const g_c = data[i + 1] * alpha + 255 * (1 - alpha);
    const b = data[i + 2] * alpha + 255 * (1 - alpha);
    const g = Math.round(0.299 * r + 0.587 * g_c + 0.114 * b);
    grays[i >> 2] = g;
    if (g < minGray) minGray = g;
    if (g > maxGray) maxGray = g;
  }
  const range = maxGray - minGray || 1;
  for (let i = 0; i < data.length; i += 4) {
    data[i] = data[i + 1] = data[i + 2] = Math.round(((grays[i >> 2] - minGray) / range) * 255);
    data[i + 3] = 255;
  }
  
  const hist = new Int32Array(256);
  for (let i = 0; i < data.length; i += 4) hist[data[i]]++;
  const total = data.length / 4;
  let sum = 0; for (let t = 0; t < 256; t++) sum += t * hist[t];
  let sumB = 0, wB = 0, maxVar = 0, threshold = 128;
  for (let t = 0; t < 256; t++) {
    wB += hist[t];
    if (wB === 0) continue;
    const wF = total - wB;
    if (wF === 0) break;
    sumB += t * hist[t];
    const mB = sumB / wB;
    const mF = (sum - sumB) / wF;
    const varBetween = wB * wF * (mB - mF) ** 2;
    if (varBetween > maxVar) { maxVar = varBetween; threshold = t; }
  }
  for (let i = 0; i < data.length; i += 4) {
    const val = data[i] < threshold ? 0 : 255;
    data[i] = data[i + 1] = data[i + 2] = val;
    data[i + 3] = 255;
  }

  const visited = new Uint8Array(w * h);
  let blobs = [];
  const minBlobSize = Math.max(15, Math.floor(w * h * 0.00005));
  const maxBlobSize = Math.floor(w * h * 0.05);

  const floodFill = (startX, startY) => {
    const stack = [{ x: startX, y: startY }];
    const pixels = [];
    let minX = startX, maxX = startX, minY = startY, maxY = startY;

    while (stack.length > 0) {
      const { x, y } = stack.pop();
      if (x < 0 || x >= w || y < 0 || y >= h) continue;
      const idx = y * w + x;
      if (visited[idx] || data[idx * 4] > 64) continue;
      visited[idx] = 1;
      pixels.push({ x, y });

      if (pixels.length > maxBlobSize) {
        while (stack.length > 0) {
          const p = stack.pop();
          if (p.x >= 0 && p.x < w && p.y >= 0 && p.y < h) visited[p.y * w + p.x] = 1;
        }
        return null;
      }
      minX = Math.min(minX, x); maxX = Math.max(maxX, x);
      minY = Math.min(minY, y); maxY = Math.max(maxY, y);
      stack.push({ x: x + 1, y }, { x: x - 1, y }, { x, y: y + 1 }, { x, y: y - 1 });
    }
    if (pixels.length < minBlobSize) return null;
    return { pixels, minX, maxX, minY, maxY };
  };

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (!visited[y * w + x] && data[(y * w + x) * 4] < 64) {
        const b = floodFill(x, y);
        if (b) blobs.push(b);
      }
    }
  }

  const filteredBlobs = blobs.filter((b) => b.pixels.length >= 30);
  if (filteredBlobs.length < 4) { console.log('ERROR: < 4 markers'); return; }

  const centroids = filteredBlobs.map((b, i) => ({
    blob: b, index: i, cx: (b.minX + b.maxX) / 2, cy: (b.minY + b.maxY) / 2
  }));
  const minCx = centroids.reduce((min, c) => Math.min(min, c.cx), Infinity);
  const maxCx = centroids.reduce((max, c) => Math.max(max, c.cx), -Infinity);
  const minCy = centroids.reduce((min, c) => Math.min(min, c.cy), Infinity);
  const maxCy = centroids.reduce((max, c) => Math.max(max, c.cy), -Infinity);

  const extractClosest = (x, y, list) => {
    let minD = Infinity, bestIdx = -1;
    list.forEach((item, idx) => {
      const d = (item.cx - x) ** 2 + (item.cy - y) ** 2;
      if (d < minD) { minD = d; bestIdx = idx; }
    });
    return list.splice(bestIdx, 1)[0];
  };

  const tlDot = extractClosest(minCx, minCy, centroids);
  const trDot = extractClosest(maxCx, minCy, centroids);
  const blDot = extractClosest(minCx, maxCy, centroids);
  const brDot = extractClosest(maxCx, maxCy, centroids);

  const cellBlobs = Array.from({ length: 9 }, () => Array.from({ length: 10 }, () => []));
  centroids.forEach((item) => {
    const y_top = tlDot.cy + ((item.cx - tlDot.cx) * (trDot.cy - tlDot.cy)) / (trDot.cx - tlDot.cx || 1);
    const y_bottom = blDot.cy + ((item.cx - blDot.cx) * (brDot.cy - blDot.cy)) / (brDot.cx - blDot.cx || 1);
    const x_left = tlDot.cx + ((item.cy - tlDot.cy) * (blDot.cx - tlDot.cx)) / (blDot.cy - tlDot.cy || 1);
    const x_right = trDot.cx + ((item.cy - trDot.cy) * (brDot.cx - trDot.cx)) / (brDot.cy - trDot.cy || 1);
    const px = (item.cx - x_left) / (x_right - x_left || 1);
    const py = (item.cy - y_top) / (y_bottom - y_top || 1);
    const colFrac = (px - 0.0263) / 0.9474;
    const rowFrac = (py - 0.0366) / 0.9323;
    const c = Math.floor(colFrac * 10);
    const r = Math.floor(rowFrac * 9);
    if (c >= 0 && c < 10 && r >= 0 && r < 9) cellBlobs[r][c].push(item.blob);
  });

  const thin = (pixels, minX, maxX, minY, maxY) => {
    const bw = maxX - minX + 3;
    const bh = maxY - minY + 3;
    const grid = new Uint8Array(bw * bh);
    pixels.forEach((p) => {
      const x = Math.floor(p.x - minX) + 1;
      const y = Math.floor(p.y - minY) + 1;
      if (x >= 0 && x < bw && y >= 0 && y < bh) grid[y * bw + x] = 1;
    });
    const skeletonPts = [];
    for (let y = 1; y < bh - 1; y++) {
      for (let x = 1; x < bw - 1; x++) {
        if (grid[y * bw + x] === 1) skeletonPts.push({ x: x - 1 + minX, y: y - 1 + minY });
      }
    }
    return skeletonPts;
  };

  const traceSkeleton = (skeletonPts, minGX, minGY) => {
    if (skeletonPts.length === 0) return [];
    const CELL = 5;
    const grid = new Map();
    const pts = skeletonPts.map((p, i) => ({ ...p, idx: i }));
    const active = new Uint8Array(pts.length).fill(1);
    const cellKey = (p) => Math.floor((p.x - minGX) / CELL) * 1000003 + Math.floor((p.y - minGY) / CELL);
    pts.forEach((p, i) => { const k = cellKey(p); if(grid.has(k)) grid.get(k).push(i); else grid.set(k, [i]); });
    const neighbours = (p, excludeIdx) => {
      const res = [];
      const cx = Math.floor((p.x - minGX) / CELL);
      const cy = Math.floor((p.y - minGY) / CELL);
      for(let dy = -1; dy <= 1; dy++) for(let dx = -1; dx <= 1; dx++) {
        const bucket = grid.get((cx+dx)*1000003 + (cy+dy));
        if(bucket) for(let j of bucket) if(j !== excludeIdx && active[j]) res.push(j);
      }
      return res;
    };
    const strokes = [];
    for (let i = 0; i < pts.length; i++) {
      if (!active[i]) continue;
      const stroke = [];
      let curIdx = i;
      while (curIdx !== -1) {
        const cur = pts[curIdx];
        stroke.push({ x: cur.x, y: cur.y });
        active[curIdx] = 0;
        const bucket = grid.get(cellKey(cur)); if(bucket) { const pos = bucket.indexOf(curIdx); if(pos!==-1) bucket.splice(pos, 1); }
        const nbrs = neighbours(cur, curIdx);
        if (nbrs.length === 0) break;
        let bestJ = -1, bestD = Infinity;
        for(let j of nbrs) {
          const d = (pts[j].x - cur.x)**2 + (pts[j].y - cur.y)**2;
          if(d < bestD) { bestD = d; bestJ = j; }
        }
        curIdx = bestJ;
      }
      if(stroke.length >= 2) strokes.push(stroke);
      else if(stroke.length === 1) strokes.push([stroke[0], {x: stroke[0].x+0.1, y: stroke[0].y+0.1}]);
    }
    return strokes;
  };

  const ALL_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,!?@#$%&*+-=()[]{}<>\\\'"~/|'.split('');
  const glyphMap = {};
  
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 10; c++) {
      const idx = r * 10 + c;
      if (idx >= ALL_CHARS.length) continue;
      const cellBlobsList = cellBlobs[r][c];
      if (cellBlobsList.length === 0) continue;
      
      const allPixels = [];
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      cellBlobsList.forEach(b => {
        minX = Math.min(minX, b.minX); maxX = Math.max(maxX, b.maxX);
        minY = Math.min(minY, b.minY); maxY = Math.max(maxY, b.maxY);
        b.pixels.forEach(p => allPixels.push(p));
      });
      const skeletonPts = thin(allPixels, minX, maxX, minY, maxY);
      const rawStrokes = traceSkeleton(skeletonPts, minX, minY);
      
      const strokes = [];
      rawStrokes.forEach((stroke) => {
        const normalized = stroke.map(p => {
          const y_top = tlDot.cy + ((p.x - tlDot.cx) * (trDot.cy - tlDot.cy)) / (trDot.cx - tlDot.cx || 1);
          const y_bottom = blDot.cy + ((p.x - blDot.cx) * (brDot.cy - blDot.cy)) / (brDot.cx - blDot.cx || 1);
          const x_left = tlDot.cx + ((p.y - tlDot.cy) * (blDot.cx - tlDot.cx)) / (blDot.cy - tlDot.cy || 1);
          const x_right = trDot.cx + ((p.y - trDot.cy) * (brDot.cx - trDot.cx)) / (brDot.cy - trDot.cy || 1);
          const px = (p.x - x_left) / (x_right - x_left || 1);
          const py = (p.y - y_top) / (y_bottom - y_top || 1);
          const colFrac = (px - 0.0263) / 0.9474;
          const rowFrac = (py - 0.0366) / 0.9323;
          return { x: ((colFrac * 10) - c) * 500, y: ((rowFrac * 9) - r) * 500 };
        });
        if (normalized.length > 0) {
          const isPrePrintedLabel = normalized.every(p => p.x < 75 && p.y < 75);
          if (!isPrePrintedLabel) strokes.push(normalized);
        }
      });
      if (strokes.length > 0) glyphMap[ALL_CHARS[idx]] = strokes;
    }
  }

  console.log('Final Extracted Glyphs:', Object.keys(glyphMap).length);
  if (Object.keys(glyphMap).length > 0) {
    const firstChar = Object.keys(glyphMap)[0];
    console.log(`Bounds for ${firstChar}:`);
    const strokes = glyphMap[firstChar];
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    strokes.forEach(s => s.forEach(p => {
      minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x);
      minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y);
    }));
    console.log(`X: ${minX} to ${maxX}, Y: ${minY} to ${maxY}`);
  }
}
test().catch(console.error);
