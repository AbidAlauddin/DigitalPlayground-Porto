# DESIGN SYSTEM

Dokumen ini menetapkan standar desain visual, token styling, dan pedoman komponen antarmuka untuk portfolio **The Digital Playground**.

Tujuannya adalah menjamin konsistensi visual, keterbacaan tingkat tinggi, dan kemudahan pemeliharaan kode styling berbasis **Tailwind CSS (v4)**.

- Untuk komposisi visual, suasana, dan batasan ornamen, rujuk `VISUAL_DIRECTION.md`.
- Untuk spesifikasi karakter monster, rujuk `MONSTER_CHARACTER_GUIDE.md`.
- Untuk arsitektur teknis dan instalasi styling, rujuk `TECHNICAL_ARCHITECTURE.md`.

---

## 1. Filosofi Desain

- **Minimalist & Clean:** Antarmuka bebas dari elemen dekoratif yang tidak perlu, memberikan ruang bagi konten portfolio dan karakter monster untuk bersinar.
- **Playful & Approachable:** Sentuhan hangat dan ramah melalui karakter monster dan micro-interaction yang subtil.
- **Readable First:** Kontras warna dan ukuran font dirancang untuk kenyamanan membaca dalam waktu lama.
- **Consistent & Modular:** Berbasis token desain yang terstandarisasi melalui Tailwind CSS v4.

---

## 2. Palet Warna (Color Palette)

Palet warna menggunakan nuansa netral hangat yang tenang (*warm neutral/stone*) dipadukan dengan aksen *teal/turquoise* yang harmonis dengan warna bulu monster.

### 2.1 Core Tokens

| Token CSS / Tailwind | Nilai Hex | Peran & Penggunaan |
|---|---|---|
| `--color-primary` | `#0F766E` (teal-700) | Warna identitas utama, tombol CTA utama, teks tautan aktif |
| `--color-primary-dark` | `#115E59` (teal-800) | State hover tombol primary, penekanan teks khusus |
| `--color-primary-light` | `#CCFBF1` (teal-100) | Background badge, highlight lembut, chip tag |
| `--color-accent` | `#F59E0B` (amber-500) | Indikator status kecil, aksen interaktif terbatas |
| `--color-bg` | `#FAFAF9` (stone-50) | Warna latar belakang utama seluruh halaman |
| `--color-surface` | `#FFFFFF` | Latar kartu proyek, kartu pengalaman, modal panel |
| `--color-text-primary` | `#1C1917` (stone-900) | Judul heading, label penting, teks utama |
| `--color-text-secondary`| `#78716C` (stone-500) | Deskripsi pendukung, metadata, subtitle |
| `--color-border` | `#E7E5E4` (stone-200) | Garis pembatas kartu, separator section, outline input |
| `--color-muted` | `#F5F5F4` (stone-100) | Background sekunder, tombol sekunder, tag latar |

### 2.2 Semantic Colors

| Token | Nilai Hex | Penggunaan |
|---|---|---|
| `--color-success` | `#16A34A` (green-600) | Status keberhasilan pengiriman formulir / live demo aktif |
| `--color-warning` | `#D97706` (amber-600) | Status peringatan atau informasi penting |
| `--color-error` | `#DC2626` (red-600) | Pesan validasi error pada formulir |
| `--color-info` | `#0284C7` (sky-600) | Indikator catatan informatif |

### 2.3 Aturan Penggunaan Warna:
- Gunakan warna latar belakang netral (`#FAFAF9`) sebagai kanvas utama.
- Jangan menggunakan gradien mencolok pada latar belakang halaman atau kartu UI.
- Pastikan rasio kontras teks terhadap background memenuhi standar WCAG AA (minimal 4.5:1 untuk body text dan 3:1 untuk large text).

---

## 3. Tipografi (Typography)

Sistem tipografi mengutamakan font sans-serif modern yang bersih dan memiliki legibilitas tinggi pada berbagai ukuran layar.

### 3.1 Font Family
- **Font Utama:** `Plus Jakarta Sans`, dengan fallback `Inter`, `system-ui`, `sans-serif`.
- **Monospace (untuk kode / tag teknis):** `ui-monospace`, `JetBrains Mono`, `monospace`.

### 3.2 Skala Tipografi

