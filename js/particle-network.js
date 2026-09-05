/**
 * ParticleNetwork — latar hero: titik melayang yang saling terhubung
 * garis ketika jaraknya cukup dekat.
 *
 * Ini bukan komponen React Bits. Efeknya ditulis sendiri di atas Three.js:
 * satu THREE.Points untuk simpulnya dan satu THREE.LineSegments untuk
 * garis penghubungnya, keduanya di dalam satu Group yang berputar pelan
 * dan sedikit mengikuti kursor.
 *
 * Garis dibangun sekali di awal, lalu Group-nya yang diputar. Jadi tidak
 * ada penghitungan jarak antar titik di setiap frame — hanya satu kali
 * saat inisialisasi.
 */

/** Bangun scene Three.js. Dipanggil setelah modul `three` selesai dimuat. */
function createNetwork(THREE, container, o) {
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setPixelRatio(o.pixelRatio);
  renderer.setClearColor(0x000000, 0);
  container.append(renderer.domElement);

  const camera = new THREE.PerspectiveCamera(o.fov, 1, 0.1, 100);
  camera.position.set(0, 0, o.cameraDistance);

  const scene = new THREE.Scene();
  const group = new THREE.Group();
  scene.add(group);

  /* ---------------- simpul ---------------- */

  const count = o.count;
  const positions = new Float32Array(count * 3);
  const points = [];

  for (let i = 0; i < count; i += 1) {
    // Sebaran dibuat lebih lebar daripada tinggi supaya mengisi hero yang
    // bentuknya memanjang ke samping.
    const v = new THREE.Vector3(
      (Math.random() - 0.5) * o.radius * 2.2,
      (Math.random() - 0.5) * o.radius * 1.3,
      (Math.random() - 0.5) * o.radius * 1.4
    );
    points.push(v);
    positions.set([v.x, v.y, v.z], i * 3);
  }

  const pointGeometry = new THREE.BufferGeometry();
  pointGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const pointMaterial = new THREE.PointsMaterial({
    color: new THREE.Color(o.pointColor),
    size: o.pointSize,
    transparent: true,
    opacity: o.pointOpacity,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  group.add(new THREE.Points(pointGeometry, pointMaterial));

  /* ---------------- garis penghubung ---------------- */

  // Buffer dipesan di muka. Tiap garis butuh 2 titik x 3 komponen.
  const maxLines = count * 6;
  const linePositions = new Float32Array(maxLines * 3 * 2);

  const lineGeometry = new THREE.BufferGeometry();
  const linePositionAttribute = new THREE.BufferAttribute(linePositions, 3);
  lineGeometry.setAttribute('position', linePositionAttribute);

  const lineMaterial = new THREE.LineBasicMaterial({
    color: new THREE.Color(o.lineColor),
    transparent: true,
    opacity: o.lineOpacity,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  group.add(new THREE.LineSegments(lineGeometry, lineMaterial));

  /** Hubungkan tiap pasang titik yang jaraknya di bawah linkDistance. */
  function buildLines() {
    let index = 0;

    for (let a = 0; a < count && index < maxLines; a += 1) {
      for (let b = a + 1; b < count && index < maxLines; b += 1) {
        if (points[a].distanceTo(points[b]) >= o.linkDistance) continue;

        linePositions.set(
          [points[a].x, points[a].y, points[a].z, points[b].x, points[b].y, points[b].z],
          index * 6
        );
        index += 1;
      }
    }

    lineGeometry.setDrawRange(0, index * 2);
    linePositionAttribute.needsUpdate = true;
  }

  buildLines();

  /* ---------------- ukuran ---------------- */

  function resize() {
    const width = container.clientWidth || 1;
    const height = container.clientHeight || 1;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }

  resize();
  window.addEventListener('resize', resize);

  let resizeObserver = null;
  if ('ResizeObserver' in window) {
    resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);
  }

  /* ---------------- gerak ---------------- */

  const frozen = Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
  let mouseX = 0;
  let mouseY = 0;

  function onPointerMove(event) {
    mouseX = event.clientX / window.innerWidth - 0.5;
    mouseY = event.clientY / window.innerHeight - 0.5;
  }

  if (!frozen) {
    window.addEventListener('pointermove', onPointerMove, { passive: true });
  }

  const clock = new THREE.Clock();
  let rafId = null;

  function animate() {
    rafId = requestAnimationFrame(animate);

    if (frozen) {
      group.rotation.y = 0.15;
    } else {
      const t = clock.getElapsedTime();
      group.rotation.y = t * 0.05 + mouseX * 0.4;
      group.rotation.x = Math.sin(t * 0.08) * 0.08 + mouseY * 0.25;
    }

    renderer.render(scene, camera);
  }

  rafId = requestAnimationFrame(animate);

  return {
    setColors(pointColor, lineColor) {
      pointMaterial.color.set(pointColor);
      lineMaterial.color.set(lineColor);
    },
    destroy() {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onPointerMove);
      resizeObserver?.disconnect();
      pointGeometry.dispose();
      lineGeometry.dispose();
      pointMaterial.dispose();
      lineMaterial.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}

/**
 * @param {HTMLElement} container elemen yang akan diisi <canvas>.
 * @param {object} [options]
 * @param {number} [options.count=90] jumlah simpul.
 * @param {number} [options.radius=8.5] radius dasar sebaran simpul.
 * @param {number} [options.linkDistance=4.6] jarak maksimum dua simpul
 *        masih ditarik garis.
 * @param {string} [options.pointColor='#8b7bff']
 * @param {string} [options.lineColor='#2fd8f0']
 * @param {number} [options.pointSize=0.11] dalam satuan dunia, bukan piksel.
 * @param {number} [options.pointOpacity=0.9]
 * @param {number} [options.lineOpacity=0.18]
 * @param {number} [options.fov=52]
 * @param {number} [options.cameraDistance=15]
 * @param {number} [options.pixelRatio=1]
 */
export default function ParticleNetwork(container, options = {}) {
  const o = {
    count: 90,
    radius: 8.5,
    linkDistance: 4.6,
    pointColor: '#8b7bff',
    lineColor: '#2fd8f0',
    pointSize: 0.11,
    pointOpacity: 0.9,
    lineOpacity: 0.18,
    fov: 52,
    cameraDistance: 15,
    pixelRatio: 1,
    ...options,
  };

  if (!container) return { destroy() {} };

  container.classList.add('canvas-layer');

  // Three.js berukuran sekitar satu megabita. Kalau di-import secara statis,
  // seluruh modul halaman ikut menunggu unduhannya selesai dan animasi teks
  // baru mulai beberapa detik kemudian. Dengan import dinamis, sisa halaman
  // jalan lebih dulu dan latar hero menyusul begitu Three.js siap.
  let instance = null;
  let disposed = false;
  let queued = null;

  import('three')
    .then((THREE) => {
      if (disposed) return;
      instance = createNetwork(THREE, container, o);
      if (queued) instance.setColors(...queued);
    })
    .catch((error) => {
      // Latar hero gagal dimuat bukan alasan halaman ikut berhenti.
      console.warn('ParticleNetwork: Three.js gagal dimuat, latar hero dilewati.', error);
    });

  return {
    element: container,
    /**
     * Dipakai saat tema berganti.
     * @param {string} pointColor
     * @param {string} lineColor
     */
    setColors(pointColor, lineColor) {
      if (instance) instance.setColors(pointColor, lineColor);
      else queued = [pointColor, lineColor];
    },
    destroy() {
      disposed = true;
      instance?.destroy();
    },
  };
}
