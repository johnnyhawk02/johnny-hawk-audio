// Depth for the poster: bands fold up into place as they scroll in and
// product cards lean toward the mouse. Plain DOM, no dependencies.
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
const root = document.documentElement;
root.classList.add('d3');

// Bands: --fold runs 1 -> 0 as a band's top rises from the bottom of the
// screen to two thirds of the way up. CSS turns that into a rotateX.
const bands = [...document.querySelectorAll('.band, main > .section')];
if (!reduced && bands.length) {
  let queued = false;
  const update = () => {
    queued = false;
    const vh = innerHeight;
    // At the very bottom everything lies flat, so a short last band never stays tilted.
    const end = scrollY + vh >= root.scrollHeight - 4;
    for (const b of bands) {
      const top = b.getBoundingClientRect().top;
      const f = end ? 0 : Math.min(1, Math.max(0, (top - vh * 0.35) / (vh * 0.65)));
      b.style.setProperty('--fold', f.toFixed(3));
    }
  };
  const ask = () => { if (!queued) { queued = true; requestAnimationFrame(update); } };
  addEventListener('scroll', ask, { passive: true });
  addEventListener('resize', ask, { passive: true });
  update();
}

// Product cards lean toward the pointer (mouse only).
if (!reduced && fine) {
  for (const card of document.querySelectorAll('.product')) {
    const band = card.closest('.band');
    let raf = 0;
    band.addEventListener('pointermove', (e) => {
      const r = band.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        card.style.setProperty('--ry', (x * 9).toFixed(2) + 'deg');
        card.style.setProperty('--rx', (-y * 7).toFixed(2) + 'deg');
      });
    });
    band.addEventListener('pointerleave', () => {
      cancelAnimationFrame(raf);
      card.style.setProperty('--ry', '0deg');
      card.style.setProperty('--rx', '0deg');
    });
  }
}
