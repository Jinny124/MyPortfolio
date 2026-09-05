/**
 * GradientText — port vanilla.
 * Asli: https://www.reactbits.dev/text-animations/gradient-text
 *       src/content/TextAnimations/GradientText/GradientText.jsx
 *
 * Komponen asli menggerakkan background-position lewat useAnimationFrame
 * dan useMotionValue dari `motion`. Di sini dipakai requestAnimationFrame
 * biasa dengan perhitungan progres yang sama persis, termasuk mode yoyo.
 */

import { reducedMotion } from './utils.js';

/**
 * @param {HTMLElement} el elemen yang isinya akan diberi gradien.
 * @param {object} [options]
 * @param {string[]} [options.colors]
 * @param {number} [options.animationSpeed=8] detik untuk satu lintasan.
 * @param {boolean} [options.showBorder=false]
 * @param {'horizontal'|'vertical'|'diagonal'} [options.direction='horizontal']
 * @param {boolean} [options.pauseOnHover=false]
 * @param {boolean} [options.yoyo=true]
 * @param {boolean} [options.inline=false] tambahan di luar komponen asli:
 *        pakai true kalau elemen ini satu kata di tengah kalimat.
 */
export default function GradientText(el, options = {}) {
  const o = {
    colors: ['#5227FF', '#FF9FFC', '#B497CF'],
    animationSpeed: 8,
    showBorder: false,
    direction: 'horizontal',
    pauseOnHover: false,
    yoyo: true,
    inline: false,
    ...options,
  };

  el.classList.add('animated-gradient-text');
  if (o.inline) el.classList.add('inline');
  if (o.showBorder) el.classList.add('with-border');

  // Susun ulang isi elemen mengikuti struktur JSX aslinya:
  // [.gradient-overlay] + .text-content
  const content = document.createElement('span');
  content.className = 'text-content';
  while (el.firstChild) content.append(el.firstChild);

  let overlay = null;
  if (o.showBorder) {
    overlay = document.createElement('span');
    overlay.className = 'gradient-overlay';
    el.append(overlay);
  }
  el.append(content);

  const angle =
    o.direction === 'horizontal'
      ? 'to right'
      : o.direction === 'vertical'
        ? 'to bottom'
        : 'to bottom right';

  const size =
    o.direction === 'horizontal'
      ? '300% 100%'
      : o.direction === 'vertical'
        ? '100% 300%'
        : '300% 300%';

  function paint(node) {
    // Warna pertama diulang di akhir supaya sambungan loop tidak terlihat.
    const stops = [...o.colors, o.colors[0]].join(', ');
    node.style.backgroundImage = `linear-gradient(${angle}, ${stops})`;
    node.style.backgroundSize = size;
    node.style.backgroundRepeat = 'repeat';
  }

  function position(progress) {
    return o.direction === 'vertical' ? `50% ${progress}%` : `${progress}% 50%`;
  }

  function setPosition(progress) {
    const pos = position(progress);
    content.style.backgroundPosition = pos;
    if (overlay) overlay.style.backgroundPosition = pos;
  }

  paint(content);
  if (overlay) paint(overlay);

  const duration = o.animationSpeed * 1000;
  let elapsed = 0;
  let lastTime = null;
  let paused = false;
  let raf = null;

  if (o.pauseOnHover) {
    el.addEventListener('mouseenter', () => {
      paused = true;
      lastTime = null;
    });
    el.addEventListener('mouseleave', () => {
      paused = false;
    });
  }

  function frame(time) {
    raf = requestAnimationFrame(frame);

    if (paused) {
      lastTime = null;
      return;
    }
    if (lastTime === null) {
      lastTime = time;
      return;
    }

    elapsed += time - lastTime;
    lastTime = time;

    let progress;
    if (o.yoyo) {
      const cycle = elapsed % (duration * 2);
      progress =
        cycle < duration
          ? (cycle / duration) * 100
          : 100 - ((cycle - duration) / duration) * 100;
    } else {
      progress = (elapsed / duration) * 100;
    }

    setPosition(progress.toFixed(2));
  }

  if (reducedMotion()) {
    setPosition(50);
  } else {
    raf = requestAnimationFrame(frame);
  }

  return {
    element: el,
    /** Dipakai saat tema berganti supaya gradien ikut warna baru. */
    setColors(colors) {
      o.colors = colors;
      paint(content);
      if (overlay) paint(overlay);
    },
    destroy() {
      if (raf) cancelAnimationFrame(raf);
    },
  };
}