| Level Elemen | Ukuran Desktop | Ukuran Mobile | Line Height | Weight |
|---|---|---|---|---|
| **Display / Hero H1** | 56px – 72px | 36px – 44px | 1.1 – 1.15 | 800 (Extra Bold) |
| **Section Title H2** | 36px – 44px | 28px – 32px | 1.2 | 700 (Bold) |
| **Card / Subsection H3** | 20px – 24px | 18px – 20px | 1.3 | 600 (Semi Bold) |
| **Body Large** | 18px | 16px | 1.6 | 400 / 500 |
| **Body Regular** | 16px | 15px | 1.6 | 400 (Regular) |
| **Caption / Meta** | 13px – 14px | 12px – 13px | 1.5 | 500 (Medium) |
| **Button / Label** | 14px – 15px | 14px | 1.0 | 600 (Semi Bold) |

---

## 4. Sistem Spacing & Grid Layout

Sistem spacing menggunakan kelipatan 4px untuk menjaga konsistensi ritme vertikal dan horizontal.

### 4.1 Token Spacing Utama

| Token | Nilai Piksel | Penggunaan Tipikal |
|---|---:|---|
| `space-1` | 4px | Jarak mikro antar-ikon dan teks |
| `space-2` | 8px | Padding badge, gap horizontal kecil |
| `space-3` | 12px | Padding vertikal tombol compact |
| `space-4` | 16px | Padding dalam kartu standar, gap list |
| `space-6` | 24px | Padding kartu besar, margin antar-paragraf |
| `space-8` | 32px | Jarak antar-subbagian dalam satu section |
| `space-12` | 48px | Padding section pada tablet |
| `space-16` | 64px | Padding section standar pada desktop |
| `space-24` | 96px | Jarak pemisah antar-section besar |

### 4.2 Kontainer & Batas Lebar (Container Width)
- **Maksimum Konten:** `1200px` (`max-w-6xl` disesuaikan).
- **Padding Horizontal Kontainer:**
  - Desktop: `48px` (`px-12`)
  - Tablet: `32px` (`px-8`)
  - Mobile: `20px` (`px-5`)

### 4.3 Adaptive Canvas Inset & Frame System
Main canvas dibingkai secara adaptif menggunakan CSS Custom Properties terpadu untuk keempat sisi:
```css
:root {
  --shell-inset: clamp(12px, min(2.5vw, 3.5vh), 40px);
  --shell-radius: clamp(12px, 1.5vw, 22px);
  --navbar-height: clamp(48px, 6vh, 52px);
  --section-top-inset: clamp(16px, 3vh, 32px);
  --section-bottom-inset: clamp(24px, 4vh, 44px);
  --content-max-width: 1360px;
  --content-padding-x: clamp(20px, 4vw, 64px);
}

@media (min-width: 1024px) {
  :root {
    --navbar-height: 46px;
    --section-top-inset: clamp(24px, 3.9vh, 38px);
  }
}

.portfolio-outer {
  position: relative;
  width: 100vw;
  height: 100svh;
  overflow: hidden;
  background-color: #ECE6DA;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
}

.portfolio-shell {
  position: relative;
  box-sizing: border-box;
  width: calc(100vw - (2 * var(--shell-inset)));
  height: calc(100svh - (2 * var(--shell-inset)));
  border-radius: var(--shell-radius);
  background-color: #FCFBF9;
  overflow: hidden;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(231, 229, 228, 0.6);
}
```
Aturan:
- Margin atas = kanan = bawah = kiri = `--shell-inset` secara presisi.
- Mencegah pembesaran margin berlebihan pada layar ultrawide (dibatasi maksimum 40px).
- Menjaga area konten tetap optimal pada layar ber-aspect ratio sempit atau pendek.

### 4.4 Centralized Vertical Spacing System (`--section-top-inset` & `--section-bottom-inset`)
Seluruh section menerapkan sistem jarak vertikal terpusat dengan pemisahan independen antara jarak atas (`--section-top-inset`) dan jarak bawah (`--section-bottom-inset`):

