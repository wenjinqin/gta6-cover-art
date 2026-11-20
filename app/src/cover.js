// Neon Coast cover renderer: draws a multi-panel GTA-style poster onto a canvas.
// The cover is built from panel rectangles (fractions of the canvas), one photo per
// panel with its own pan/zoom, a colour grade, and a bold caption band along the foot.
// Nothing here reaches the network: photos are Image objects the user loaded locally.

/** The three post sizes the app exports, keyed by the size button's value. */
export const SIZES = {
  square: { w: 1080, h: 1080, label: 'Square 1080 x 1080' },
  portrait: { w: 1080, h: 1350, label: 'Portrait 1080 x 1350' },
  wide: { w: 1920, h: 1080, label: 'Wide 1920 x 1080' },
};

/** Colour grades: a wash drawn over every panel plus a sunset/neon sky gradient. */
export const GRADES = {
  sunset: {
    label: 'Vice Sunset',
    wash: ['rgba(255, 122, 26, 0.16)', 'rgba(214, 51, 132, 0.30)'],
    sky: ['#ff7a1a', '#d63384', '#2b1055'],
    accent: '#ffb703',
  },
  neon: {
    label: 'Neon Night',
    wash: ['rgba(0, 229, 255, 0.14)', 'rgba(255, 0, 128, 0.34)'],
    sky: ['#00e5ff', '#7b2ff7', '#12002e'],
    accent: '#00e5ff',
  },
  teal: {
    label: 'Teal Dawn',
    wash: ['rgba(45, 212, 191, 0.16)', 'rgba(13, 110, 253, 0.28)'],
    sky: ['#2dd4bf', '#0d6efd', '#062a4d'],
    accent: '#5eead4',
  },
  noir: {
    label: 'Mono Noir',
    wash: ['rgba(255, 255, 255, 0.10)', 'rgba(0, 0, 0, 0.42)'],
    sky: ['#e5e5e5', '#6b7280', '#111111'],
    accent: '#f5f5f5',
  },
};

/** Caption lettering styles. All use system font stacks; no font file is shipped. */
export const CAPTION_STYLES = {
  block: { label: 'Block', fill: '#ffffff', stroke: '#14001f', glow: null, slant: -0.05 },
  neon: { label: 'Neon Sign', fill: '#1a0026', stroke: '#ff2e88', glow: '#00e5ff', slant: 0 },
  stripe: { label: 'Sunset Stripe', fill: null, stroke: '#14001f', glow: null, slant: -0.05 },
};

const GAP = 0.012; // panel gap, as a fraction of the cover's short side

/**
 * Panel rectangles for a layout, as fractions of the canvas (x, y, w, h).
 * The caption band is the strip along the foot; panels fill the rest.
 */
export function layoutPanels(layout, sizeKey) {
  const captionH = sizeKey === 'wide' ? 0.2 : sizeKey === 'portrait' ? 0.15 : 0.18;
  const top = 1 - captionH;
  if (layout === 'triptych') {
    const third = (1 - GAP * 2) / 3;
    return {
      caption: { x: 0, y: top, w: 1, h: captionH },
      panels: [
        { x: 0, y: 0, w: third, h: top },
        { x: third + GAP, y: 0, w: third, h: top },
        { x: (third + GAP) * 2, y: 0, w: third, h: top },
      ],
    };
  }
  // hero layout: one big panel, two small ones beside/below it, per size
  if (sizeKey === 'square') {
    const heroW = 0.62;
    return {
      caption: { x: 0, y: top, w: 1, h: captionH },
      panels: [
        { x: 0, y: 0, w: heroW, h: top },
        { x: heroW + GAP, y: 0, w: 1 - heroW - GAP, h: top / 2 - GAP / 2 },
        { x: heroW + GAP, y: top / 2 + GAP / 2, w: 1 - heroW - GAP, h: top / 2 - GAP / 2 },
      ],
    };
  }
  if (sizeKey === 'portrait') {
    return {
      caption: { x: 0, y: top, w: 1, h: captionH },
      panels: [
        { x: 0, y: 0, w: 1, h: top * 0.66 },
        { x: 0, y: top * 0.66 + GAP, w: 0.5 - GAP / 2, h: top * 0.34 - GAP },
        { x: 0.5 + GAP / 2, y: top * 0.66 + GAP, w: 0.5 - GAP / 2, h: top * 0.34 - GAP },
      ],
    };
  }
  // wide: hero in the middle, a tall panel on each side
  const sideW = 0.3;
  return {
    caption: { x: 0, y: top, w: 1, h: captionH },
    panels: [
      { x: 0, y: 0, w: sideW, h: top },
      { x: sideW + GAP, y: 0, w: 1 - sideW * 2 - GAP * 2, h: top },
      { x: 1 - sideW, y: 0, w: sideW, h: top },
    ],
  };
}

