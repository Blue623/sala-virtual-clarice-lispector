/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type WindowPhotoPresetId = 'copacabana_view' | 'clarice_photo_4' | 'aerial_leme';

export interface WindowPhotoPreset {
  id: WindowPhotoPresetId;
  title: string;
  subtitle: string;
  source: string;
  badge: string;
  description: string;
}

export const WINDOW_PHOTO_PRESETS: WindowPhotoPreset[] = [
  {
    id: 'copacabana_view',
    title: 'A Curva de Copacabana & Morro do Leme',
    subtitle: 'Fotografia da Janela de Clarice • Rua Gustavo Sampaio, Leme',
    source: 'Registro Fotográfico Memorial',
    badge: 'Vista da Janela',
    description:
      'A vista exata que inspirava Clarice ao olhar pela janela de seu gabinete: o Morro do Leme com suas falésias de granito e mata nativa à direita, as ondas espumosas do Atlântico, e a clássica curva em crescente da praia de Copacabana até o Arpoador.'
  },
  {
    id: 'clarice_photo_4',
    title: 'Clarice Diante da Janela do Leme (Foto #4)',
    subtitle: 'Fotografia Histórica de Maureen Bisilliat (1970) • Acervo Instituto Moreira Salles',
    source: 'Acervo IMS / Maureen Bisilliat',
    badge: 'Foto #4 do Acervo',
    description:
      'O célebre retrato de Clarice Lispector em preto e branco diante da janela aberta para Copacabana. Clarice segura seu cigarro pensativa ao lado da máquina Olympia e de seus manuscritos, com a curva do mar ao fundo.'
  },
  {
    id: 'aerial_leme',
    title: 'Fotografia Panorâmica Aérea da Orla',
    subtitle: 'O Leme, a Ilha de Cotunduba e os Navios no Oceano',
    source: 'Perspectiva Aérea Costeira',
    badge: 'Vista Aérea',
    description:
      'Vista aérea ampla de toda a enseada do Leme e Copacabana, revelando a geografia monumental do Rio de Janeiro: o Forte Duque de Caxias no Morro do Leme, o calçadão de ondas e os navios cargueiros ancorados no oceano.'
  }
];

/**
 * Procedural Film Grain Overlay (Simulating 35mm photographic silver halide)
 */
function applyFilmGrain(ctx: CanvasRenderingContext2D, width: number, height: number, intensity: number = 0.045) {
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;
  const len = data.length;
  for (let i = 0; i < len; i += 4) {
    const noise = (Math.random() - 0.5) * 255 * intensity;
    data[i] = Math.min(255, Math.max(0, data[i] + noise));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
  }
  ctx.putImageData(imgData, 0, 0);
}

/**
 * Renders the realistic photographic view of Copacabana curve & Morro do Leme
 */
