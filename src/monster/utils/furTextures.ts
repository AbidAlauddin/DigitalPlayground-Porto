import * as THREE from 'three';

let cachedBumpTexture: THREE.CanvasTexture | null = null;
const cachedShellTextures = new Map<string, THREE.CanvasTexture>();

/**
 * Generates a tileable procedural fur bump texture with fine directional strokes
 * to give stylized 3D models a soft, tactile plush-fur surface without external image overhead.
 */
export function getFurBumpTexture(): THREE.CanvasTexture {
  if (cachedBumpTexture) return cachedBumpTexture;

  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    ctx.fillStyle = '#808080';
    ctx.fillRect(0, 0, size, size);

    // Deterministic pseudo-random generator for reproducible fur grain
    let seed = 1337;
    const rand = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };

    // Draw layered soft fur wisps (wrapped seamlessly across edges)
    for (let i = 0; i < 2400; i++) {
      const x = rand() * size;
      const y = rand() * size;
      const len = 5 + rand() * 11;
      const angle = Math.PI * 0.5 + (rand() - 0.5) * 0.55;
      const shade = Math.floor(90 + rand() * 140);
      const alpha = 0.25 + rand() * 0.45;

      ctx.strokeStyle = `rgba(${shade}, ${shade}, ${shade}, ${alpha})`;
      ctx.lineWidth = 0.8 + rand() * 1.1;
      ctx.lineCap = 'round';

      const dx = Math.cos(angle) * len;
      const dy = Math.sin(angle) * len;

      // Wrap across tile boundaries
      for (const ox of [-size, 0, size]) {
        for (const oy of [-size, 0, size]) {
          const sx = x + ox;
          const sy = y + oy;
          if (sx >= -20 && sx <= size + 20 && sy >= -20 && sy <= size + 20) {
            ctx.beginPath();
            ctx.moveTo(sx, sy);
            ctx.lineTo(sx + dx, sy + dy);
            ctx.stroke();
          }
        }
      }
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 4);
  texture.needsUpdate = true;

  cachedBumpTexture = texture;
  return texture;
}

/**
 * Generates a tileable alpha mask for multi-layer shell texturing fur.
 * Higher layerIndex values produce sparser, finer tips so the fur tapers naturally.
 */
export function getFurShellAlphaTexture(layerIndex: number, totalLayers: number): THREE.CanvasTexture {
  const key = `${layerIndex}_${totalLayers}`;
  const existing = cachedShellTextures.get(key);
  if (existing) return existing;

  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, size, size);

    // Same seed across layers so strands align vertically from root to tip
    let seed = 42069;
    const rand = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };

    const h = (layerIndex + 1) / totalLayers; // 0.2 .. 1.0
    const strandCount = 3400;

    for (let i = 0; i < strandCount; i++) {
      const x = rand() * size;
      const y = rand() * size;
      const strandHeight = 0.28 + rand() * 0.72; // random hair lengths
      const baseRadius = 1.6 + rand() * 2.0;

      // Only draw strands tall enough to reach this shell layer
      if (strandHeight >= h) {
        const taper = 1 - (h / strandHeight) * 0.72;
        const radius = Math.max(0.55, baseRadius * taper);
        const brightness = Math.floor(195 + rand() * 60);

        ctx.fillStyle = `rgb(${brightness}, ${brightness}, ${brightness})`;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(5, 5);
  texture.needsUpdate = true;

  cachedShellTextures.set(key, texture);
  return texture;
}