```css
/* Centralized Navbar Header Geometry */
.navbar-header {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: var(--navbar-height);
  display: flex;
  align-items: flex-end;
  z-index: 50;
  width: 100%;
  user-select: none;
  pointer-events: none;
  box-sizing: border-box;
  padding-left: var(--content-padding-x);
  padding-right: var(--content-padding-x);
}

/* Centralized Responsive Page Container */
.page-container {
  width: 100%;
  max-width: var(--content-max-width);
  margin-left: auto;
  margin-right: auto;
}

/* Centralized Section Container Spacing System */
.portfolio-section {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  box-sizing: border-box;
  padding-top: calc(var(--navbar-height) + var(--section-top-inset));
  padding-bottom: var(--section-bottom-inset);
  padding-left: var(--content-padding-x);
  padding-right: var(--content-padding-x);
  user-select: none;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
}

/* Pull main content closer to top category label while keeping footer anchored at bottom */
.portfolio-section > :nth-child(3) {
  margin-top: auto;
}
```

Rumus & Verifikasi Matematis:
- `.navbar-header` menggunakan `align-items: flex-end` sehingga batas bawah `.navbar-header` berhimpit persis dengan batas bawah aktual elemen `<nav>` (`--navbar-height: 46px` pada desktop) tanpa mengubah posisi visual teks navbar.
- `Top spacing = Top content position - Navbar bottom position = var(--section-top-inset)` (`35.1px` pada `1440×900`, `38.0px–40.0px` pada `1920×1080`).
- `Bottom spacing = Canvas bottom position - Bottom content position = var(--section-bottom-inset)` (`37.0px` pada `1440×900`, `42.2px–44.2px` pada `1920×1080` — dipertahankan tetap tanpa perubahan).
- Elemen konten utama ditarik lebih dekat ke category label bagian atas sehingga membentuk satu kesatuan kelompok informasi.

### 4.5 Top Fade Overlay & Feathered Backdrop Blur
Untuk mencegah benturan visual dan hilangnya keterbacaan teks navigasi saat konten berpindah di bawah navbar fixed, diterapkan overlay transisi halus di bagian atas `.portfolio-shell`:
```css
.navbar-fade-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: clamp(56px, 7.5vh, 68px);
  pointer-events: none;
  z-index: 20;
  background: linear-gradient(
    to bottom,
    rgba(252, 251, 249, 0.95) 0%,
    rgba(252, 251, 249, 0.7) 45%,
    rgba(252, 251, 249, 0) 100%
  );
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  mask-image: linear-gradient(
    to bottom,
    black 0%,
    black 40%,
    transparent 100%
  );
  -webkit-mask-image: linear-gradient(
    to bottom,
    black 0%,
    black 40%,
    transparent 100%
  );
}
```
Karakteristik & Clearance Header:
- Seluruh section container menggunakan padding atas proporsional `pt-20 sm:pt-22 md:pt-24 lg:pt-24` (80px pada mobile, 96px pada desktop).
- Tinggi overlay dibatasi kompak `clamp(56px, 7.5vh, 68px)`, sehingga teks eyebrow (misalnya `— PERSONAL PORTFOLIO`, `— PROFESSIONAL BACKGROUND`) dan judul utama section berada dekat dan serasi tepat setelah navbar tanpa jeda kosong berlebihan (jarak aman ~48px dari teks navbar dan ~29px dari ujung bawah overlay gradient).
- Saat scrolling/transisi, konten yang bergerak ke atas tetap memudar halus di belakang navbar.
Karakteristik & Hierarki Layer:
1. **Layer 1 (Z-index 10 / default):** Background dan slider konten section.
2. **Layer 2 (Z-index 20):** `.navbar-fade-overlay` dengan `pointer-events: none;`, gradient pencocokan background `#FCFBF9`, serta `mask-image` vertikal agar efek blur memudar secara gradual tanpa garis potong tajam.
3. **Layer 3 (Z-index 30 / 50):** `<Navbar />` dengan `pointer-events: auto;` — teks navigasi tetap tajam, kontras tinggi, dan sepenuhnya interaktif tanpa terkena efek blur.

### 4.5 Mobile Hamburger Navigation & Full-Screen Overlay Menu
Pada layar mobile dan tablet (`< 1024px`), navigasi horizontal desktop dialihkan menjadi hamburger button dengan full-screen overlay navigation yang menyatu di dalam `.portfolio-shell`:

```text
01  HOME
02  ABOUT
03  SKILLS
04  EXPERIENCE
05  PROJECTS
06  CONTACT
```

