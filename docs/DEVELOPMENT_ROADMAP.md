# DEVELOPMENT ROADMAP

Dokumen ini menetapkan tahapan pengembangan bertahap (*phased roadmap*) untuk pembangunan website portfolio **The Digital Playground**.

Setiap fase memiliki sasaran spesifik, daftar tugas, dan kriteria verifikasi yang wajib dipenuhi sebelum melanjutkan ke fase berikutnya.

> **Aturan Mutlak AI Agent:**
> AI Agent dilarang keras mengimplementasikan beberapa fase sekaligus dalam satu tugas tanpa persetujuan eksplisit.
> Selesaikan satu fase, jalankan verifikasi teknis, laporkan hasil, dan tunggu instruksi pengguna.

- Untuk pedoman operasional AI Agent, rujuk `AGENTS.md`.
- Untuk arsitektur teknis dan komponen, rujuk `TECHNICAL_ARCHITECTURE.md` dan `COMPONENT_STRUCTURE.md`.
- Untuk panduan desain visual dan monster, rujuk `VISUAL_DIRECTION.md` dan `MONSTER_CHARACTER_GUIDE.md`.

---

## 1. Ikhtisar Fase Pengembangan (Phases Overview)

| Fase | Nama Fase | Fokus Pekerjaan | Prioritas |
|---|---|---|---|
| **Phase 01** | Project Setup & Inspection | Audit repositori, konfigurasi Tailwind v4 di Vite, pembersihan boilerplate | Critical |
| **Phase 02** | Design Foundation | Token warna, tipografi Plus Jakarta Sans, shared UI components (`Button`, `Container`) | Critical |
| **Phase 03** | Main Layout & Sections | Struktur DOM 7 section lengkap (Hero s/d Footer) dengan placeholder monster | Critical |
| **Phase 04** | Monster Integration | Single Shared Canvas (R3F), pemuatan model 3D `.glb`, lighting studio, fallback | High |
| **Phase 05** | Animation & Interaction | GSAP ScrollTrigger timeline, Motion UI hover, pergerakan kamera sinematik | High |
| **Phase 06** | Portfolio Content | Pengisian data nyata (profil, proyek lengkap, riwayat karir, kontak) dari `src/data/` | High |
| **Phase 07** | Responsive & Optimization | Penyesuaian viewport mobile/tablet, DPR clamp, lazy loading, reduced motion | Critical |
| **Phase 08** | Testing & Final Polish | Audit lintas browser, validasi aksesibilitas, verifikasi lint & build produksi | Critical |

---

## 2. Rincian Setiap Fase

---

### Phase 01 — Project Setup & Inspection

#### Sasaran:
Memastikan seluruh konfigurasi tooling inti (Vite, Tailwind v4, TypeScript, ESLint) terhubung secara sempurna dan bebas dari residu template bawaan.

#### Daftar Tugas:
1. Konfigurasikan plugin `@tailwindcss/vite` di dalam `vite.config.ts`.
2. Bersihkan file `src/index.css` dari CSS boilerplate dan pasang `@import "tailwindcss";`.
3. Bersihkan file `src/App.tsx` dan `src/App.css` dari kode counter demo bawaan Vite.
4. Verifikasi eksekusi linting (`npm run lint`) dan build produksi (`npm run build`).

#### Kriteria Verifikasi:
- [ ] Plugin `@tailwindcss/vite` aktif di `vite.config.ts`.
- [ ] Utilitas Tailwind CSS berfungsi pada elemen antarmuka.
- [ ] `npm run lint` selesai dengan 0 error.
- [ ] `npm run build` menghasilkan bundle produksi tanpa error.

---

### Phase 02 — Design Foundation

#### Sasaran:
Membangun fondasi desain antarmuka berbasis `DESIGN_SYSTEM.md` sebelum menyusun section.

