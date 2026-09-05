/**
 * Utilitas bersama untuk port vanilla komponen React Bits.
 *
 * Komponen asli bersandar pada tiga library:
 *   gsap    -> tween + easing + ScrollTrigger
 *   motion  -> useSpring, useAnimationFrame
 *   ogl     -> renderer WebGL
 *
 * File ini menyediakan penggantinya memakai API browser saja:
 * Web Animations API, IntersectionObserver, requestAnimationFrame,
 * dan satu integrator pegas sederhana.
 */

/** @returns {boolean} true kalau pengguna minta animasi dikurangi. */
export function reducedMotion() {
  return Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
}

/**
 * Padanan easing GSAP ke cubic-bezier CSS.
 * Penamaan GSAP: power1 = quad, power2 = cubic, power3 = quart, power4 = quint.
 */
export const EASES = {
  none: 'linear',
  linear: 'linear',
  'power1.in': 'cubic-bezier(0.55,0.085,0.68,0.53)',
  'power1.out': 'cubic-bezier(0.25,0.46,0.45,0.94)',
  'power1.inOut': 'cubic-bezier(0.455,0.03,0.515,0.955)',
  'power2.in': 'cubic-bezier(0.55,0.055,0.675,0.19)',
  'power2.out': 'cubic-bezier(0.215,0.61,0.355,1)',
  'power2.inOut': 'cubic-bezier(0.645,0.045,0.355,1)',
  'power3.in': 'cubic-bezier(0.895,0.03,0.685,0.22)',
  'power3.out': 'cubic-bezier(0.165,0.84,0.44,1)',
  'power3.inOut': 'cubic-bezier(0.77,0,0.175,1)',
  'power4.in': 'cubic-bezier(0.755,0.05,0.855,0.06)',
  'power4.out': 'cubic-bezier(0.23,1,0.32,1)',
  'power4.inOut': 'cubic-bezier(0.86,0,0.07,1)',
  'expo.out': 'cubic-bezier(0.19,1,0.22,1)',
  'back.out': 'cubic-bezier(0.175,0.885,0.32,1.275)',
  'circ.out': 'cubic-bezier(0.075,0.82,0.165,1)',
};

/**
 * @param {string} name nama easing GSAP, atau cubic-bezier() apa adanya.
 * @returns {string} nilai easing yang dimengerti CSS.
 */
export function toEasing(name) {
  if (!name) return 'ease-out';
  if (name.startsWith('cubic-bezier')) return name;
  return EASES[name] ?? EASES[`${name}.out`] ?? 'ease-out';
}

/** Angka dianggap piksel; string dipakai apa adanya. */
export function len(value) {
  return typeof value === 'number' ? `${value}px` : String(value);
}

/**
 * Ubah objek gaya gsap-like menjadi satu keyframe CSS.
 * @param {{opacity?:number, x?:number|string, y?:number|string, scale?:number, rotate?:number}} state
 */
export function toKeyframe(state) {
  const parts = [];
  if (state.x != null) parts.push(`translateX(${len(state.x)})`);
  if (state.y != null) parts.push(`translateY(${len(state.y)})`);
  if (state.scale != null) parts.push(`scale(${state.scale})`);
  if (state.rotate != null) parts.push(`rotate(${state.rotate}deg)`);

  return {
    opacity: state.opacity != null ? String(state.opacity) : '1',
    transform: parts.length ? parts.join(' ') : 'none',
  };
}

/** Tulis satu state langsung ke gaya inline elemen. */
export function applyState(el, state) {
  const kf = toKeyframe(state);
  el.style.opacity = kf.opacity;
  el.style.transform = kf.transform;
}

/**
 * Padanan ScrollTrigger `{ start: "top <pct>%", once: true }`.
 * Bukan sama persis secara piksel, tapi memicu pada ambang yang sama
 * dan hanya sekali.
 *
 * Selain IntersectionObserver dipasang juga pemeriksaan manual sebagai
 * cadangan: sebagian browser tidak mengirim callback IntersectionObserver
 * selama tab belum pernah ditampilkan. Tanpa cadangan itu, isi halaman
 * bisa tertinggal pada opacity 0 di tab latar.
 *
 * @param {HTMLElement} el
 * @param {number} threshold
 * @param {string} rootMargin
 * @param {() => void} callback
 * @returns {{disconnect: () => void}}
 */
