import { createCanvas } from 'canvas';
import { writeFileSync } from 'fs';

function generateIcon(size, outputPath) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Background: ocean gradient
  const grad = ctx.createLinearGradient(0, 0, 0, size);
  grad.addColorStop(0, '#0c4a6e');   // sky-900
  grad.addColorStop(0.6, '#075985'); // sky-800
  grad.addColorStop(1, '#0369a1');   // sky-700
  ctx.fillStyle = grad;

  // Rounded rect
  const r = size * 0.15;
  ctx.beginPath();
  ctx.moveTo(r, 0);
  ctx.lineTo(size - r, 0);
  ctx.quadraticCurveTo(size, 0, size, r);
  ctx.lineTo(size, size - r);
  ctx.quadraticCurveTo(size, size, size - r, size);
  ctx.lineTo(r, size);
  ctx.quadraticCurveTo(0, size, 0, size - r);
  ctx.lineTo(0, r);
  ctx.quadraticCurveTo(0, 0, r, 0);
  ctx.closePath();
  ctx.fill();

  // Water waves at the bottom
  ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  ctx.lineWidth = size * 0.015;
  for (let w = 0; w < 3; w++) {
    const y = size * (0.72 + w * 0.08);
    ctx.beginPath();
    for (let x = 0; x <= size; x += 2) {
      const waveY = y + Math.sin((x / size) * Math.PI * 3 + w) * size * 0.02;
      if (x === 0) ctx.moveTo(x, waveY);
      else ctx.lineTo(x, waveY);
    }
    ctx.stroke();
  }

  const cx = size * 0.48;
  const baseY = size * 0.68;

  // Mast
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = size * 0.02;
  ctx.beginPath();
  ctx.moveTo(cx, size * 0.18);
  ctx.lineTo(cx, baseY);
  ctx.stroke();

  // Main sail (triangle)
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.beginPath();
  ctx.moveTo(cx, size * 0.2);
  ctx.lineTo(cx + size * 0.25, baseY - size * 0.05);
  ctx.lineTo(cx, baseY - size * 0.03);
  ctx.closePath();
  ctx.fill();

  // Jib (front sail)
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.beginPath();
  ctx.moveTo(cx, size * 0.22);
  ctx.lineTo(cx - size * 0.15, baseY - size * 0.05);
  ctx.lineTo(cx, baseY - size * 0.05);
  ctx.closePath();
  ctx.fill();

  // Hull
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(cx - size * 0.22, baseY);
  ctx.lineTo(cx + size * 0.28, baseY);
  ctx.lineTo(cx + size * 0.2, baseY + size * 0.07);
  ctx.lineTo(cx - size * 0.15, baseY + size * 0.07);
  ctx.closePath();
  ctx.fill();

  const buf = canvas.toBuffer('image/png');
  writeFileSync(outputPath, buf);
  console.log(`Created ${outputPath} (${size}x${size})`);
}

generateIcon(192, 'public/icons/icon-192.png');
generateIcon(512, 'public/icons/icon-512.png');