function renderCopacabanaViewPhoto(ctx: CanvasRenderingContext2D, width: number, height: number, mode: 'golden' | 'night' | 'day') {
  // 1. SKY GRADIENT
  if (mode === 'golden') {
    const sky = ctx.createLinearGradient(0, 0, 0, height * 0.45);
    sky.addColorStop(0, '#2d4b68');
    sky.addColorStop(0.35, '#5689a8');
    sky.addColorStop(0.65, '#f59e0b');
    sky.addColorStop(0.85, '#fde68a');
    sky.addColorStop(1, '#ffedd5');
    ctx.fillStyle = sky;
  } else if (mode === 'night') {
    const sky = ctx.createLinearGradient(0, 0, 0, height * 0.45);
    sky.addColorStop(0, '#030712');
    sky.addColorStop(0.4, '#0f172a');
    sky.addColorStop(0.85, '#1e1b4b');
    sky.addColorStop(1, '#312e81');
    ctx.fillStyle = sky;
  } else {
    // Crisp sunny Rio daylight
    const sky = ctx.createLinearGradient(0, 0, 0, height * 0.45);
    sky.addColorStop(0, '#1d4ed8');
    sky.addColorStop(0.3, '#3b82f6');
    sky.addColorStop(0.7, '#93c5fd');
    sky.addColorStop(1, '#e0f2fe');
    ctx.fillStyle = sky;
  }
  ctx.fillRect(0, 0, width, height * 0.45);

  // Soft atmospheric haze over horizon
  const haze = ctx.createLinearGradient(0, height * 0.25, 0, height * 0.42);
  haze.addColorStop(0, 'rgba(255, 255, 255, 0)');
  haze.addColorStop(1, mode === 'golden' ? 'rgba(254, 215, 170, 0.45)' : mode === 'night' ? 'rgba(15, 23, 42, 0.3)' : 'rgba(224, 242, 254, 0.5)');
  ctx.fillStyle = haze;
  ctx.fillRect(0, height * 0.25, width, height * 0.17);

  // Night Moon & Stars
  if (mode === 'night') {
    ctx.fillStyle = 'rgba(254, 249, 195, 0.95)';
    ctx.beginPath();
    ctx.arc(width * 0.28, height * 0.14, 28, 0, Math.PI * 2);
    ctx.fill();

    // Lunar glow
    const moonGlow = ctx.createRadialGradient(width * 0.28, height * 0.14, 25, width * 0.28, height * 0.14, 110);
    moonGlow.addColorStop(0, 'rgba(254, 249, 195, 0.35)');
    moonGlow.addColorStop(1, 'rgba(254, 249, 195, 0)');
    ctx.fillStyle = moonGlow;
    ctx.fillRect(width * 0.15, 0, width * 0.26, height * 0.3);
  }

  // 2. DISTANT SILHOUETTES: DOIS IRMÃOS & PEDRA DA GÁVEA (Far West)
  const distantMtnColor = mode === 'golden' ? '#6b4c60' : mode === 'night' ? '#090d16' : '#64748b';
  ctx.fillStyle = distantMtnColor;
  ctx.beginPath();
  ctx.moveTo(0, height * 0.38);
  // Ridge leading to Morro Dois Irmãos
  ctx.lineTo(width * 0.04, height * 0.34);
  ctx.lineTo(width * 0.08, height * 0.29); // Irmão Maior peak
  ctx.lineTo(width * 0.11, height * 0.32); // saddle
  ctx.lineTo(width * 0.13, height * 0.30); // Irmão Menor peak
  ctx.lineTo(width * 0.17, height * 0.36);
  ctx.lineTo(width * 0.22, height * 0.33); // Pedra da Gávea flat table top
  ctx.lineTo(width * 0.26, height * 0.33);
  ctx.lineTo(width * 0.30, height * 0.38);
  ctx.lineTo(width * 0.45, height * 0.39);
  ctx.lineTo(width * 0.55, height * 0.40);
  ctx.lineTo(width * 0.55, height * 0.42);
  ctx.lineTo(0, height * 0.42);
  ctx.closePath();
  ctx.fill();

  // 3. THE DEEP ATLANTIC OCEAN
  const oceanGrad = ctx.createLinearGradient(0, height * 0.38, 0, height);
  if (mode === 'golden') {
    oceanGrad.addColorStop(0, '#1e3a5f');
    oceanGrad.addColorStop(0.3, '#2a5b82');
    oceanGrad.addColorStop(0.7, '#0f766e');
    oceanGrad.addColorStop(1, '#0d9488');
  } else if (mode === 'night') {
    oceanGrad.addColorStop(0, '#020617');
    oceanGrad.addColorStop(0.4, '#091024');
    oceanGrad.addColorStop(1, '#0f172a');
  } else {
    // Rio turquoise coastal ocean
    oceanGrad.addColorStop(0, '#0369a1');
    oceanGrad.addColorStop(0.35, '#0284c7');
    oceanGrad.addColorStop(0.7, '#0ea5e9');
    oceanGrad.addColorStop(0.92, '#06b6d4');
    oceanGrad.addColorStop(1, '#22d3ee');
  }
  ctx.fillStyle = oceanGrad;
  ctx.fillRect(0, height * 0.38, width, height * 0.62);

  // Ocean swell & wave crest lines in deep water
  ctx.strokeStyle = mode === 'night' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.22)';
  for (let s = 0; s < 18; s++) {
    const sy = height * (0.42 + (s / 18) * 0.4);
    ctx.lineWidth = 1 + (s / 18) * 2;
    ctx.beginPath();
    ctx.moveTo(width * 0.15, sy);
    for (let x = width * 0.15; x < width * 0.72; x += 60) {
      const dy = Math.sin((x * 0.015) + s * 1.4) * (2 + s * 0.35);
      ctx.lineTo(x, sy + dy);
    }
    ctx.stroke();
  }

  // 4. GOLDEN SAND CURVE OF COPACABANA (Curving across the bottom left)
  const sandGrad = ctx.createLinearGradient(0, height * 0.5, width * 0.65, height);
  if (mode === 'golden') {
    sandGrad.addColorStop(0, '#fef08a');
    sandGrad.addColorStop(0.5, '#fde047');
    sandGrad.addColorStop(1, '#eab308');
  } else if (mode === 'night') {
    sandGrad.addColorStop(0, '#1e293b');
    sandGrad.addColorStop(1, '#334155');
  } else {
    sandGrad.addColorStop(0, '#fef9c3');
    sandGrad.addColorStop(0.5, '#fef08a');
    sandGrad.addColorStop(1, '#fde047');
  }

  ctx.fillStyle = sandGrad;
  ctx.beginPath();
  // Start from Arpoador in far left
  ctx.moveTo(0, height * 0.44);
  // Crescent sweeping arc towards Leme
  ctx.bezierCurveTo(width * 0.18, height * 0.46, width * 0.38, height * 0.60, width * 0.72, height * 0.95);
  ctx.lineTo(width * 0.60, height);
  ctx.lineTo(0, height);
  ctx.closePath();
  ctx.fill();

  // White surf breaking foam along the arc
  const foamColor = mode === 'night' ? 'rgba(255, 255, 255, 0.4)' : 'rgba(255, 255, 255, 0.88)';
  for (let w = 0; w < 4; w++) {
    ctx.strokeStyle = foamColor;
    ctx.lineWidth = 3.5 - w * 0.6;
    ctx.beginPath();
    const off = w * 9;
    ctx.moveTo(0, height * 0.44 - off * 0.3);
    ctx.bezierCurveTo(
      width * 0.18 + off * 0.5, height * 0.46 + off * 0.4,
      width * 0.38 + off * 0.8, height * 0.60 + off * 0.6,
      width * 0.72 + off, height * 0.95 + off * 0.3
    );
    ctx.stroke();
  }

  // Avenida Atlântica promenade with wave mosaic sidewalk
  ctx.fillStyle = mode === 'night' ? '#0f172a' : '#e2e8f0';
  ctx.beginPath();
  ctx.moveTo(0, height * 0.48);
  ctx.bezierCurveTo(width * 0.15, height * 0.50, width * 0.32, height * 0.64, width * 0.55, height);
  ctx.lineTo(0, height);
  ctx.closePath();
  ctx.fill();

  // Red cycling lane and green coconut palm dots along the promenade
  ctx.strokeStyle = mode === 'night' ? '#7f1d1d' : '#ef4444';
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.moveTo(0, height * 0.485);
  ctx.bezierCurveTo(width * 0.15, height * 0.505, width * 0.32, height * 0.645, width * 0.55, height);
  ctx.stroke();

  // Coconut palms
  for (let p = 0; p < 25; p++) {
    const t = p / 25;
    const px = t * (width * 0.48);
    const py = height * 0.49 + t * (height * 0.48) + Math.sin(p) * 6;
    ctx.fillStyle = mode === 'night' ? '#064e3b' : '#15803d';
    ctx.beginPath();
    ctx.arc(px, py, 4.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // 5. THE MAJESTIC MORRO DO LEME (Dominating the Right Foreground)
  const lemeBaseX = width * 0.64;
  const lemeCliffGrad = ctx.createLinearGradient(lemeBaseX, height * 0.22, width, height);
  if (mode === 'golden') {
    lemeCliffGrad.addColorStop(0, '#5c4033');
    lemeCliffGrad.addColorStop(0.4, '#785338');
    lemeCliffGrad.addColorStop(0.7, '#442d20');
    lemeCliffGrad.addColorStop(1, '#2c1e15');
  } else if (mode === 'night') {
    lemeCliffGrad.addColorStop(0, '#090d16');
    lemeCliffGrad.addColorStop(0.5, '#0d1527');
    lemeCliffGrad.addColorStop(1, '#05080f');
  } else {
    lemeCliffGrad.addColorStop(0, '#475569');
    lemeCliffGrad.addColorStop(0.3, '#64748b');
    lemeCliffGrad.addColorStop(0.65, '#52525b');
    lemeCliffGrad.addColorStop(1, '#334155');
  }

  // Granite cliff silhouette
  ctx.fillStyle = lemeCliffGrad;
  ctx.beginPath();
  ctx.moveTo(width * 0.62, height);
  // Rocky curve rising up to Morro do Leme peak
  ctx.bezierCurveTo(width * 0.66, height * 0.72, width * 0.70, height * 0.45, width * 0.82, height * 0.22);
  // Rounded peak of Morro do Leme
  ctx.quadraticCurveTo(width * 0.88, height * 0.18, width * 0.94, height * 0.24);
  // Descent into the sea on right
  ctx.bezierCurveTo(width * 0.98, height * 0.38, width, height * 0.58, width, height);
  ctx.closePath();
  ctx.fill();

  // Lush Tropical Atlantic Forest Canopy on Morro do Leme
  const forestGrad = ctx.createLinearGradient(width * 0.70, height * 0.20, width * 0.98, height * 0.75);
  forestGrad.addColorStop(0, mode === 'night' ? '#062012' : '#14532d');
  forestGrad.addColorStop(0.4, mode === 'night' ? '#0a301c' : '#15803d');
  forestGrad.addColorStop(0.8, mode === 'night' ? '#04170d' : '#166534');
  ctx.fillStyle = forestGrad;
  ctx.beginPath();
  ctx.moveTo(width * 0.67, height * 0.85);
  ctx.bezierCurveTo(width * 0.70, height * 0.55, width * 0.76, height * 0.32, width * 0.83, height * 0.22);
  ctx.quadraticCurveTo(width * 0.88, height * 0.18, width * 0.93, height * 0.25);
  ctx.bezierCurveTo(width * 0.96, height * 0.40, width * 0.96, height * 0.65, width * 0.88, height * 0.85);
  ctx.closePath();
  ctx.fill();

  // Granite facets & rock textures on the cliff face
  ctx.strokeStyle = mode === 'night' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.25)';
  for (let r = 0; r < 24; r++) {
    const rx = width * (0.68 + (r % 6) * 0.05);
    const ry = height * (0.35 + Math.floor(r / 6) * 0.12);
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(rx, ry);
    ctx.lineTo(rx + 18, ry + 25);
    ctx.lineTo(rx + 10, ry + 42);
    ctx.stroke();
  }

  // Forte Duque de Caxias lookout at Morro do Leme summit
  ctx.fillStyle = mode === 'night' ? '#0f172a' : '#f8fafc';
  ctx.fillRect(width * 0.84, height * 0.19, 14, 8);
  ctx.fillStyle = '#ef4444'; // Flag on summit
  ctx.fillRect(width * 0.854, height * 0.17, 8, 5);

  // Caminho dos Pescadores: Rocky pathway at the sea base of Morro do Leme
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(width * 0.71, height * 0.88, 55, 16, -0.2, 0, Math.PI * 2);
  ctx.stroke();

  // 6. TWO SHIPS ON ATLANTIC HORIZON
  ctx.fillStyle = mode === 'night' ? '#1e293b' : '#334155';
  ctx.fillRect(width * 0.42, height * 0.395, 45, 5);
  ctx.fillStyle = '#dc2626';
  ctx.fillRect(width * 0.42, height * 0.398, 45, 2.5);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(width * 0.455, height * 0.39, 9, 5);

  // 7. PHOTOGRAPHIC EMBOSSED ARCHIVAL STAMP (Bottom Right)
  ctx.fillStyle = 'rgba(255, 255, 255, 0.82)';
  ctx.font = '600 13px "Courier Prime", monospace';
  ctx.fillText('LEME • COPACABANA • RIO DE JANEIRO', 35, height - 30);
  ctx.font = '400 11px sans-serif';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
  ctx.fillText('Janela de Clarice Lispector — Rua Gustavo Sampaio, 520', 35, height - 14);
}