Karakteristik & Spesifikasi:
1. **Breakpoint Adaptif:**
   - `< 1024px` (Mobile & Tablet): Menu horizontal disembunyikan (`hidden lg:flex`), tombol hamburger aktif (`flex lg:hidden`).
   - `>= 1024px` (Desktop): Menu horizontal murni teks aktif, tombol hamburger disembunyikan.
2. **Animated Hamburger / Close Button:**
   - Target sentuh ergonomis minimal 44x44px (`w-11 h-11`).
   - 3 bar garis horizontal (`h-0.5 bg-stone-900`) yang bertransisi halus menjadi 'X' simetris saat dibuka:
     - Garis atas: `rotate-45 translate-y-[7px]`
     - Garis tengah: `opacity-0`
     - Garis bawah: `-rotate-45 -translate-y-[7px]`
3. **Full-Screen Canvas Overlay (`MobileMenu`):**
   - Mengikuti batas kelengkungan sudut (`border-radius: inherit`) dan berada di dalam kanvas utama (`position: absolute; inset: 0; z-index: 40`).
   - Latar belakang off-white serasi `#FCFBF9`.
   - Menggunakan Motion `AnimatePresence` untuk transisi opacity dan staggered slide-up pada setiap item list secara halus.
4. **Hierarki Layer & Interaktivitas:**
   - **Layer 1 (`z-index: 10`):** Section slider (otomatis `overflow-hidden` saat menu terbuka untuk mencegah scroll gesture di latar belakang).
   - **Layer 2 (`z-index: 20`):** Top fade overlay.
   - **Layer 3 (`z-index: 40`):** Full-screen `MobileMenu` overlay (`role="dialog"`).
   - **Layer 4 (`z-index: 50`):** Header bar (`THE DIGITAL PLAYGROUND.` di kiri dan tombol Close 'X' di kanan).
5. **Standar Aksesibilitas:**
   - Dilengkapi `aria-expanded`, `aria-controls`, dan `aria-label` dinamis.
   - Manajemen fokus dan *focus trap* (Tab/Shift+Tab bersiklus di dalam dialog modal).
   - Dukungan penuh tombol `Escape` untuk menutup menu.
   - Auto-close saat viewport di-resize ke ukuran desktop (>= 1024px).

---

## 5. Bentuk Komponen: Radius & Bayangan (Border Radius & Shadows)

Menghadirkan kesan lembut yang selaras dengan karakter monster tanpa terlihat berlebihan.

### 5.1 Border Radius

| Token | Nilai | Komponen |
|---|---:|---|
| `rounded-sm` | 6px | Chip tag kecil, tooltip |
| `rounded-md` | 10px | Input form, tombol standar |
| `rounded-lg` | 16px | Kartu proyek, kartu pengalaman |
| `rounded-xl` | 24px | Kontainer panel utama, modal dialog |
| `rounded-full`| 9999px | Badge pill, tombol bulat, avatar |

### 5.2 Shadows (Bayangan Halus)
Gunakan bayangan yang lembut dan natural:
- **Card Shadow:** `0 4px 20px -2px rgba(28, 25, 23, 0.05)`
- **Hover Shadow:** `0 10px 25px -3px rgba(28, 25, 23, 0.08)`
- Hindari drop shadow hitam pekat atau bayangan warna-warni yang mencolok.

---

## 6. Komponen Antarmuka Utama

### 6.1 Tombol (Buttons)
- **Primary Button:** Latar primary (`#0F766E`), teks putih, hover slightly darker (`#115E59`), transisi halus, radius 10px atau pill.
- **Secondary / Ghost Button:** Latar transparan atau muted (`#F5F5F4`), border halus (`#E7E5E4`), teks stone-800.
- **State Wajib:** Default, Hover, Active, Focus-visible (ring-2 ring-teal-500 ring-offset-2), Disabled.

### 6.2 Kartu Proyek (Project Cards)
- Menggunakan permukaan putih (`#FFFFFF`) dengan border tipis 1px (`#E7E5E4`).
- Menampilkan thumbnail/preview dengan rasio aspek konsisten (16:9 atau 16:10).
- Menampilkan judul, deskripsi ringkas, tag teknologi berupa badges, dan tautan aksi yang jelas.

### 6.3 Formulir & Input
- Outline border tegas 1px (`#E7E5E4`), berubah menjadi border teal (`#0F766E`) dan ring halus pada state focus.
- Label teks terbaca jelas di atas input field.
- Pesan error berwarna merah (`#DC2626`) dengan penjelasan konkret.

