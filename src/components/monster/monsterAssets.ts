/**
 * monsterAssets.ts
 * 
 * Explicit asset mapping and asset preloader/normalizer for MainMonster.
 * Maps exact paths in public/monsters/main-monster/ for blinking and waving frames.
 */

export const MONSTER_ASSETS = {
  blinking: {
    open: '/monsters/main-monster/blinking/1open-eyes.webp',
    close: '/monsters/main-monster/blinking/2close-eyes.webp',
    wink: '/monsters/main-monster/blinking/3wink-eyes.webp',
    wide: '/monsters/main-monster/blinking/4wide-eyes.webp',
  },
  waving: [
    '/monsters/main-monster/waving/1-iddle.webp',
    '/monsters/main-monster/waving/2-waving.webp',
    '/monsters/main-monster/waving/3-waving.webp',
    '/monsters/main-monster/waving/4-waving.webp',
    '/monsters/main-monster/waving/5-waving.webp',
    '/monsters/main-monster/waving/6-afterwaving.webp',
  ],
  happy: '/monsters/main-monster/waving/7-happy.webp',
} as const;

export type EyeFrameKey = 'open' | 'close' | 'wink' | 'wide';

export interface MonsterFrameInfo {
  key: string;
  src: string;
}

// Flat list of all 11 frames for preloading and decoding
export const ALL_MONSTER_FRAMES: MonsterFrameInfo[] = [
  { key: 'blink_open', src: MONSTER_ASSETS.blinking.open },
  { key: 'blink_close', src: MONSTER_ASSETS.blinking.close },
  { key: 'blink_wink', src: MONSTER_ASSETS.blinking.wink },
  { key: 'blink_wide', src: MONSTER_ASSETS.blinking.wide },
  { key: 'wave_0', src: MONSTER_ASSETS.waving[0] },
  { key: 'wave_1', src: MONSTER_ASSETS.waving[1] },
  { key: 'wave_2', src: MONSTER_ASSETS.waving[2] },
  { key: 'wave_3', src: MONSTER_ASSETS.waving[3] },
  { key: 'wave_4', src: MONSTER_ASSETS.waving[4] },
  { key: 'wave_5', src: MONSTER_ASSETS.waving[5] },
  { key: 'happy', src: MONSTER_ASSETS.happy },
];

/**
 * In-memory cache for processed canvas frames (transparent & aligned)
 */
const frameCanvasCache = new Map<string, HTMLCanvasElement>();
let preloadingPromise: Promise<void> | null = null;

// Target canvas dimensions
const CANVAS_SIZE = 500;
const TARGET_FEET_Y = 460;
const TARGET_CENTER_X = 250;
const TARGET_HEIGHT = 380;

/**
 * Normalizes a raw image onto a 500x500 canvas:
 * 1. Flood-fills border checkerboard neutral pixels to transparent (alpha = 0).
 * 2. Finds the monster's tight bounding box.
 * 3. Scales and aligns the monster so that feet baseline and center-X match across all frames.
 */
