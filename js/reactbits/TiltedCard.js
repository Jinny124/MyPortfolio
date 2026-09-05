/**
 * TiltedCard — port vanilla.
 * Asli: https://www.reactbits.dev/components/tilted-card
 *       src/content/Components/TiltedCard/TiltedCard.jsx
 *
 * Komponen asli memakai useSpring dari `motion`. Di sini dipakai
 * integrator pegas sendiri dengan konfigurasi yang sama persis
 * (springValues: damping 30, stiffness 100, mass 2), jadi kurva
 * geraknya sama.
 *
 * Perbedaan struktur: versi React membungkus sebuah <img> di dalam
 * .tilted-card-figure yang memegang perspective. Di sini tilt dipasang
 * langsung ke kartu berisi teks, jadi perspective ikut masuk ke dalam
 * transform kartu.
 */

import { reducedMotion, Spring, addTicker, wakeTickers } from './utils.js';

/** Nilai pegas yang sama dengan springValues di komponen asli. */
const SPRING_VALUES = { damping: 30, stiffness: 100, mass: 2 };

/** Default useSpring milik motion, dipakai komponen asli untuk opacity. */
const OPACITY_SPRING = { stiffness: 100, damping: 10, mass: 1 };

/** Konfigurasi rotateFigcaption di komponen asli. */
const CAPTION_SPRING = { stiffness: 350, damping: 30, mass: 1 };

/**
 * @param {HTMLElement} el
 * @param {object} [options]
 * @param {number} [options.rotateAmplitude=14] derajat maksimum kemiringan.
 * @param {number} [options.scaleOnHover=1.1]
 * @param {string} [options.captionText='']
 * @param {boolean} [options.showTooltip=true]
 * @param {number} [options.perspective=800]
 */
export default function TiltedCard(el, options = {}) {
  const o = {
    rotateAmplitude: 14,
    scaleOnHover: 1.1,
    captionText: '',
    showTooltip: true,
    perspective: 800,
    ...options,
  };

  if (reducedMotion()) return { element: el, destroy() {} };

  el.classList.add('tilted-card');

  const rotateX = new Spring(0, SPRING_VALUES);
  const rotateY = new Spring(0, SPRING_VALUES);
  const scale = new Spring(1, SPRING_VALUES);
  const opacity = new Spring(0, OPACITY_SPRING);
  const rotateCaption = new Spring(0, CAPTION_SPRING);

  let caption = null;
  if (o.showTooltip && o.captionText) {
    caption = document.createElement('figcaption');
    caption.className = 'tilted-card-caption';
    caption.textContent = o.captionText;
    el.append(caption);
  }

  let captionX = 0;
  let captionY = 0;
  let lastOffsetY = 0;
  let hovering = false;

  function onMouseMove(event) {
    const rect = el.getBoundingClientRect();
    const offsetX = event.clientX - rect.left - rect.width / 2;
    const offsetY = event.clientY - rect.top - rect.height / 2;

    rotateX.set((offsetY / (rect.height / 2)) * -o.rotateAmplitude);
    rotateY.set((offsetX / (rect.width / 2)) * o.rotateAmplitude);

    captionX = event.clientX - rect.left;
    captionY = event.clientY - rect.top;

    // Tooltip dimiringkan mengikuti kecepatan gerak vertikal kursor.
    rotateCaption.set(-(offsetY - lastOffsetY) * 0.6);
    lastOffsetY = offsetY;

    wakeTickers();
  }

  function onMouseEnter() {
    hovering = true;
    scale.set(o.scaleOnHover);
    opacity.set(1);
    wakeTickers();
  }

  function onMouseLeave() {
    hovering = false;
    opacity.set(0);
    scale.set(1);
    rotateX.set(0);
    rotateY.set(0);
    rotateCaption.set(0);
    wakeTickers();
  }

  el.addEventListener('mousemove', onMouseMove);
  el.addEventListener('mouseenter', onMouseEnter);
  el.addEventListener('mouseleave', onMouseLeave);

  addTicker((dt) => {
    const moving =
      hovering ||
      !rotateX.settled() ||
      !rotateY.settled() ||
      !scale.settled() ||
      !opacity.settled() ||
      !rotateCaption.settled();

    if (!moving) return false;

    rotateX.step(dt);
    rotateY.step(dt);
    scale.step(dt);
    opacity.step(dt);
    rotateCaption.step(dt);

    el.style.transform =
      `perspective(${o.perspective}px) ` +
      `rotateX(${rotateX.value.toFixed(3)}deg) ` +
      `rotateY(${rotateY.value.toFixed(3)}deg) ` +
      `scale(${scale.value.toFixed(4)})`;

    if (caption) {
      caption.style.opacity = Math.max(0, opacity.value).toFixed(3);
      caption.style.transform =
        `translate(${captionX.toFixed(1)}px, ${captionY.toFixed(1)}px) ` +
        `rotate(${rotateCaption.value.toFixed(2)}deg)`;
    }

    return true;
  });

  return {
    element: el,
    destroy() {
      el.removeEventListener('mousemove', onMouseMove);
      el.removeEventListener('mouseenter', onMouseEnter);
      el.removeEventListener('mouseleave', onMouseLeave);
    },
  };
}
