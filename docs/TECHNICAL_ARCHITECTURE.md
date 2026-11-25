# TECHNICAL ARCHITECTURE

Dokumen ini menetapkan arsitektur teknis, pembagian tanggung jawab teknologi, strategi rendering 3D, manajemen state, dan mekanisme fallback untuk portfolio **The Digital Playground**.

Tujuannya adalah membangun sistem aplikasi web yang berkinerja tinggi, stabil, mudah dipelihara, dan memiliki integrasi visual 3D yang mulus tanpa kompleksitas yang berlebihan.

- Untuk struktur hierarki folder dan komponen, rujuk `COMPONENT_STRUCTURE.md`.
- Untuk panduan motion dan integrasi GSAP, rujuk `ANIMATION_GUIDELINES.md`.
- Untuk anggaran poligon, tekstur, dan rendering budget, rujuk `PERFORMANCE_GUIDELINES.md`.

---

## 1. Sasaran Teknis Utama (Technical Goals)

1. **Single-Page Application (SPA):** Pengalaman navigasi cepat tanpa reload halaman.
2. **Keterpisahan Ranah (Separation of Concerns):** Konten teks berada di DOM semantik, sedangkan karakter monster berada di WebGL canvas.
3. **Efisiensi Sumber Daya GPU:** Menggunakan satu WebGL Canvas bersama (*Single Shared Canvas*) untuk seluruh alur halaman.
4. **Resilience & Progressive Enhancement:** Konten website tetap berfungsi 100% meskipun WebGL gagal dimuat atau dinonaktifkan.
5. **Zero Over-engineering:** Tidak menambahkan dependensi state management berat (Redux, Zustand) atau backend yang belum dibutuhkan.

> **Prinsip Utama:**
> *"Build the simplest architecture that can deliver the intended experience."*

---

## 2. Stack Teknologi & Pembagian Tanggung Jawab

Berdasarkan kondisi aktual repository, stack teknologi ditetapkan sebagai berikut:

| Kategori | Paket & Versi | Peran & Tanggung Jawab |
|---|---|---|
| **Core UI Framework** | `react` & `react-dom` (^19.3.1) | Struktur UI, hierarki komponen, lifecycle, dan interaksi dasar |
| **Language & Typings** | `typescript` (~6.0.3) | Type safety, pengetikan data portfolio, dan kontrak interface |
| **Build & Dev Tool** | `vite` (^8.3.6) | Bundler berkas produksi, HMR development, dan optimasi aset |
| **CSS & Design Engine**| `tailwindcss` & `@tailwindcss/vite` (^4.3.5) | Styling utilitas modern berbasis `@theme` CSS variables |
| **3D Engine** | `three` (^0.187.0) | Fondasi matematika 3D, scene graph, geometry, dan shaders |
| **React 3D Bridge** | `@react-three/fiber` (^9.8.2) | Pengelolaan scene Three.js deklaratif dalam siklus React 19 |
| **3D Helpers** | `@react-three/drei` (^10.7.9) | GLTF loader, kamera, controls, dan utilitas view |
| **Scroll Storytelling**| `gsap` (^3.15.1) + ScrollTrigger | Transisi antarseksi, sinkronisasi scroll, dan timeline posisi kamera/monster |
| **UI Motion** | `motion` (^14.14.0) | Animasi interaksi tombol, micro-interactions, dan transisi DOM |
| **Linter & Code Quality**| `eslint` (^10.14.0) + plugins | Penegakan aturan kode dan pencegahan bug hooks |

### Aturan Pemilihan & Penggunaan Dependensi:
- **Jangan memasang library tumpang tindih:** `motion` digunakan untuk interaksi UI DOM, sementara `gsap` digunakan untuk alur scroll storytelling.
- **Tailwind v4:** Menggunakan plugin `@tailwindcss/vite` di `vite.config.ts` dan direktif `@import "tailwindcss";` di CSS utama.
- **Package Manager:** Menggunakan `npm` secara konsisten sesuai `package-lock.json`.

---

## 3. Arsitektur Rendering: Single Shared Canvas vs Multiple Canvas

### Analisis & Keputusan Arsitektur:
Penggunaan beberapa Canvas WebGL terpisah (misal satu canvas per section) memiliki kelemahan fatal pada browser web:
1. **Batas Konteks WebGL (Context Limits):** Perangkat mobile (iOS Safari/Android Chrome) membatasi maksimal 8–16 WebGL contexts per tab. 7 canvas terpisah berisiko memicu *WebGL Context Lost* dan crash halaman.
2. **Overhead Memori GPU:** Setiap canvas mengalokasikan buffer memori terpisah, melipatgandakan konsumsi RAM/VRAM.
3. **Ketidaksinambungan Animasi:** Karakter monster tidak dapat berpindah posisi secara mulus antarseksi.

