# PROGRESS TRACKING — THE DIGITAL PLAYGROUND

Dokumen ini mencatat kemajuan pengembangan bertahap proyek **The Digital Playground** sesuai arahan [AGENTS.md](file:///Users/macbook/Documents/Projects/digital-playground/AGENTS.md) dan [docs/DEVELOPMENT_ROADMAP.md](file:///Users/macbook/Documents/Projects/digital-playground/docs/DEVELOPMENT_ROADMAP.md).

---

## Status Fase Pengembangan

| Fase | Nama Fase | Status | Tanggal Penyelesaian | Catatan |
|---|---|---|---|---|
| **Phase 01** | Project Setup & Inspection | **SELESAI** | 2026-11-16 | Integrasi Tailwind v4, `@tailwindcss/vite`, pembersihan template lama, sanitasi linter & build. |
| **Phase 02 & 03** | Full-Page Layout, Section Navigation & Smooth Scroll | **SELESAI** | 2026-11-17 | Layout frame pastel + kanvas putih ber-radius, text-only navbar, 6 section lengkap, GSAP Observer full-page scroll, `MonsterPlaceholder` siap pakai tanpa asset monster. |
| **Refinement** | Adaptive Frame Spacing & Responsive Canvas | **SELESAI** | 2026-11-17 | Implementasi sistem `--shell-inset` & `--shell-radius` terpadu simetris 4 sisi (top=bottom=left=right), lulus uji Playwright di 6 resolusi (16:9, 16:10, 4:3, 21:9, Ultrawide, Mobile). |
| **Refinement** | Subtle Navbar Fade & Backdrop Blur | **SELESAI** | 2026-11-17 | Lapisan top fade gradient + feathered backdrop blur masked (`z-index: 20`, `pointer-events: none`) di bawah navbar (`z-index: 30`) untuk transisi konten mulus tanpa tabrakan visual. |
| **Refinement** | Mobile Hamburger Navigation & Full-Screen Menu | **SELESAI** | 2026-11-17 | Navigasi mobile editorial full-screen overlay ber-nomor (`01`–`06`) di dalam kanvas utama, animated 3-bar hamburger/close toggle, focus trap, escape key, dan background gesture lock. Lulus uji 320px–1440px. |
| **Refinement** | Section Header Top Clearance & Overlay Tuning | **SELESAI** | 2026-11-17 | Menyetel jarak padding atas section menjadi proporsional `pt-20 sm:pt-22 md:pt-24 lg:pt-24` (80px–96px) dan tinggi overlay menjadi `clamp(56px, 7.5vh, 68px)`. Judul halaman tampil kompak langsung di bawah navbar tanpa jeda kosong berlebihan dan bebas dari efek blur. |
| **Refinement** | Consistent Vertical Spacing Across All Sections | **SELESAI** | 2026-11-17 | Mengadopsi sistem vertical inset terpusat `--section-vertical-inset: clamp(24px, 4vh, 44px)` & `--navbar-height: clamp(56px, 7vh, 64px)`. `Top spacing` (navbar bottom ke top content) dan `Bottom spacing` (bottom content ke canvas bottom) seimbang sempurna dengan deviasi deviasi ≤ 1.0px di seluruh 6 section. |
| **Refinement** | Top Spacing Adjustment & Internal Header Grouping | **SELESAI** | 2026-11-17 | Memisahkan `--section-top-inset` dan `--section-bottom-inset` agar konten bagian atas lebih dekat ke navbar (`35.1px` pada 900p, `38px–40px` pada 1080p dari batas bawah aktual navbar), memadatkan jarak category label ke heading, dan mempertahankan jarak bawah 100% tetap (`37.0px` pada 900p, `42.2px–44.2px` pada 1080p). |
| **Refinement** | Responsive Scroll Indicator & Bottom Utility Row Alignment | **SELESAI** | 2026-11-17 | Arsitektur `BottomUtilityRow` terpadu: desktop single-row shared baseline (center Y = 815.5px, 70px safe gap) bebas tabrakan; mobile bottom-center dengan layout 2 baris terpisah dan `--mobile-scroll-safe-space` reserved safe space (158px clearance untuk About Item 3). Lulus uji di 10 resolusi (desktop, tablet, mobile). |
| **Refinement** | Global Content Width & Contact Footer Alignment | **SELESAI** | 2026-11-17 | Memperlebar max-width konten utama menjadi 1360px (`.page-container`) dengan padding adaptif `clamp(20px, 4vw, 64px)`. Menyatukan horizontal guideline navbar, header, content, footer, dan scroll indicator. Memperbaiki garis divider Contact menjadi separator independen di atas utility row (clearance 15px di atas lingkaran Scroll Up). |
| **Phase 04** | Monster Mascot Integration | **SELESAI (Hero, About, Skills, Experience, Projects)** | 2026-11-22 | Hero: Yeti CC0. About: Cactoro CC0 + Developer Workspace. Skills: Monkroose CC0 (*The Skill Builder*). Experience: Archivist Frog CC0 (*The Career Archivist*). Projects: Showcase Operator Dino CC0 (*The Showcase Operator — The Little Project Controller*) dengan headset, boom mic, topi operator, vest, ID card `"PROJECT OPERATOR"`, sarung tangan, dan sinkronisasi 2-Bone IK langsung ke pagination existing `01`–`06`. |
| **Phase 05** | Animation & Interaction | *Belum Dimulai* | — | GSAP timeline kamera sinematik, micro-interactions Motion. |
| **Phase 06** | Portfolio Content Polish | **SELESAI** | 2026-11-17 | Pembaruan total seluruh data & konten portfolio (Hero, About, Skills, Experience, Projects, Contact, Metadata) berdasarkan profil & repositori GitHub riil @AbidAlauddin (Abid Alauddin, UNNES). 100% fakta terverifikasi, zero data fiktif. |
| **Phase 07** | Responsive & Optimization | *Sebagian Siap* | — | Mobile fluid scroll dan desktop Observer gesture lock telah terverifikasi. |
| **Phase 08** | Testing & Final Polish | *Menunggu Akhir* | — | Pengujian lintas browser dan audit aksesibilitas akhir. |

---

## Log Implementasi Terakhir (Phase 02 & 03)

1. **Analisis Video Referensi:** Menyusun [docs/REFERENCE_ANALYSIS.md](file:///Users/macbook/Documents/Projects/digital-playground/docs/REFERENCE_ANALYSIS.md) berdasarkan analisis frame dari `reference.mov`.
2. **Arsitektur Komposisi:** Mengimplementasikan outer frame pastel hangat (`#ECE6DA`) dengan kartu kanvas utama off-white (`#FCFBF9`) ber-rounded corner halus dan margin viewport luas.
3. **Navbar Text-Only:** Menu horizontal murni teks (`HOME`, `ABOUT`, `SKILLS`, `EXPERIENCE`, `PROJECTS`, `CONTACT`) tanpa button/card/pill/ikon, dengan active state penanda opacity/warna halus.
4. **Sistem Navigasi Full-Page:** Menggunakan GSAP Observer pada desktop dengan lock 1 gesture = 1 section transition (bebas scroll-jacking bertumpuk) dan navigasi keyboard (`ArrowDown`, `ArrowUp`, `PageDown`, `PageUp`, `Home`, `End`).
5. **6 Section Lengkap:** Mengembangkan `HeroSection`, `AboutSection`, `SkillsSection`, `ExperienceSection`, `ProjectsSection`, dan `ContactSection`.
6. **Sistem MonsterPlaceholder:** Menyediakan kontainer penempatan terstruktur di setiap section tanpa menggunakan gambar monster palsu, stiker, emoji, atau border visual.
7. **Verifikasi:** Lolos uji linting (`npm run lint`), build produksi (`npm run build`), dan inspeksi visual responsif via browser Playwright.
8. **Penyempurnaan Spacing & Navbar Blur:**
   - Mengadopsi CSS Custom Property `--shell-inset` & `--shell-radius` terpadu 4 sisi (top = right = bottom = left).
   - Mengimplementasikan `.navbar-fade-overlay` dengan feathered backdrop blur (`mask-image: linear-gradient`) dan background gradient `#FCFBF9`, menjaga teks navbar tetap tajam (`z-index: 30`) dan konten di baliknya bertransisi secara lembut (`z-index: 20`, `pointer-events: none`).
9. **Navigasi Mobile & Full-Screen Menu:**
   - Mengganti menu horizontal desktop dengan tombol hamburger animasi 3-bar morph pada viewport `< 1024px`.
   - Mengembangkan `MobileMenu` berbasis Motion `AnimatePresence` yang mengisi seluruh area kanvas utama secara adaptif (`border-radius: inherit`).
   - Menyajikan daftar bernomor vertikal (`01 HOME` hingga `06 CONTACT`) dengan tipografi editorial tegas, active state tersinkronisasi, dan touch targets minimal 44px.
   - Mengunci scroll gesture dan navigasi keyboard section saat menu terbuka (`overflow-hidden`), serta mendukung keyboard `Escape`, *focus trap*, dan pemulihan gesture setelah ditutup.
10. **Penyempurnaan Clearance Bagian Atas Seluruh Section:**
    - Mengidentifikasi akar masalah di mana deklarasi shorthand `lg:p-14` (56px) menimpa `md:pt-24`, sehingga teks eyebrow di posisi desktop berada di 56px (lebih tinggi dari batas bawah navbar 88px).
    - Memisahkan padding menjadi `px-6 sm:px-10 md:px-12 lg:px-14`, `pb-6 sm:pb-8 md:pb-10 lg:pb-12`, dan padding atas eksplisit `pt-28 sm:pt-32 md:pt-36 lg:pt-36` (112px–144px) di seluruh 6 section (`Hero`, `About`, `Skills`, `Experience`, `Projects`, `Contact`).
    - Menyesuaikan batas tinggi `.navbar-fade-overlay` menjadi `clamp(80px, 11vh, 104px)` dan navbar padding menjadi `px-6 py-5 md:px-12 md:py-6`.
    - Terverifikasi via Playwright: jarak aman (*clearance*) teks eyebrow terhadap navbar adalah +92px dan terhadap fade overlay adalah +45px (100% terlihat jelas, tajam, dan bebas efek blur).
11. **Penyempurnaan Vertical Spacing Konsisten (Top Spacing ≈ Bottom Spacing):**
    - Mengimplementasikan CSS custom property `--section-vertical-inset: clamp(24px, 4vh, 44px)` dan `--navbar-height: clamp(56px, 7vh, 64px)` terpusat.
    - Menetapkan `.navbar-header` dengan tinggi `var(--navbar-height)` dan `.portfolio-section` dengan `padding-top: calc(var(--navbar-height) + var(--section-vertical-inset))` serta `padding-bottom: var(--section-vertical-inset)`.
    - Mengoptimalkan struktur hierarki internal timeline pada `ExperienceSection` agar tinggi kartu proporsional dan tidak mendorong elemen footer ke bawah.
    - Terverifikasi via Playwright pada 4 aspect ratio desktop (16:9, 16:10, 4:3, 21:9) dan mobile: `Top spacing` (navbar bottom ke top content) sama presisi dengan `Bottom spacing` (bottom content ke canvas bottom) dengan selisih deviasi hanya 0.2px hingga 1.0px (jauh di bawah batas toleransi 4px).
12. **Penyempurnaan Top Spacing & Jarak Internal Category Label ke Heading:**
    - Memisahkan CSS custom property menjadi `--section-top-inset` dan `--section-bottom-inset: clamp(24px, 4vh, 44px)` serta menyelaraskan batas bawah `.navbar-header` (`align-items: flex-end`, `--navbar-height: 46px` pada desktop) dengan batas bawah aktual `<nav>`.
    - Mengurangi jarak atas dari batas bawah aktual navbar ke elemen konten paling atas dari `53.5px–61.2px` menjadi `35.1px` (pada `1440×900`) dan `38.0px–40.0px` (pada `1920×1080`), sekaligus mempertahankan posisi seluruh elemen paling bawah dan jaraknya ke batas bawah main canvas tanpa perubahan (`0.0px` perubahan).
    - Memadatkan jarak internal antara category label dan heading utama (termasuk `PROFESSIONAL BACKGROUND` → `Impact & engineering leadership over the years.` menjadi `16px`) agar terasa sebagai satu kesatuan kelompok informasi.
13. **Penyempurnaan Responsive Scroll Indicator Positioning & Bottom Utility Row Alignment:**
    - **Akar Masalah Collision Teridentifikasi:**
      1. Pada desktop, `ScrollIndicator` dan teks metadata footer section berada di node DOM terpisah dengan padding hardcoded (`pl-40`) yang kurang dari lebar aktual tombol, sehingga terjadi overlap horizontal serta ketidaksesuaian garis baseline vertikal.
      2. Pada mobile, section terkunci dalam `h-full overflow-hidden` tanpa reserved bottom safe space, menyebabkan indikator menimpa item konten terbawah (Item 3 "Human-Centered Craft" di About).
    - **Implementasi Komponen `BottomUtilityRow`:** Menstandarisasi footer di seluruh 6 section (`Hero`, `About`, `Skills`, `Experience`, `Projects`, `Contact`) dengan slot khusus `w-56 shrink-0` (224px) di sisi kiri pada desktop, menyelaraskan baseline dan vertical center teks `SCROLL DOWN` / `SCROLL UP`, metadata kiri, dan metadata kanan pada koordinat Y yang identik (`815.5px` pada 900p) dengan gap horizontal aman 70px.
    - **Posisi Mobile Bottom-Center & 2-Baris Terpisah:** Pada mobile (`< 768px`), `ScrollIndicator` berpindah ke posisi horizontal tengah bawah (`justify-center mx-auto`) dengan ukuran icon compact (28x28px), sementara footer metadata terangkat ke baris atasnya (`mb-10 sm:mb-11 md:mb-0`).
    - **Reserved Bottom Safe Space (`--mobile-scroll-safe-space`):** Mengalokasikan safe area padding pada `.section-content` dan mengaktifkan `overflow-y-auto` di section wrapper mobile, memberikan ruang bebas 158px di bawah item ke-3 About section.
    - **Verifikasi Lintas Perangkat:** Lolos audit Playwright di 10 resolusi (Desktop: 1920x1080, 1440x900, 1200x900, 2560x1080; Mobile: 390x844, 375x812, 430x932, 360x800; Tablet: 768x1024, 1024x768). Zero collision dan navigasi 100% mulus.
14. **Penyempurnaan Global Content Width & Alignment Divider Footer Contact:**
    - **Global Content Width Expansion (`--content-max-width: 1360px`):** Mengganti pembatasan `max-w-6xl` (1152px) dengan `.page-container` berbasis `max-width: 1360px` dan padding horizontal adaptif `--content-padding-x: clamp(20px, 4vw, 64px)`. Konten utama kini tampil proporsional terhadap kanvas website pada seluruh resolusi desktop, laptop, dan ultrawide tanpa mengorbankan safe margin.
    - **Penyelarasan Guidelines Horizontal Terpadu:** Seluruh elemen vertikal (Navbar brand & menu, Eyebrow & section number, Main content grid, Scroll Indicator, Bottom utility row, dan divider lines) kini berbagi left alignment dan right alignment yang identik hingga tingkat sub-pixel (`90.09px` pada 1440p, `280.00px` pada 1080p).
    - **Pemisahan Divider Line Contact Section:** Mengeluarkan garis horizontal dari `BottomUtilityRow` dan menjadikannya separator independen di atas utility row (`mb-3 sm:mb-4 md:mb-5`). Icon lingkaran `Scroll Up` kini berada 100% di bawah garis dengan jarak aman minimum 15px–18px saat titik tertinggi gentle bounce.
    - **Verifikasi:** Lolos uji linting (`npm run lint`), build produksi (`npm run build`), dan inspeksi visual Playwright pada 5 viewport uji (1920×1080, 1440×900, 1280×800, 768×1024, 390×844).
15. **Penyempurnaan Konsistensi Tipografi & Komposisi Scroll Indicator (Strict Two-Line Composition):**
    - **Akar Inkonsistensi:** Sebelumnya teks `SCROLL DOWN` (11 karakter) dan `SCROLL UP` (9 karakter) dirender sebagai string tunggal di dalam satu kontainer teks. Pada batas container tertentu, `SCROLL DOWN` terpecah menjadi 2 baris sementara `SCROLL UP` pas dalam 1 baris, menimbulkan perbedaan layout dan asimetri visual.
    - **Strict Two-Line Typography:** Menstandarisasi struktur DOM teks menjadi flex-column dua baris eksplisit:
      - Baris 1: `SCROLL`
      - Baris 2: `DOWN` (section 0–4) atau `UP` (section 5)
    - **Visual Properties Unification:**
      - Ukuran font (`text-[10px] sm:text-[11px] md:text-xs`), font weight (`font-bold`), letter spacing (`tracking-widest`), line height (`leading-[1.05]`), serta gap horizontal icon-ke-teks (`gap-2.5 md:gap-3`) diseragamkan 100%.
      - Lebar kontainer teks stabil (`min-w-[48px] md:min-w-[54px]`) menjamin **zero layout shift** (lebar total tombol identik `99.75px` pada desktop dan `86.00px` pada mobile di kedua kondisi).
      - Centering vertikal: Icon lingkaran dan blok teks dua baris sejajar pada titik pusat vertikal (`align-items: center`, selisih deviasi center-Y `< 0.4px`).
    - **Animasi Bouncing Direksional Sesuai Arah Navigasi:**
      - Saat mengarah ke bawah: `.scroll-bounce-down` (`translateY(4px)`, 1.6s ease-in-out infinite).
      - Saat mengarah ke atas: `.scroll-bounce-up` (`translateY(-4px)`, 1.6s ease-in-out infinite).
      - Mendukung penuh `prefers-reduced-motion: reduce`.
    - **Verifikasi Komprehensif:** Lolos uji linting (`npm run lint`), build (`npm run build`), dan evaluasi Playwright di desktop (1440×900) dan mobile (390×844). Navigasi maju section-by-section serta kembali dari Contact ke Home berfungsi 100% mulus.
16. **Implementasi Main Monster Animation System (Waving, Blinking & Home Integration):**
    - **Audit Aset Visual:**
      - Meneliti seluruh aset pada `public/monsters/main-monster/` (`blinking/` frames 1–3 `.png`, frame 4 `.jpeg`; `waving/` frames 1–6 `.png`, frame 7 `.jpeg`).
      - Ditemukan bahwa seluruh gambar adalah render tubuh utuh (*full-body*) berlatar checkerboard bawaan dengan variasi dimensi kanvas (tinggi 458px, 566px, 572px, 698px). Karena seluruh frame memiliki tubuh dan wajah lengkap, pemisahan layering fisik (menumpuk mata berkedip di atas tubuh melambai) tidak memungkinkan secara estetika tanpa benturan visual.
    - **Solusi Normalisasi Offscreen Canvas (`monsterAssets.ts`):**
      - Mengembangkan preloader cerdas berbasis HTML5 Canvas yang otomatis menghapus pola checkerboard tepi secara non-destruktif via BFS border flood-fill.
      - Menstandarisasi skala dan mengunci pijakan kaki pada baseline seragam (`TARGET_FEET_Y = 460px` pada kanvas 500×500) sehingga peralihan antarframe bebas jitter dan bebas layout shift.
    - **Komponen Modular & State Machine:**
      - `MainMonster.tsx`: Komponen utama, touch-gesture filtering (`Math.hypot(dx, dy) < 12px`), keyboard accessible (`Enter`/`Space`), serta responsive sizing.
      - `useMonsterBlink.ts`: Siklus berkedip alami dengan interval acak 2.5s–5.0s, durasi kedip 140ms, dan 10% probabilitas ekspresi wink.
      - `useMonsterWave.ts`: Rangkaian waving sekuensial (frames 1–6, 130ms per frame), berpindah ke happy pose (frame 7), dengan logic holding desktop (selama kursor di atas karakter) dan mobile tap (holding 850ms lalu auto-revert ke idle).
      - `MonsterRenderer.tsx`: Renderer canvas berkinerja tinggi dengan subtle floating animation saat idle (3.2s infinite ease-in-out).
    - **Integrasi Hero Section (`HeroSection.tsx`):**
      - Memasang `MainMonster` sebagai maskot visual utama Hero Section (menggantikan placeholder statis), berdampingan secara proporsional dengan judul dan tagline portfolio.
    - **Verifikasi Komprehensif:** Lolos linting (`npm run lint`), TypeScript build (`npm run build`), dan pengujian Playwright lintas 5 breakpoint viewport (1440px, 1280px, 768px, 390px, 360px). Terverifikasi: blinking otomatis, hover desktop, tap mobile, scroll-gesture immunity, keyboard accessibility, serta navigasi antar-section.
17. **Penonaktifan Sementara Tampilan Main Monster (Preservasi Kode Penuh):**
    - **Implementasi Prop `hidden`:** Menambahkan prop `hidden?: boolean` pada `MainMonster.tsx`. Ketika `hidden = true`, komponen me-render kontainer invisible (`invisible pointer-events-none select-none`) dengan dimensi yang sama untuk mempertahankan keseimbangan layout grid Hero Section, sekaligus mem-pause siklus blinking dan waving.
    - **Penerapan pada Hero Section (`HeroSection.tsx`):** Menambahkan atribut `hidden` pada `<MainMonster size="xl" hidden />` sehingga karakter monster tidak terlihat di layar, tanpa menghapus satupun file atau baris kode implementasi animasi yang sudah dibangun.
    - **Kemudahan Reaktivasi:** Komponen dapat diaktifkan kembali kapan saja cukup dengan menghapus prop `hidden` atau menyetel `hidden={false}`.
    - **Verifikasi:** Lolos linting (`npm run lint`), build (`npm run build`), dan inspeksi Playwright mengonfirmasi elemen visual monster 100% tidak tampak pada halaman (`visibility: hidden`, `canvasPresent: false`).
18. **Audit & Pembaruan Konten Portfolio Terverifikasi Berdasarkan Profil GitHub (@AbidAlauddin):**
    - **Audit Profil & Ekosistem GitHub:** Mengaudit profil GitHub `https://github.com/AbidAlauddin`, README profil, serta 14 repositori publik (`Nalar`, `HCIS`, `PortalAlumni` / `Hey Job`, `MYOB-App`, `SPK-Beasiswa-Menggunakan-SAW-ROC`, `EcoQuiz`, `eBake`, `iTask-RPL`, `Rekap_TauriApp`, dll.).
    - **Pembaruan Data Profil (`src/data/profile.ts`):** Mengganti identitas persona fiktif dengan data autentik Abid Alauddin (Mahasiswa Sistem Informasi Universitas Negeri Semarang / UNNES, berdomisili di Semarang, Indonesia). Menetapkan tautan sosial terverifikasi: GitHub (`https://github.com/AbidAlauddin`), Instagram (`https://www.instagram.com/abiiidal`), dan LinkedIn (`https://linkedin.com/in/abidalauddin`). Tanpa membuat email dummy (`abid@...` atau `alex@...`).
    - **Pembaruan Technical Skills (`src/data/skills.ts`):** Mengelompokkan skill terverifikasi ke dalam 4 kategori nyata:
      - *Backend & Frameworks:* PHP, Laravel, Blade, Livewire, REST APIs, Python, Flask.
      - *Frontend & Client:* React.js, TypeScript, JavaScript (ES6+), Tailwind CSS, HTML5 & CSS3, Vite.
      - *Database & Storage:* MySQL, PostgreSQL, SQLite, Supabase, Eloquent ORM.
      - *Tools & Workflow:* Git & GitHub, Docker, Laravel Sail, Tauri, Composer & npm, Postman.
    - **Pembaruan Pengalaman Nyata (`src/data/experience.ts`):** Mengganti posisi agensi fiktif dengan 3 rekam jejak akademik dan independen riil:
      - *Information Systems Student & Developer* • Universitas Negeri Semarang (2022 — Present)
      - *Full-Stack & Desktop Software Developer* • Independent & Academic Projects (2023 — Present)
      - *Open-Source & Web Technology Explorer* • GitHub & Personal Lab (2021 — Present)
    - **Pembaruan Proyek Pilihan Terverifikasi (`src/data/projects.ts`):** Menyeleksi 5 proyek unggulan berbasis repositori nyata dengan link GitHub aktif:
      1. *Nalar:* AI-Powered LMS for Indonesian Schools (Laravel, PHP, Blade, Fortify, MySQL, Docker).
      2. *HCIS Talent Mapping:* Desktop Human Capital Information System (Tauri, React, TypeScript, Tailwind CSS, Supabase, PostgreSQL).
      3. *Hey Job (Portal Alumni):* Modern Jobseeker & Alumni Career Platform (Laravel 12, Livewire 3, PHP 8.2, MySQL, Tailwind CSS).
      4. *MYOB Smart-Guide:* Interactive Accounting Simulation Assistant for Vocational High Schools (Laravel, Blade, MySQL, Tailwind CSS, Docker).
      5. *SPK Beasiswa SAW-ROC:* Decision Support System for Student Scholarship Selection (Python 3, Flask, SQLite, Bootstrap, SAW & ROC).
    - **Sinkronisasi Metadata & Section:** Memperbarui footer Hero section (`EST. 2021`), Experience section (`2022 — PRESENT`), Contact section (direct profile link to GitHub), dan `index.html` (`<title>Abid Alauddin — The Digital Playground Portfolio</title>`).
    - **Verifikasi Komprehensif:** Lolos linting (`npm run lint`), build produksi (`npm run build`), dan audit Playwright lintas 6 section serta 3 resolusi (Desktop, Tablet, Mobile) tanpa overflow horizontal dan seluruh interactive state (tab switcher project, direct profile links, responsivitas) berfungsi 100%.
19. **Penggantian Featured Project (MYOB ke Toekoni) & Retro Browser Monitor Preview:**
    - **Audit & Verifikasi Toekoni (`https://toekoni.id/`):** Mengaudit website publik Toekoni secara live via HTTP headers dan DOM inspection. Terverifikasi: backend **Laravel** (PHP 8.4, session `toekoni-session`, `XSRF-TOKEN`), frontend **Livewire 3** (`livewire.js`, SPA reload tracking) + **Tailwind CSS** + **Vite**, direktori 31 UMKM terdaftar dan katalog 39 produk lokal Kecamatan Sapuran, Kabupaten Wonosobo. Terverifikasi kontribusi kolaboratif tim ("Kolaborasi antara Abid, Asa, Arin, Hilmi, Umar, Valen dan POKJA II Kecamatan Sapuran") melalui inisiatif program UNNES GIAT 16.
    - **Pengambilan Asset Screenshot Nyata (`public/projects/toekoni-preview.webp`):** Mengambil screenshot otentik dari website `https://toekoni.id/` (Hero section lengkap dengan navbar, tagline *Cintai Produk Sapuran*, pencarian, statistik UMKM terdaftar, dan visual utama) menggunakan Playwright. Mengoptimalkan gambar menjadi WebP berkualitas tinggi dengan kompresi hemat (107 KB) untuk performa cepat tanpa degradasi visual.
    - **Pembaruan Arsitektur Data (`src/data/projects.ts`):** Menetapkan **Toekoni** sebagai *Featured Project* utama pada indeks 0 (`proj-1`), serta mempertahankan proyek lainnya termasuk `MYOB Smart-Guide` pada indeks 4 (`proj-5`) sehingga tetap dapat diakses melalui navigasi. Menambahkan tag `projectType: 'Collaborative Project (UNNES GIAT 16)'`, badges teknologi riil (`Laravel`, `PHP 8`, `Livewire 3`, `Blade`, `Tailwind CSS`, `MySQL`), metrik aktual `31 MSMEs Registered • 39 Local Products`, dan live link `https://toekoni.id/`.
    - **Penyempurnaan Komponen Monitor Browser (`ProjectsSection.tsx`):**
      - Membangun frame monitor browser editorial dengan window control dots (merah, amber, hijau), address bar pill dinamis (menampilkan hostname `toekoni.id` dengan ikon lock), dan indikator status pulsing green `Live`.
      - Menampilkan screenshot website otentik dengan hover overlay `Visit Live Site ↗` yang langsung membuka `https://toekoni.id/`.
      - Mempertahankan fallback tipografi bersih jika proyek tidak memiliki gambar preview.
      - Menambahkan kontrol navigasi navigasi ganda: tombol Previous (`‹`) dan Next (`›`) dengan auto wrap-around bersanding dengan tab nomor proyek (`01`–`06`).
      - Mempertahankan posisi companion `MonsterPlaceholder` dan keselarasan `BottomUtilityRow`.
    - **Verifikasi Lintas Perangkat:** Lolos linting (`npm run lint`), build produksi (`npm run build`), serta pengujian Playwright pada Desktop (`1440×900`), Tablet (`768×1024`), dan Mobile (`390×844`). Bebas horizontal overflow, responsive, dan navigasi 100% mulus.
20. **Pembaruan Website Favicon (`/icons/icon.png`):**
    - **Audit & Pembersihan Favicon Lama:** Mengidentifikasi tag favicon lama pada `index.html` (`<link rel="icon" type="image/svg+xml" href="/favicon.svg" />`).
    - **Penerapan Favicon Utama:** Mengganti referensi favicon dengan file PNG resmi dari pengguna di `public/icons/icon.png` menggunakan konfigurasi standar browser modern:
      - `<link rel="icon" type="image/png" href="/icons/icon.png" />`
      - `<link rel="apple-touch-icon" href="/icons/icon.png" />`
    - **Verifikasi & Build:** Lolos lint (`npm run lint`), TypeScript build (`npm run build`), status HTTP 200 OK pada `http://localhost:4173/icons/icon.png` (`Content-Type: image/png`, 1.69 MB), dan verifikasi DOM Playwright mengonfirmasi kedua link aktif tanpa deklarasi ganda atau konflik.
21. **Riset, Pemilihan Asset 3D & Implementasi Monster Interaktif pada Hero Section:**
    - **Riset & Seleksi Asset 3D Alternatif:** Mengaudit kandidat dari Poly Pizza (Quaternius *Ultimate Monsters Bundle*), Sketchfab API, dan GitHub CC0 hubs tanpa menggunakan/menyalin aset `public/monster/main-monster`. Memilih **Yeti** oleh **Quaternius** (`https://poly.pizza/m/ceRHrn8HHE`, lisensi **CC0 1.0 Public Domain**, 413 KB GLB, 6.094 triangles, full rig dengan 14 animasi bawaan) sebagai kandidat terbaik.
    - **Penempatan Aset & Zero New Dependencies:** Menyimpan model pada `public/models/monster/yeti-mascot.glb` dan memanfaatkan stack existing (`three`, `@react-three/fiber`, `@react-three/drei`) tanpa menambah dependency baru.
    - **Upgrade Visual Fur & Expressive Eyes (`src/monster/`):**
      - `furTextures.ts`: Generator procedural fur bump map dan 5-layer alpha strand mask berbasis offscreen canvas.
      - `HeroMonsterModel.tsx`: Menerapkan palet turquoise-teal (`#228B82`) & mint (`#86D6CC`) dengan `MeshPhysicalMaterial` sheen + 5-layer *skinned fur shell* di sekitar tubuh untuk siluet berbulu lembut; mengganti mata flat bawaan dengan bola mata 3D glossy + iris teal + catchlight + kelopak mata atas/bawah yang terikat langsung pada tulang `Head`.
      - **5 Sistem Animasi & Interaksi (Zero React Re-render):** Idle/Breathing multi-harmonik + skeletal `Idle` clip, autonomous eye blinking berinterval acak (2.6–5.6 detik + 22% *double blink*), cursor tracking halus pada `Neck`, `Head`, dan `pupilGroup` dengan clamp rotasi & auto-return ke idle, reaksi *Wave/Yes* saat diklik + kedipan reflektif pada gerakan kursor cepat, serta dukungan `prefers-reduced-motion`, tab visibility pause, dan `frameloop="demand"` saat Hero tidak aktif.
      - `HeroMonsterCanvas.tsx` & `HeroMonsterFallback.tsx`: Lazy-loaded R3F Canvas dengan warm studio lighting, `ContactShadows`, stage diorama minimalis, WebGL context-lost handler, dan ErrorBoundary fallback SVG.
    - **Penyempurnaan Komposisi Hero Section (`HeroSection.tsx` & `PortfolioShell.tsx`):** Menyajikan layout dua kolom seimbang dengan CTA `View Projects` & `Let's Talk` di kiri dan panggung maskot 3D besar di kanan. Tidak mengubah section lain (`About`, `Skills`, `Experience`, `Projects`, `Contact`).
    - **Verifikasi Komprehensif:** Lolos `npm run lint` (0 errors), `npm run build` (lazy chunk terpisah, 485ms), dan uji Playwright nyata (0 console errors, breathing aktif, 10x autonomous blinks terdeteksi, cursor tracking yaw `-0.34` → `+0.17` & smooth idle return `-0.007`, CTA navigation ke `#projects`, zero overlap & zero horizontal overflow di Desktop `1440×900`, Tablet `768×1024`, dan Mobile `390×844`).
22. **Refinement Hero Section — Monster Animation Safe Area, Zero Clipping & Vertical Alignment:**
    - **Akar Masalah Clipping Teridentifikasi:** Frustum kamera WebGL sebelumnya (`z = 5.75, fov = 35°`) pada kanvas `1:1` hanya menghasilkan ruang tampak `±1.81` unit, sedangkan jangkauan animasi Yeti saat *waving* dan *head tilt* mencapai `x = ±2.46` dan `y = +2.41` (keluar dari frustum atas/samping WebGL).
    - **Perhitungan & Penerapan Animation Safe Area (`HeroMonsterCanvas.tsx` & `HeroMonsterModel.tsx`):**
      - Memperluas frustum kamera menjadi `position: [0, 0.35, 7.6], fov: 36°` (`visible Y: -2.12 .. +2.82`, `visible X: ±2.67` pada rasio `aspect-[1.08/1]`), menyesuaikan skala model ke `0.94`, dan menurunkan posisi pijakan kaki ke `y = -1.52` bersama `ContactShadows` di `y = -1.54` (`scale = 4.2`) agar tetap membumi dan bebas melayang.
      - Memperbarui dekorasi lingkaran stage (`inset-[14%] translate-y-[6%]`) agar berpusat pada massa tubuh karakter dan menyisakan headroom luas untuk tangan saat *waving*.
      - Menambahkan proyeksi *real-time NDC bounding box* pada `window.__HERO_MONSTER_STATE__.ndcBounds` untuk validasi matematis anti-clipping.
    - **Penyempurnaan Vertical Alignment & Proporsi (`HeroSection.tsx`):** Menurunkan posisi keseluruhan blok konten hero secara optik (`pt-4 sm:pt-6 lg:pt-6 xl:pt-8`), menyelaraskan kolom teks kiri (`lg:pt-6`) terhadap titik berat visual karakter, dan memperluas kontainer monster menjadi `aspect-[1.08/1] overflow-visible` hingga `580px` pada desktop besar.
    - **Verifikasi Kondisi Ekstrem (Playwright):** Lolos `npm run lint` (0 errors), `npm run build` (469ms), dan pengujian Playwright di kondisi Idle, Extreme Left/Right Cursor (`yaw -0.337` / `+0.187`), serta Peak Waving (`maxY = 0.566`, `maxX = 0.661`, `anyClipped: false`) di Desktop (`1440×900`), Tablet (`768×1024`), dan Mobile (`390×844`) dengan 0 console errors dan 0 horizontal overflow.
23. **Peningkatan Skala Monster & Penyelarasan Tinggi Visual Hero Section:**
    - **Peningkatan Ukuran Visual Monster (~40% lebih besar):** Meningkatkan skala model dari `0.94` menjadi `1.06` (`HeroMonsterModel.tsx`), mendekatkan kamera ke `position: [0, 0.35, 6.5], fov: 37°`, menyelaraskan pijakan kaki (`y = -1.32`) dan `ContactShadows` (`y = -1.34`, `scale = 4.5`), serta memperluas kontainer stage desktop menjadi `lg:h-[580px] xl:h-[620px] lg:-my-8` (`HeroSection.tsx`).
    - **Penyelarasan Tinggi Visual terhadap Blok Teks Kiri:** Pada Desktop `1440×900`, puncak kepala monster kini sejajar secara visual dengan label `FULL STACK DEVELOPER` (`y ≈ 244px`) dan telapak kaki/bayangan sejajar dengan bagian bawah tombol CTA (`y ≈ 712px`), menciptakan pasangan visual yang seimbang dan proporsional.
    - **Independensi Lingkaran Background:** Lingkaran stage belakang diatur terpisah (`w-[68%]` / `w-[54%]` `aspect-square`) agar tetap halus dan proporsional tanpa ikut membesar secara berlebihan.
    - **Verifikasi Anti-Clipping & Responsif:** Lolos `npm run lint` (0 errors), `npm run build` (741ms), dan pengujian Playwright pada Desktop (`1440×900`, Peak Waving `maxY: 0.913`, `maxX: 0.901`, `clipped: false`) serta Mobile (`390×844`, Peak Waving `maxY: 0.892`, `waveClippedMobile: false`, `noOverlapMobile: true`, `hasHorizontalOverflow: false`).
24. **Implementasi Monster Interaktif Kedua — Cozy Developer Workspace pada About Section:**
    - **Riset & Seleksi 4 Asset CC0 Independen (`public/models/workspace/`):**
      1. **Second Monster — Alien** oleh Quaternius (`https://poly.pizza/m/RRliSQBP7r`, **CC0 1.0**, 469 KB `.glb`, full skeleton lengkap dengan tulang jari & kaki — berbeda 100% dari Yeti Hero namun satu universe).
      2. **Desk** oleh Kenney (`https://poly.pizza/m/6PbVkqPzEU`, **CC0 1.0**, 23 KB `.glb`).
      3. **Office Chair** oleh Quaternius (`https://poly.pizza/m/UfKvrZBK6C`, **CC0 1.0**, 113 KB `.glb`).
      4. **Laptop** oleh Kenney (`https://poly.pizza/m/GnbwSUiVty`, **CC0 1.0**, 12 KB `.glb`).
      Total 617 KB, **zero new dependencies**.
    - **Diorama 3D & Pose Duduk Natural (`AboutWorkspaceScene.tsx` & `AboutWorkspaceCanvas.tsx`):**
      - Menerapkan palet bulu *slate-teal* (`#356978`) & antena keriting *sage-mint* (`#7CC4A8`) dengan 5-layer *skinned fur shells* + bola mata 3D glossy berkedip.
      - Menormalisasi posisi & skala kursi, meja, laptop (menghadap monster dengan *screen glow* lembut), dan cangkir kopi mungil tanpa objek mengambang atau saling menembus.
      - Menggunakan `applyCharSpaceDelta` + sanitizer nama tulang (`UpperArm.L` → `UpperArmL`) agar kaki tertekuk duduk nyaman di kursi dan kedua lengan/tangan berada tepat di atas keyboard laptop.
    - **Sistem Animasi Tenang & Fokus (Intensitas Lebih Rendah dari Hero):**
      - *Subtle Breathing* (amplitudo 0.014, pinggul stabil di kursi), *Natural Blinking* (interval 3.2–6.2 detik + 18% double blink), *Typing & Thinking Cycle* (ketukan halus lengan & jari bergantian lalu jeda berpikir/miring kepala), serta *Minimal Cursor Glance* saat kursor mendekati workspace lalu kembali fokus ke laptop.
      - Mendukung `prefers-reduced-motion`, tab visibility pause, dan `frameloop="demand"` saat section tidak aktif.
    - **Layout Terbalik (`AboutSection.tsx` & `PortfolioShell.tsx`):** Membalik komposisi menjadi **Workspace di Kiri** (`lg:col-span-5`) dan **Konten Teks di Kanan** (`lg:col-span-7`) tanpa mengubah substansi teks & 3 prinsip, serta stack vertikal rapi pada mobile.
    - **Verifikasi Playwright:** Lolos `npm run lint` (0 errors), `npm run build` (519ms), Desktop `1440×900` (`layoutReversed: true`, `typing` → `thinking` aktif, `blinkCount: 2`, `glancing: true`, `clipped: false`, `overflow: false`, 0 console errors), dan Mobile `390×844` (`workspaceAboveText: true`, `clippedMobile: false`, `overflowMobile: false`).
25. **Penggantian Aset Monster About Section (Non-Animal Original Fluffy Creature — Cactoro CC0):**
    - **Penggantian Model & Cache-Busting (`public/models/workspace/cactoro-dev.glb`):** Menghapus permanen file lama `dev-monster.glb` (*Alien* bertanduk/tentakel) dan mengintegrasikan file model baru **Cactoro** oleh Quaternius (`https://poly.pizza/m/IGn9lhdama`, **CC0 1.0 Public Domain**, 461 KB `.glb`, 6.398 triangles) dengan nama file baru `cactoro-dev.glb` agar browser tidak pernah memuat cache model lama. Geometri, siluet, kepala, dan anatomi 100% berbeda tanpa tanduk melengkung, tanpa tentakel, dan tanpa kemiripan hewan.
    - **Pembaruan Material & Fur Shell (`AboutWorkspaceScene.tsx`):** Memetakan 5-layer *skinned fur shells* + `MeshPhysicalMaterial` *sheen* pada `Cactoro_Main` dan `Cactoro_Main.001` (`#3B8B7C` sage-teal plush), topi & tuft hangat (`#D9A066`) dengan pita topi teal (`#115E59`), serta mengikat bola mata 3D glossy + kelopak berkedip pada tulang `Head`.
    - **Preservasi 100% Fungsi & Workspace Existing:** Seluruh logika, timing, dan intensitas animasi (*breathing*, *automatic blinking*, *typing*, *head movement*, *thinking pause*, *minimal cursor glance*), meja, kursi, laptop, layout terbalik, dan teks About tidak diubah sama sekali.
    - **Verifikasi Playwright:** Lolos `npm run lint` (0 errors), `npm run build` (592ms), Desktop `1440×900` (`loaded: true`, `breathingChanged: true`, `blinkCount: 11`, `glancing: true`, `clipped: false`, `overflowDesktop: false`, 0 console errors), dan Mobile `390×844` (`clippedMobile: false`, `overflowMobile: false`).
26. **Fine-tune Posisi Horizontal Grup Monster About Section (Background Tetap):**
    - **Pemisahan Layer Positioning (`AboutWorkspaceCanvas.tsx`):** Membungkus hanya `<Canvas>` (grup 3D monster, kursi, meja, laptop, cangkir, dan *contact shadow*) dengan wrapper khusus `lg:-translate-x-8 xl:-translate-x-9` (`-32px` pada `lg:`, `-36px` pada `xl:`), tanpa menyentuh parent container maupun elemen dekoratif background (lingkaran luar, lingkaran dalam, titik hijau & oranye).
    - **Verifikasi Sub-Pixel (Playwright Desktop `1440×900`):** Terverifikasi `stageCenterX = 338.6px`, `bgOuterCenterX = 338.6px` (`0.0px` pergeseran background), dan `canvasCenterX = 302.6px` (`shiftDeltaPx = -36.0px` khusus pada grup monster + workspace), `clipped: false`, `overflowDesktop: false`, 0 console errors. Mobile & Tablet tetap terpusat tanpa pergeseran.
27. **Implementasi Monster Ketiga — The Skill Builder (Skills Section `03 / 06`):**
    - **Aset Monster Baru (`public/monster/skill-builder/skill-builder.glb`):** Menggunakan model **Orc** oleh Quaternius (`https://poly.pizza/m/5vO2YJsPEf`, **CC0 1.0 Public Domain**, 500 KB `.glb`, full skeleton + 14 animasi) — siluet bulat berbulu *coral-terracotta* (`#C9785D`) dengan jambul mohawk *deep teal* (`#0F766E`), sabuk builder (`#44403C`), submesh senjata disembunyikan agar kedua tangan kosong mendorong balok, serta 5-layer *skinned fur shells* dan bola mata 3D glossy berkedip. Sepenuhnya berbeda dari Yeti (Hero) dan Cactoro (About) serta bukan hewan.
    - **Balok Teknologi Mainan (`src/monster/utils/blockTextures.ts`):** 4 balok mainan berlabel tajam (`Laravel`, `React`, `PHP`, `TS`) disusun di depan tangan monster tanpa menutupi wajahnya, lengkap dengan goyangan dorongan dan *settling momentum* saat berhenti.
    - **Sistem State Machine 5-Fase (`SkillBuilderScene.tsx` & `SkillBuilderCanvas.tsx`):**
      1. `walking`: berjalan santai secara horizontal (`[-1.05, +1.05]`), kaki melangkah bergantian, tubuh condong mendorong balok.
      2. `turning`: memperlambat langkah di batas lintasan, berhenti sejenak, berputar 180° natural, lalu berjalan ke arah sebaliknya.
      3. `slowing_down` → `surprised` → `looking`: saat kursor masuk area monster, monster melambat halus, terkejut singkat (mata membesar `1.24x`, kepala terangkat, loncatan kecil mundur, tangan mengendur), lalu menatap & mengikuti kursor sambil tetap bernapas dan berkedip.
      4. `resuming`: saat kursor keluar, kembali menghadap arah semula dan melanjutkan berjalan tepat dari posisi terakhir (tidak reset ke awal).
      5. `prefers-reduced-motion`, `document.hidden`, dan `frameloop="demand"` saat section tidak aktif.
    - **Integrasi Terisolasi (`SkillsSection.tsx` & `PortfolioShell.tsx`):** Ditempatkan di kolom kiri tepat di bawah headline `"Tools, stacks & craft engineered with precision."`, tanpa mengubah 4 kartu skill di kanan, tanpa mengubah monster Home maupun About.
    - **Verifikasi Playwright:** Lolos `npm run lint` (0 errors), `npm run build` (646ms, lazy chunk `5.99 kB` gzip), Desktop `1440×900` (`walkedHorizontally: true`, `surprised` `eyeScale: 1.167`, `looking` `headYaw: -0.1955`, `resumedFromLastPos: true`, `noOverlapCards: true`, `clipped: false`, `overflowDesktop: false`, 0 console errors), dan Mobile `390×844` (`turnCount: 8`, `blinkCount: 13`, `clipped: false`, `overflowMobile: false`).
28. **Upgrade Animasi The Skill Builder — Build the Tech Stack (Skills Section `03 / 06`):**
    - **Transformasi Perilaku Animasi (`SkillBuilderScene.tsx` & `SkillBuilderCanvas.tsx`):** Mengubah perilaku dari mendorong balok sekaligus menjadi rangkaian 6 tahap *Build the Tech Stack* berbasis state machine terstruktur di dalam `useFrame` (*zero React re-renders*):
      1. `entering`: Monster muncul dari luar batas kiri (`x = -3.65`) berjalan masuk secara natural menuju balok pertama.
      2. `picking_up`: Berhenti, membungkuk halus, meraih balok, dan mengangkatnya ke pelukan kedua tangan.
      3. `carrying`: Berjalan mantap membawa balok (posisi balok terkunci pada tangan mengikuti *step bob* dan orientasi tubuh) menuju sisi paling kanan (`STACK_X = +1.65`).
      4. `placing`: Menurunkan/mengangkat tangan sesuai ketinggian slot menara vertikal (`Laravel` → `React` → `PHP` → `TS`) dan melepaskan balok dengan efek *damped settling bounce* ringan tanpa pantulan berlebihan.
      5. `returning`: Berputar natural dan kembali ke kiri mengambil balok berikutnya hingga keempat balok tersusun rapi tanpa saling menembus.
      6. `admiring` → `exiting`: Berdiri di dekat tumpukan sambil mengagumi hasil pekerjaannya (*breathing*, *blinking*, anggukan bangga `5.2s`), lalu berjalan keluar kiri untuk reset *seamless loop*.
    - **Safe Cursor Interaction Guard:** Interaksi hover (*slowing_down* → *surprised* → *looking* → *resuming*) dipertahankan dan otomatis ditunda jika monster sedang berada di tengah fase `picking_up` atau `placing` agar posisi balok tidak pernah lepas sinkronisasi.
    - **Preservasi Total:** Tidak mengubah aset monster, desain 4 kartu Skills, background garis lintasan, maupun monster Home dan About. Mendukung `prefers-reduced-motion` (menampilkan menara selesai bersama monster tenang).
    - **Verifikasi Playwright:** Lolos `npm run lint` (0 errors), `npm run build` (688ms), Desktop `1440×900` (seluruh fase `entering`, `picking_up`, `carrying`, `placing`, `returning`, `looking`, `surpriseCount: 1`, `anyClipped: false`, `overflowDesktop: false`, 0 console errors), dan Mobile `390×844` (`clipped: false`, `overflowMobile: false`, siklus loop penuh terverifikasi).
29. **Update Animasi Skills — The Exhausted Builder (10-Block Pyramid & Sleeping Finale):**
    - **Visual Storytelling Baru (`SkillBuilderScene.tsx`, `SkillBuilderCanvas.tsx`, `blockTextures.ts`):**
      - **Area Awal 100% Kosong:** Seluruh 10 balok teknologi dimulai dalam kondisi tersembunyi di luar sisi kiri container (`OFFSCREEN_X = -3.95`, `visible = false`), sehingga tidak ada balok yang muncul sebelum benar-benar dibawa masuk oleh tangan monster.
      - **Piramida 10 Balok Teknologi (4-3-2-1):** Tersusun presisi tanpa melayang maupun saling menembus — Dasar: `JavaScript`, `Tailwind`, `Python`, `Vite`; Baris 2: `Laravel`, `MySQL`, `Docker`; Baris 3: `React`, `Git`; Puncak: `PHP`.
      - **State Machine 9-Fase (`entering` → `fetching` → `carrying` → `placing` → `returning` → `resting` → `celebrating` → `exhausted` → `sleeping`):** Kecepatan berjalan melambat bertahap seiring meningkatnya jumlah balok (*progressive fatigue*), jeda istirahat singkat di tengah pembangunan (`resting`), ekspresi puas menatap piramida selesai (`celebrating`), menguap lalu perlahan duduk tertidur (`exhausted` → `sleeping`) di samping piramida (`x = -1.35`) dengan mata terpejam, napas lembut, dan 3 simbol `Z` melayang perlahan.
      - **Interaksi Kursor Aman di Semua Fase:** Tetap mempertahankan *surprise & cursor tracking* saat berjalan/membawa, menunda interupsi saat *placing*, melirik saat *resting*, dan sedikit terbangun/menggeliat lalu kembali tidur saat di-hover ketika *sleeping*.
    - **Preservasi Total:** Tidak mengubah halaman Home, About, 4 kartu kategori Skills, background lintasan, maupun navigasi global.
    - **Verifikasi Playwright:** Lolos `npm run lint` (0 errors), `npm run build` (641ms), Desktop `1440×900` (`initialZeroBlocks: true`, seluruh fase `entering`→`fetching`→`carrying`→`placing`→`returning`→`sleeping`, `finalPlacedCount: 10`, `sleepDisturbedOnHover: true`, `clipped: false`, `overflowDesktop: false`, 0 console errors), dan Mobile `390×844` (`clipped: false`, `overflowMobile: false`).

- **Log 30 (Skills Section — Right-to-Left Pyramid Order, Full Off-Screen Fetch & Extended Pacing):**
    - **Scope:** Hanya memodifikasi `src/monster/components/SkillBuilderScene.tsx` tanpa mengubah layout Skills, 4 kartu keahlian, ukuran/posisi container, dekorasi background, identitas monster/balok, maupun section Hero/About.
    - **Urutan Penyusunan Kanan-ke-Kiri, Bawah-ke-Atas (4-3-2-1):** Mengurutkan ulang `PYRAMID_BLOCKS` agar balok `[1]` (`Vite`, `x = +1.455`) diletakkan paling kanan baris bawah terlebih dahulu, dilanjutkan ke kiri (`[2] Python`, `[3] Tailwind`, `[4] JavaScript`), kemudian baris kedua kanan-ke-kiri (`[5] Docker`, `[6] MySQL`, `[7] Laravel`), baris ketiga kanan-ke-kiri (`[8] Git`, `[9] React`), dan diakhiri puncak `[10] PHP` (`x = +0.72`).
    - **Keluar Penuh dari Area Tampilan (Off-Screen Fetch):** Menggeser `OFFSCREEN_X` dari `-3.95` ke `-5.45` (>2.0 world units di luar batas kiri frustum kamera `-3.44`) agar seluruh tubuh monster dan balok yang dibawa 100% menghilang alami melewati tepi kiri container (tanpa trik opacity) sebelum kembali masuk membawa balok berikutnya.
    - **Pacing Antarbalok Diperpanjang & Sequential:** Menambahkan fase `post_place_pause` (`700ms`) dan `offscreen_fetch` (`1,100ms`), serta mengkalibrasi `baseWalkSpeed` (`4.2 → 3.15` seiring kelelahan) agar transisi `placing` (~700ms) → `post_place_pause` (~700ms) → `returning` (~1,450ms) → `offscreen_fetch` (~1,100ms) → `carrying` (~1,700ms) berjalan alami tanpa tumpang tindih, dan tetap berakhir pada fase `sleeping` setelah balok `[10]` (`PHP`) terpasang.
    - **Verifikasi Playwright:** Lolos `npm run lint` (0 errors), `npm run build` (`tsc -b && vite build`, 567ms), Desktop `1440×900` (terverifikasi real-time `placedIds: ["vite", "python"]`, `monsterFullyOffscreen: true` di `posX: -5.45` selama `offscreen_fetch`, urutan akhir `["vite", "python", "tailwind", "js", "docker", "mysql", "laravel", "git", "react", "php"]`, `phase: "sleeping"`, `clipped: false`, `overflow: false`, 0 console errors), Tablet `768×1024` (`overflow: false`, `clipped: false`), dan Mobile `390×844` (`overflow: false`, `clipped: false`).

- **Log 31 (Skills Section — Real-Time Dynamic Shadows & Slower Organic Movement):**
    - **Root Cause Bug Bayangan:** `<ContactShadows>` di `src/monster/components/SkillBuilderCanvas.tsx` sebelumnya menggunakan `frames={reducedMotion ? 1 : 30}`, sehingga shadow render target hanya di-bake selama 30 frame pertama (~0.5 detik) lalu membeku permanen di posisi awal monster, meninggalkan bayangan statis di tepi kiri dan tidak mengikuti monster maupun balok.
    - **Perbaikan Sistem Bayangan Real-Time:** Mengubah `<ContactShadows>` menjadi `frames={reducedMotion ? 1 : Infinity}` dengan `resolution={256}`, `scale={8.8}`, `far={3.4}`, `blur={2.2}`, `opacity={0.36}` serta mengaktifkan `shadows="percentage"` pada `<Canvas>` dan `castShadow` pada key `<directionalLight>` (`shadow-mapSize={512}`, tight frustum) agar bayangan monster, balok yang dibawa, dan piramida balok tersusun selalu sinkron secara real-time setiap frame termasuk depth shadow antarbalok.
    - **Perlambatan & Penghalusan Gerakan Monster:** Menurunkan `baseWalkSpeed` di `src/monster/components/SkillBuilderScene.tsx` dari `4.2 → 3.15` menjadi `2.55 → 1.95` dengan kurva perlambatan *smoothstep ease-in-out* saat mendekati titik target (`inspectX`, `dropX`, `admireX`), menambahkan damping pose (`smoothTorsoBend`, `smoothArmLift`, `smoothArmInward`) agar transisi membungkuk/mengangkat/meletakkan tidak patah, memperhalus cadence langkah (`5.4 - fatigueLevel * 1.0`), serta memperpanjang fase secara konsisten (`placing` `1,050ms` 3-beat, `post_place_pause` `900ms`, `offscreen_fetch` `1,200ms`, `resting` `1,550ms`, `celebrating` `3,100ms`, `exhausted` `2,300ms`).
    - **Verifikasi Playwright:** Lolos `npm run lint` (0 errors), `npm run build` (523ms), Desktop `1440×900` (terverifikasi real-time `carrying` `~3,198ms`, `placing` `~1,115ms`, `post_place_pause` `~910ms`, `returning` `~2,833ms`, `offscreen_fetch` `~1,212ms`; bayangan real-time pada balok & monster tidur tanpa jejak bayangan statis; `dynamicShadowActive: true`, `clipped: false`, `overflow: false`, 0 console errors), dan Mobile `390×844` (`overflow: false`, `clipped: false`, 0 console errors).

- **Log 32 (Skills Section — Visual Consistency Redesign: Quaternius Mushroom King CC0):**
    - **Analisis Referensi Home & About:** Mengaudit `HeroMonsterModel.tsx` (Home: **Yeti** CC0, bulu `#228B82` + aksen `#86D6CC`, 5-layer skinned fur shells, mata glossy 3D pada tulang `Head`) dan `AboutWorkspaceScene.tsx` (About: **Cactoro** CC0, bulu `#3B8B7C` + topi hangat `#D9A066`, 5-layer skinned fur shells, mata glossy 3D). Keduanya berbagi bahasa geometri stylized Quaternius, proporsi tangan/kaki, material plush `MeshPhysicalMaterial` (`sheen: 1.0`), dan pencahayaan studio lembut.
    - **Penggantian Aset (`public/monsters/skill-builder/mushroom-builder.glb`):** Mengganti aset Skills menjadi **Mushroom King** oleh **Quaternius** (`https://poly.pizza/m/grnFTziU8u`, lisensi **CC0 1.0 Public Domain**, 444 KB `.glb`, 14 animasi & skeleton penuh) dengan proporsi lebih gemuk/pendek (`scale={[0.78, 0.68, 0.78]}`) agar tetap memiliki siluet baru yang unik namun 100% satu universe dengan Yeti (Home) dan Cactoro (About).
    - **Material, Fur & Perbaikan Bug Mata:** Menyembunyikan prop tangan `Mushroom` agar kedua tangan bebas membawa balok; menyembunyikan **kedua** mesh mata bawaan (`Eye_White` & `Eye_Black`) dan memasang tepat **2 mata glossy 3D simetris + kelopak berkedip** (`eyeRadius = 0.00195`, pitch kepala `-0.08` agar pinggir topi tidak menutupi mata) sehingga bug 4 mata tidak terulang. Menerapkan 5-layer skinned fur shells (`furLengthLocal = 0.00068`) dengan bulu tubuh seafoam-teal (`#4BA398` / `#8EDBD1`), topi dome plush hangat (`#D69358` / `#ECC193`), dan aksen perut cream-mint (`#CBECE6`).
    - **Kompatibilitas Animasi Existing:** Mempertahankan 100% timeline Skills (urutan piramida kanan-ke-kiri 10 balok, off-screen fetch `-5.45`, kecepatan gerak lambat organik *ease-in-out*, clearance Z baris atas `idx >= 4`, bayangan dinamis real-time, animasi tidur `Z`, interaksi kursor) tanpa menyentuh Home, About, atau layout Skills.
    - **Verifikasi Playwright:** Lolos `npm run lint` (0 errors), `npm run build` (497ms), perbandingan visual 3 monster (Home Yeti, About Cactoro, Skills Mushroom King carrying & sleeping) di Desktop `1440×900` (`eyeCount: 2`, `dynamicShadowActive: true`, `clipped: false`, `overflow: false`, 0 console errors) serta Mobile `390×844` (`overflow: false`, `clipped: false`, 0 console errors).

- **Log 33 (Skills Section — Redesign Total Monster Skills: Custom Two-Tone Chubby Plush Mascot GLB):**
    - **Analisis & Arah Visual:** Menyelaraskan Monster Skills secara penuh dengan kualitas dan bahasa desain Monster Home (`yeti-mascot.glb`) dan Monster About (`cactoro-dev.glb`) tanpa tudung jamur, tanpa duri/tanduk, tanpa cakar, dan tanpa wajah reptil/amfibi.
    - **Pembuatan Aset 3D Baru (`public/monsters/skill-builder/chubby-builder.glb` & `scripts/generate-chubby-builder-glb.mjs`):** Memahat dan mengekspor model glTF 2.0 binary (`.glb`) original berlisensi penuh milik project (*First-Party Project Asset / CC0*) dengan siluet *chubby gumdrop/dumpling* yang menyatukan kepala lebar dan perut bulat secara mulus (tanpa leher sempit/patah), *triangle-partitioned two-tone surface* (`Builder_Main` `#258F85` turquoise-teal coat + `Builder_Secondary` `#8EE0D6` flush pastel mint-teal face mask, oval belly patch, tangan mitten & kaki pendek), 3 jambul plush kecil di puncak kepala, telinga bulat lembut di samping, hidung bulat pastel, senyum ramah dengan lidah pink & gigi bulat kecil, serta pipi merona lembut.
    - **Material, Velvety Fur & 2 Mata Glossy (`src/monster/components/SkillBuilderScene.tsx`):** Menggunakan `MeshPhysicalMaterial` (`sheen: 1.0`, `getFurBumpTexture()`) dan 5-layer *velvety micro-plush fur shells* dengan UV palet seragam sehingga permukaan bulu halus seperti Monster Home tanpa bintik noise, serta memasang tepat **2 mata glossy 3D simetris + rim soket teal gelap + kelopak mata berkedip** (`eyeCount: 2`).
    - **Kompatibilitas Animasi Existing:** Mempertahankan 100% mekanisme animasi Skills (muncul dari kiri, off-screen fetch `-5.45` hingga 100% tak terlihat, penyusunan piramida 10 balok kanan-ke-kiri bawah-ke-atas, kecepatan gerak organik *ease-in-out*, clearance Z baris atas, bayangan dinamis real-time, animasi menguap & tidur `Z`, serta interaksi kursor).
    - **Verifikasi Playwright:** Lolos `npm run lint` (0 errors), `npm run build` (538ms), inspeksi berdampingan Home, About, dan Skills (carrying & sleeping) di Desktop `1440×900` (`eyeCount: 2`, `dynamicShadowActive: true`, `clipped: false`, `overflow: false`, 0 console errors) serta Mobile `390×844` (`overflow: false`, `clipped: false`, 0 console errors).

- **Log 34 (Skills Section — Total Monster Replacement & Reset Old Design Constraints: Modern Smooth Soft-Matte Designer Mascot):**
    - **Reset Kriteria Desain Lama (Deprecated):** Membatalkan dan menghapus seluruh preferensi desain lama pada Monster Skills (tubuh gendut/gemuk/chubby blob, tekstur fur/fluffy/bulu tebal, siluet boneka berbulu, dan kepala tudung jamur) baik pada implementasi kode maupun dokumentasi `docs/MONSTER_CHARACTER_GUIDE.md`.
    - **Arah Desain Baru (`public/monsters/skill-builder/modern-builder.glb` & `scripts/generate-modern-builder-glb.mjs`):** Memahat dan mengekspor karakter maskot 3D baru (**The Skill Builder — Modern Smooth Soft-Matte Designer Mascot**, lisensi *First-Party Original Project Asset / CC0*) dengan:
      1. **Proporsi Normal, Ramping & Seimbang:** Torso ramping berpotongan *athletic-stylized* dengan *utility belt* slate-teal (`#164E4A`) + gesper amber (`#F59E0B`), lengan & tungkai proporsional, manset pergelangan amber, tangan *cream-mint* beribu-jari jelas, dan sepatu *two-tone builder boots*.
      2. **Permukaan 100% Halus & Soft-Matte (`hasFur: false`):** Menghapus seluruh *fur bump map* dan *fur shell layers* pada `SkillBuilderScene.tsx`, digantikan material *soft-matte designer vinyl/clay* (`MeshPhysicalMaterial` `roughness: 0.44–0.46`, `clearcoat: 0.08`).
      3. **Siluet Kepala & Wajah Ekspresif (`eyeCount: 2`):** Kepala *rounded-squircle* modern dengan *swept-up fantasy sprite ear-crests*, antena builder berujung bola amber (`AntennaOrb`) yang memantul halus saat berjalan dan merunduk saat tidur, *flush cream-mint face plate* (`#DFF6F2`), tepat **2 mata glossy 3D simetris** dengan kelopak teal halus, **alis 3D (`BrowL`/`BrowR`) yang bergerak dinamis mengikuti emosi**, hidung kecil, pipi merona, dan senyum ramah berlidah coral-pink.
    - **Pelestarian Animasi & Dokumentasi:** Mempertahankan 100% mekanisme animasi Skills (off-screen fetch `-5.45`, urutan piramida 10 balok kanan-ke-kiri, gerakan *ease-in-out*, dynamic shadow real-time, reaksi kursor, serta menguap & tidur `Z`). Memperbarui `docs/MONSTER_CHARACTER_GUIDE.md` agar kriteria lama tidak lagi menjadi acuan.
    - **Verifikasi:** Lolos `npm run lint` (0 errors), `npx tsc -b` (0 errors), serta verifikasi visual & fungsional Playwright di Desktop `1440×900` dan Mobile `390×844` (`hasFur: false`, `eyeCount: 2`, `dynamicShadowActive: true`, `clipped: false`, `overflow: false`, 0 console errors).

- **Log 35 (Skills Section — Strict Visual Match: Monkroose CC0 by Quaternius):**
    - **Analisis & Penghapusan Karakter Sci-Fi/Alien:** Mengeliminasi seluruh elemen sci-fi, antena, dan siluet yang tidak konsisten dari iterasi sebelumnya agar Monster Skills seirama secara visual dengan Monster Home (Yeti) dan Monster About (Cactoro).
    - **Aset Resmi Satu Bundle Quaternius (`public/monsters/skill-builder/builder-mascot.glb`):** Mengadopsi karakter **Monkroose** dari koleksi resmi **Ultimate Monsters Bundle** oleh 3D artist **Quaternius** (lisensi **CC0 1.0 Public Domain**, 421 KB `.glb`), keluarga bundel yang sama persis dengan Yeti dan Cactoro. Memiliki anatomi low-poly stylized yang ramah, proporsi seimbang, telinga bulat lembut, dan moncong bersahabat tanpa antena, tanduk, atau tudung jamur.
    - **Penyelarasan Material Plush & Bola Mata 3D:**
      - Coat utama `Monkroose_Main` dipetakan ke signature turquoise-teal (`#228B82`) dengan `MeshPhysicalMaterial` (`sheen: 1.0`, `sheenRoughness: 0.6`, `sheenColor: #A7F3D0`, `bumpMap: getFurBumpTexture()`, `bumpScale: 0.015`).
      - Aksen sekunder `Monkroose_Secondary` dipetakan ke soft pastel mint-teal (`#86D6CC`) pada moncong, perut, telapak tangan, dan kaki.
      - Telinga bulat `Monkroose_Ears` dipetakan ke soft mint-teal (`#7ECFC3`).
      - Memasang tepat **2 bola mata 3D glossy simetris** pada tulang `Head` dengan iris deep teal (`#0D6E68`), specular catchlight ganda, dan kelopak mint (`#73C9BE`) yang berkedip dinamis dan terpejam saat tidur.
    - **Preservasi 100% Animasi The Exhausted Builder:**
      - Penyusunan 10 balok piramida kanan-ke-kiri bawah-ke-atas (Row 0: Vite, Python, Tailwind, JS; Row 1: Docker, MySQL, Laravel; Row 2: Git, React; Apex: PHP).
      - Off-screen fetch di `x = -5.45` (>2 unit di luar frustum kamera) sehingga monster dan balok yang dibawa 100% menghilang alami dari tepi kiri sebelum kembali masuk.
      - Pose pelukan natural membawa balok (`computeCarryPosition`) dengan koordinasi lengan `UpperArm.L/R` dan `LowerArm.L/R` yang pas.
      - Contact shadow real-time dinamis (`frames={Infinity}`) tersinkronisasi sepanjang gerak monster dan tumpukan piramida.
      - Finale perayaan, menguap lembut, dan tidur lelap di samping piramida (`x = -1.35`) lengkap dengan 3 sprite `Z` mengambang.
    - **Verifikasi Side-by-Side Playwright:** Terverifikasi perbandingan berdampingan 3 monster (Yeti, Cactoro, Monkroose) di `test-mascot.html`, lolos `npm run lint` (0 errors), `npx tsc -b` (0 errors), verifikasi desktop `1440×900` dan mobile `390×844` (`loaded: true`, `eyeCount: 2`, `hasFur: true`, `dynamicShadowActive: true`, `clipped: false`, 0 console errors).

- **Log 36 (2026-11-21) — Critical Fix: Rebuild & Restore Skills Monster Visual Structure:**
  - **Akar Masalah Teridentifikasi:**
    1. Penggunaan `scene.clone(true)` pada SkinnedMesh alih-alih `SkeletonUtils.clone(scene)`: binding tulang skeleton tidak terduplikasi ke klon baru sehingga mesh masih terikat ke tulang template awal di `(0, 0, 0)`, mengakibatkan deformasi ekstrem dan bagian tubuh (kepala, tangan, kaki) terpisah ribuan unit di ruang 3D saat carrier berpindah.
    2. Kesalahan kalkulasi orientasi tulang `applyCharSpaceDelta`: hanya mengalikan delta Euler langsung ke rest quaternion tanpa konversi ruang karakter ke ruang lokal parent (`parentInChar^-1 * deltaChar * parentInChar * rest`), menyebabkan sendi lengan dan kaki berputar di luar sumbu anatomi.
    3. Frustum culling prematur pada SkinnedMesh: `frustumCulled: true` menyebabkan mesh tubuh menghilang saat bounding sphere awal keluar frustum.
    4. Skala dan komposisi tidak seimbang: proporsi monster (`scale=0.78`) dan balok (`size 0.45`) terlalu kecil dibandingkan panggung dan kartu kategori di samping.
  - **Perbaikan yang Dilakukan:**
    1. Menggunakan `cloneSkeleton` dari `three/examples/jsm/utils/SkeletonUtils.js` untuk integritas skeleton binding 100%.
    2. Menghubungkan skeletal `AnimationMixer` bawaan (`CharacterArmature|Walk` dan `Idle`) untuk langkah kaki dan ayunan badan yang natural tanpa deformasi sendi.
    3. Memperbaiki fungsi `applyCharSpaceDelta` dengan matriks orientasi parent-relatif yang presisi untuk pose membawa balok dan duduk istirahat.
    4. Menetapkan `mesh.frustumCulled = false` pada seluruh bagian tubuh monster sehingga tidak pernah menghilang.
    5. Menyesuaikan posisi soket mata 3D ke permukaan depan wajah di atas moncong (`eyeRadius = 0.00215`, forward offset `eyeRadius * 1.55`).
    6. Memperbesar skala karakter menjadi `scale={1.05}` dan ukuran balok menjadi `[0.56, 0.50, 0.54]` dengan `DX = 0.60`, menciptakan komposisi visual yang mantap, proporsional, dan seimbang dengan 4 kartu kategori.
    7. Menyesuaikan pacing cerita menjadi lebih tenang dan organik (kecepatan jalan `1.15 - 0.78` dengan jeda aksi yang natural).
  - **Hasil Pengujian & Verifikasi:**
    - `npm run lint` $\rightarrow$ 0 errors, 0 warnings.
    - `npm run build` (`tsc -b && vite build`) $\rightarrow$ 0 errors (clean build).
    - Inspeksi visual Playwright pada resolusi Desktop (1440×900) dan Mobile (390×844) memverifikasi karakter tampil utuh sempurna, tidak ada bagian tubuh yang terpisah atau melayang, animasi membawa dan menyusun 10 balok berjalan mulus, dan monster tertidur dengan tenang di samping piramida.

- **Log 37 (2026-11-21) — Fix Monster Detached Eyes & Natural Two-Hand Block Carrying Grip (`SkillBuilderScene.tsx`):**
  - **Perbaikan Keterikatan Mata 3D (Skeletal Inverse Bind Matrix Socketing):**
    - Mengekstrak koordinat soket mata langsung dari `origEyeMesh.skeleton.boneInverses[headIdx]` dalam *local space* tulang `Head` (`Left: [-0.003388, 0.003466, 0.001834]`, `Right: [+0.003403, 0.003466, 0.001831]`, orientasi normal `Vector3(±0.266, 0.365, 0.892).normalize()`) sehingga kedua mata terikat permanen sebagai direct child dari `Head` tanpa pernah terlepas.
  - **Akar Masalah Pose Membawa Balok Terdahulu:**
    1. Balok diposisikan dengan offset global rendah (`carryHeight = 0.72`–`0.74`) tepat di depan pinggang/perut bawah dan terlepas dari gerakan bobbing vertikal tulang tubuh.
    2. Rotasi lengan sebelumnya (`rz = +0.38` pada `UpperArmL`, `-0.38` pada `UpperArmR`, dan `lowerArmBend = -0.32`) justru membuka siku dan tangan melebar ke samping (`handSpanX ≈ 1.39`–`2.94` unit dibanding lebar balok `0.56` unit).
    3. Animasi bawaan `CharacterArmature|Idle` tidak memiliki track untuk `UpperArm.L/R`, dan `CharacterArmature|Walk` mengubah tulang jari tangan kanan secara asimetris (`Index2.R..Thumb2.R`).
  - **Arsitektur Carry Anchor & Pose Pegangan Dua Tangan (Two-Hand Block Grip):**
    1. **Carry Anchor Hierarchy (`carryAnchorRef`):** Menambahkan node `<group ref={carryAnchorRef} name="CarryAnchor" />` di dalam `monsterRootRef` yang dikunci secara real-time setiap frame pada titik tengah (*midpoint*) antara telapak tangan kiri (`Middle2L`) dan telapak tangan kanan (`Middle2R`) di depan torso (`Y ≈ 0.98`–`1.09`, `Z ≈ 0.66`). Transformasi balok yang sedang dibawa dikonversi langsung dari world matrix `carryAnchorRef` ke local space `stageGroupRef`, sehingga gerakan naik-turun saat berjalan (*walk step-bob*), napas, dan kemiringan torso tersinkronisasi 100% tanpa jeda atau efek melayang.
    2. **Kalibrasi Pose Lengan & Tangan Berbasis Vertex SkinnedMesh (`Monkroose_3`):** Mengoptimasi rotasi `ShoulderL/R`, `UpperArmL/R`, dan `LowerArmL/R` terhadap *GPU-skinned vertex bounding box* mesh tangan (`applyBoneTransform`) pada 3 ketinggian koheren (`LOW_GRIP`, `MID_CARRY`, `HIGH_GRIP`) serta mereset tulang jari (`Index1..3`, `Middle1..3`, `Pinky1..3`, `Thumb1..2`) agar kedua telapak tangan dan jari-jari (`X = ±0.240..±0.648`, `Y = 0.683..1.317`, `Z = 0.276..1.033`) menempel presisi mengapit dinding kiri dan kanan balok (`X = ±0.267`, `Y = 0.73..1.21`, `Z = 0.40..0.92`) tanpa clipping ke dalam balok maupun dada.
    3. **Transisi Halus Pickup, Carry, Placement & Idle (`gripWeight`, `carryHeightNorm`, `releaseSpread`):**
       - **Pickup (`offscreen_fetch`):** Monster membungkuk dan menggerakkan tangan ke `LOW_GRIP`, menyentuh sisi balok, lalu mengangkatnya mulus ke `MID_CARRY` di depan torso.
       - **Carry & Walking (`carrying`, `slowing_down`, `surprised`, `looking`, `resuming`):** `gripWeight = 1.0` menjaga kedua tangan tetap memegang sisi kiri dan kanan balok sepanjang perjalanan maupun saat melirik kursor.
       - **Placement (`placing`):** Kedua tangan tetap mengapit balok sambil menurunkan/mengangkatnya (`carryHeightNorm` bertransisi menuju ketinggian baris piramida `slotHeightNorm`) hingga balok menyentuh posisi target (`p = 0.72`), baru kemudian tangan membuka halus ke samping (`releaseSpread`) dan kembali ke pose idle natural.
  - **Verifikasi:** Lolos `npm run lint` (0 errors), `npm run build` (0 errors), serta pengujian koordinat multi-fase dan inspeksi visual Playwright pada fase Idle, Pickup, Carry, Walking, dan Placement.

- **Log 38 (2026-11-21) — Section 04 — Experience: Monster Asset Proportion, Rigging Refinement & Prop Calibration (`CareerArchivistScene.tsx`):**
  - **Identifikasi Masalah Terdahulu:**
    - Telapak tangan dan jari monster terlalu besar (proporsi flipper/dayung melebar 120°) dibandingkan kertas, dokumen, map arsip, dan stempel kantor.
    - Dimensi properti terbalik secara spasial (map berkas berukuran `0.24×0.30`, lebih kecil daripada dokumen `0.26×0.36`).
    - Masih terdapat tombol pill UI manual di bawah kanvas alih-alih sequence otomatis yang mulus.
  - **Penyempurnaan Proporsi Anatomi & Rigging Tangan (22 Skeletal Finger Joints):**
    1. **Skalasi Selektif Telapak & Jari (`HAND_SCALE = 0.72`):** Menerapkan reduksi skala 28% secara khusus pada 4 root finger bones di kedua tangan (`Thumb1`, `Index1`, `Middle1`, `Pinky1`) tanpa mengecilkan tubuh, lengan, atau kepala.
    2. **Preset Pose Jari Natural (`applyHandPose`):**
       - `relaxed`: Lengkungan jari natural bertumpu di atas meja.
       - `documentHold`: Ibu jari menekan lembut tepi dokumen tanpa menutupi teks.
       - `folderHold`: Pegangan dua tangan mengapit tepian map berkas tebal.
       - `stampGrip`: Jari melingkar ergonomis memegang gagang kayu stempel dengan telapak tangan di atas knob bulat.
       - `waveOpen`: Lambaian tangan ramah dengan jari terbuka ceria.
    3. **Kalibrasi Dimensi Properti Kantor Realistis:**
       - Dokumen Karier: `[0.30, 0.42]` (A4 aspect ratio) dengan tekstur dokumen terverifikasi cap stempel merah.
       - Map Berkas Arsip: `[0.34, 0.46, 0.024]` (lebih besar dari dokumen sehingga menampung lembar di dalamnya).
       - Tumpukan Map Meja: `[0.26, 0.012, 0.36]`.
       - Stempel Kayu & Kuningan: Gagang bubut ergonomis (`r = 0.014–0.022`, tinggi `0.070`), knob bola (`r = 0.024`), kerah kuningan (`r = 0.024`), bantalan cap merah (`[0.052, 0.010, 0.052]`).
    4. **Alur Otomatis Tanpa Tombol UI:**
       - Menghapus seluruh pill action buttons di bawah kanvas.
       - Transisi berulang otomatis: `idle` (2.5s) $\rightarrow$ `inspect` (3.5s) $\rightarrow$ `organize` (3.5s) $\rightarrow$ `stamp` (2.8s) $\rightarrow$ `review` (2.2s) $\rightarrow$ `celebrate` (1.8s).
  - **Hasil Pengujian & Verifikasi:**
    - `npm run lint` $\rightarrow$ 0 errors.
    - `npm run build` $\rightarrow$ 0 errors (clean build).
    - Inspeksi visual Playwright pada seluruh 6 fase (`idle`, `inspect`, `organize`, `stamp_impact`, `review`, `celebrate`) memverifikasi proporsi tangan yang jauh lebih natural, tidak ada clipping, dan alur otomatis berputar tanpa henti.

- **Log 39 (2026-11-21) — Section 04 Critical Animation Fix: Hand-Object Synchronization (2-Bone Arm IK + Reusable Attachment System) & Single-Controller Head Orientation (`CareerArchivistScene.tsx`):**
  - **Akar Masalah Teridentifikasi:**
    1. **Kepala Berputar Berlebihan / Terbalik:** Kode lama menerapkan `headBoneRef.current.quaternion.multiply(headDelta)` secara kumulatif setiap frame di atas quaternion tulang `Head` tanpa reset ke *rest pose*, serta berkonflik dengan klip `Yes` dan `Wave` dari `AnimationMixer`. Ketika mixer tidak menimpa `Head` pada frame tertentu, delta rotasi terus terakumulasi 60x/detik sehingga kepala berputar/terbalik.
    2. **Tangan Tidak Mengikuti Objek (Kertas & Stempel Melayang Sendiri):** Posisi stempel (`targetStampX/Y/Z`) dan map (`heldFolder.position.set`) dianimasikan secara independen dengan koordinat hardcoded, sementara lengan menggunakan estimasi Euler manual pada sisi lengan yang keliru (`UpperArmR` di sisi negatif X, padahal stempel berada di sisi positif X dekat `UpperArmL`) sehingga kedua tangan terlempar ke tepi luar meja sementara stempel bergerak sendiri.
  - **Perbaikan Arsitektur Animasi:**
    1. **Single-Controller Bounded Head System:**
       - `AnimationMixer` dibatasi hanya menjalankan breathing halus klip `Idle` (`weight = 0.45`), dan tulang `Neck` di-reset ke `restQuat` setiap frame agar tidak ada konflik pengendali rotasi kepala.
       - Satu pengendali terpadu (`headStateRef` + `applyCharSpaceDelta('Head', pitch, yaw, roll, 'YXZ')`) selalu memulai dari `restQuatsRef.current['Head']` (mustahil terakumulasi/berputar), di-clamp ketat (`yaw ±12.6°`, `pitch -8°..+12.6°`, `roll ±4.5°`), dan di-damp halus (`THREE.MathUtils.damp`). Cursor tracking dibatasi halus hanya saat `idle` sehingga tidak mengganggu fokus membaca atau mengecap.
    2. **Analytical 2-Bone Arm IK (`solveArmIK`):**
       - Menyelesaikan kinematika terbalik 2 tulang (`UpperArm -> LowerArm -> Middle2` pusat cengkeraman jari) menggunakan *Law of Cosines* dan *pole vector* siku natural keluar-bawah.
       - Memastikan tangan kiri (`L`, sisi kanan layar) dan tangan kanan (`R`, sisi kiri layar) selalu mencapai titik grip properti secara presisi milimeter di atas meja maupun kabinet arsip.
    3. **Reusable Hand-Object Attachment System (`attachProp`, `releaseProp`, `syncPropTransform`, `resetAllAttachments`):**
       - Mendukung 3 properti terpadu: `paper` (`deskDocGroupRef`), `folder` (`heldFolderRef`), dan `stamp` (`deskStampRef`) dengan mode anchor `'L'`, `'R'`, atau `'BOTH'`.
       - **Inspect:** Tangan mendekati tepi dokumen (dokumen tetap diam) $\rightarrow$ membentuk `documentHold` $\rightarrow$ `attachProp('paper', 'BOTH')` $\rightarrow$ mengangkat dokumen ke posisi baca di depan dada $\rightarrow$ menurunkan hingga menyentuh meja $\rightarrow$ `releaseProp('paper')` mempertahankan transformasi stabil di atas meja.
       - **Organize:** Tangan kanan membuka laci atas kabinet $\rightarrow$ mengambil map arsip $\rightarrow$ kedua tangan memegang map (`BOTH`) membawanya ke tumpukan meja $\rightarrow$ `releaseProp('folder')`.
       - **Stamp:** Tangan kiri mendekati gagang stempel di bantalan tinta (stempel tetap diam) $\rightarrow$ `attachProp('stamp', 'L', STAMP_GRIP_OFFSET)` $\rightarrow$ mengangkat stempel $\rightarrow$ menggeser tepat ke atas dokumen $\rightarrow$ menekan lurus ke bawah hingga cap merah tertera $\rightarrow$ mengembalikan ke bantalan tinta $\rightarrow$ `releaseProp('stamp')`.
  - **Hasil Pengujian Numerik & Visual Playwright (10 Checkpoint + Live Playback):**
    - `npm run lint` $\rightarrow$ 0 errors, `npm run build` $\rightarrow$ 0 errors.
    - **Akurasi Sinkronisasi Tangan-Objek:** `stampDistCm = 0.00 cm` pada seluruh fase `stamp_lifted`, `stamp_impact`, dan `stamp_returning`; `paperMidDistCm = 1.00 cm` (offset vertikal grip) saat mengangkat & membaca, dan `0.10 cm` saat diletakkan.
    - **Stabilitas Kepala (Live Playback 8 sampel):** `headDeg` selalu terkendali tenang pada `pitch: 2.1°..10.3°`, `yaw: -1.1°..+7.4°`, `roll: 0.0°` tanpa rotasi berlebih atau terbalik.

- **Log 40 (2026-11-21) — Section 04 Work Desk Redesign & Monster Scale Rebalance (`CareerArchivistScene.tsx`, `CareerArchivistCanvas.tsx`):**
  - **Redesign Meja Kerja Konsisten dengan Section 02 — About:**
    - Mengganti meja prosedural tipis berkaki hairpin sebelumnya dengan instance klon independen dari aset meja GLB Section 02 (`/models/workspace/desk.glb`) melalui helper `buildArchivistDesk()`, mempertahankan palet material persis (`#DFC3A3` kayu hangat `roughness: 0.72` + `#3A3735` aksen matte gelap) tanpa menyentuh atau mengubah Section 02.
    - Memperlebar dimensi meja secara proporsional menjadi **`1.58m × 0.72m × 0.64m`** (+39% lebih lebar dan lebih dalam dibanding meja lama `1.14m × 0.79m × 0.46m`) sehingga menyediakan area kerja luas untuk dokumen aktif, tumpukan dokumen belum diproses (*inbox stack*), bantalan tinta & stempel, kalender, serta tumpukan map arsip.
  - **Rebalancing Skala Monster & Posisi Kerja:**
    - Mengecilkan skala monster secara seragam (*uniform scaling*) dari `0.84` menjadi **`0.66`** (~78.5% dari ukuran sebelumnya), menjaga anatomi, wajah, mata, topi, kemeja, dasi, dan ID card tetap utuh.
    - Menyelaraskan posisi berdiri monster (`[0, -0.015, 0.02]`, kaki menapak lantai `y = 0`) tepat di belakang meja `0.72m`, sehingga siku berada natural di atas permukaan meja dan kedua tangan menjangkau seluruh properti secara ergonomis via 2-bone Arm IK.
    - Menyelaraskan ketinggian `ContactShadows` (`y = -0.785`) dan elevasi kamera (`y = 0.56`) agar bayangan menapak presisi dan seluruh permukaan meja terbaca jelas.
  - **Kalibrasi Ulang Dimensi Properti:**
    - Dokumen aktif: `[0.25, 0.34]` (A4 proporsional), map arsip: `[0.28, 0.38, 0.020]`, stempel kayu-kuningan (`handle 0.060`, `knob r=0.021`, `die 0.045`), tumpukan dokumen kiri (`[-0.48]`), tumpukan map kanan (`[+0.54]`), dan kabinet arsip mini diselaraskan tingginya menjadi `0.76m` di samping kiri meja (`x = -0.96`, jarak aman 5cm bebas tabrakan).
  - **Hasil Pengujian & Verifikasi:**
    - `npm run lint` $\rightarrow$ 0 errors, `npm run build` $\rightarrow$ 0 errors.
    - Inspeksi visual Playwright Desktop (`1440×900`) pada fase `idle`, `inspect`, `stamp_lifted`, dan `stamp_impact` serta Mobile (`390×844`) memverifikasi tidak ada clipping, seluruh animasi & attachment tetap berjalan presisi, dan Section 02 (`#about`) 100% bebas regresi (`loaded: true`, `clipped: false`).

- **Log 41 (2026-11-21) — Section 04 Shadow Clipping Fix & Stamp Visibility Enhancement (`CareerArchivistCanvas.tsx`, `CareerArchivistScene.tsx`, `ExperienceSection.tsx`):**
  - **Investigasi & Perbaikan Sumber Shadow Clipping:**
    1. **Akar Masalah:** Kolom kanvas `lg:col-span-4` ber-aspect ratio portrait (`~0.70`) memotong tepi kiri dan kanan shadow lantai (`ContactShadows`) pada batas drawing buffer WebGL (`x = ±1.14m`), sementara workstation (`1.99m`) + soft blur shadow membutuhkan ruang sebar hingga `±1.35m`.
    2. **Solusi:** Menambahkan `overflow-visible` dan horizontal render bleed (`-mx-6 sm:-mx-10 lg:-mx-12`, lebar `+3rem..+6rem`) pada wrapper kanvas tanpa mengubah layout grid editorial, memundurkan kamera secara halus (`[0.0, 0.62, 5.55]`), memusatkan `ContactShadows` tepat di bawah workstation (`[0.0, -0.784, 0.28]`, `scale={4.2}`, `resolution={512}`, `opacity={0.28}`, `blur={2.2}`, warna hangat `#44403C`), serta meningkatkan resolusi shadow map `directionalLight` menjadi `1024×1024` dengan frustum ketat `[-2.4, 2.4, 2.2, -1.8]`.
  - **Perbesaran (~1.42×) & Visibilitas Stempel di Kondisi Idle:**
    1. Memperbesar stempel secara proporsional: bantalan karet merah `[0.066, 0.013, 0.066]`, kerah kuningan `r=0.030`, gagang kayu bubut `r=0.017–0.027, h=0.085`, knob bulat atas `r=0.030`, beserta bantalan tinta serasi `[0.115, 0.016, 0.095]`.
    2. Memindahkan `STAMP_REST_POS` ke area terbuka depan-kanan meja `(+0.22, DESK_HEIGHT + 0.018, +0.12)` dan menyesuaikan `LEFT_HAND_IDLE_DESK` ke `(+0.42, DESK_HEIGHT + 0.042, -0.06)` sehingga seluruh bentuk dan warna stempel terlihat utuh dan jelas saat `idle` tanpa tertutup tangan monster.
    3. Memperbarui `STAMP_GRIP_OFFSET` menjadi `(0, -0.098, 0.010)` sehingga animasi pendekatan, genggaman, pengangkatan, pengecapan, dan pengembalian stempel tetap sinkron 100%.
  - **Verifikasi:** Lolos `npm run lint` (0 errors), `npm run build` (0 errors), serta inspeksi visual Playwright Desktop (`1440×900`) pada fase `idle`, `stamp_lifted`, `stamp_impact`, dan Mobile (`390×844`) — shadow lembut utuh bebas terpotong dan stempel tampil jelas di atas meja.

- **Log 42 (2026-11-21) — Section 04 Shadow System Restoration & Container Render Area Expansion (`CareerArchivistCanvas.tsx`, `CareerArchivistScene.tsx`):**
  - **Pemulihan Penuh Sistem Shadow Asli:** Mengembalikan seluruh parameter asli `ContactShadows` (`position={[0, -0.785, 0]}`, `opacity={0.34}`, `scale={6.5}`, `blur={2.0}`, `far={2.8}`, `resolution={256}`, `color="#374151"`), `directionalLight` (`[3.2, 5.2, 4.0]`, shadow camera `[-3.5, 3.5, 3.0, -2.2]`), kamera (`[0.0, 0.56, 5.2]`), dan `stageGroupRef` (`[0.12, -0.78, 0]`) sehingga bentuk, kedalaman, kelembutan, dan pijakan shadow di bawah monster, meja, serta kabinet kembali 100% identik seperti sebelumnya.
  - **Perluasan Area Container Shadow Tanpa Mengubah Skala Monster:** Memperluas area render horizontal `<Canvas>` (`-mx-8 sm:-mx-12 lg:-mx-20`, lebar `+4rem..+10rem` → `576×580px` pada desktop 1440p) dengan mempertahankan tinggi container tetap sama (`h-full`) dan `overflow-visible`, sehingga ukuran pixel monster dan meja 100% tidak berubah sementara seluruh sebaran shadow tampil utuh tanpa terpotong tepi container.
  - **Retensi Stempel:** Perbesaran stempel (~1.42×), posisi terbuka saat `idle`, dan animasi genggaman stempel dipertahankan sepenuhnya.
  - **Verifikasi:** Lolos `npm run lint` (0 errors), `npm run build` (0 errors), serta verifikasi visual Playwright Desktop (`1440×900`) dan Mobile (`390×844`).

- **Log 43 (2026-11-22) — Section 04 Monster Eye Hierarchy Fix: Eliminate Overlapping Eyeballs & Seamless Socketing (`CareerArchivistScene.tsx`):**
  - **Hasil Audit Scene Graph & Akar Masalah:**
    1. **Duplikasi Mount pada `useEffect` Cleanup:** `useEffect` menambahkan `ArchivistEye_L`, `ArchivistEye_R`, `ArchivistNewsboyCap`, `ShirtCollar`, dan `ArchivistBadge` ke `headBone`/`torsoBone` tanpa menghapusnya pada fungsi cleanup maupun sebelum re-mount, sehingga di React 19 `StrictMode` atau HMR dapat memicu penumpukan dua pasang bola mata (4 bola mata).
    2. **Protrusi Depan & Shell Kelopak Berlebihan:** `eyeMount.translateZ(0.00040)` mendorong bola mata terlalu jauh ke depan soket asli `Frog_4` (`z = 0.00409` dibanding pusat soket `0.00357`), sementara `upperLidGeo`/`lowerLidGeo` berukuran `eyeRadius * 1.13` berwarna mint pucat (`#73C9BE`) membentuk siluet bola kedua yang menumpuk di depan tonjolan mata asli kepala (`#228B82`) terutama saat berkedip.
    3. **Translasi Pupil Off-Axis:** Pergerakan gaze sebelumnya menggeser `pupilGroup.position.x/y` secara datar alih-alih rotasi sferis di pusat bola mata.
  - **Perbaikan Struktur & Hierarchy:**
    1. **Deduplikasi & Cleanup Ketat (`removeByNames` + `attachedNodes`):** Memastikan setiap node kustom pada `headBone`/`torsoBone` dibersihkan sebelum mount dan dihapus (`parent.remove(child)`) saat unmount — menjamin secara absolut hanya ada tepat 2 bola mata (`ArchivistEye_L` / `Sclera_L` dan `ArchivistEye_R` / `Sclera_R`), dengan `Frog_3` dan `Frog_4` tetap `visible: false`.
    2. **Anatomical Socket Nestling & Head-Matched Eyelids:** Menempatkan kedua mata simetris di dalam soket anatomis (`[±0.00350, 0.00552, 0.00342]`, `eyeRadius = 0.00120`, tanpa protrusi `translateZ`), mengecilkan shell kelopak menjadi pas (`eyeRadius * 1.04`) dengan material `#228B82` identik warna kepala dan sudut buka tersembunyi rapi (`-1.55 / +1.50 rad`).
    3. **Spherical Gaze Rotation:** Mengubah eye tracking menjadi rotasi sferis `pupilGroup.rotation.y/x` (clamp `±0.24 / -0.18..+0.22 rad`) agar iris, pupil, dan catchlights selalu menempel mulus di permukaan lengkung bola mata.
  - **Hasil Pengujian & Verifikasi:**
    - `npm run lint` $\rightarrow$ 0 errors, `npm run build` $\rightarrow$ 0 errors.
    - Audit scene graph Playwright: `eyeMountCount: 2`, `scleraCount: 2`, `frog3Vis: false`, `frog4Vis: false`.
    - Inspeksi close-up Playwright pada tampak depan (`idle`), tampak tiga-perempat kiri (`organize`), dan kondisi berkedip/tersenyum (`celebrate`) memverifikasi tepat 2 mata simetris, menyatu natural di wajah, dan bebas tumpang tindih.

- **Log 44 (2026-11-22) — Section 05 Projects: The Showcase Operator — 3D Character, Outfit, 2-Bone Arm IK & Synchronized Project Pagination (`ShowcaseOperatorScene.tsx`, `ShowcaseOperatorCanvas.tsx`, `ProjectsSection.tsx`, `PortfolioShell.tsx`):**
  - **Desain Karakter & Konsistensi Keluarga Maskot:**
    - Menambahkan aset dedikasi `public/monsters/showcase-operator/operator-mascot.glb` (CC0 Quaternius Cute Monster Pack `Dino`, 43-bone `CharacterArmature`) dengan material bulu keluarga `#228B82` + mint `#86D6CC`, menyembunyikan taring & lidah (`Dino_Teeth`, `Dino_Tongue`), dan memasang tepat 2 mata glossy 3D (`OperatorEye_L/R`) berbasis ekstraksi soket inverse-bind matrix dengan kelopak `#228B82` dan cleanup deduplikasi ketat.
    - Melengkapi outfit operator mini: headset dengan dual ear cups + aksen teal + boom mic (`OperatorHeadset`), topi operator kasual (`OperatorCap`), kerah kemeja + lapel rompi (`OperatorOutfit`), ID card akrilik `"PROJECT OPERATOR"` (`operatorTextures.ts`), serta manset sarung tangan putih-amber (`OperatorGloveCuff_L/R`).
  - **Integrasi Langsung ke Pagination Existing (`01`–`06`) & Autoplay/Manual Control:**
    - Menempatkan `<ShowcaseOperatorCanvas />` tepat di bawah bar pagination pada sisi kiri Section 05 (`ProjectsSection.tsx`) tanpa mengubah konten proyek, tombol `Live Website`, maupun monitor preview di kanan.
    - Mengukur posisi aktual tombol DOM `01`–`06` terhadap container kanvas via `ResizeObserver` dan `window.resize` (zero DOM polling per frame), lalu memproyeksikannya ke koordinat 3D (`ndcXToWorldX`) agar 2-Bone Arm IK (`solveArmIK`) mengarahkan tangan monster tepat ke bawah tombol target.
    - Urutan otomatis sinkron satu sumber state: `idle (1.5s) → reach (0.62s) → press (0.26s, memicu tactile press feedback & setActiveProjectIdx) → react (0.55s, menoleh bangga ke preview) → return (0.45s)`, berulang `01 → 02 → 03 → 04 → 05 → 06 → 01` dengan gestur penyesuaian headset periodik setiap 3 siklus.
    - Mendukung override klik manual secara aman (membatalkan siklus berjalan, memicu `manual_react`, jeda autoplay 6 detik), jeda saat hover pagination, tombol toggle `Auto`/`Paused` aksesibel, dan dukungan `prefers-reduced-motion`.
  - **Hasil Pengujian & Verifikasi:**
    - `npm run lint` $\rightarrow$ 0 errors, `npm run build` $\rightarrow$ 0 errors (`ShowcaseOperatorCanvas` 7.88 kB gzip).
    - Pengujian live trace Playwright memverifikasi urutan `idle → reach → press (01→02) → react → return → idle → reach (02→03)`, override klik manual ke `05` (`MYOB Smart-Guide`, `phase: manual_react`, `auto: false`), `eyeMountCount: 2`, 0 console errors, serta tampilan responsif Desktop (`1440×900`) dan Mobile (`390×844`) bebas clipping/overlap.

- **Log 45 (2026-11-22) — Section 05 Redesign: Seated Idle Position, Dynamic `[data-project-pagination]` DOM Targeting & Stick-to-Button Interaction (`ShowcaseOperatorScene.tsx`, `ShowcaseOperatorCanvas.tsx`, `ProjectsSection.tsx`):**
  - **Perubahan Posisi Idle & Pose Duduk Skeletal (`applySittingPosture`):**
    - Monster kini duduk santai di sisi kiri tepat di bawah tombol `Live Website` / `Source Code` (anchor diukur dinamis dari `actionButtonsRef`, tanpa koordinat hardcoded) menggunakan pose duduk skeletal asli (`UpperLegL/R` menekuk maju `74°`, `LowerLegL/R` dan `FootL/R` rileks, kedua tangan di pangkuan, `sitBlend = 1.0`).
    - Sebelum Section 05 aktif (`isActive === false`), monster tetap duduk santai dan tidak pernah bergerak atau menekan pagination.
  - **Alur Animasi Lengkap & Trigger Section Aman:**
    - Saat Section 05 mulai aktif (dipicu sekali secara aman via `hasTriggeredOnce` agar re-render tidak mengulang animasi): `sitting_idle → waking (0.72s) → standing_up (0.62s) → walking_to_btn (animasi skeletal Walk) → raising_hand (0.38s) → pressing (0.25s) → retracting (0.32s) → pause_between (0.65s)` berulang untuk seluruh tombol yang tersedia `01 → 02 → ... → 0N`, lalu `finishing_react (0.78s) → walking_home → sitting_down (0.62s) → completed_idle` (duduk kembali dengan tenang tanpa looping tak berujung).
    - Menghapus tombol tambahan `Auto/Paused` sesuai batasan layout agar UI Projects tetap 100% bersih seperti desain asli.
  - **Dynamic DOM Targeting (`[data-project-pagination]`) & Stick-to-Button:**
    - Membungkus baris Actions + Pagination dan area lantai monster dalam satu container koordinat bersama (`operatorStageRef`) dengan `<ShowcaseOperatorCanvas />` sebagai overlay `pointer-events-none z-20`.
    - Mengukur posisi aktual seluruh elemen `[data-project-pagination]` (`ndcX`, `ndcY`) via `getBoundingClientRect()`, `ResizeObserver`, `MutationObserver`, dan `window.resize`, lalu memproyeksikannya langsung ke bidang interaksi 3D (`unprojectNdcToPlane`) agar 2-Bone Arm IK (`solveArmIK`) mengarahkan jari tangan bersarung tepat ke tengah tombol aktual (`handToButtonErrorCm = 2.6 cm` pada uji Playwright).
  - **Hasil Pengujian Jumlah Proyek Dinamis, Interaksi Manual & Responsif:**
    - `npm run lint` $\rightarrow$ 0 errors, 0 warnings; `npm run build` $\rightarrow$ 0 errors.
    - **Pengujian Urutan Penuh (6 Proyek):** Terverifikasi `before: not-active-yet`, urutan penekanan penuh `pressedSequence: [0, 1, 2, 3, 4, 5]`, dan kembali ke `completed_idle` (`sitBlend: 1`).
    - **Pengujian Jumlah Proyek Dinamis:** Penambahan tombol ke-7 (`data-project-pagination="6"`) otomatis memperbarui `buttonCount` menjadi `7`, dan pengurangan tombol otomatis memperbarui `buttonCount` menjadi `5` tanpa perubahan kode animasi.
    - **Interaksi Manual & Navigasi Prev/Next:** Klik manual tombol `04` dan tombol `›` segera membatalkan sequence otomatis (`phase: manual_react`), berpindah proyek tanpa klik ganda, dan monster kembali duduk dengan aman.
    - **Responsif:** Penyesuaian jarak vertical mobile (`mt-5 sm:mt-1`) mencegah tumpang tindih pada baris pagination 2-baris di viewport `390×844`.

- **Log 46 (2026-11-22) — Section 05 Refinement: Slower Natural Motion (~35–40%), Anticipation/Follow-Through & Smaller Companion Scale (`ShowcaseOperatorScene.tsx`, `ShowcaseOperatorCanvas.tsx`):**
  - **Perlambatan Tempo Keseluruhan (~35–40%) & Kualitas Transisi Alami:**
    - Memperpanjang durasi gerakan aktual (bukan sekadar menambah jeda): `waking` (`1.15s`), `standing_up` (`1.55s`), `prep_walk` (`0.65s`), `WALK_SPEED` (`1.65 → 1.02` dengan ease-in/ease-out akselerasi & perlambatan halus, `Walk` clip `timeScale = 0.75` bebas *foot sliding*), `raising_hand` (`0.72s`), `pressing` (`0.46s`), `retracting` (`0.65s`), `pause_between` (`0.80s`), `finishing_react` (`1.15s`), dan `sitting_down` (`1.35s`), serta `Idle` breathing clip `timeScale = 0.42` (~3.5 detik per siklus).
    - Mengadopsi kurva `easeInOutSine` & `easeInOutCubic` serta menambahkan *anticipation* & *follow-through* organik (condong torso lembut sebelum bangun/duduk, fase `prep_walk` pergeseran berat badan sebelum melangkah, lintasan lengkung saat mengangkat tangan, dan *anticipation pull-back* → tekan → *cushion follow-through* saat menekan tombol).
    - Menghaluskan damping kepala (`7.5 → 4.5`), rotasi badan (`7.0 → 4.5`), transisi duduk (`10.0 → 6.5`), dan IK tangan (`18 → 11`) agar seluruh tubuh bergerak terkoordinasi dalam satu tempo tenang.
  - **Pengecilan Skala Karakter (~17.7% Lebih Kecil):**
    - Mengubah skala seragam `monsterRootRef` dari `0.68` menjadi **`MONSTER_SCALE = 0.56`** (menjaga seluruh proporsi, rig, outfit, dan shadow utuh) serta menyelaraskan elevasi panggung (`stageY = -0.82`), `ContactShadows` (`y = -0.825`), dan `btnStopOffsetX = ±0.18` agar tangan tetap menjangkau dan menyentuh tombol DOM aktual secara akurat tanpa meregang berlebihan.
  - **Hasil Pengujian & Verifikasi:**
    - `npm run lint` $\rightarrow$ 0 errors, 0 warnings; `npm run build` $\rightarrow$ 0 errors.
    - Pengujian live timing Playwright memverifikasi seluruh durasi sesuai target (`waking: 1.16s`, `standing_up: 1.54s`, `prep_walk: 0.67s`, `walking_to_btn: 2.45s`, `raising_hand: 0.75s`) dengan akurasi stick-to-button `handToButtonErrorCm = 2.9 cm` pada tombol `01` dan 0 console errors.

- **Log 47 (2026-11-25) — Section 05 Audit & Repair: True Directional Facing, Distance-Driven Stride Kinematics, Body Synchronization & Continuous IK Blending (`ShowcaseOperatorScene.tsx`):**
  - **Audit Kode & Diagnosis Akar Masalah:**
    - Mengidentifikasi 5 akar penyebab utama kekakuan dan glitch pada Monster 5: (1) sudut hadap berjalan sebelumnya hanya `±0.36 rad` (`±20.6°`) sehingga monster masih menghadap kamera dan bergeser menyamping saat berjalan ke kanan/kiri; (2) *hard boolean cutoff* `if (st.walkWeight < 0.35)` mematikan `solveArmIK` dan `applyHandPose` secara mendadak saat mulai/berhenti berjalan, menyebabkan skala tangan (`HAND_SCALE = 0.80`) membesar-mengecil (*pop*) dan target tangan lama (`handTargetsRef`) menyentak melintasi badan saat masuk `raising_hand`; (3) clip `Walk` GLTF memiliki amplitudo lokal sangat kecil dan `root.position.y` ditimpa `0` setiap frame saat berdiri, membuat karakter tampak meluncur (*sliding*) terutama pada langkah pendek antar tombol `01 → 02`; (4) *double-damping* pada `st.sitBlend` di akhir `standing_up` serta reset `desiredRootRotY = 0.06` pada awal `retracting` menimbulkan patahan pose; (5) pembersihan highlight tombol DOM (`onPressVisualChange(null)`) belum dipanggil saat `isActive` berubah menjadi `false`.
  - **Perbaikan Arah Hadap, Kinematika Langkah, Sinkronisasi Tubuh & Transisi Halus:**
    - **Arah Hadap Berjalan Akurat (`rootRotY`):** Saat `prep_walk` dan `walking_to_btn` ke kanan (`+X`), tubuh berputar mulus menghadap kanan (`+1.18 rad` / `+68°` untuk perjalanan jauh, `+0.86 rad` / `+49°` untuk langkah pendek antar tombol berdekatan), dan saat `walking_home` ke kiri (`-X`) berputar penuh menghadap kiri (`-1.18 rad` / `-68°`), lalu berbelok halus menghadap tombol/depan pada `0.16m–0.22m` terakhir sebelum berhenti.
    - **Distance-Driven Stride Kinematics (`applyBodyLocomotionAndSitting`):** Menggerakkan fase langkah `st.walkPhase += (step / 0.145) * Math.PI` secara proporsional terhadap jarak perpindahan horizontal aktual (`step`) — lengkap dengan ayunan paha bergantian (`UpperLegL/R`), tekukan lutut saat kaki diangkat (`LowerLegL/R`), artikulasi engkel *heel-strike/toe-off* (`FootL/R`), *vertical stride bob* (`|sin(walkPhase)| * 0.032`), serta *counter-twist* dan *weight shift* torso (`Torso`).
    - **Continuous Arm Locomotion & Quaternion Slerp IK Blending:** Menghapus *boolean cutoff* `st.walkWeight < 0.35`, memperbarui `handTargetsRef` dan `applyHandPose` (`HAND_SCALE = 0.80`) setiap frame tanpa jeda, menambahkan ayunan lengan & bahu berlawanan fase dengan kaki (`ShoulderL/R`, `UpperArmL/R`, `LowerArmL/R`), serta melakukan *quaternion slerp* kontinu (`ikWeight = 1 - st.walkActivity`) menuju 2-Bone Arm IK (`solveArmIK`) ditambah pengangkatan bahu natural saat menekan tombol.
  - **Verifikasi Lint, Build & Browser (Tests A–H):**
    - `npm run lint` $\rightarrow$ 0 errors, 0 warnings; `npm run build` $\rightarrow$ 0 errors.
    - Terverifikasi via Playwright di viewport Desktop (`1440×900`) dan Mobile (`390×844`): berjalan ke kanan menghadap kanan (`rootRotY = +0.882..+1.18 rad`), berjalan ke kiri menghadap kiri (`rootRotY = -1.166 rad`), langkah kaki & ayunan tangan sinkron tanpa *foot sliding*, penekanan tombol pagination akurat (`pressedSequence: [0, 1, 2, 3, 4, 5]`), serta *manual click override* dan *section switch* aman dengan 0 console errors.

- **Log 48 (2026-11-25) — Section 05 Complete Interaction, 3-Round Automatic Loop & Wake-on-Click System (`ProjectsSection.tsx`, `ShowcaseOperatorScene.tsx`):**
  - **Perbaikan Klik Manual Pagination & Pointer Events (`ProjectsSection.tsx`):**
    - Meningkatkan stacking context baris tombol Actions & Pagination dari `z-10` menjadi `relative z-30 pointer-events-auto` di atas container `<ShowcaseOperatorCanvas />` (`z-20 pointer-events-none`), sehingga seluruh tombol pagination (`01–06` serta `‹` / `›`) berada di lapisan paling atas (`document.elementFromPoint` terverifikasi `isButtonTopmost: true` untuk seluruh tombol) tanpa terhalang overlay canvas 3D.
    - Saat pengguna mengeklik tombol pagination secara manual kapan saja, proyek langsung berpindah, sequence otomatis dihentikan dengan aman (`manual_react → walking_home → sitting_down → completed_idle`), dan `currentTargetIdx` disinkronkan ke tombol berikutnya (`(manualDomIdx + 1) % targets.length`) agar monster tidak pernah mengklik ulang tombol yang baru saja dipilih pengguna.
  - **Sistem 3 Putaran Otomatis Dinamis (`DEFAULT_TOTAL_ROUNDS = 3`):**
    - Menambahkan counter putaran dinamis (`currentRound`, `completedRounds`, `totalRoundsTarget = 3`, `pressedInCurrentRound`) yang membaca jumlah tombol aktual dari DOM (`targets.length` via `[data-project-pagination]`, bukan hardcoded 6).
    - Satu putaran hanya dihitung selesai setelah seluruh target pagination aktual berhasil ditekan (`st.pressedInCurrentRound === targets.length`). Setelah 3 putaran penuh selesai (18 penekanan untuk 6 proyek: `01..06 × 3`), monster menyelesaikan gerakan terakhir (`retracting → pause_between → finishing_react → walking_home → sitting_down → completed_idle`).
  - **Mekanisme Membangunkan Monster Melalui Klik Saat Idle (`isPointerOverMonster`):**
    - Menambahkan deteksi klik terfokus pada karakter monster (`THREE.Raycaster` terhadap `monsterRootRef` + *bounding envelope* 3D karakter) pada `stageContainerRef` yang hanya aktif saat monster dalam state duduk idle (`sitting_idle` atau `completed_idle`) dan mengabaikan klik pada tombol/link (`targetEl.closest('button, a')`) maupun klik berulang saat monster sedang aktif (`wakeClickCount` tetap `1` saat di-spam klik).
    - Saat dibangunkan, monster membaca posisi pagination aktif terbaru (`lp.activeProjectIdx`), menentukan target urutan berikutnya secara dinamis, lalu menjalankan 3 putaran penuh baru sebelum kembali duduk idle.
  - **Hasil Verifikasi Lint, Build & Browser (Tests A–F):**
    - `npm run lint` $\rightarrow$ 0 errors, 0 warnings; `npm run build` $\rightarrow$ 0 errors.
    - Seluruh pengujian Playwright (Test A Manual Pagination, Test B Automatic Sequence, Test C 3-Round Loop `[0..5, 0..5, 0..5]`, Test D Wake-on-Click 3 putaran baru `[3,4,5,0,1,2 × 3]`, Test E Interaction Conflict & Dynamic Project Count `6 ↔ 7`, Test F Directional Walking Realism) lulus 100% dengan 0 console errors.

- **Log 49 (2026-11-25) — Section 05 Advanced User Interruption, Target Re-Synchronization, Angry Reaction & Sulking System (`ShowcaseOperatorScene.tsx`):**
  - **Sinkronisasi Target Pagination Setelah Intervensi Pengguna (Zero Stale Closure):**
    - Membaca `activeProjectIdx` secara langsung dari props React saat `manualTriggerVersion !== st.lastManualVersion` di dalam `useFrame` (menghindari *1-frame lag* pada `useEffect` ref) dan menghitung `st.currentTargetIdx = (manualDomIdx + 1) % targets.length`.
    - Setiap kali pengguna menekan nomor pagination saat monster sedang bekerja, monster selalu memperbarui target DOM berikutnya ke nomor **setelah** halaman terakhir yang dipilih pengguna (misal pengguna menekan `01` $\rightarrow$ monster lanjut ke `02`; pengguna menekan `05` $\rightarrow$ monster lanjut ke `06`; pengguna menekan `02` $\rightarrow$ monster lanjut ke `03`).
  - **Sistem Counter Gangguan (`interruptionCount`) & 3 Tahap Reaksi Emosional:**
    - Counter hanya menghitung klik pagination manual pengguna selama monster sedang aktif bekerja (`!isMonsterIdle && !st.isSulking`) dan tidak pernah menghitung klik otomatis monster sendiri maupun klik pengguna saat monster sedang duduk idle.
    - **Gangguan 1 & 2 (`interrupted_notice`, `0.52s`):** Monster berhenti sejenak, menoleh dan melirik ke arah tombol pagination yang baru dipilih pengguna, lalu **tetap melanjutkan pekerjaan** menuju tombol urutan berikutnya.
    - **Gangguan ke-3 (`angry_react`, `1.35s`):** Monster menunjukkan ekspresi marah/kesal melalui animasi karakter — kelopak mata atas miring mengerut tajam (`rotation.z = ±0.34`, squint `0.72`), kepala menunduk dan menggeleng kesal, kedua tangan berkacak di samping pinggang, serta kaki kanan menghentak lantai dua kali (`stompFootAmt`). Setelah reaksi marah selesai, monster **tetap melanjutkan pekerjaan** ke target berikutnya apabila tidak diganggu lagi.
    - **Gangguan ke-4+ (`sulking_react → walking_home → sitting_down → sulking_idle`):** Monster menghentikan tugas otomatis (`isSulking = true`, `sequenceCancelled = true`), menarik kedua tangan menyilang/menekuk di depan dada/pangkuan, membuang muka dari pagination (`rootRotY = -0.26`), berjalan pulang menghadap kiri ke tempat duduk, dan duduk membungkuk dengan ekspresi ngambek (`extraTorsoPitch = 0.14`, sesekali melirik kesal ke arah pagination).
  - **Mekanisme Membujuk / Membangunkan Monster Saat Ngambek (`sulking_idle → waking`):**
    - Mengeklik tubuh monster saat `sulking_idle` (atau `completed_idle`) membujuk monster untuk mengangkat kepala, memulihkan ekspresi mata normal (`isAngry = false`, `isSulking = false`), me-reset `interruptionCount = 0`, dan memulai sesi 3 putaran penuh baru dari nomor setelah halaman aktif terakhir.
  - **Hasil Verifikasi Lint, Build & Browser (Tests A–G):**
    - `npm run lint` $\rightarrow$ 0 errors, 0 warnings; `npm run build` $\rightarrow$ 0 errors.
    - Terverifikasi penuh via Playwright (Tests A–G): sinkronisasi target setelah klik `01` $\rightarrow$ lanjut `02` (`index 1`), klik `05` $\rightarrow$ lanjut `06` (`index 5`), klik ke-3 (`02`) $\rightarrow$ `angry_react` lalu lanjut menekan `03` (`index 2`), klik ke-4 (`04`) $\rightarrow$ `sulking_react → sulking_idle` (duduk ngambek sementara pagination tetap interaktif), dan klik pada monster saat ngambek $\rightarrow$ reset `interruptionCount: 0` dan menuntaskan 3 putaran baru `[4,5,0,1,2,3 × 3]` dengan 0 console errors.

- **Log 50 (2026-11-25) — Section 06 Contact Implementation: The Final Gathering — All 5 Monsters Peeking Behind the Contact Card & Final Celebration (`ContactGatheringScene.tsx`, `ContactGatheringCanvas.tsx`, `ContactSection.tsx`, `PortfolioShell.tsx`):**
  - **Konsep & Integrasi Kelima Monster Asli ("The Final Gathering"):**
    - Mengintegrasikan seluruh 5 karakter 3D asli dari section sebelumnya ke dalam satu scene terkoordinasi di sekitar kartu Contact (`[data-contact-card]`):
      1. **Section 01 Hero Yeti** (`/models/monster/yeti-mascot.glb`) — mengintip dari tepi kiri-atas kartu.
      2. **Section 02 Cactoro Dev** (`/models/workspace/cactoro-dev.glb`) — mengintip miring dari tepi samping kiri kartu lengkap dengan topi *sunhat* terakota-teal.
      3. **Section 03 Skill Builder Monkroose** (`/monsters/skill-builder/builder-mascot.glb`) — mengintip miring dari tepi samping kanan kartu.
      4. **Section 04 Career Archivist Frog** (`/monsters/archivist/archivist-mascot.glb`) — mengintip dari tepi tengah-atas kartu lengkap dengan *newsboy cap*, kerah kemeja, dasi amber, dan ID badge `"CAREER ARCHIVIST"`.
      5. **Section 05 Showcase Operator Dino** (`/monsters/showcase-operator/operator-mascot.glb`) — mengintip dari tepi kanan-atas kartu lengkap dengan *operator headset*, topi operator, dan ID badge `"PROJECT OPERATOR"`.
    - **Layering & Dynamic Card Bounds Tracking:** Canvas 3D ditempatkan pada layer `z-10 pointer-events-none` di belakang kartu Contact putih (`z-20`), sementara aksen jari/tangan monster yang memegang tepian kartu berada di tepi bingkai kartu dan form input berada di layer teratas (`z-30`). Posisi kartu diukur secara live menggunakan `ResizeObserver` (`getCardBoundsNdc`) dan diproyeksikan ke ruang 3D (`unprojectNdc`) sehingga kelima monster selalu mengintip presisi dari balik tepi kartu di semua ukuran layar.
  - **State Machine Animasi Lengkap (`hidden → entering → idle ↔ observing → celebrating → happy-idle`):**
    - **Staggered Entrance (`entering`):** Saat Section 06 aktif (`isActive === true`), kelima monster muncul bertahap dari balik kartu dengan *stagger delay* (`0.0s`, `0.16s`, `0.30s`, `0.44s`, `0.58s`) dan kurva `easeOutBack`.
    - **Desynchronized Idle (`idle`):** Setiap monster memiliki frekuensi napas, goyangan halus, gerakan kepala, dan jadwal kedipan mata 3D yang berbeda agar tidak pernah bergerak serempak secara mekanis.
    - **Reaksi Interaksi Form (`observing`):** Ketika pengunjung memilih/mengetik pada input `Name`, `Email`, atau `Message`, kelompok monster terdekat mengarahkan kepala dan pandangan pupil mata 3D secara halus ke area field yang sedang aktif tanpa mengganggu fokus keyboard.
    - **Final Gathering Celebration (`celebrating → happy-idle`):** Hanya dipicu setelah pengiriman pesan benar-benar berhasil (`celebrationTrigger` bertambah setelah request sukses — tidak dipicu saat validasi gagal, saat *loading*, atau saat server error). Kelima monster muncul lebih tinggi dari balik kartu secara bertahap dan merayakan bersama dengan variasi gestur khas masing-masing (Yeti mengangkat kedua tangan, Cactoro melambaikan tangan kanan, Builder memompa kedua lengan, Archivist melambai ramah, Operator memberi salam operator, disertai lompatan gembira dan mata *happy crescent squint*), menahan pose bahagia (*Celebration Hold*), lalu kembali mengintip dalam state `happy-idle`.
  - **Form Contact Fungsional, Validasi & Error/Loading Handling (`ContactSection.tsx`):**
    - Menyediakan field `Name`, `Email`, `Message`, dan tombol `Send Message` dengan validasi input, *loading state* (`Sending...` + pencegahan *double-submit* via `isSubmittingRef`), penanganan error (`role="alert"`), dukungan endpoint `VITE_CONTACT_ENDPOINT` (atau *validated async delivery pipeline*), serta pesan konfirmasi `"Message sent successfully! Looking forward to connecting with you."`.
  - **Verifikasi Lint, Build & Browser (Desktop, Tablet, Mobile):**
    - `npm run lint` $\rightarrow$ 0 errors, 0 warnings; `npm run build` $\rightarrow$ 0 errors.
    - Terverifikasi penuh melalui Playwright pada Desktop (`1440×900`), Tablet (`768×1024`), dan Mobile (`390×844`): tidak ada *horizontal overflow*, seluruh 5 monster mengintip dengan proporsi dan layering tepat, validasi & simulasi server error tidak memicu celebration (`celebrationCount: 0`), pengiriman berhasil memicu `celebrating → happy-idle` (`celebrationCount: 1`), dan pengiriman kedua yang berhasil memicu celebration kembali (`celebrationCount: 2`) dengan 0 console errors.

- **Log 51 (2026-11-25) — Section 05 Projects Expansion: Replace MYOB with EcoQuiz, Update Nalar, Audit 4 GitHub Repositories & Integrate Live/Prepared PNG Previews (`src/data/projects.ts`, `src/components/sections/ProjectsSection.tsx`, `public/projects/`):**
  - **Penghapusan MYOB, Penambahan EcoQuiz & Pembaruan Nalar:**
    - Menghapus seluruh entri `MYOB Smart-Guide` dari `FEATURED_PROJECTS` di `src/data/projects.ts`.
    - Menambahkan **EcoQuiz** (`demoUrl: "https://ecoquiz.ab1dal.com"`, `repoUrl: "https://github.com/AbidAlauddin/EcoQuiz"`) berdasarkan audit `PROJECT_CONTEXT.md` repository resmi (platform pembelajaran ekonomi SMA/SMK berbasis web dengan 8 modul materi, 80 soal kuis pilihan ganda berbasis kasus, evaluasi skor & rekomendasi belajar otomatis, serta *live leaderboard*).
    - Memperbarui **Nalar** dengan menambahkan `demoUrl: "https://nalar.ab1dal.com"` (`Live Website ↗`) di samping `repoUrl: "https://github.com/AbidAlauddin/Nalar"` (`Source Code ↗`).
    - Mengakses kedua website live secara langsung menggunakan Playwright pada viewport desktop `1440 × 900` dan menyimpan screenshot homepage asli ke `public/projects/ecoquiz.png` (serta `ecoquiz-preview.png`) dan `public/projects/nalar.png` (serta `nalar-preview.png`).
  - **Audit Empat Repository GitHub Baru & Integrasi Preview (`SIMORA`, `Rekap Inventaris`, `HCIS`, `iTask`):**
    - **SIMORA (`https://github.com/AbidAlauddin/InternalSystemsOffice`):** Diaudit langsung dari `routes/web.php`, `composer.json`, dan `package.json` — sistem operasional internal kantor berbasis Laravel 13, Livewire 4, Volt, PHP 8.3, Tailwind CSS, dan Leaflet.js untuk manajemen peminjaman kendaraan dinas, *real-time fleet GPS tracking*, permintaan barang, inventaris, klaim, dan notifikasi WhatsApp (Fonnte webhook). Diintegrasikan dengan preview `public/projects/simora-preview.png` (`2994×1792`) yang telah disiapkan.
    - **Rekap Inventaris (`https://github.com/AbidAlauddin/Rekap_TauriApp`):** Diaudit langsung dari `package.json`, `TODO.md`, `src/routes/router.tsx`, `src/pages/Dashboard.tsx`, `src/pages/TransactionPage.tsx`, dan `src/components/Sidebar.tsx` — aplikasi desktop rekap keuangan, transaksi/pengadaan, direktori vendor & akun, realisasi anggaran, serta ekspor multi-sheet Excel & PDF berbasis Tauri v2, React 19, TypeScript, Supabase, Prisma, Recharts, dan ExcelJS.
    - **HCIS (`https://github.com/AbidAlauddin/HCIS`):** Diaudit dan diperbarui menjadi `title: "HCIS"` dengan deskripsi dan tech stack sesuai `README.md` & `package.json` (`Tauri v2`, `React 19`, `TypeScript`, `Tailwind CSS`, `Supabase`, `Prisma`).
    - **iTask (`https://github.com/AbidAlauddin/iTask` / `iTask-RPL`):** Diaudit dari `composer.json` dan `routes/web.php` — aplikasi manajemen tugas harian berbasis Laravel 10, PHP 8.1, Blade, Tailwind CSS, dan MySQL dengan fitur *My Day*, daftar kategori kustom, tenggat waktu, filter status penyelesaian, dan tema Light/Dark. Diintegrasikan dengan preview `public/projects/itask-preview.png` (`2988×1858`) yang telah disiapkan.
    - Juga menghubungkan `public/projects/beasiswa-preview.png` (`1668×958`) ke project **SPK Beasiswa SAW-ROC** serta `public/projects/toekoni-preview.png` (`1440×900`) ke **Toekoni**.
  - **Status Audit & Keamanan Eksekusi File `.exe` (`HCIS` & `Rekap Inventaris`):**
    - Hasil pemeriksaan repository GitHub menunjukkan kedua repository tidak memiliki *GitHub Releases* publik (`releases: []`), tidak menyimpan file `.exe` di dalam git tree, dan *artifacts* pada GitHub Actions (`tauri-windows-exe` / `app-exe` dari Juni 2026) telah kedaluwarsa (`total_count: 0`). Selain itu, sesuai aturan keamanan bahwa file `.exe` Windows tidak boleh dijalankan langsung pada host macOS tanpa Windows VM/sandbox terisolasi, kedua project desktop tersebut ditampilkan menggunakan kartu *clean architectural preview fallback* bawaan tanpa mengarang screenshot palsu.
  - **Verifikasi Pagination 9 Project & Kompatibilitas Monster 5:**
    - `npm run lint` $\rightarrow$ 0 errors, 0 warnings; `npm run build` $\rightarrow$ 0 errors.
    - Terverifikasi melalui Playwright pada Desktop (`1440×900`), Tablet (`768×1024`), dan Mobile (`390×844`): pagination otomatis menyesuaikan menjadi 9 tombol (`01` s/d `09`), Monster 5 mendeteksi `buttonCount: 9` secara dinamis dan menuntaskan 3 putaran penuh (`27` penekanan berurutan `[0..8 × 3]`) sebelum kembali ke `completed_idle`, serta perilaku interupsi manual, `angry_react`, `sulking_idle`, dan *wake-on-click* tetap berfungsi 100% dengan 0 console errors.

- **Log 52 (2026-11-25) — Audit GitHub Actions Windows Artifacts & Lingkungan Eksekusi macOS M1 (`HCIS` & `Rekap Inventaris`):**
  - **Audit Artifact Build Terbaru di GitHub Actions:**
    - **HCIS (`AbidAlauddin/HCIS`):** Terverifikasi Run `#45642284390` (`2026-11-25T15:11:10Z`) berstatus `completed / success` dengan 2 artifact aktif (`expired: false`): `tauri-windows-exe` (Artifact ID `15036781209`, `2,291,167 bytes`) dan `tauri-windows-msi` (Artifact ID `15035982094`, `3,073,152 bytes`).
    - **Rekap Inventaris (`AbidAlauddin/Rekap_TauriApp`):** Terverifikasi Run `#45644736516` (`2026-11-25T15:24:05Z`) berstatus `completed / success` dengan 1 artifact aktif (`expired: false`): `app-exe` (Artifact ID `15036114247`, `2,341,563 bytes`).
  - **Audit Lingkungan Eksekusi Host (MacBook Apple Silicon M1 — `arm64`):**
    - Host saat ini adalah macOS `Darwin arm64` (`RELEASE_ARM64_T8103`).
    - Pemeriksaan Parallels Desktop (`prlctl list --all` dan `prlctl list -i "Windows 11"`) menunjukkan entry VM `Windows 11` berstatus `invalid` karena direktori bundle `/Users/macbook/Parallels/Windows 11.pvm/` sudah tidak ada di disk (`No such file or directory`). Tidak ada Windows VM lain (UTM/VMware/VirtualBox) yang tersedia dengan GUI aktif.
    - Selain itu, file ZIP artifact dari GitHub Actions belum diunduh ke dalam workspace maupun `~/Downloads/` (endpoint API `actions/artifacts/<id>/zip` memerlukan token autentikasi GitHub).
  - **Status Granular Sesuai Pedoman Keaslian Screenshot (Tanpa Wine/CrossOver & Tanpa Mockup Palsu):**
    - **HCIS:**
      - Build tersedia: **YA** (GitHub Actions Run `#45642284390`, artifact `tauri-windows-exe` & `tauri-windows-msi`).
      - Executable berhasil dijalankan: **BELUM** (dihentikan sesuai instruksi karena tidak tersedia lingkungan Windows GUI / Windows VM aktif pada MacBook M1).
      - Screenshot berhasil diambil (`public/projects/hcis.png`): **BELUM** (menunggu eksekusi pada lingkungan Windows asli/VM).
      - Preview berhasil diintegrasikan di portfolio: **BELUM** (saat ini masih menggunakan *clean architectural card fallback* agar tidak menampilkan gambar palsu).
    - **Rekap Inventaris:**
      - Build tersedia: **YA** (GitHub Actions Run `#45644736516`, artifact `app-exe`).
      - Executable berhasil dijalankan: **BELUM** (dihentikan sesuai instruksi karena tidak tersedia lingkungan Windows GUI / Windows VM aktif pada MacBook M1).
      - Screenshot berhasil diambil (`public/projects/rekap-inventaris.png`): **BELUM** (menunggu eksekusi pada lingkungan Windows asli/VM).
      - Preview berhasil diintegrasikan di portfolio: **BELUM** (saat ini masih menggunakan *clean architectural card fallback* agar tidak menampilkan gambar palsu).

- **Log 53 (2026-11-25) — Section 05 Projects Visibility Toggle: Hide HCIS, Rekap Inventaris & iTask While Preserving Project Code (`src/data/projects.ts`):**
  - Menambahkan properti opsional `hidden?: boolean` pada interface `ProjectItem` di `src/data/projects.ts`.
  - Menyimpan seluruh 9 definisi project lengkap di dalam `ALL_PROJECTS` tanpa menghapus kode apa pun, memberi flag `hidden: true` pada **HCIS** (`proj-hcis`), **Rekap Inventaris** (`proj-rekap-inventaris`), dan **iTask** (`proj-itask`), serta mengekspor `FEATURED_PROJECTS = ALL_PROJECTS.filter((project) => !project.hidden)`.
  - Terverifikasi melalui `npm run lint`, `npm run build`, dan Playwright browser (`buttonCount: 6`): hanya 6 project aktif (`01 Toekoni`, `02 Nalar`, `03 EcoQuiz`, `04 SIMORA`, `05 Hey Job (Portal Alumni)`, `06 SPK Beasiswa SAW-ROC`) yang tampil pada Section 05 beserta pagination dan Monster 5.

- **Log 54 (2026-11-25) — Initial Loading & Performance Optimization: Code Splitting, Asset Compression & Idle Prefetching (`vite.config.ts`, `src/components/layout/PortfolioShell.tsx`, `src/data/projects.ts`, `index.html`, `public/`):**
  - **Audit & Pembersihan Bottleneck Initial Bundle:**
    - Sebelumnya, `PortfolioShell.tsx` mengimpor seluruh 6 section secara statis di tingkat atas, menghasilkan bundle `index-*.js` sebesar 499.74 kB (163.69 kB gzip) dan menggabungkan Three.js ke dalam chunk fallback sebesar 994.90 kB.
    - Favicon `public/icons/icon.png` sebelumnya berukuran 1.65 MB (gambar 2048×2048 JPEG berkedok PNG) yang selalu diunduh browser pada saat pertama kali membuka `index.html`.
    - Asset gambar project `simora-preview.png` berukuran 1.74 MB, `toekoni-preview.png` 506 KB, dan `beasiswa-preview.png` 462 KB.
  - **Code Splitting & Dynamic Section Loading:**
    - Mempertahankan `HeroSection` sebagai modul eager utama agar halaman Home langsung tampil seketika (*instant paint*).
    - Mengonversi `AboutSection`, `SkillsSection`, `ExperienceSection`, `ProjectsSection`, dan `ContactSection` ke `React.lazy()` dengan fallback `SectionSkeleton` bernuansa minimalis warm off-white yang tidak menimbulkan layout shift (`CLS = 0`).
    - Membuat `src/components/sections/sectionLoaders.ts` dengan fungsi `scheduleIdleSectionPrefetch` berbasis `requestIdleCallback` yang mengunduh section selanjutnya di latar belakang secara bertahap setelah Hero selesai dirender.
    - Menambahkan `preloadSectionByIndex` pada saat hover navigasi desktop (`Navbar.tsx`) dan pembukaan menu mobile (`MobileMenu.tsx`).
  - **Konfigurasi Rollup / Rolldown Manual Chunks di `vite.config.ts`:**
    - Mengelompokkan library ke dalam vendor chunk terisolasi dan mudah di-cache: `vendor-react` (213.68 kB / 66.72 kB gzip), `vendor-motion` (230.42 kB / 81.85 kB gzip), dan `vendor-three` (993.00 kB / 264.34 kB gzip).
    - Bundle utama aplikasi `index-*.js` menyusut drastis dari **499.74 kB** menjadi **23.92 kB** (7.41 kB gzip) — **penurunan 95.2%**.
  - **Optimalisasi Aset Gambar & Favicon ke WebP:**
    - Mengoptimasi `public/icons/icon.png` menjadi 64.0 KB (crisp 256×256 PNG) dan menghasilkan `favicon-32x32.png` (1.2 KB) serta `apple-touch-icon.png` (38 KB).
    - Mengonversi seluruh screenshot project ke WebP dengan kualitas 85% lanczos:
      - `simora-preview`: 1,740.4 KB $\rightarrow$ 88.9 KB WebP (**94.9% penghematan**)
      - `beasiswa-preview`: 462.5 KB $\rightarrow$ 45.4 KB WebP (**90.2% penghematan**)
      - `itask-preview`: 320.0 KB $\rightarrow$ 33.9 KB WebP (**89.4% penghematan**)
      - `ecoquiz`: 152.8 KB $\rightarrow$ 56.3 KB WebP (**63.1% penghematan**)
      - `nalar`: 132.1 KB $\rightarrow$ 51.7 KB WebP (**60.8% penghematan**)
    - Mengonversi 11 frame sprite fallback monster di `public/monsters/main-monster/` dari ~3.2 MB menjadi ~345 KB total (**~89% penghematan**).
  - **Preloading Asset Kritis Hero:**
    - Menambahkan `<link rel="preload" href="/models/monster/yeti-mascot.glb" as="fetch" crossorigin="anonymous" />` pada `index.html` sehingga model 3D Yeti diunduh paralel bersamaan dengan parsing script awal.
  - **Verifikasi & Pengujian Runtime:**
    - `npm run lint` $\rightarrow$ 0 errors, 0 warnings.
    - `npm run build` $\rightarrow$ 0 errors, 0 warnings, build waktu 600 ms.
    - Pengujian browser via Playwright:
      - DOMContentLoaded: ~426 ms
      - First Paint: ~492 ms
      - First Contentful Paint: ~576 ms
      - Seluruh interaksi Hero, About, Skills, Experience, Projects (Monster 5 pagination & sulking), dan Contact (Final Gathering) berjalan normal tanpa regresi visual atau fungsional.
      - Console errors: 0.