/** Draws one photo into a panel rect, cropped to fill, panned and zoomed. */
function drawPanelPhoto(ctx, photo, rect, pan, zoom) {
  const { x, y, w, h } = rect;
  if (!photo) {
    // Empty panel: a dusk gradient with a palm-free skyline silhouette drawn in code.
    const sky = ctx.createLinearGradient(0, y, 0, y + h);
    sky.addColorStop(0, '#3b1d5e');
    sky.addColorStop(0.6, '#c2437a');
    sky.addColorStop(1, '#ff7a1a');
    ctx.fillStyle = sky;
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = 'rgba(20, 0, 31, 0.85)';
    const base = y + h;
    ctx.beginPath();
    ctx.moveTo(x, base);
    const blocks = 5;
    for (let i = 0; i <= blocks; i++) {
      const bx = x + (w / blocks) * i;
      const bh = h * (0.18 + 0.22 * Math.abs(Math.sin(i * 2.7 + 1)));
      ctx.lineTo(bx, base - bh);
      ctx.lineTo(bx + w / blocks / 2, base - bh);
      ctx.lineTo(bx + w / blocks / 2, base);
    }
    ctx.lineTo(x + w, base);
    ctx.closePath();
    ctx.fill();
    return;
  }
  const iw = photo.naturalWidth;
  const ih = photo.naturalHeight;
  const cover = Math.max(w / iw, h / ih) * zoom;
  const pw = iw * cover;
  const ph = ih * cover;
  // Frame near the top when the photo is cropped vertically: faces sit above
  // the middle of a photo, so a centred crop cuts them off in wide panels.
  // The crop window's top edge sits 18% down the cropped-away excess.
  const excessY = Math.max(0, ph - h);
  const topBias = 0.18 * excessY;
  const cx = x + w / 2 + pan.x * w;
  const cy = y + ph / 2 - topBias + pan.y * h;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.filter = 'saturate(1.28) contrast(1.1) brightness(1.03)';
  ctx.drawImage(photo, cx - pw / 2, cy - ph / 2, pw, ph);
  ctx.restore();
  ctx.filter = 'none';
}

/** Washes a panel with the grade's colours and darkens its edges. */
function gradePanel(ctx, rect, grade) {
  const { x, y, w, h } = rect;
  const wash = ctx.createLinearGradient(x, y, x + w, y + h);
  wash.addColorStop(0, grade.wash[0]);
  wash.addColorStop(1, grade.wash[1]);
  ctx.fillStyle = wash;
  ctx.fillRect(x, y, w, h);
  const edge = ctx.createRadialGradient(
    x + w / 2, y + h / 2, Math.min(w, h) * 0.35,
    x + w / 2, y + h / 2, Math.max(w, h) * 0.75,
  );
  edge.addColorStop(0, 'rgba(10, 0, 20, 0)');
  edge.addColorStop(1, 'rgba(10, 0, 20, 0.42)');
  ctx.fillStyle = edge;
  ctx.fillRect(x, y, w, h);
}

