/**
 * SplitText — port vanilla.
 * Asli: https://www.reactbits.dev/text-animations/split-text
 *       src/content/TextAnimations/SplitText/SplitText.jsx
 *
 * Komponen asli memakai plugin GSAP SplitText untuk memecah teks dan
 * ScrollTrigger untuk memicunya. Di sini pemecahan dilakukan manual ke
 * <span>, animasinya Web Animations API, pemicunya IntersectionObserver.
 *
 * Nama prop dan nilai default dipertahankan sama dengan komponen React-nya.
 */

import { applyState, onceInView, reducedMotion, toEasing, toKeyframe } from './utils.js';

/**
 * @param {HTMLElement} el elemen yang isinya akan dipecah (h1, p, ...).
 * @param {object} [options]
 * @param {string} [options.text] teks yang dipakai; default isi elemen.
 * @param {number} [options.delay=50] jeda antar potongan, dalam milidetik.
 * @param {number} [options.duration=1.25] durasi tiap potongan, dalam detik.
 * @param {string} [options.ease='power3.out'] nama easing GSAP.
 * @param {'chars'|'words'} [options.splitType='chars'] satuan pemecahan.
 * @param {object} [options.from] state awal, gaya gsap ({opacity, x, y, scale, rotate}).
 * @param {object} [options.to] state akhir.
 * @param {number} [options.threshold=0.1]
 * @param {string} [options.rootMargin='-100px']
 * @param {() => void} [options.onLetterAnimationComplete]
 */
export default function SplitText(el, options = {}) {
  const o = {
    text: null,
    className: '',
    delay: 50,
    duration: 1.25,
    ease: 'power3.out',
    splitType: 'chars',
    from: { opacity: 0, y: 40 },
    to: { opacity: 1, y: 0 },
    threshold: 0.1,
    rootMargin: '-100px',
    textAlign: null,
    onLetterAnimationComplete: null,
    ...options,
  };

  const source = o.text ?? el.textContent;
  const words = [];
  const chars = [];
  let observer = null;

  function build() {
    el.classList.add('split-parent');
    if (o.className) el.classList.add(...o.className.split(/\s+/).filter(Boolean));
    if (o.textAlign) el.style.textAlign = o.textAlign;
    el.textContent = '';

    // Pisah sambil menahan spasi supaya jarak antar kata tidak hilang.
    for (const token of String(source).split(/(\s+)/)) {
      if (token === '') continue;

      if (/^\s+$/.test(token)) {
        el.append(document.createTextNode(' '));
        continue;
      }

      const word = document.createElement('span');
      word.className = 'split-word';

      if (o.splitType.includes('chars')) {
        for (const char of token) {
          const span = document.createElement('span');
          span.className = 'split-char';
          span.textContent = char;
          word.append(span);
          chars.push(span);
        }
      } else {
        word.textContent = token;
      }

      el.append(word);
      words.push(word);
    }
  }

  function targets() {
    return o.splitType.includes('chars') && chars.length ? chars : words;
  }

  function play() {
    const list = targets();

    if (reducedMotion() || !list.length || !list[0].animate) {
      list.forEach((node) => applyState(node, o.to));
      o.onLetterAnimationComplete?.();
      return;
    }

    const keyframes = [toKeyframe(o.from), toKeyframe(o.to)];
    let last = null;

    list.forEach((node, i) => {
      last = node.animate(keyframes, {
        duration: o.duration * 1000,
        delay: i * o.delay,
        easing: toEasing(o.ease),
        fill: 'both',
      });
    });

    if (last && o.onLetterAnimationComplete) {
      last.onfinish = () => o.onLetterAnimationComplete();
    }
  }

  function start() {
    build();
    targets().forEach((node) => applyState(node, o.from));
    observer = onceInView(el, o.threshold, o.rootMargin, play);
  }

  // Komponen asli menunggu document.fonts.ready supaya lebar karakter tidak
  // berubah setelah dipecah. Di koneksi lambat itu membuat judul kosong
  // berdetik-detik, jadi di sini ditunggu font ATAU 800 ms, mana yang duluan.
  if (document.fonts && document.fonts.status !== 'loaded') {
    let started = false;
    const startOnce = () => {
      if (started) return;
      started = true;
      start();
    };
    document.fonts.ready.then(startOnce);
    setTimeout(startOnce, 800);
  } else {
    start();
  }

  return {
    element: el,
    get words() {
      return words;
    },
    get chars() {
      return chars;
    },
    destroy() {
      observer?.disconnect();
    },
  };
}
