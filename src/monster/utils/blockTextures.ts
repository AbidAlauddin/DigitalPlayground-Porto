import * as THREE from 'three';

const cachedBlockTextures = new Map<string, THREE.CanvasTexture>();

/**
 * Generates a crisp, toy-like matte block face texture with rounded inner border
 * and clean bold technology label (e.g. "PHP", "Laravel", "React", "TS").
 */
export function getTechBlockTexture(
  label: string,
  bgColor: string,
  textColor = '#FFFFFF'
): THREE.CanvasTexture {
  const key = `${label}_${bgColor}_${textColor}`;
  const existing = cachedBlockTextures.get(key);
  if (existing) return existing;

  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    // Base matte toy block fill
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, size, size);

    // Subtle soft bevel highlight frame for tactile toy-block feel
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
    ctx.lineWidth = 10;
    ctx.strokeRect(14, 14, size - 28, size - 28);

    // Subtle inner shadow edge
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.lineWidth = 4;
    ctx.strokeRect(22, 22, size - 44, size - 44);

    // Bold readable technology label
    const fontSize = label.length > 5 ? 46 : label.length > 3 ? 58 : 74;
    ctx.fillStyle = textColor;
    ctx.font = `800 ${fontSize}px "Plus Jakarta Sans", system-ui, -apple-system, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, size / 2, size / 2 + 2);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  texture.needsUpdate = true;

  cachedBlockTextures.set(key, texture);
  return texture;
}

let cachedSleepZTexture: THREE.CanvasTexture | null = null;

/**
 * Generates a soft, minimalist floating "Z" sprite texture for the sleeping monster indicator.
 */
export function getSleepZTexture(): THREE.CanvasTexture {
  if (cachedSleepZTexture) return cachedSleepZTexture;

  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    ctx.clearRect(0, 0, size, size);
    ctx.fillStyle = '#0F766E';
    ctx.font = '800 84px "Plus Jakarta Sans", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Z', size / 2, size / 2 + 4);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;

  cachedSleepZTexture = texture;
  return texture;
}