/** Draws the caption band: sky gradient, caption, subcaption and accent rule. */
function drawCaptionBand(ctx, band, caption, subcaption, grade, styleKey) {
  const { x, y, w, h } = band;
  const sky = ctx.createLinearGradient(x, y, x + w, y + h);
  sky.addColorStop(0, grade.sky[0]);
  sky.addColorStop(0.55, grade.sky[1]);
  sky.addColorStop(1, grade.sky[2]);
  ctx.fillStyle = sky;
  ctx.fillRect(x, y, w, h);
  // thin accent rule above the band
  ctx.fillStyle = grade.accent;
  ctx.fillRect(x, y, w, Math.max(3, h * 0.05));

  const style = CAPTION_STYLES[styleKey] ?? CAPTION_STYLES.block;
  const text = (caption || '').trim().toUpperCase();
  const sub = (subcaption || '').trim().toUpperCase();
  const pad = w * 0.04;
  const cx = x + w / 2;
  if (text) {
    let size = h * (sub ? 0.46 : 0.58);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const setFont = (s) => { ctx.font = `900 ${s}px "Arial Black", "Archivo Black", "Helvetica Neue", sans-serif`; };
    setFont(size);
    while (ctx.measureText(text).width > w - pad * 2 && size > 10) {
      size -= 2;
      setFont(size);
    }
    const cy = y + h * (sub ? 0.36 : 0.52);
    ctx.save();
    ctx.translate(cx, cy);
    ctx.transform(1, 0, style.slant, 1, 0, 0);
    ctx.lineJoin = 'round';
    ctx.lineWidth = Math.max(2, size * 0.09);
    if (style.glow) {
      ctx.shadowColor = style.glow;
      ctx.shadowBlur = size * 0.35;
    }
    if (style.fill === null) {
      // sunset-stripe fill: a gradient clipped to the letters
      const grad = ctx.createLinearGradient(0, -size / 2, 0, size / 2);
      grad.addColorStop(0, '#ffe259');
      grad.addColorStop(0.5, '#ff7a1a');
      grad.addColorStop(1, '#ff2e88');
      ctx.strokeStyle = style.stroke;
      ctx.strokeText(text, 0, 0);
      ctx.fillStyle = grad;
      ctx.fillText(text, 0, 0);
    } else {
      ctx.strokeStyle = style.stroke;
      ctx.strokeText(text, 0, 0);
      ctx.fillStyle = style.fill;
      ctx.fillText(text, 0, 0);
    }
    ctx.restore();
  }
  if (sub) {
    let size = h * 0.16;
    ctx.font = `700 ${size}px "Helvetica Neue", Arial, sans-serif`;
    while (ctx.measureText(sub).width > w - pad * 2 && size > 8) {
      size -= 1;
      ctx.font = `700 ${size}px "Helvetica Neue", Arial, sans-serif`;
    }
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
    // letter-spacing by hand: canvas has no letterSpacing everywhere, so draw spaced
    const spaced = sub.split('').join('\u2009');
    ctx.fillText(spaced, cx, y + h * 0.8);
  }
}

/**
 * Draws the whole cover onto `canvas` at its own pixel size.
 * `state` holds: sizeKey, layout, photos (Image|null[]), panelPhoto (photo index per
 * panel), pans ({x,y} fractions per panel), zooms (per panel), caption, subcaption,
 * gradeKey, captionStyle. `highlight` (panel index or -1) outlines the selected panel.
 */
export function drawCover(canvas, state, highlight = -1) {
  const ctx = canvas.getContext('2d');
  const { width: w, height: h } = canvas;
  const grade = GRADES[state.gradeKey] ?? GRADES.sunset;
  const geo = layoutPanels(state.layout, state.sizeKey);
  const gapPx = GAP * Math.min(w, h);

  ctx.fillStyle = '#14001f';
  ctx.fillRect(0, 0, w, h);

  geo.panels.forEach((frac, i) => {
    const rect = {
      x: frac.x * w + (i === 0 ? 0 : 0),
      y: frac.y * h,
      w: frac.w * w,
      h: frac.h * h,
    };
    const photo = state.photos[state.panelPhoto[i]] ?? null;
    drawPanelPhoto(ctx, photo, rect, state.pans[i] ?? { x: 0, y: 0 }, state.zooms[i] ?? 1);
    gradePanel(ctx, rect, grade);
    // panel separators
    ctx.strokeStyle = 'rgba(20, 0, 31, 0.9)';
    ctx.lineWidth = Math.max(2, gapPx * 0.5);
    ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
    if (i === highlight) {
      ctx.strokeStyle = grade.accent;
      ctx.lineWidth = Math.max(3, gapPx);
      ctx.strokeRect(rect.x + 2, rect.y + 2, rect.w - 4, rect.h - 4);
    }
  });

  drawCaptionBand(
    ctx,
    { x: geo.caption.x * w, y: geo.caption.y * h, w: geo.caption.w * w, h: geo.caption.h * h },
    state.caption, state.subcaption, grade, state.captionStyle,
  );
}

/** The panel rectangles in canvas pixels, for hit-testing clicks on the preview. */
export function panelRectsPx(canvas, state) {
  const geo = layoutPanels(state.layout, state.sizeKey);
  return geo.panels.map((f) => ({
    x: f.x * canvas.width, y: f.y * canvas.height,
    w: f.w * canvas.width, h: f.h * canvas.height,
  }));
}

/** A fresh default state: no photos yet, hero layout, sunset grade, block caption. */
export function defaultState() {
  return {
    sizeKey: 'square',
    layout: 'hero',
    photos: [null, null, null],
    panelPhoto: [0, 1, 2],
    pans: [{ x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }],
    zooms: [1, 1, 1],
    caption: 'Neon Coast',
    subcaption: 'Vice City Nights',
    gradeKey: 'sunset',
    captionStyle: 'block',
  };
}