function processImageToCanvas(img: HTMLImageElement, key: string): HTMLCanvasElement {
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = img.naturalWidth || img.width;
  tempCanvas.height = img.naturalHeight || img.height;
  const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });

  if (!tempCtx) {
    const fallbackCanvas = document.createElement('canvas');
    fallbackCanvas.width = CANVAS_SIZE;
    fallbackCanvas.height = CANVAS_SIZE;
    const fCtx = fallbackCanvas.getContext('2d');
    fCtx?.drawImage(img, 0, 0, CANVAS_SIZE, CANVAS_SIZE);
    return fallbackCanvas;
  }

  tempCtx.drawImage(img, 0, 0);
  const imgData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
  const data = imgData.data;
  const w = tempCanvas.width;
  const h = tempCanvas.height;

  // BFS flood-fill from border pixels to remove neutral checkerboard / background
  const visited = new Uint8Array(w * h);
  const queue: number[] = [];

  const isBackgroundPixel = (idx: number): boolean => {
    const r = data[idx];
    const g = data[idx + 1];
    const b = data[idx + 2];
    
    // Check neutral checkerboard (gray/white tones)
    const isNeutral =
      Math.abs(r - g) < 16 &&
      Math.abs(r - b) < 16 &&
      Math.abs(g - b) < 16 &&
      r > 190;
      
    // For wide-eyes jpeg, also handle dark corner vignette
    const isDarkVignette = key === 'blink_wide' && r < 75 && g < 75 && b < 75;

    return isNeutral || isDarkVignette;
  };

  // Add all 4 borders to queue
  for (let x = 0; x < w; x++) {
    const topIdx = (0 * w + x) * 4;
    const botIdx = ((h - 1) * w + x) * 4;
    if (isBackgroundPixel(topIdx)) {
      queue.push(0 * w + x);
      visited[0 * w + x] = 1;
    }
    if (isBackgroundPixel(botIdx)) {
      queue.push((h - 1) * w + x);
      visited[(h - 1) * w + x] = 1;
    }
  }

  for (let y = 0; y < h; y++) {
    const leftIdx = (y * w + 0) * 4;
    const rightIdx = (y * w + (w - 1)) * 4;
    if (isBackgroundPixel(leftIdx) && !visited[y * w + 0]) {
      queue.push(y * w + 0);
      visited[y * w + 0] = 1;
    }
    if (isBackgroundPixel(rightIdx) && !visited[y * w + (w - 1)]) {
      queue.push(y * w + (w - 1));
      visited[y * w + (w - 1)] = 1;
    }
  }

  // Execute BFS
  let head = 0;
  while (head < queue.length) {
    const p = queue[head++];
    const py = Math.floor(p / w);
    const px = p % w;

    // Set pixel to transparent
    data[p * 4 + 3] = 0;

    const neighbors = [
      py > 0 ? (py - 1) * w + px : -1,
      py < h - 1 ? (py + 1) * w + px : -1,
      px > 0 ? py * w + (px - 1) : -1,
      px < w - 1 ? py * w + (px + 1) : -1,
    ];

    for (const np of neighbors) {
      if (np !== -1 && !visited[np]) {
        visited[np] = 1;
        if (isBackgroundPixel(np * 4)) {
          queue.push(np);
        }
      }
    }
  }

  tempCtx.putImageData(imgData, 0, 0);

  // Find monster bounding box
  let minX = w, maxX = 0, minY = h, maxY = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const a = data[(y * w + x) * 4 + 3];
      if (a > 50) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  // Destination unified canvas
  const canvas = document.createElement('canvas');
  canvas.width = CANVAS_SIZE;
  canvas.height = CANVAS_SIZE;
  const ctx = canvas.getContext('2d');

  if (!ctx || minX > maxX || minY > maxY) {
    return tempCanvas;
  }

  const monsterW = maxX - minX + 1;
  const monsterH = maxY - minY + 1;

  // Scale monster to uniform TARGET_HEIGHT
  const scale = TARGET_HEIGHT / monsterH;
  const drawW = monsterW * scale;
  const drawH = monsterH * scale;

  // Center horizontally and align feet baseline vertically
  const destX = TARGET_CENTER_X - drawW / 2;
  const destY = TARGET_FEET_Y - drawH;

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(
    tempCanvas,
    minX, minY, monsterW, monsterH,
    destX, destY, drawW, drawH
  );

  return canvas;
}

/**
 * Preloads and decodes all monster frames, generating transparent aligned canvases.
 */
export function preloadMonsterAssets(): Promise<void> {
  if (preloadingPromise) return preloadingPromise;

  preloadingPromise = new Promise((resolve) => {
    let loadedCount = 0;
    const total = ALL_MONSTER_FRAMES.length;

    ALL_MONSTER_FRAMES.forEach(({ key, src }) => {
      const img = new Image();
      img.src = src;

      const handleLoaded = () => {
        try {
          const processed = processImageToCanvas(img, key);
          frameCanvasCache.set(key, processed);
        } catch {
          // Fallback handled gracefully
        }
        loadedCount++;
        if (loadedCount >= total) resolve();
      };

      if (img.complete && img.naturalWidth > 0) {
        handleLoaded();
      } else {
        img.onload = () => {
          if (img.decode) {
            img.decode().then(handleLoaded).catch(handleLoaded);
          } else {
            handleLoaded();
          }
        };
        img.onerror = () => {
          loadedCount++;
          if (loadedCount >= total) resolve();
        };
      }
    });
  });

  return preloadingPromise;
}

/**
 * Retrieves processed transparent canvas for a given frame key.
 */
export function getProcessedMonsterCanvas(key: string): HTMLCanvasElement | null {
  return frameCanvasCache.get(key) || null;
}
