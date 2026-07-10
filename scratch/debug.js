const fs = require('fs');
const { createCanvas, loadImage } = require('canvas');

async function test() {
  const imgPath = 'C:/Users/deepi/.gemini/antigravity-ide/brain/e5fa569d-2509-4a16-bd0b-41bd6bd7fb9b/media__1783174965447.png';
  const img = await loadImage(imgPath);
  
  const MAX_PROCESS_DIM = 1200;
  const scale = Math.min(1, MAX_PROCESS_DIM / Math.max(img.width, img.height));
  const canvas = createCanvas(Math.round(img.width * scale), Math.round(img.height * scale));
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  
  let minGray = 255;
  let maxGray = 0;
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
    const stretched = Math.round(((grays[i >> 2] - minGray) / range) * 255);
    data[i] = data[i + 1] = data[i + 2] = stretched;
    data[i + 3] = 255;
  }

  const hist = new Int32Array(256);
  for (let i = 0; i < data.length; i += 4) hist[data[i]]++;

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

  for (let i = 0; i < data.length; i += 4) {
    const val = data[i] < threshold ? 0 : 255;
    data[i] = data[i + 1] = data[i + 2] = val;
  }

  ctx.putImageData(imageData, 0, 0);

  // Debug: Save thresholded image
  fs.writeFileSync('scratch/thresholded.png', canvas.toBuffer('image/png'));
  console.log('Thresholded image saved.');
  console.log('Threshold was:', threshold);

  const w = canvas.width;
  const h = canvas.height;
  const visited = new Uint8Array(w * h);
  const blobs = [];

  const minBlobSize = Math.max(15, Math.floor(w * h * 0.00005));
  const maxBlobSize = Math.floor(w * h * 0.05);

  const getPixel = (x, y) => data[(y * w + x) * 4];

  const floodFill = (startX, startY) => {
    const stack = [{ x: startX, y: startY }];
    const pixels = [];
    let minX = startX, maxX = startX, minY = startY, maxY = startY;

    while (stack.length > 0) {
      const { x, y } = stack.pop();
      if (x < 0 || x >= w || y < 0 || y >= h) continue;
      const idx = y * w + x;
      if (visited[idx] || getPixel(x, y) > 64) continue;

      visited[idx] = 1;
      pixels.push({ x, y });

      if (pixels.length > maxBlobSize) {
        while (stack.length > 0) {
          const p = stack.pop();
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

  console.log('Total raw blobs detected:', blobs.length);
  const filteredBlobs = blobs.filter((b) => b.pixels.length >= 30);
  console.log('Total blobs >= 30 pixels:', filteredBlobs.length);

  const centroids = filteredBlobs.map((b, i) => ({
    blob: b,
    index: i,
    cx: (b.minX + b.maxX) / 2,
    cy: (b.minY + b.maxY) / 2,
  }));

  const minCx = centroids.reduce((min, c) => Math.min(min, c.cx), Infinity);
  const maxCx = centroids.reduce((max, c) => Math.max(max, c.cx), -Infinity);
  const minCy = centroids.reduce((min, c) => Math.min(min, c.cy), Infinity);
  const maxCy = centroids.reduce((max, c) => Math.max(max, c.cy), -Infinity);

  const extractClosest = (x, y, list) => {
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

  const tlDot = extractClosest(minCx, minCy, centroids);
  const trDot = extractClosest(maxCx, minCy, centroids);
  const blDot = extractClosest(minCx, maxCy, centroids);
  const brDot = extractClosest(maxCx, maxCy, centroids);
  
  console.log('Corners:', { 
    tl: { cx: tlDot?.cx, cy: tlDot?.cy },
    tr: { cx: trDot?.cx, cy: trDot?.cy },
    bl: { cx: blDot?.cx, cy: blDot?.cy },
    br: { cx: brDot?.cx, cy: brDot?.cy },
  });

  // Debug: draw circles on the corners
  ctx.fillStyle = 'red';
  const drawCorner = (dot) => {
    if (!dot) return;
    ctx.beginPath();
    ctx.arc(dot.cx, dot.cy, 15, 0, 2 * Math.PI);
    ctx.fill();
  }
  drawCorner(tlDot); drawCorner(trDot); drawCorner(blDot); drawCorner(brDot);

  fs.writeFileSync('scratch/corners.png', canvas.toBuffer('image/png'));
  console.log('Corners image saved.');

}

test().catch(console.error);
