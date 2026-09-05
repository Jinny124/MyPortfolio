/**
 * AnimatedContent — port vanilla.
 * Asli: https://www.reactbits.dev/animations/animated-content
 *       src/content/Animations/AnimatedContent/AnimatedContent.jsx
 *
 * Komponen asli memakai timeline GSAP yang dipicu ScrollTrigger.
 * Di sini dipakai Web Animations API + IntersectionObserver.
 *
 * Catatan penting: state awal dipasang dari JavaScript, bukan dari CSS.
 * Jadi kalau JavaScript gagal jalan, seluruh isi halaman tetap terbaca
 * penuh, bukan tertinggal pada opacity 0.
 */

import { applyState, onceInView, reducedMotion, toEasing, toKeyframe } from './utils.js';

/**
 * @param {HTMLElement} el
 * @param {object} [options]
 * @param {number} [options.distance=100] jarak geser awal, dalam piksel.
 * @param {'vertical'|'horizontal'} [options.direction='vertical']
 * @param {boolean} [options.reverse=false] balik arah datangnya.
 * @param {number} [options.duration=0.8] dalam detik.
 * @param {string} [options.ease='power3.out']
 * @param {number} [options.initialOpacity=0]
 * @param {boolean} [options.animateOpacity=true]
 * @param {number} [options.scale=1] skala awal.
 * @param {number} [options.threshold=0.1]
 * @param {number} [options.delay=0] dalam detik.
 * @param {() => void} [options.onComplete]
 */
export default function AnimatedContent(el, options = {}) {
  const o = {
    distance: 100,
    direction: 'vertical',
    reverse: false,
    duration: 0.8,
    ease: 'power3.out',
    initialOpacity: 0,
    animateOpacity: true,
    scale: 1,
    threshold: 0.1,
    delay: 0,
    onComplete: null,
    ...options,
  };

  const axis = o.direction === 'horizontal' ? 'x' : 'y';
  const offset = o.reverse ? -o.distance : o.distance;

  const from = {
    [axis]: offset,
    scale: o.scale,
    opacity: o.animateOpacity ? o.initialOpacity : 1,
  };
  const to = { [axis]: 0, scale: 1, opacity: 1 };

  if (reducedMotion() || !el.animate) {
    applyState(el, to);
    o.onComplete?.();
    return { element: el, destroy() {} };
  }

  applyState(el, from);

  const observer = onceInView(el, o.threshold, '0px', () => {
    const animation = el.animate([toKeyframe(from), toKeyframe(to)], {
      duration: o.duration * 1000,
      delay: o.delay * 1000,
      easing: toEasing(o.ease),
      fill: 'both',
    });

    animation.onfinish = () => {
      // Kunci hasil akhir ke gaya inline lalu lepas animasinya, supaya
      // elemen tidak lagi bergantung pada fill:'both'.
      applyState(el, to);
      animation.cancel();
      o.onComplete?.();
    };
  });

  return {
    element: el,
    destroy() {
      observer.disconnect();
    },
  };
}
