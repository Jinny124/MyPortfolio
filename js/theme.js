/**
 * Pengelolaan tema gelap/terang.
 *
 * Urutan penentuan tema:
 *   1. pilihan pengguna yang tersimpan di localStorage
 *   2. preferensi sistem (prefers-color-scheme)
 *
 * Nilai warna sebenarnya ada di css/tokens.css; file ini hanya
 * memasang atribut data-theme di elemen <html>.
 */

const STORAGE_KEY = 'jinny-theme';
const root = document.documentElement;

/** Palet yang dipakai komponen React Bits, disamakan dengan token CSS. */
export const PALETTES = {
  dark: {
    point: '#8b7bff',
    line: '#2fd8f0',
    gradient: ['#8b7bff', '#2fd8f0', '#ff6f9c'],
  },
  light: {
    point: '#5a43e0',
    line: '#0a8aa0',
    gradient: ['#5a43e0', '#0a8aa0', '#c8306e'],
  },
};

/** Baca pilihan tersimpan. Mode penyamaran bisa melarang akses. */
function readStored() {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === 'light' || value === 'dark' ? value : null;
  } catch {
    return null;
  }
}

function writeStored(value) {
  try {
    localStorage.setItem(STORAGE_KEY, value);
  } catch {
    // Penyimpanan diblokir; tema tetap jalan, hanya tidak diingat.
  }
}

/** Terapkan pilihan tersimpan sebelum halaman digambar. */
export function restoreTheme() {
  const stored = readStored();
  if (stored) root.setAttribute('data-theme', stored);
}

/** @returns {boolean} apakah tampilan saat ini gelap. */
export function isDark() {
  const explicit = root.getAttribute('data-theme');
  if (explicit === 'dark') return true;
  if (explicit === 'light') return false;
  return !window.matchMedia?.('(prefers-color-scheme: light)').matches;
}

/** @returns {{point: string, line: string, gradient: string[]}} palet tema aktif. */
export function currentPalette() {
  return isDark() ? PALETTES.dark : PALETTES.light;
}

/**
 * Pasang tombol pengganti tema.
 * @param {HTMLElement} button
 * @param {(palette: {point: string, line: string, gradient: string[]}) => void} onChange
 */
export function setupThemeToggle(button, onChange) {
  if (!button) return;

  button.addEventListener('click', () => {
    const next = isDark() ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    writeStored(next);
    onChange?.(currentPalette());
  });
}