### Keputusan: Single Shared Canvas dengan Pengontrol Posisi
Website menggunakan **satu elemen Canvas WebGL tetap (*fixed background/overlay Canvas*)** yang melayani seluruh halaman:
- Scene 3D tetap aktif di latar belakang (atau menggunakan Drei `View` / portal jika diperlukan).
- GSAP ScrollTrigger menggerakkan posisi, rotasi, skala, dan kamera monster sesuai section yang sedang berada di viewport.
- Konten teks dan kartu proyek berada di atas canvas dalam lapisan DOM semantik dengan latar transparan.

```text
┌────────────────────────────────────────────────────────┐
│ DOM Layer (z-index: 10)                                │
│ ├── Navbar                                             │
│ ├── Sections (Hero -> About -> ... -> Footer)          │
│ └── HTML Buttons, Cards, Headings                      │
├────────────────────────────────────────────────────────┤
│ 3D WebGL Layer (z-index: 0 / Fixed Fullscreen)         │
│ └── Canvas (R3F)                                       │
│     ├── PerspectiveCamera (dikendalikan ScrollTrigger) │
│     ├── AmbientLight & DirectionalLight                │
│     └── MonsterScene (Model + Animation Clips)         │
└────────────────────────────────────────────────────────┘
```

---

## 4. Arsitektur Monster Module

Modul monster diisolasi agar tidak mengotori logika section portfolio:

```text
src/monster/
├── components/
│   ├── MonsterCanvas.tsx       # Canvas tunggal, lighting studio, setup kamera
│   ├── MonsterModel.tsx        # useGLTF loader, skeletal animations, material
│   └── MonsterFallback.tsx     # Render fallback 2D jika WebGL gagal
├── controllers/
│   └── MonsterController.tsx   # Sinkronisasi pose, ekspresi, dan posisi dengan scroll
├── config/
│   └── monsterSections.ts      # Konfigurasi pose/ekspresi per section
└── types/
    └── monster.types.ts        # Tipe TypeScript pose, ekspresi, koordinat
```

### Konfigurasi Deklaratif Section:
```ts
export interface MonsterSectionConfig {
  sectionId: string;
  expression: "happy" | "curious" | "thinking" | "focused" | "excited" | "welcoming" | "relaxed";
  animation: "idle" | "floating" | "waving" | "looking" | "reacting";
  position: [number, number, number];
  rotation: [number, number, number];
  scale: number;
}
```

---

## 5. Arsitektur Animasi & Integrasi Lifecycle

### 5.1 GSAP Context & React Lifecycle
Setiap timeline animasi berbasis scroll diinisialisasi dalam `gsap.context()` pada `useEffect` atau custom hook:
```tsx
useEffect(() => {
  const ctx = gsap.context(() => {
    // Definisi scroll trigger dan animasi
  });
  return () => ctx.revert(); // Wajib untuk mencegah memory leak
}, []);
```

### 5.2 Motion untuk Antarmuka DOM
Gunakan komponen dari `motion/react`:
```tsx
import { motion } from "motion/react";

export function ProjectCard({ title }: { title: string }) {
  return (
    <motion.article
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="bg-white rounded-lg p-6 border border-stone-200"
    >
      <h3>{title}</h3>
    </motion.article>
  );
}
```

---

## 6. Manajemen State (State Architecture)

1. **Local State First:** Interaksi kecil (menu terbuka/tutup, modal aktif, tab filter proyek) dikelola menggunakan `useState` standar React pada komponen bersangkutan.
2. **Active Section State:** Custom hook `useActiveSection` memanfaatkan `IntersectionObserver` untuk mengetahui section mana yang sedang aktif guna menandai menu navigasi dan memperbarui pose monster.
3. **No Heavy External Store:** Tidak memerlukan Redux, Zustand, atau Jotai. Pengelolaan data portfolio cukup menggunakan berkas data statis TypeScript di `src/data/`.

---

## 7. Arsitektur Penanganan Kegagalan & Fallback (WebGL Fallback)

Untuk menjamin keandalan (*robustness*):

1. **Deteksi Dukungan WebGL:** Periksa ketersediaan WebGL saat aplikasi pertama kali dimuat.
2. **Error Boundary 3D:** Bungkus `MonsterCanvas` dengan React Error Boundary khusus. Jika shader atau model gagal memuat:
   - Tangkap error secara diam-diam (*silent catch*).
   - Tampilkan komponen `MonsterFallback` (render gambar 2D WebP/SVG beresolusi tinggi).
   - Pastikan seluruh konten DOM tetap tampil sempurna.

---

## 8. Checklist Verifikasi Arsitektur

- [ ] Seluruh dependensi utama terpasang dan cocok versinya.
- [ ] Tailwind CSS v4 terintegrasi melalui plugin Vite.
- [ ] Menggunakan konsep Single Shared Canvas untuk mencegah crash konteks WebGL.
- [ ] Seluruh ScrollTrigger memiliki siklus `revert()` saat unmount.
- [ ] Fallback visual tersedia jika WebGL gagal.
- [ ] Kode lulus lint (`npm run lint`) dan build produksi (`npm run build`).