#### Daftar Tugas:
1. Hubungkan font keluarga `Plus Jakarta Sans` dan fallback sans-serif.
2. Definisikan token warna utama (`teal`, `stone`, `amber`) dalam tema CSS.
3. Bangun primitif komponen UI bersama:
   - `Container.tsx` (lebar maksimal dan padding konsisten)
   - `Button.tsx` (varian primary, secondary, ghost)
   - `Badge.tsx` (chip tag keahlian & teknologi)
   - `SectionHeading.tsx` (judul H2 standar & pengantar)
4. Buat komponen navigasi dasar (`Navbar.tsx` & `MobileMenu.tsx`).

#### Kriteria Verifikasi:
- [ ] Komponen UI bersama dapat digunakan kembali.
- [ ] Tipografi dan kontras warna sesuai standar aksesibilitas WCAG AA.
- [ ] Tata letak kontainer responsif pada desktop dan mobile.

---

### Phase 03 — Main Layout & Sections

#### Sasaran:
Membangun struktur konten lengkap seluruh 7 section portfolio dalam lapisan DOM semantik dengan placeholder monster visual, tanpa menunggu integrasi 3D.

#### Daftar Tugas:
Implementasikan 7 section di dalam `src/sections/`:
1. `Hero/` — H1 nama, pengantar singkat, CTA tombol, placeholder visual monster.
2. `About/` — Cerita profil developer, filosofi kerja, placeholder visual monster.
3. `Skills/` — Grid kategori keahlian teknis, placeholder visual monster.
4. `Experience/` — Garis waktu kronologis pengalaman kerja, placeholder visual monster.
5. `Projects/` — Grid kartu showcase karya (`ProjectCard.tsx`), placeholder visual monster.
6. `Contact/` — Saluran komunikasi langsung, form kontak, placeholder visual monster.
7. `Footer/` — Navigasi sekunder, copyright, penutup visual monster.

#### Kriteria Verifikasi:
- [ ] Seluruh 7 section tampil utuh dan dapat di-scroll secara alami.
- [ ] Karakter monster memiliki representasi visual di setiap section (termasuk Footer).
- [ ] Navigasi header melompat ke anchor ID yang sesuai.
- [ ] Tidak terjadi *horizontal overflow* pada viewport layar sempit.

---

### Phase 04 — Monster Integration (3D & WebGL)

#### Sasaran:
Mengintegrasikan modul karakter 3D Three.js + React Three Fiber menggunakan arsitektur **Single Shared Canvas**.

#### Daftar Tugas:
1. Siapkan aset 3D `monster-main.glb` teroptimasi di `public/models/monster/`.
2. Implementasikan `MonsterCanvas.tsx` dengan pencahayaan studio lembut (*soft studio lighting*) dan kamera perspektif.
3. Implementasikan `MonsterModel.tsx` menggunakan `useGLTF` dan pengontrol animasi skeletal (*animation clips*).
4. Implementasikan `MonsterController.tsx` dan `monsterSections.ts` untuk memetakan transformasi pose dan ekspresi berdasarkan section yang aktif.
5. Implementasikan `MonsterFallback.tsx` dengan render 2D elegan jika WebGL tidak didukung.

#### Kriteria Verifikasi:
- [ ] Model 3D monster berhasil dimuat tanpa error shader.
- [ ] Menggunakan tepat 1 Canvas WebGL yang fixed di latar belakang.
- [ ] Pose dan ekspresi monster beralih dengan halus saat section berubah.
- [ ] Fallback 2D aktif otomatis jika WebGL dinonaktifkan.

---

### Phase 05 — Animation & Interaction

#### Sasaran:
Menghidupkan alur visual melalui orkestrasi timeline GSAP ScrollTrigger dan micro-interactions Motion.

