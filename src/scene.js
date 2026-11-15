// Floating 3D slabs behind the page, drawn with Three.js.
// Black slabs and white planks cut like the CSS clip-paths, lit with a
// pink bounce so they sit in the poster. Scroll moves them past at different
// speeds (nearer ones faster), the pointer swings the camera a little.
// Built into /assets/scene.js by `npm run build` (see README).
import {
  WebGLRenderer, Scene, PerspectiveCamera, Shape, ExtrudeGeometry,
  MeshStandardMaterial, Mesh, AmbientLight, DirectionalLight, HemisphereLight,
  Group, MathUtils,
} from 'three';

export function start({ reduced = false, front = true } = {}) {
  const phone = matchMedia('(max-width: 700px)').matches;
  const canvas = document.createElement('canvas');
  canvas.className = front ? 'scene3d' : 'scene3d masked';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.prepend(canvas);

  let renderer;
  try {
    renderer = new WebGLRenderer({ canvas, antialias: !phone, alpha: true, powerPreference: 'low-power' });
  } catch (e) { canvas.remove(); return; }
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, phone ? 1.5 : 2));
  renderer.setClearColor(0x000000, 0);

  const scene = new Scene();
  const camera = new PerspectiveCamera(40, 1, 0.1, 100);
  camera.position.set(0, 0, 18);

  scene.add(new AmbientLight(0xffffff, 0.55));
  scene.add(new HemisphereLight(0xffffff, 0xfc0fc0, 1.4));
  const key = new DirectionalLight(0xffffff, 2.2);
  key.position.set(-6, 9, 10);
  scene.add(key);

  // A quad with slightly uneven corners, like the slabs' clip-path.
  function slabShape(w, h, seed) {
    const j = (n) => (Math.sin(seed * 12.9898 + n * 78.233) * 43758.5453 % 1) * 0.08;
    const s = new Shape();
    s.moveTo(-w / 2, -h / 2 + h * Math.abs(j(1)));
    s.lineTo(w / 2 - w * Math.abs(j(2)) * 0.2, -h / 2);
    s.lineTo(w / 2, h / 2 - h * Math.abs(j(3)));
    s.lineTo(-w / 2 + w * Math.abs(j(4)) * 0.2, h / 2);
    s.closePath();
    return s;
  }

  const black = new MeshStandardMaterial({ color: 0x0b0b0b, roughness: 0.55, metalness: 0.1 });
  const white = new MeshStandardMaterial({ color: 0xffffff, roughness: 0.8 });
  const hot = new MeshStandardMaterial({ color: 0x9e0078, roughness: 0.6 });

  const count = phone ? 9 : 16;
  const span = 26;               // world-units tall the slabs loop through
  const items = [];
  const group = new Group();
  scene.add(group);
  for (let i = 0; i < count; i++) {
    const r = (n) => { const x = Math.sin((i + 1) * 91.7 + n * 13.1) * 10000; return x - Math.floor(x); };
    const kind = i % 5 === 4 ? 'white' : i % 7 === 3 ? 'hot' : 'black';
    const w = kind === 'white' ? 5 + r(1) * 5 : 1.6 + r(1) * 3.6;
    const h = kind === 'white' ? 0.5 + r(2) * 0.5 : 0.6 + r(2) * 1.1;
    const depth = 0.25 + r(3) * 0.45;
    const geo = new ExtrudeGeometry(slabShape(w, h, i + 1), {
      depth, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.04, bevelSegments: 1, curveSegments: 1,
    });
    geo.center();
    const mesh = new Mesh(geo, kind === 'white' ? white : kind === 'hot' ? hot : black);
    const side = i % 2 ? 1 : -1;
    const z = -10 + r(4) * 12;   // -10 (far) .. 2 (near)
    mesh.userData = {
      side, fx: r(5),            // where across its side of the screen, 0 = inner edge, 1 = outer
      halfW: w / 2,
      y: (i / count) * span - span / 2,
      z,
      speed: 0.006 + (z + 10) * 0.0011,  // nearer slabs pass faster
      rx: (r(6) - 0.5) * 0.9, ry: (r(7) - 0.5) * 1.2, rz: (r(8) - 0.5) * 0.5,
      spin: (r(9) - 0.5) * 0.25,
      bob: r(10) * Math.PI * 2,
    };
    mesh.rotation.set(mesh.userData.rx, mesh.userData.ry, mesh.userData.rz);
    group.add(mesh);
    items.push(mesh);
  }

  // On install and guide pages the slabs stay in the margins beside the text
  // column, and a CSS mask hides anything that drifts into it.
  let w = 0, h = 0, colFrac = 0.3;
  function resize() {
    w = innerWidth; h = innerHeight;
    if (!front) {
      const col = (document.querySelector('main .inner') || {}).offsetWidth || 760;
      colFrac = Math.min(1, (col + 40) / w);
      canvas.style.setProperty('--col', (col + 40) + 'px');
    }
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();
  addEventListener('resize', resize, { passive: true });

  let px = 0, py = 0, tx = 0, ty = 0;
  addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    tx = (e.clientX / w - 0.5) * 2;
    ty = (e.clientY / h - 0.5) * 2;
  }, { passive: true });

  function frame(t) {
    const time = t / 1000;
    const sy = scrollY;
    px += (tx - px) * 0.05; py += (ty - py) * 0.05;
    camera.position.x = px * 1.4;
    camera.position.y = -py * 0.9;
    camera.lookAt(0, 0, -4);
    for (const m of items) {
      const d = m.userData;
      let y = d.y + sy * d.speed;
      y = ((y + span / 2) % span + span) % span - span / 2;
      const halfView = Math.tan(MathUtils.degToRad(camera.fov / 2)) * (camera.position.z - d.z) * camera.aspect;
      // Front page: keep clear of the big title, which sits left of centre.
      const inner = !front ? colFrac : w < 900 ? 0.15 : d.side < 0 ? 0.88 : 0.5;
      const x = d.side * ((inner + (1.05 - inner) * d.fx) * halfView + (front ? 0 : d.halfW * 0.6));
      m.position.set(x, y + Math.sin(time * 0.6 + d.bob) * 0.15, d.z);
      m.rotation.y = d.ry + (reduced ? 0 : time * d.spin) + sy * 0.0008;
      m.rotation.x = d.rx + Math.sin(time * 0.4 + d.bob) * 0.08;
    }
    renderer.render(scene, camera);
  }

  if (reduced) {
    // One still frame, redrawn only on scroll or resize.
    let queued = false;
    const draw = () => { queued = false; frame(0); };
    const ask = () => { if (!queued) { queued = true; requestAnimationFrame(draw); } };
    addEventListener('scroll', ask, { passive: true });
    addEventListener('resize', ask, { passive: true });
    draw();
  } else {
    let running = true;
    renderer.setAnimationLoop(frame);
    document.addEventListener('visibilitychange', () => {
      const vis = document.visibilityState === 'visible';
      if (vis !== running) { running = vis; renderer.setAnimationLoop(vis ? frame : null); }
    });
  }
  requestAnimationFrame(() => canvas.classList.add('on'));
}