export function onceInView(el, threshold, rootMargin, callback) {
  let done = false;
  let observer = null;
  let timer = null;

  function teardown() {
    observer?.disconnect();
    clearTimeout(timer);
    window.removeEventListener('scroll', check);
    window.removeEventListener('resize', check);
  }

  function finish() {
    if (done) return;
    done = true;
    teardown();
    callback();
  }

  /** Hitung sendiri seberapa banyak elemen yang masuk viewport. */
  function check() {
    const rect = el.getBoundingClientRect();
    const viewport = window.innerHeight || document.documentElement.clientHeight;
    const visible = Math.min(rect.bottom, viewport) - Math.max(rect.top, 0);
    if (visible <= 0) return;

    // Elemen yang lebih tinggi dari layar tidak akan pernah memenuhi
    // rect.height * threshold, jadi ambangnya dibatasi setengah viewport.
    const needed = Math.min(rect.height * threshold, viewport * 0.5);
    if (visible >= needed) finish();
  }

  if ('IntersectionObserver' in window) {
    observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) finish();
      },
      { threshold: Math.min(Math.max(threshold, 0), 1), rootMargin }
    );
    observer.observe(el);

    // Kalau setelah 1,5 detik observer belum bicara, lanjutkan dengan
    // pemeriksaan manual yang dipicu scroll dan resize.
    timer = setTimeout(() => {
      if (done) return;
      check();
      if (done) return;
      window.addEventListener('scroll', check, { passive: true });
      window.addEventListener('resize', check);
    }, 1500);
  } else {
    check();
    window.addEventListener('scroll', check, { passive: true });
    window.addEventListener('resize', check);
  }

  return {
    disconnect() {
      done = true;
      teardown();
    },
  };
}

/**
 * Integrator pegas massa-peredam, padanan `useSpring` dari motion.
 * Dipakai TiltedCard supaya kurva geraknya sama dengan komponen asli.
 */
export class Spring {
  constructor(value, { stiffness, damping, mass }) {
    this.value = value;
    this.target = value;
    this.velocity = 0;
    this.stiffness = stiffness;
    this.damping = damping;
    this.mass = mass;
  }

  set(target) {
    this.target = target;
  }

  /** Lompat ke nilai tanpa animasi. */
  jump(value) {
    this.value = value;
    this.target = value;
    this.velocity = 0;
  }

  step(dt) {
    const force = -this.stiffness * (this.value - this.target);
    const damper = -this.damping * this.velocity;
    this.velocity += ((force + damper) / this.mass) * dt;
    this.value += this.velocity * dt;
    return this.value;
  }

  settled() {
    return Math.abs(this.velocity) < 0.01 && Math.abs(this.value - this.target) < 0.01;
  }
}

/* ------------------------------------------------------------------
   Satu requestAnimationFrame dipakai bersama semua pegas di halaman.
   Loop berhenti sendiri saat tidak ada yang bergerak, lalu dibangunkan
   lagi lewat wakeTickers().
   ------------------------------------------------------------------ */

const tickers = [];
let running = false;
let lastTime = 0;

function frame(now) {
  const dt = Math.min((now - lastTime) / 1000, 1 / 30);
  lastTime = now;

  let alive = false;
  for (const tick of tickers) {
    if (tick(dt)) alive = true;
  }

  if (alive) requestAnimationFrame(frame);
  else running = false;
}

/** @param {(dt: number) => boolean} tick kembalikan true selama masih bergerak. */
export function addTicker(tick) {
  tickers.push(tick);
  wakeTickers();
}

export function wakeTickers() {
  if (running) return;
  running = true;
  lastTime = performance.now();
  requestAnimationFrame(frame);
}
