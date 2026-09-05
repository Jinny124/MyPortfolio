/**
 * Titik masuk halaman: memasang komponen React Bits ke markup di
 * index.html dan menyambungkannya ke pengganti tema.
 *
 * Elemen dipilih lewat atribut data-*, jadi menambah kartu baru di HTML
 * cukup dengan menyalin atributnya, tanpa menyentuh file ini.
 */

import {
  AnimatedContent,
  GradientText,
  SpotlightCard,
  SplitText,
  TiltedCard,
} from './reactbits/index.js';

import ParticleNetwork from './particle-network.js';
import { currentPalette, restoreTheme, setupThemeToggle } from './theme.js';

restoreTheme();

/** Instance yang warnanya perlu ikut berganti saat tema diganti. */
const themed = [];

/* ---------------- latar hero: jaring partikel ---------------- */

const heroNetwork = ParticleNetwork(document.getElementById('hero-canvas'), {
  count: 90,
  radius: 8.5,
  linkDistance: 4.6,
  pointColor: currentPalette().point,
  lineColor: currentPalette().line,
  pixelRatio: Math.min(window.devicePixelRatio || 1, 2),
});

/* ---------------- SplitText + GradientText: judul hero ---------------- */

/** Indeks kata pada judul hero yang diberi gradien: "sistem" dan "web". */
const GRADIENT_WORDS = [1, 5];

const heroHeading = SplitText(document.getElementById('hero-heading'), {
  splitType: 'words',
  delay: 60,
  duration: 0.9,
  ease: 'power3.out',
  from: { opacity: 0, y: 40 },
  to: { opacity: 1, y: 0 },
  threshold: 0.1,
  rootMargin: '0px',
  onLetterAnimationComplete() {
    // Gradien dipasang setelah animasi selesai supaya pemecahan kata dan
    // pembungkusan .text-content tidak saling menimpa.
    for (const index of GRADIENT_WORDS) {
      const word = heroHeading.words[index];
      if (!word) continue;

      themed.push(
        GradientText(word, {
          colors: currentPalette().gradient,
          animationSpeed: 7,
          inline: true,
          yoyo: true,
        })
      );
    }
  },
});

/* ---------------- GradientText: judul kontak ---------------- */

themed.push(
  GradientText(document.getElementById('grad-terhubung'), {
    colors: currentPalette().gradient,
    animationSpeed: 7,
    inline: true,
    yoyo: true,
  })
);

/* ---------------- AnimatedContent: seluruh blok bertanda ---------------- */

for (const el of document.querySelectorAll('[data-animated-content]')) {
  AnimatedContent(el, {
    distance: 40,
    direction: 'vertical',
    duration: 0.8,
    ease: 'power3.out',
    threshold: 0.15,
    delay: Number.parseFloat(el.dataset.acDelay ?? '0'),
    onComplete() {
      // Bar keahlian baru diisi setelah kartunya benar-benar terlihat.
      const bar = el.querySelector('.skill-bar-fill');
      if (bar) bar.style.width = `${bar.dataset.level}%`;
    },
  });
}

/* ---------------- SpotlightCard ---------------- */

for (const el of document.querySelectorAll('[data-spotlight]')) {
  SpotlightCard(el, {
    spotlightColor:
      el.dataset.spotlight === 'accent'
        ? 'rgba(139,123,255,0.30)'
        : 'rgba(47,216,240,0.28)',
  });
}

/* ---------------- TiltedCard ---------------- */

for (const el of document.querySelectorAll('[data-tilt]')) {
  TiltedCard(el, {
    // Default React Bits 14 derajat; diturunkan karena ini kartu teks,
    // bukan gambar, dan kemiringan besar membuat teks sulit dibaca.
    rotateAmplitude: 9,
    // Default 1.1 membuat kartu saling tindih di dalam grid.
    scaleOnHover: 1.03,
    captionText: el.dataset.caption ?? '',
    showTooltip: Boolean(el.dataset.caption),
  });
}

/* ---------------- sorot latar mengikuti kursor ---------------- */

const spot = document.getElementById('bg-spot');
if (spot && !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
  window.addEventListener(
    'pointermove',
    (event) => {
      spot.style.setProperty('--mx', `${((event.clientX / window.innerWidth) * 100).toFixed(1)}%`);
      spot.style.setProperty('--my', `${((event.clientY / window.innerHeight) * 100).toFixed(1)}%`);
    },
    { passive: true }
  );
}

/* ---------------- tombol tema ---------------- */

setupThemeToggle(document.getElementById('theme-toggle'), (palette) => {
  heroNetwork.setColors(palette.point, palette.line);
  themed.forEach((instance) => instance.setColors(palette.gradient));
});