#### Daftar Tugas:
1. Konfigurasikan GSAP ScrollTrigger untuk menggerakkan kamera dan posisi monster secara sinematik seiring scroll pengguna.
2. Implementasikan siklus hidup pembersihan aman (`gsap.context()` / `ctx.revert()`).
3. Tambahkan animasi idle monster (breathing, blinking, subtle floating).
4. Tambahkan micro-interactions menggunakan Motion pada kartu proyek dan tombol antarmuka.
5. Implementasikan pengait `useReducedMotion` untuk mematikan pergerakan kamera ekstrem bagi pengguna yang sensitif.

#### Kriteria Verifikasi:
- [ ] Scrolling tetap responsif tanpa efek scroll-jacking yang menjebak.
- [ ] Tidak ada duplikasi ScrollTrigger atau kebocoran memori (*memory leaks*).
- [ ] Tidak terjadi benturan antara properti animasi GSAP dan Motion.
- [ ] Mode reduced motion berfungsi menonaktifkan gerakan kamera berlebih.

---

### Phase 06 — Portfolio Content

#### Sasaran:
Mengisi seluruh informasi portfolio dengan data akurat, jujur, dan berbobot tanpa data fiktif (*dummy data*).

#### Daftar Tugas:
1. Lengkapi berkas data di `src/data/`:
   - `profile.ts` (nama, headline, biografi singkat)
   - `skills.ts` (keahlian teknis terstruktur)
   - `experiences.ts` (perusahaan, jabatan, tahun, pencapaian)
   - `projects.ts` (nama proyek, gambar preview, deskripsi solusi, tech tags, link demo & repo)
   - `socialLinks.ts` (GitHub, LinkedIn, email)
2. Pastikan seluruh tautan eksternal memiliki atribut `rel="noopener noreferrer"`.

#### Kriteria Verifikasi:
- [ ] Data tersaji lengkap tanpa placeholder "Lorem Ipsum".
- [ ] Seluruh tautan proyek (demo dan repository) valid dan berfungsi.
- [ ] Kartu proyek menyajikan informasi dengan hierarki visual yang jelas.

---

### Phase 07 — Responsive & Optimization

#### Sasaran:
Mengoptimalkan pengalaman pengguna di berbagai perangkat (desktop, tablet, mobile) dan menjaga efisiensi daya.

#### Daftar Tugas:
1. Terapkan pembatasan resolusi canvas dengan `dpr={[1, 2]}`.
2. Nonaktifkan bayangan kompleks pada perangkat mobile.
3. Uji tata letak pada breakpoint: Mobile (375px–767px), Tablet (768px–1023px), Desktop (>= 1024px).
4. Pastikan target sentuh tombol minimal 44x44px pada layar sentuh.
5. Terapkan lazy loading pada gambar proyek.

#### Kriteria Verifikasi:
- [ ] Laju frame stabil di 60 FPS pada desktop dan 30–60 FPS pada mobile.
- [ ] Teks dan kartu proyek mudah dibaca tanpa saling bertumpuk dengan monster di layar kecil.
- [ ] Tidak terjadi penurunan performa atau lag saat scrolling cepat.

---

### Phase 08 — Testing & Final Polish

#### Sasaran:
Pengujian menyeluruh terhadap fungsionalitas, aksesibilitas, dan stabilitas sebelum publikasi.

#### Daftar Tugas:
1. Jalankan audit aksesibilitas keyboard (navigasi tombol Tab, penanda focus-visible).
2. Periksa kesesuaian atribut `aria-hidden="true"` pada elemen 3D.
3. Jalankan audit linting kode (`npm run lint`).
4. Jalankan build produksi (`npm run build`).
5. Uji tampilan visual dan responsivitas akhir.

#### Kriteria Verifikasi:
- [ ] `npm run lint` menghasilkan 0 error dan 0 warning.
- [ ] `npm run build` sukses menghasilkan direktori `dist/`.
- [ ] Tidak ada error atau warning yang tidak tertangani pada console browser.
- [ ] Dokumentasi perkembangan proyek diperbarui.
