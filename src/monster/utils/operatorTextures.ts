import * as THREE from 'three';

let cachedOperatorBadgeTexture: THREE.CanvasTexture | null = null;

/**
 * Generates the miniature staff ID badge ("PROJECT OPERATOR") texture
 * for Section 05 — The Showcase Operator.
 */
export function getOperatorBadgeTexture(): THREE.CanvasTexture {
  if (cachedOperatorBadgeTexture) return cachedOperatorBadgeTexture;

  const w = 256;
  const h = 360;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    // Clean warm-white card background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, w, h);

    // Subtle card border
    ctx.strokeStyle = '#CBD5E1';
    ctx.lineWidth = 4;
    ctx.strokeRect(4, 4, w - 8, h - 8);

    // Header bar (Deep Teal)
    ctx.fillStyle = '#0F766E';
    ctx.fillRect(4, 4, w - 8, 60);

    // Lanyard slot punch
    ctx.fillStyle = '#E2E8F0';
    ctx.beginPath();
    ctx.roundRect(w / 2 - 22, 10, 44, 10, 5);
    ctx.fill();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 18px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('SHOWCASE OPS', w / 2, 48);

    // Portrait frame
    const photoX = 44;
    const photoY = 80;
    const photoW = 168;
    const photoH = 142;
    ctx.fillStyle = '#F0FDFA';
    ctx.fillRect(photoX, photoY, photoW, photoH);
    ctx.strokeStyle = '#99F6E4';
    ctx.lineWidth = 2;
    ctx.strokeRect(photoX, photoY, photoW, photoH);

    // Mascot silhouette with operator headset
    ctx.fillStyle = '#0D9488';
    ctx.beginPath();
    ctx.arc(w / 2, photoY + 68, 38, 0, Math.PI * 2);
    ctx.fill();

    // Headset band & ear cups
    ctx.strokeStyle = '#1E293B';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(w / 2, photoY + 66, 44, Math.PI * 1.05, Math.PI * 1.95);
    ctx.stroke();

    ctx.fillStyle = '#1E293B';
    ctx.fillRect(w / 2 - 50, photoY + 56, 12, 24);
    ctx.fillRect(w / 2 + 38, photoY + 56, 12, 24);

    // Eyes
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(w / 2 - 14, photoY + 62, 7, 0, Math.PI * 2);
    ctx.arc(w / 2 + 14, photoY + 62, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#141316';
    ctx.beginPath();
    ctx.arc(w / 2 - 14, photoY + 62, 3.5, 0, Math.PI * 2);
    ctx.arc(w / 2 + 14, photoY + 62, 3.5, 0, Math.PI * 2);
    ctx.fill();

    // Role title: PROJECT OPERATOR
    ctx.fillStyle = '#0F172A';
    ctx.font = 'bold 20px system-ui, -apple-system, sans-serif';
    ctx.fillText('PROJECT', w / 2, 256);
    ctx.fillStyle = '#0F766E';
    ctx.font = 'bold 21px system-ui, -apple-system, sans-serif';
    ctx.fillText('OPERATOR', w / 2, 282);

    // Subtle barcode lines
    ctx.fillStyle = '#64748B';
    for (let i = 0; i < 18; i++) {
      const bx = 52 + i * 8.5;
      const bw = i % 3 === 0 ? 4 : 2;
      ctx.fillRect(bx, 304, bw, 28);
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  cachedOperatorBadgeTexture = tex;
  return tex;
}