/**
 * Renders the iconic archival black & white / sepia photograph of Clarice at the window (Foto #4)
 */
function renderClaricePhoto4(ctx: CanvasRenderingContext2D, width: number, height: number, mode: 'golden' | 'night' | 'day') {
  // Rich monochrome silver-gelatin tones
  const tint = mode === 'golden' ? '#fdf6e2' : '#f8fafc';
  const darkTint = mode === 'golden' ? '#1c1917' : '#09090b';

  // Base background: Archival dark photographic studio
  const baseGrad = ctx.createLinearGradient(0, 0, width, height);
  baseGrad.addColorStop(0, darkTint);
  baseGrad.addColorStop(0.5, '#18181b');
  baseGrad.addColorStop(1, '#27272a');
  ctx.fillStyle = baseGrad;
  ctx.fillRect(0, 0, width, height);

  // THE LARGE PANORAMIC WINDOW (Right side behind Clarice)
  const winX = width * 0.38;
  const winY = height * 0.08;
  const winW = width * 0.58;
  const winH = height * 0.78;

  // Window view: Copacabana crescent & Morro do Leme in photographic monochrome
  const winSky = ctx.createLinearGradient(winX, winY, winX, winY + winH * 0.45);
  winSky.addColorStop(0, '#52525b');
  winSky.addColorStop(0.5, '#a1a1aa');
  winSky.addColorStop(1, '#e4e4e7');
  ctx.fillStyle = winSky;
  ctx.fillRect(winX, winY, winW, winH);

  // Distant mountain silhouette in window
  ctx.fillStyle = '#3f3f46';
  ctx.beginPath();
  ctx.moveTo(winX, winY + winH * 0.38);
  ctx.lineTo(winX + winW * 0.2, winY + winH * 0.32);
  ctx.lineTo(winX + winW * 0.35, winY + winH * 0.30);
  ctx.lineTo(winX + winW * 0.55, winY + winH * 0.36);
  ctx.lineTo(winX + winW * 0.65, winY + winH * 0.38);
  ctx.lineTo(winX + winW * 0.65, winY + winH * 0.45);
  ctx.lineTo(winX, winY + winH * 0.45);
  ctx.closePath();
  ctx.fill();

  // Atlantic Ocean in window
  const winOcean = ctx.createLinearGradient(winX, winY + winH * 0.38, winX, winY + winH);
  winOcean.addColorStop(0, '#27272a');
  winOcean.addColorStop(0.4, '#3f3f46');
  winOcean.addColorStop(0.8, '#52525b');
  winOcean.addColorStop(1, '#71717a');
  ctx.fillStyle = winOcean;
  ctx.fillRect(winX, winY + winH * 0.38, winW, winH * 0.62);

  // Copacabana Beach sand arc in window
  ctx.fillStyle = '#e4e4e7';
  ctx.beginPath();
  ctx.moveTo(winX, winY + winH * 0.42);
  ctx.bezierCurveTo(winX + winW * 0.25, winY + winH * 0.45, winX + winW * 0.5, winY + winH * 0.62, winX + winW * 0.8, winY + winH);
  ctx.lineTo(winX, winY + winH);
  ctx.closePath();
  ctx.fill();

  // White surf line
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(winX, winY + winH * 0.42);
  ctx.bezierCurveTo(winX + winW * 0.25, winY + winH * 0.45, winX + winW * 0.5, winY + winH * 0.62, winX + winW * 0.8, winY + winH);
  ctx.stroke();

  // Morro do Leme inside the window frame (Right side)
  ctx.fillStyle = '#18181b';
  ctx.beginPath();
  ctx.moveTo(winX + winW * 0.65, winY + winH);
  ctx.bezierCurveTo(winX + winW * 0.72, winY + winH * 0.55, winX + winW * 0.78, winY + winH * 0.30, winX + winW * 0.90, winY + winH * 0.18);
  ctx.quadraticCurveTo(winX + winW * 0.96, winY + winH * 0.15, winX + winW, winY + winH * 0.22);
  ctx.lineTo(winX + winW, winY + winH);
  ctx.closePath();
  ctx.fill();

  // Window mullions / wooden frame
  ctx.strokeStyle = '#09090b';
  ctx.lineWidth = 14;
  ctx.strokeRect(winX, winY, winW, winH);
  // Vertical bar
  ctx.beginPath();
  ctx.moveTo(winX + winW * 0.48, winY);
  ctx.lineTo(winX + winW * 0.48, winY + winH);
  // Horizontal bar
  ctx.moveTo(winX, winY + winH * 0.45);
  ctx.lineTo(winX + winW, winY + winH * 0.45);
  ctx.stroke();

  // CLARICE LISPECTOR PORTRAIT SILHOUETTE (Left & Foreground)
  const clariceX = width * 0.22;
  const clariceY = height * 0.62;

  // Dark wool overcoat / silhouette
  ctx.fillStyle = '#09090b';
  ctx.beginPath();
  ctx.moveTo(0, height);
  ctx.lineTo(width * 0.05, height * 0.52);
  ctx.bezierCurveTo(width * 0.12, height * 0.42, width * 0.20, height * 0.40, width * 0.26, height * 0.48);
  ctx.bezierCurveTo(width * 0.32, height * 0.55, width * 0.36, height * 0.68, width * 0.42, height);
  ctx.closePath();
  ctx.fill();

  // Textured scarf around neck
  ctx.fillStyle = '#3f3f46';
  ctx.beginPath();
  ctx.ellipse(clariceX, height * 0.46, 42, 22, 0.1, 0, Math.PI * 2);
  ctx.fill();

  // Clarice's expressive head & profile
  ctx.fillStyle = '#d4d4d8';
  ctx.beginPath();
  ctx.ellipse(clariceX, height * 0.36, 32, 42, -0.08, 0, Math.PI * 2);
  ctx.fill();

  // Hair (Iconic bob haircut of Clarice)
  ctx.fillStyle = '#18181b';
  ctx.beginPath();
  ctx.moveTo(clariceX - 35, height * 0.38);
  ctx.quadraticCurveTo(clariceX - 40, height * 0.26, clariceX, height * 0.26);
  ctx.quadraticCurveTo(clariceX + 38, height * 0.26, clariceX + 36, height * 0.40);
  ctx.quadraticCurveTo(clariceX + 15, height * 0.30, clariceX - 35, height * 0.38);
  ctx.fill();

  // Eyes, nose & lips profile looking pensively toward the window
  ctx.strokeStyle = '#27272a';
  ctx.lineWidth = 2.5;
  // Brow & eye
  ctx.beginPath();
  ctx.arc(clariceX + 10, height * 0.34, 4, 0, Math.PI);
  ctx.stroke();
  // Nose
  ctx.beginPath();
  ctx.moveTo(clariceX + 16, height * 0.34);
  ctx.lineTo(clariceX + 26, height * 0.38);
  ctx.lineTo(clariceX + 18, height * 0.40);
  ctx.stroke();
  // Lips
  ctx.beginPath();
  ctx.moveTo(clariceX + 14, height * 0.43);
  ctx.lineTo(clariceX + 22, height * 0.43);
  ctx.stroke();

  // Hand holding cigarette
  ctx.fillStyle = '#e4e4e7';
  ctx.beginPath();
  ctx.ellipse(clariceX + 48, height * 0.50, 14, 20, 0.4, 0, Math.PI * 2);
  ctx.fill();

  // Cigarette & Smoke
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(clariceX + 56, height * 0.49);
  ctx.lineTo(clariceX + 78, height * 0.47);
  ctx.stroke();

  // Red tip of cigarette
  ctx.fillStyle = '#ef4444';
  ctx.beginPath();
  ctx.arc(clariceX + 78, height * 0.47, 2, 0, Math.PI * 2);
  ctx.fill();

  // Rising curl of smoke
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(clariceX + 78, height * 0.46);
  ctx.bezierCurveTo(clariceX + 85, height * 0.40, clariceX + 75, height * 0.34, clariceX + 90, height * 0.28);
  ctx.bezierCurveTo(clariceX + 100, height * 0.22, clariceX + 92, height * 0.16, clariceX + 108, height * 0.10);
  ctx.stroke();

  // Olympia Typewriter & Manuscripts on desk in foreground
  ctx.fillStyle = '#18181b';
  ctx.fillRect(width * 0.35, height * 0.74, 180, 85);
  // Keyboard keys
  ctx.fillStyle = '#52525b';
  for (let k = 0; k < 15; k++) {
    ctx.fillRect(width * 0.37 + (k % 5) * 14, height * 0.78 + Math.floor(k / 5) * 8, 9, 6);
  }
  // Paper sheet
  ctx.fillStyle = '#f4f4f5';
  ctx.fillRect(width * 0.42, height * 0.64, 75, 60);

  // Vintage Silver Gelatin Photo Archival Border
  ctx.strokeStyle = tint;
  ctx.lineWidth = 18;
  ctx.strokeRect(9, 9, width - 18, height - 18);

  // Museum Acervo IMS Inscription
  ctx.fillStyle = tint;
  ctx.font = '600 13px "Courier Prime", monospace';
  ctx.fillText('CLARICE LISPECTOR • RETRATO HISTÓRICO #4', 36, height - 32);
  ctx.font = '400 11px sans-serif';
  ctx.fillText('Fotografia de Maureen Bisilliat (1970) • Acervo Instituto Moreira Salles', 36, height - 16);
}

