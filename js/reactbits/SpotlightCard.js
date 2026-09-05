/**
 * SpotlightCard — port vanilla.
 * Asli: https://www.reactbits.dev/components/spotlight-card
 *       src/content/Components/SpotlightCard/SpotlightCard.jsx
 *
 * Ini satu-satunya komponen yang tidak butuh library apa pun di versi
 * React-nya: seluruh efek ada di CSS, JavaScript-nya cuma memperbarui
 * dua custom property posisi kursor. Port ini 1:1.
 */

/**
 * @param {HTMLElement} el
 * @param {object} [options]
 * @param {string} [options.spotlightColor='rgba(255, 255, 255, 0.25)']
 */
export default function SpotlightCard(el, options = {}) {
  const o = { spotlightColor: 'rgba(255, 255, 255, 0.25)', ...options };

  el.classList.add('card-spotlight');

  function onMouseMove(event) {
    const rect = el.getBoundingClientRect();
    el.style.setProperty('--mouse-x', `${event.clientX - rect.left}px`);
    el.style.setProperty('--mouse-y', `${event.clientY - rect.top}px`);
    el.style.setProperty('--spotlight-color', o.spotlightColor);
  }

  el.addEventListener('mousemove', onMouseMove);

  return {
    element: el,
    setSpotlightColor(color) {
      o.spotlightColor = color;
      el.style.setProperty('--spotlight-color', color);
    },
    destroy() {
      el.removeEventListener('mousemove', onMouseMove);
    },
  };
}
