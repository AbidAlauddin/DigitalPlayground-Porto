# COMPONENT STRUCTURE

Dokumen ini menetapkan standar pengorganisasian komponen, arsitektur modul, struktur direktori `src/`, dan konvensi penamaan berkas untuk portfolio **The Digital Playground**.

Dokumen ini menjadi acuan struktur kode agar modular, tidak terjadi duplikasi komponen, dan mudah dipelihara.

- Untuk arsitektur teknis dan pemilihan library, rujuk `TECHNICAL_ARCHITECTURE.md`.
- Untuk token desain, ukuran, dan warna, rujuk `DESIGN_SYSTEM.md`.
- Untuk tahapan pengerjaan komponen per fase, rujuk `DEVELOPMENT_ROADMAP.md`.

---

## 1. Prinsip Organisasi Komponen

1. **Separation of Concerns:** Memisahkan komponen UI (DOM), komponen 3D (R3F), data statis, dan logika animasi.
2. **Reusable with Purpose:** Komponen bersama (*shared components*) dibuat hanya jika digunakan di lebih dari satu tempat (misal: `Button`, `Container`, `SectionHeading`).
3. **Single Responsibility:** Setiap komponen hanya bertanggung jawab atas satu tugas spesifik.
4. **Pemuatan Bertahap (Progressive Creation):** Folder dan berkas dibuat secara bertahap saat fase implementasi berjalan, **bukan** membuat puluhan berkas kosong di awal.

---

## 2. Struktur Direktori Sumber (`src/`)

Struktur target untuk aplikasi React + TypeScript + Vite:

```text
src/
├── app/
│   └── App.tsx                 # Komposisi utama layout dan susunan section
│
├── components/
│   ├── ui/                     # Primitif UI atomik
│   │   ├── Button.tsx          # Tombol varian primary & secondary
│   │   ├── Badge.tsx           # Tag/chip teknologi
│   │   └── Container.tsx       # Pembungkus lebar maksimal konten
│   │
│   ├── navigation/             # Komponen navigasi
│   │   ├── Navbar.tsx          # Navigasi sticky desktop & mobile trigger
│   │   └── MobileMenu.tsx      # Overlay menu navigasi mobile
│   │
│   └── common/                 # Komponen umum antar-section
│       ├── SectionHeading.tsx  # Standar judul dan pengantar section
│       └── SocialLinks.tsx     # Tautan jejaring sosial (GitHub, LinkedIn)
│
├── sections/                   # 7 Section utama halaman portfolio
│   ├── Hero/
│   │   ├── Hero.tsx
│   │   └── index.ts
│   ├── About/
│   │   ├── About.tsx
│   │   └── index.ts
│   ├── Skills/
│   │   ├── Skills.tsx
│   │   └── index.ts
│   ├── Experience/
│   │   ├── Experience.tsx
│   │   └── index.ts
│   ├── Projects/
│   │   ├── Projects.tsx
│   │   ├── ProjectCard.tsx
│   │   └── index.ts
│   ├── Contact/
│   │   ├── Contact.tsx
│   │   └── index.ts
│   └── Footer/
│       ├── Footer.tsx
│       └── index.ts
│
├── monster/                    # Modul terisolasi karakter 3D monster
│   ├── components/
│   │   ├── MonsterCanvas.tsx   # Canvas R3F tunggal, studio lighting, camera
│   │   ├── MonsterModel.tsx    # useGLTF loader & skeletal animation clips
│   │   └── MonsterFallback.tsx # Render 2D image saat WebGL gagal
│   ├── controllers/
│   │   └── MonsterController.tsx # Sinkronisasi pose monster dengan scroll
│   ├── config/
│   │   └── monsterSections.ts  # Konfigurasi pose & ekspresi tiap section
│   └── types/
│       └── monster.types.ts    # Tipe TypeScript pose, ekspresi, koordinat
│
├── animations/                 # Logika dan utilitas animasi terpusat
│   ├── gsap/
│   │   └── scrollTransitions.ts # Timeline scroll GSAP ScrollTrigger
│   └── motion/
│       └── variants.ts          # Varian animasi Motion (fade, scale, hover)
│
├── hooks/                      # Custom hooks pembantu
│   ├── useActiveSection.ts     # Deteksi section aktif melalui IntersectionObserver
│   ├── useReducedMotion.ts     # Deteksi preferensi reduced motion
│   └── useMediaQuery.ts        # Deteksi breakpoint responsif
│
├── data/                       # Konten data portfolio yang terpisah dari UI
│   ├── profile.ts              # Data identitas, bio, dan pengantar
│   ├── skills.ts               # Daftar keahlian teknis per kategori
│   ├── experiences.ts          # Riwayat pekerjaan & pengalaman
│   ├── projects.ts             # Data karya proyek (nama, demo, repo, tools)
│   └── socialLinks.ts          # URL sosial dan tautan kontak
│
├── config/
│   ├── navigation.ts           # Daftar link navigasi dan anchor IDs
│   └── site.ts                 # Metadata nama situs, SEO description
│
├── assets/                     # Aset lokal yang di-import langsung oleh Vite
│   └── images/
│
├── styles/
│   └── index.css               # Import Tailwind v4 (@import "tailwindcss";) & tema
│
└── main.tsx                    # Entry point aplikasi React
```

