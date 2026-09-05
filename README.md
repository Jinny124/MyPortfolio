# jinny.dev — Portofolio

Portofolio satu halaman untuk Jinny (System Analyst · Web Developer · QA).
Dibangun dengan HTML, CSS, dan JavaScript murni — tanpa framework, tanpa
bundler, tanpa `npm install`.

Efek teksnya dan kartunya adalah port vanilla dari komponen
[React Bits](https://www.reactbits.dev/). Latar hero berupa jaring partikel
digambar sendiri di atas [Three.js](https://threejs.org/).

---

## Menjalankan

Halaman ini memakai ES Module, jadi harus dibuka lewat HTTP, bukan dengan
klik dua kali berkas `index.html`. Pilih salah satu cara:

**Live Server (paling mudah di VS Code)**

Pasang ekstensi Live Server — VS Code akan menawarkannya otomatis karena
sudah terdaftar di `.vscode/extensions.json`. Lalu klik kanan `index.html`
→ **Open with Live Server**.

**Python**

```bash
py -3 -m http.server 5500
```

Buka `http://localhost:5500`.

**Node**

```bash
npx serve .
```

> Kalau `index.html` dibuka langsung tanpa server, seluruh teks dan tata
> letak tetap tampil normal — yang hilang hanya animasi dan partikelnya,
> karena browser menolak memuat modul dari `file://`.

---

## Struktur berkas

```
MyPorto2026/
├── index.html              # markup halaman
├── css/
│   ├── tokens.css          # variabel warna, radius, font (gelap & terang)
│   ├── base.css            # reset, tipografi dasar, .container
│   ├── reactbits.css       # CSS komponen React Bits
│   ├── layout.css          # latar, navigasi, tombol, hero, footer
│   └── sections.css        # Tentang, Keahlian, Proyek, Kontak
└── js/
    ├── main.js             # memasang komponen ke elemen di index.html
    ├── theme.js            # tema gelap/terang + palet warna
    ├── particle-network.js # latar hero: titik + garis penghubung (Three.js)
    └── reactbits/
        ├── index.js        # titik ekspor semua komponen
        ├── utils.js        # easing, keyframe, pegas, ticker bersama
        ├── SplitText.js
        ├── GradientText.js
        ├── AnimatedContent.js
        ├── SpotlightCard.js
        └── TiltedCard.js
```

---

## Komponen React Bits

Lima komponen diport dari React ke JavaScript biasa. Nama prop dan nilai
default dipertahankan, jadi dokumentasi di reactbits.dev tetap berlaku.

| Komponen | Dependensi asli | Pengganti di sini |
| --- | --- | --- |
| `SplitText` | `gsap` + ScrollTrigger + plugin SplitText | Web Animations API + IntersectionObserver |
| `GradientText` | `motion` (`useAnimationFrame`) | `requestAnimationFrame` |
| `AnimatedContent` | `gsap` + ScrollTrigger | Web Animations API + IntersectionObserver |
| `SpotlightCard` | — | sudah vanilla dari aslinya, disalin 1:1 |
| `TiltedCard` | `motion` (`useSpring`) | integrator pegas sendiri, konfigurasi sama |

Pola pemakaiannya seragam:

```js
import { SpotlightCard } from './reactbits/index.js';

const card = SpotlightCard(element, { spotlightColor: 'rgba(139,123,255,0.3)' });
card.destroy(); // lepas semua listener
```

### Penyimpangan yang disengaja

Semuanya ditandai komentar di berkas terkait:

- `GradientText` aslinya mengunci warna latar border ke `#120F17`. Di sini
  dipakai `var(--bg-elevated)` supaya tema terang tidak rusak. Ditambahkan
  juga varian `.inline` untuk memakai gradien pada satu kata di tengah kalimat.
- `TiltedCard` aslinya membungkus `<img>`. Di sini tilt dipasang ke kartu
  berisi teks, dan `scaleOnHover` diturunkan dari `1.1` ke `1.03` karena
  nilai aslinya membuat kartu saling tindih di dalam grid.
- `SplitText` aslinya hanya menunggu `document.fonts.ready`. Di koneksi
  lambat itu membuat judul hero kosong beberapa detik, jadi ditambahkan
  batas waktu 800 ms.
- Three.js dimuat lewat `import('three')` dinamis, bukan `import` statis.
  Berkasnya sekitar satu megabita; kalau di-import statis, seluruh modul
  halaman menunggu unduhannya selesai dan animasi teks baru mulai beberapa
  detik kemudian.
- `onceInView()` di `utils.js` memasang pemeriksaan viewport manual sebagai
  cadangan IntersectionObserver. Sebagian browser tidak mengirim callback
  observer selama tab belum pernah ditampilkan, dan tanpa cadangan itu isi
  halaman bisa tertinggal pada `opacity 0`.

---

## Latar hero

`js/particle-network.js` — bukan komponen React Bits, ditulis sendiri.
Sembilan puluh titik disebar acak di dalam kotak yang lebih lebar daripada
tinggi, lalu tiap pasang titik yang jaraknya di bawah `linkDistance` ditarik
garis. Semuanya masuk satu `THREE.Group` yang berputar pelan dan sedikit
mengikuti kursor.

Garis dihitung sekali saat inisialisasi, bukan tiap frame — yang bergerak
hanya rotasi grupnya. Nilai yang biasa disetel:

| Opsi | Bawaan | Efek |
| --- | --- | --- |
| `count` | `90` | jumlah titik |
| `radius` | `8.5` | radius dasar sebaran |
| `linkDistance` | `4.6` | makin besar, makin rapat jaringnya |
| `pointSize` | `0.11` | ukuran titik, satuan dunia bukan piksel |
| `lineOpacity` | `0.18` | ketebalan kesan garis |
| `cameraDistance` | `15` | makin kecil, makin dekat dan besar |

Warnanya diambil dari `PALETTES` di `js/theme.js` (`point` dan `line`), jadi
ikut berganti saat tema diubah.

---

## Menyunting isi

Sebagian besar perubahan cukup dilakukan di `index.html`.

**Menambah kartu keahlian atau proyek** — salin satu blok kartu yang sudah
ada. Atribut `data-*` yang menyalakan komponen:

| Atribut | Efek |
| --- | --- |
| `data-animated-content` | kartu meluncur masuk saat di-scroll |
| `data-ac-delay="0.08"` | jeda animasi masuk, dalam detik |
| `data-spotlight` | sorot mengikuti kursor (warna toska) |
| `data-spotlight="accent"` | sorot mengikuti kursor (warna ungu) |
| `data-tilt` | kartu miring 3D saat hover |
| `data-caption="Teks"` | tooltip yang mengikuti kursor |
| `data-level="72"` | persentase bar keahlian |

**Mengubah warna** — semua nilai ada di `css/tokens.css`. Kalau warna aksen
diubah, samakan juga daftar warna di `PALETTES` pada `js/theme.js`, karena
partikel dan gradien teks membaca dari sana.

**Mengubah judul hero** — tulis kalimat baru di `<h1 id="hero-heading">`,
lalu sesuaikan `GRADIENT_WORDS` di `js/main.js` (indeks kata dihitung dari
nol) supaya kata yang diberi gradien tetap pas.

---

## Yang masih perlu diisi

- Tautan detail di tiga kartu proyek masih `href="#"`.
- Tombol Email, GitHub, dan LinkedIn di bagian Kontak masih `href="#"`.
- Isi proyek masih contoh; ganti dengan studi kasus asli.