### 6.4 Persistent Scroll Indicator & Bottom Utility Row
- **Desktop Layout (`>= 768px`):**
  - **Letak:** Pojok kiri bawah canvas (`.portfolio-shell`) dengan `position: absolute; bottom: var(--section-bottom-inset); z-index: 30; height: 32px;`.
  - **Anatomi:** Lingkaran border 32x32px (`w-8 h-8 rounded-full border border-stone-300`) dengan panah SVG (`w-3.5 h-3.5`) dan teks vertikal dua baris (`SCROLL` di baris 1 dan `DOWN`/`UP` di baris 2).
  - **Bottom Utility Row:** Komponen terpadu `BottomUtilityRow` di setiap section menyediakan slot khusus `w-56 shrink-0` (224px) di sisi kiri.
  - **Shared Baseline:** Indikator scroll, metadata kiri (`CRAFT & PHILOSOPHY`, dsb.), dan label kanan (`MODERN ENGINEERING`, dsb.) berada dalam satu baris horizontal dengan vertical center dan baseline yang presisi (gap horizontal ~55–70px).
- **Mobile Layout (`< 768px`):**
  - **Posisi:** Berpindah ke **bottom-center** horizontal di dalam rounded canvas.
  - **Anatomi:** Lebih compact (lingkaran 28x28px, icon `w-3 h-3`, teks `text-[10px] sm:text-[11px] font-bold tracking-widest`).
  - **Dua Baris Terpisah:**
    - Baris 1: Section footer metadata terangkat ke atas (`mb-10 sm:mb-11 md:mb-0`).
    - Baris 2: Scroll Indicator berada di tengah bawah di bawah metadata.
  - **Reserved Bottom Safe Area:** Token `--mobile-scroll-safe-space: calc(var(--section-bottom-inset) + 56px + env(safe-area-inset-bottom, 0px))` diterapkan pada `.section-content`, memastikan konten terbawah tidak pernah tertimpa indikator.
- **Konsistensi Tipografi Dua Baris (Strict Two-Line Composition):**
  - Baik Scroll Down maupun Scroll Up selalu disusun vertikal dalam 2 baris terstruktur:
    ```text
    ↓  SCROLL        ↑  SCROLL
       DOWN             UP
    ```
  - Properti visual seragam: `font-bold uppercase tracking-widest leading-[1.05] select-none text-[10px] sm:text-[11px] md:text-xs`.
  - Lebar kontainer teks stabil (`min-w-[48px] md:min-w-[54px]`) menjamin **zero layout shift** saat berpindah status antara `DOWN` dan `UP`.
  - Icon lingkaran berada di sebelah kiri teks dan secara vertikal berada di tengah (`align-items: center`, selisih titik pusat vertikal `< 0.5px`).
- **Section 0 – 4 (Home - Projects):** Arrow mengarah ke bawah, teks `SCROLL` / `DOWN`, memicu `goToSection(activeIndex + 1)`. Animasi bouncing ke arah bawah (`.scroll-bounce-down`).
- **Section 5 (Contact):** Arrow berputar halus 180° ke atas (`rotate-180 duration-500`), teks `SCROLL` / `UP`, memicu `goToSection(0)` kembali ke Hero. Animasi bouncing ke arah atas (`.scroll-bounce-up`).
- **Animasi Bouncing Direksional:**
  - `scroll-bounce-down`: Translasi Y ke bawah (`translateY(4px)`), 1.6s, ease-in-out infinite.
  - `scroll-bounce-up`: Translasi Y ke atas (`translateY(-4px)`), 1.6s, ease-in-out infinite.
  - Otomatis nonaktif pada `prefers-reduced-motion: reduce`.

---

## 7. Standar Aksesibilitas (Accessibility / a11y)

1. **Focus Indicator:** Seluruh elemen interaktif wajib memiliki penanda fokus visual (`:focus-visible`) yang jelas bagi navigasi keyboard.
2. **Kontras Teks:** Memenuhi minimal rasio kontras 4.5:1 terhadap latar belakang.
3. **Reduced Motion:** Seluruh animasi CSS dan Tailwind wajib menghormati `motion-reduce` (`@media (prefers-reduced-motion: reduce)`).
4. **Target Sentuh Mobile:** Ukuran target sentuh tombol minimal 44x44px pada layar sentuh.
