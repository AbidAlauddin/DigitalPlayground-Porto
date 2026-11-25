import * as THREE from 'three';

let cachedBadgeTexture: THREE.CanvasTexture | null = null;
let cachedDocTexture: THREE.CanvasTexture | null = null;
let cachedStampedDocTexture: THREE.CanvasTexture | null = null;
let cachedSealTexture: THREE.CanvasTexture | null = null;

/**
 * Generates the miniature staff badge ("ARCHIVIST") texture
 */
export function getArchivistBadgeTexture(): THREE.CanvasTexture {
  if (cachedBadgeTexture) return cachedBadgeTexture;

  const w = 256;
  const h = 360;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    // Card background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, w, h);

    // Subtle edge border
    ctx.strokeStyle = '#CBD5E1';
    ctx.lineWidth = 4;
    ctx.strokeRect(4, 4, w - 8, h - 8);

    // Header bar (Teal)
    ctx.fillStyle = '#0F766E';
    ctx.fillRect(4, 4, w - 8, 56);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 22px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('OFFICE KEEPER', w / 2, 40);

    // Lanyard slot punch
    ctx.fillStyle = '#64748B';
    ctx.beginPath();
    ctx.roundRect(w / 2 - 24, 10, 48, 12, 6);
    ctx.fill();

    // Photo Box
    const photoX = 40;
    const photoY = 76;
    const photoW = 176;
    const photoH = 150;
    ctx.fillStyle = '#F1F5F9';
    ctx.fillRect(photoX, photoY, photoW, photoH);
    ctx.strokeStyle = '#94A3B8';
    ctx.lineWidth = 2;
    ctx.strokeRect(photoX, photoY, photoW, photoH);

    // Mascot portrait silhouette
    ctx.fillStyle = '#0D9488';
    ctx.beginPath();
    // Head circle
    ctx.arc(w / 2, photoY + 65, 42, 0, Math.PI * 2);
    ctx.fill();
    // Newsboy cap visor silhouette
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.ellipse(w / 2, photoY + 40, 46, 18, 0, 0, Math.PI * 2);
    ctx.fill();
    // Cute smile
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(w / 2, photoY + 74, 14, 0.2, Math.PI - 0.2);
    ctx.stroke();

    // Body shoulders in photo
    ctx.fillStyle = '#0F766E';
    ctx.beginPath();
    ctx.ellipse(w / 2, photoY + 155, 60, 40, 0, Math.PI, Math.PI * 2);
    ctx.fill();

    // Role Title: "ARCHIVIST"
    ctx.fillStyle = '#0F766E';
    ctx.font = '900 32px system-ui, -apple-system, sans-serif';
    ctx.fillText('ARCHIVIST', w / 2, 268);

    // Subtext
    ctx.fillStyle = '#64748B';
    ctx.font = '600 16px monospace';
    ctx.fillText('ID: 04-EXP-2026', w / 2, 296);

    // Barcode lines at bottom
    ctx.fillStyle = '#1E293B';
    const barY = 316;
    const barH = 26;
    let curX = 36;
    const pattern = [3, 2, 5, 2, 4, 3, 2, 6, 2, 3, 5, 2, 3, 4, 2, 5, 3, 2, 4, 3, 2, 5, 2];
    for (const pw of pattern) {
      ctx.fillRect(curX, barY, pw, barH);
      curX += pw + 3;
      if (curX > w - 36) break;
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  texture.needsUpdate = true;
  cachedBadgeTexture = texture;
  return texture;
}

/**
 * Generates the career milestone paper document sheet texture
 */
export function getDocumentTexture(withStamp = false): THREE.CanvasTexture {
  if (withStamp && cachedStampedDocTexture) return cachedStampedDocTexture;
  if (!withStamp && cachedDocTexture) return cachedDocTexture;

  const w = 512;
  const h = 680;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    // Parchment white page
    ctx.fillStyle = '#FAFAF9';
    ctx.fillRect(0, 0, w, h);

    // Border
    ctx.strokeStyle = '#E7E5E4';
    ctx.lineWidth = 3;
    ctx.strokeRect(16, 16, w - 32, h - 32);

    // Document header
    ctx.fillStyle = '#1C1917';
    ctx.font = 'bold 26px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('CAREER ARCHIVE RECORD', 44, 65);

    ctx.fillStyle = '#0D9488';
    ctx.font = 'bold 15px monospace';
    ctx.fillText('SEC-04 // 2022 — PRESENT', 44, 92);

    ctx.strokeStyle = '#0D9488';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(44, 106);
    ctx.lineTo(w - 44, 106);
    ctx.stroke();

    // Section 1: Lead Interactive Architect
    ctx.fillStyle = '#292524';
    ctx.font = 'bold 20px system-ui, -apple-system, sans-serif';
    ctx.fillText('1. Interactive Systems Architect', 44, 145);

    // Lined placeholder text bars
    ctx.fillStyle = '#CBD5E1';
    for (let i = 0; i < 4; i++) {
      const lineY = 168 + i * 18;
      const lw = i === 3 ? 240 : w - 88;
      ctx.fillRect(44, lineY, lw, 7);
    }

    // Section 2: Full-Stack Engineering
    ctx.fillStyle = '#292524';
    ctx.font = 'bold 20px system-ui, -apple-system, sans-serif';
    ctx.fillText('2. Production Core Engineering', 44, 275);

    for (let i = 0; i < 4; i++) {
      const lineY = 298 + i * 18;
      const lw = i === 3 ? 280 : w - 88;
      ctx.fillRect(44, lineY, lw, 7);
    }

    // Section 3: Performance & Mentorship
    ctx.fillStyle = '#292524';
    ctx.font = 'bold 20px system-ui, -apple-system, sans-serif';
    ctx.fillText('3. Technical Leadership & Scale', 44, 405);

    for (let i = 0; i < 4; i++) {
      const lineY = 428 + i * 18;
      const lw = i === 3 ? 220 : w - 88;
      ctx.fillRect(44, lineY, lw, 7);
    }

    // Official approval signature line
    ctx.strokeStyle = '#78716C';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(44, 580);
    ctx.lineTo(240, 580);
    ctx.stroke();

    ctx.fillStyle = '#78716C';
    ctx.font = '14px monospace';
    ctx.fillText('VERIFIED ARCHIVIST SIGNATURE', 44, 602);

    if (withStamp) {
      // Circular "ARCHIVED ★ VERIFIED" red stamp mark
      ctx.save();
      ctx.translate(360, 545);
      ctx.rotate(-0.16); // Playful slight slant

      ctx.strokeStyle = '#DC2626';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(0, 0, 72, 0, Math.PI * 2);
      ctx.stroke();

      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, 62, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = '#DC2626';
      ctx.font = '900 17px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('ARCHIVED', 0, -22);

      ctx.font = 'bold 22px system-ui';
      ctx.fillText('★ ★ ★', 0, 4);

      ctx.font = '900 16px monospace';
      ctx.fillText('VERIFIED', 0, 30);

      ctx.font = 'bold 12px monospace';
      ctx.fillText('SEC-04 OK', 0, 48);

      ctx.restore();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  texture.needsUpdate = true;
  if (withStamp) {
    cachedStampedDocTexture = texture;
  } else {
    cachedDocTexture = texture;
  }
  return texture;
}

/**
 * Generates the circular red stamp seal texture for 3D overlay
 */
export function getStampSealTexture(): THREE.CanvasTexture {
  if (cachedSealTexture) return cachedSealTexture;

  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    ctx.clearRect(0, 0, size, size);

    ctx.strokeStyle = '#DC2626';
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, 105, 0, Math.PI * 2);
    ctx.stroke();

    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, 92, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#DC2626';
    ctx.font = '900 24px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('ARCHIVED', size / 2, size / 2 - 28);

    ctx.font = 'bold 30px system-ui';
    ctx.fillText('★ ★ ★', size / 2, size / 2 + 10);

    ctx.font = '900 22px monospace';
    ctx.fillText('VERIFIED', size / 2, size / 2 + 46);

    ctx.font = 'bold 16px monospace';
    ctx.fillText('PASS', size / 2, size / 2 + 72);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  cachedSealTexture = texture;
  return texture;
}
