# PROJECT STRUCTURE

Dokumen ini menetapkan struktur organisasi direktori, pemisahan aset statis versus aset sumber, dan konvensi penempatan berkas untuk proyek **The Digital Playground**.

Dokumen ini menjadi pedoman navigasi repositori agar struktur tetap bersih, rapi, dan mudah dikelola selama fase pengembangan.

- Untuk pembagian modul dan hierarki komponen React, rujuk `COMPONENT_STRUCTURE.md`.
- Untuk arsitektur teknis dan dependensi, rujuk `TECHNICAL_ARCHITECTURE.md`.
- Untuk urutan fase pengerjaan, rujuk `DEVELOPMENT_ROADMAP.md`.

---

## 1. Kondisi Aktual Repositori vs Struktur Target

### 1.1 Kondisi Awal Repositori
Repositori dibangun menggunakan scaffold **Vite 8 + React 19 + TypeScript**:
- Berkas konfigurasi utama berada di root: `package.json`, `vite.config.ts`, `tsconfig.json`, `eslint.config.js`.
- Direktori dokumentasi berada di `docs/`.
- Direktori kode sumber berada di `src/` (saat ini berisi template dasar `App.tsx`, `main.tsx`, `index.css`).
- Direktori aset statis berada di `public/`.

### 1.2 Aturan Pembentukan Struktur (Progressive Growth)
> **Penting:** Jangan membuat seluruh struktur folder dan berkas kosong sekaligus di awal.
> Buat direktori dan berkas secara bertahap hanya saat fase pengerjaan yang bersangkutan membutuhkannya.

---

## 2. Struktur Root Direktori Target

```text
digital-playground/
├── AGENTS.md               # Pedoman utama operasional AI Agent
├── README.md               # Dokumentasi pengantar proyek
├── eslint.config.js        # Konfigurasi ESLint flat config
├── index.html              # Entry point HTML aplikasi & SEO meta tags
├── package.json            # Daftar dependensi & script proyek
├── tsconfig.json           # Konfigurasi referensi TypeScript
├── tsconfig.app.json       # Konfigurasi compiler TypeScript untuk src
├── tsconfig.node.json      # Konfigurasi compiler TypeScript untuk tooling
├── vite.config.ts          # Konfigurasi bundler Vite (@tailwindcss/vite)
│
├── docs/                   # 11 Berkas dokumentasi arsitektur & panduan proyek
│   ├── PROJECT_OVERVIEW.md
│   ├── VISUAL_DIRECTION.md
│   ├── DESIGN_SYSTEM.md
│   ├── MONSTER_CHARACTER_GUIDE.md
│   ├── ANIMATION_GUIDELINES.md
│   ├── USER_EXPERIENCE.md
│   ├── TECHNICAL_ARCHITECTURE.md
│   ├── COMPONENT_STRUCTURE.md
│   ├── PERFORMANCE_GUIDELINES.md
│   ├── PROJECT_STRUCTURE.md
│   └── DEVELOPMENT_ROADMAP.md
│
├── public/                 # Aset statis yang dilayani langsung oleh web server
│   ├── favicon.svg         # Favicon browser
│   ├── icons.svg           # Sprite SVG ikon
│   ├── models/             # Berkas 3D model .glb
│   │   └── monster/
│   │       └── monster-main.glb
│   └── images/             # Gambar statis & fallback
│       ├── fallback/
│       └── previews/
│
└── src/                    # Seluruh kode sumber aplikasi React & TypeScript
    ├── app/                # Komposisi layout utama (App.tsx)
    ├── components/         # Komponen UI bersama (ui/, navigation/, common/)
    ├── sections/           # 7 Section halaman (Hero, About, Skills, Experience, Projects, Contact, Footer)
    ├── monster/            # Modul 3D monster (components/, controllers/, config/, types/)
    ├── animations/         # Utilitas animasi GSAP & Motion (gsap/, motion/)
    ├── hooks/              # Custom React hooks (useActiveSection, useReducedMotion)
    ├── data/               # Konten portfolio statis (projects, skills, experience, profile)
    ├── config/             # Konfigurasi navigasi & situs
    ├── assets/             # Aset yang di-import langsung oleh bundler
    ├── styles/             # Berkas CSS global (Tailwind v4 @import)
    └── main.tsx            # Entry point React DOM
```

---

## 3. Pemisahan Aset: `public/` vs `src/assets/`

Untuk menghindari duplikasi berkas, terapkan aturan pemisahan aset berikut:

### Gunakan `public/` untuk:
- Model 3D (`.glb`, `.gltf`) yang dimuat secara dinamis via URL path melalui loader Three.js/Drei (misal: `/models/monster/monster-main.glb`).
- Gambar fallback statis darurat (`/images/fallback/monster-fallback.webp`).
- Favicon browser dan sprite ikon statis.

### Gunakan `src/assets/` untuk:
- Citra lokal dan ikon yang di-import langsung di dalam berkas komponen TypeScript (misal: `import heroImg from '@/assets/hero.png'`), di mana Vite dapat mengoptimalkan hashing dan inlining berkas secara otomatis.

---

## 4. Konfigurasi Tooling Inti

### 4.1 Vite & Tailwind CSS v4 (`vite.config.ts`)
Integrasi resmi Tailwind CSS v4 dengan Vite menggunakan `@tailwindcss/vite`:
```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
})
```

### 4.2 Styling Entry Point (`src/styles/index.css`)
Pada Tailwind v4, inisialisasi dilakukan secara modern melalui direktif CSS baku:
```css
@import "tailwindcss";

@layer base {
  html {
    scroll-behavior: smooth;
  }
  body {
    background-color: var(--color-stone-50);
    color: var(--color-stone-900);
    font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
  }
}
```

---

## 5. Aturan Pembuatan & Pemeliharaan Berkas

1. **Periksa Sebelum Membuat:** Pastikan fungsionalitas serupa belum ada di repositori sebelum membuat modul baru.
2. **Hindari Abstraksi Dini:** Jangan membuat pembungkus (*wrapper*) tanpa nilai tambah fungsionalitas.
3. **Pembersihan Berkas Usang:** Hapus berkas boilerplate template bawaan Vite yang tidak lagi digunakan saat tahap implementasi dimulai.