---

## 3. Tanggung Jawab Komposisi `App.tsx`

`App.tsx` bertindak sebagai orkestrator komposisi halaman, menghubungkan lapisan DOM dengan lapisan 3D Monster Canvas:

```tsx
export default function App() {
  return (
    <div className="relative min-h-screen bg-stone-50 text-stone-900 selection:bg-teal-200">
      {/* 1. Navigasi Sticky */}
      <Navbar />

      {/* 2. Lapisan 3D Single Shared Canvas (Fixed Background/Overlay) */}
      <div className="fixed inset-0 pointer-events-none z-0" aria-hidden="true">
        <MonsterCanvas />
      </div>

      {/* 3. Lapisan DOM Konten Semantik */}
      <main className="relative z-10 flex flex-col">
        <Hero />
        <About />
        <Skills />
        <Experience />
        <Projects />
        <Contact />
      </main>

      {/* 4. Footer */}
      <Footer />
    </div>
  );
}
```

---

## 4. Konvensi Penamaan Berkas (Naming Conventions)

| Tipe Berkas | Format Penamaan | Contoh |
|---|---|---|
| **Komponen React** | PascalCase `.tsx` | `ProjectCard.tsx`, `MonsterCanvas.tsx` |
| **Custom Hook** | camelCase diawali `use` `.ts` | `useActiveSection.ts`, `useReducedMotion.ts` |
| **Berkas Data** | camelCase `.ts` | `projects.ts`, `skills.ts` |
| **Berkas Konfigurasi** | camelCase `.ts` | `monsterSections.ts`, `navigation.ts` |
| **Tipe TypeScript** | domain `.types.ts` | `monster.types.ts`, `portfolio.types.ts` |
| **Utilitas / Helper** | camelCase `.ts` | `cn.ts`, `formatDate.ts` |
| **Folder Section** | PascalCase | `Hero/`, `About/`, `Projects/` |

---

## 5. Pemisahan Data dari Presentasi (Data Layer)

Konten teks portfolio **dilarang di-hardcode** langsung di dalam JSX section. Semua data wajib didefinisikan secara terstruktur di folder `src/data/` lengkap dengan kontrak TypeScript.

Contoh `src/data/projects.ts`:
```ts
export interface ProjectItem {
  id: string;
  title: string;
  description: string;
  technologies: string[];
  thumbnail: string;
  demoUrl?: string;
  repoUrl?: string;
}

export const projectsData: ProjectItem[] = [
  // Data proyek terstruktur
];
```

Keuntungan: Mempermudah pembaruan data portfolio kapan pun tanpa merusak styling atau struktur visual.
