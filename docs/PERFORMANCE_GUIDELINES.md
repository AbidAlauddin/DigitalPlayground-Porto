# PERFORMANCE GUIDELINES

Dokumen ini menetapkan standar performa teknis, anggaran sumber daya grafis (*performance budgets*), optimasi WebGL, dan pedoman efisiensi untuk portfolio **The Digital Playground**.

Integrasi 3D dan animasi interaktif tidak boleh mengorbankan kecepatan halaman, responsivitas navigasi, atau kenyamanan pengguna perangkat seluler.

- Untuk arsitektur Single Shared Canvas, rujuk `TECHNICAL_ARCHITECTURE.md`.
- Untuk spesifikasi aset 3D monster, rujuk `MONSTER_CHARACTER_GUIDE.md`.
- Untuk durasi dan kurva animasi, rujuk `ANIMATION_GUIDELINES.md`.

---

## 1. Anggaran Performa WebGL & 3D (3D Resource Budgets)

Untuk menjamin laju frame konstan di **60 FPS pada desktop** dan **stabil 30–60 FPS pada mobile**, terapkan batasan ketat berikut:

| Parameter | Batas Desktop | Batas Mobile | Catatan |
|---|---|---|---|
| **Jumlah Poligon (Triangles)** | Maks. 50.000 tris | Maks. 30.000 tris | Model monster + objek pendukung |
| **Draw Calls per Frame** | Maks. 5 – 8 calls | Maks. 3 – 5 calls | Batasi jumlah mesh dan material terpisah |
| **Resolusi Tekstur** | Maks. 2048 x 2048 px | Maks. 1024 x 1024 px | Format WebP atau KTX2 terkompresi |
| **Device Pixel Ratio (DPR)** | `Math.min(dpr, 2)` | `Math.min(dpr, 1.5)` | **Wajib:** Batasi DPR untuk mencegah *fill-rate bottleneck* pada layar retina |
| **Shadows (Bayangan)** | Soft shadow teroptimasi | Contact shadow blob / dinonaktifkan | Hindari shadow map resolusi tinggi pada mobile |
| **Post-Processing** | Minimal / Subtle | Dinonaktifkan | Hindari Bloom atau SSAO berat |

---

## 2. Strategi Pemuatan Aset (Asset Loading Strategy)

Pengunjung tidak boleh dihadapkan pada layar kosong (*blank screen*) saat membuka website.

### Urutan Pemuatan Progresif:
1. **Langkah 1 (0 – 200ms):** Render struktur HTML, tipografi, navbar, dan konten teks Hero seketika dari bundle utama.
2. **Langkah 2 (200 – 500ms):** Tampilkan placeholder monster 2D halus di Hero section saat modul Three.js dimuat.
3. **Langkah 3 (Asinkron):** Model 3D monster `.glb` diunduh secara asinkron di latar belakang menggunakan `useGLTF`.
4. **Langkah 4 (Siap):** Setelah model siap, lakukan transisi *cross-fade* lembut dari placeholder ke model 3D aktif.

```tsx
// Pembatasan DPR pada Canvas React Three Fiber
<Canvas
  dpr={[1, 2]} // Otomatis mengunci DPR antara 1x hingga 2x
  gl={{ powerPreference: "high-performance", antialias: true }}
  camera={{ position: [0, 0, 5], fov: 45 }}
>
  {/* Konten 3D */}
</Canvas>
```

---

## 3. Efisiensi Runtime & Render Loop

- **Hindari Re-render State React Setiap Frame:** Jangan pernah menyimpan posisi koordinat mouse atau delta animasi per frame ke dalam `useState` React. Gunakan mutable `ref` Three.js dalam hook `useFrame`.
- **Visibilitas Viewport:** Gunakan `IntersectionObserver` untuk mematikan render loop karakter 3D saat tab browser tidak aktif atau saat scene berada di luar jangkauan pandang pengguna.
- **Pembersihan Memori (Dispose):** Saat komponen 3D di-unmount, pastikan geometri, tekstur, dan material dilepas dari memori GPU menggunakan `geometry.dispose()` dan `texture.dispose()`.

---

## 4. Optimasi Citra & Media (Image Optimization)

- **Format Citra Konten:** Gunakan format **WebP** untuk seluruh thumbnail proyek dan preview gambar di portfolio.
- **Dimensi Citra:** Sesuaikan ukuran gambar dengan kontainer tampilan; hindari memuat citra 4K untuk thumbnail kartu berukuran 400x250px.
- **Lazy Loading Native:** Terapkan `loading="lazy"` dan atribut `decoding="async"` pada gambar proyek di luar viewport pertama.

---

## 5. Optimasi Scroll & Animasi (GSAP & Motion)

- **Gunakan Transform & Opacity:** Animasikan hanya properti GPU-accelerated (`transform: translate3d/scale`, `opacity`). Hindari menganimasikan properti layout (`width`, `height`, `margin`, `top`, `left`).
- **Throttle Scroll Listeners:** GSAP ScrollTrigger secara otomatis mengoptimalkan update scroll pada siklus `requestAnimationFrame`. Jangan menambahkan custom event listener `window.onscroll` yang melakukan kalkulasi berat secara terpisah.

---

## 6. Metrik & Target Keberhasilan Performa

| Metrik | Target Desktop | Target Mobile |
|---|---|---|
| **Lighthouse Performance Score** | >= 90 | >= 85 |
| **First Contentful Paint (FCP)** | < 1.2 detik | < 1.8 detik |
| **Time to Interactive (TTI)** | < 2.5 detik | < 3.2 detik |
| **Cumulative Layout Shift (CLS)**| < 0.05 | < 0.05 |
| **Frame Rate Rendering** | Stabil 60 FPS | 30 – 60 FPS |

---

## 7. Checklist Verifikasi Performa

Sebelum melakukan rilis atau penggabungan kode:
- [ ] Model 3D monster berukuran <= 2MB setelah kompresi.
- [ ] Resolusi canvas di-clamp dengan `dpr={[1, 2]}`.
- [ ] Tidak ada re-render React berlebihan pada event mousemove atau scroll.
- [ ] Bayangan pada perangkat mobile disederhanakan.
- [ ] Gambar proyek menggunakan format WebP teroptimasi.
- [ ] Build produksi (`npm run build`) berjalan bersih tanpa warning bundle besar yang tidak terkendali.
