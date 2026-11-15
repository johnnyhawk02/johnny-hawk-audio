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

// The front title is a thin sheet with a very slow ripple running through it:
// each letter gets its own place in the wave (--i) and CSS does the motion.
const title = document.querySelector('#top .hero h1');
if (title && !reduced) {
  title.setAttribute('aria-label', [...title.querySelectorAll('span')].map((l) => l.textContent.trim()).join(' '));
  let i = 0;
  for (const line of title.querySelectorAll('span')) {
    line.setAttribute('aria-hidden', 'true');
    // Words stay whole (no breaks inside a word); letters ripple inside them.
    line.innerHTML = line.textContent.trim().split(/\s+/).map((word) =>
      `<i class="w">${[...word].map((c) => `<i class="ch" style="--i:${i++}">${c}</i>`).join('')}</i>`).join(' ');
    i += 2; // a little gap in the wave between lines
  }
  title.classList.add('ripple');
}

// The front title turns a little toward the mouse.
if (title && !reduced && fine) {
  let raf = 0;
  addEventListener('pointermove', (e) => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      title.style.setProperty('--ty', ((e.clientX / innerWidth - 0.5) * 12).toFixed(2) + 'deg');
      title.style.setProperty('--tx', ((0.5 - e.clientY / innerHeight) * 8).toFixed(2) + 'deg');
    });
  }, { passive: true });
}
