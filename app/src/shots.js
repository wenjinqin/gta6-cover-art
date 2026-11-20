// Fixed scenes for screenshots: ?shot=editor shows the editor with sample photos
// loaded; ?shot=cover shows the finished cover alone, full-viewport.
// Query params: photo (sample for panel 1), photo2 (sample for the other panels),
// caption, sub, layout, size, grade, style. window.__shotReady is set once painted.
export async function runShot(shot, query, state, setup) {
  if (shot === 'cover') document.body.classList.add('shot-cover');
  const photo = query.get('photo') ?? 'pier';
  const photo2 = query.get('photo2') ?? photo;
  state.layout = query.get('layout') ?? state.layout;
  state.sizeKey = query.get('size') ?? state.sizeKey;
  state.gradeKey = query.get('grade') ?? state.gradeKey;
  state.captionStyle = query.get('style') ?? state.captionStyle;
  state.panelPhoto = [0, 1, 2];
  // Optional framing per shot: pan0=-0.1,0.05 nudges panel 1's photo up a touch.
  for (let i = 0; i < 3; i++) {
    const pan = query.get(`pan${i}`);
    if (pan) {
      const [x, y] = pan.split(',').map(Number);
      if (Number.isFinite(x) && Number.isFinite(y)) state.pans[i] = { x, y };
    }
  }
  await setup(
    [`samples/${photo}.jpg`, `samples/${photo2}.jpg`, `samples/${photo2}.jpg`],
    query.get('caption') ?? 'Neon Coast',
    query.get('sub') ?? 'Vice City Nights',
  );
  // In cover mode the canvas must fill the viewport at the shot's aspect.
  if (shot === 'cover') {
    const canvas = document.getElementById('cover');
    canvas.style.width = '100vw';
    canvas.style.height = '100vh';
    canvas.style.objectFit = 'contain';
  }
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}