/**
 * Master Photographic Window Renderer
 */
export function renderPhotographicWindow(
  presetId: WindowPhotoPresetId,
  mode: 'golden' | 'night' | 'day',
  customImg?: HTMLImageElement | null
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 1600;
  canvas.height = 900;
  const ctx = canvas.getContext('2d')!;

  // 1. If custom uploaded image exists, render it with cover-fit
  if (customImg && customImg.complete && customImg.naturalWidth > 0) {
    const hRatio = canvas.width / customImg.naturalWidth;
    const vRatio = canvas.height / customImg.naturalHeight;
    const ratio = Math.max(hRatio, vRatio);
    const centerShiftX = (canvas.width - customImg.naturalWidth * ratio) / 2;
    const centerShiftY = (canvas.height - customImg.naturalHeight * ratio) / 2;
    ctx.drawImage(
      customImg,
      0, 0, customImg.naturalWidth, customImg.naturalHeight,
      centerShiftX, centerShiftY, customImg.naturalWidth * ratio, customImg.naturalHeight * ratio
    );

    // Filter overlay
    ctx.fillStyle = mode === 'golden' ? 'rgba(255, 170, 70, 0.08)' : mode === 'night' ? 'rgba(10, 20, 60, 0.38)' : 'rgba(255, 255, 255, 0.02)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    applyFilmGrain(ctx, canvas.width, canvas.height, 0.04);
    return canvas;
  }

  // 2. Render chosen photo preset
  if (presetId === 'clarice_photo_4') {
    renderClaricePhoto4(ctx, canvas.width, canvas.height, mode);
  } else {
    // Both 'copacabana_view' and 'aerial_leme' render the realistic coastal vista
    renderCopacabanaViewPhoto(ctx, canvas.width, canvas.height, mode);
  }

  // 3. Apply authentic 35mm film grain
  applyFilmGrain(ctx, canvas.width, canvas.height, 0.04);

  // 4. Subtle lens vignette
  const vig = ctx.createRadialGradient(800, 450, 480, 800, 450, 920);
  vig.addColorStop(0, 'rgba(0, 0, 0, 0)');
  vig.addColorStop(1, 'rgba(0, 0, 0, 0.32)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, 1600, 900);

  return canvas;
}
