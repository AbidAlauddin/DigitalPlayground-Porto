# USER EXPERIENCE (UX)

Dokumen ini menetapkan standar User Experience (UX), alur penjelajahan, interaksi, aksesibilitas, dan arsitektur informasi untuk portfolio **The Digital Playground**.

Website harus menyajikan pengalaman yang menyenangkan, intuitif, dan berkesan tanpa mempersulit pengunjung dalam memahami rekam jejak profesional sang developer.

- Untuk tata letak dan batasan visual, rujuk `VISUAL_DIRECTION.md`.
- Untuk komponen UI dan token desain, rujuk `DESIGN_SYSTEM.md`.
- Untuk perilaku karakter monster di setiap section, rujuk `MONSTER_CHARACTER_GUIDE.md`.

---

## 1. Tujuan Utama UX (UX Goals)

1. **Pemahaman Cepat:** Pengunjung (recruiter, calon klien, atau sesama engineer) dapat langsung memahami peran dan keahlian developer dalam 5 detik pertama di Hero section.
2. **Navigasi Tanpa Hambatan:** Setiap section dapat diakses baik melalui scroll alami maupun klik langsung pada menu navigasi.
3. **Penyajian Konten Berbobot:** Proyek, keahlian, dan riwayat karir disajikan secara transparan dan mudah dievaluasi.
4. **Interaksi yang Ramah:** Kehadiran karakter monster memberikan kehangatan tanpa mengurangi kesan profesional.
5. **Aksesibilitas Universal:** Dapat digunakan dengan nyaman menggunakan mouse, keyboard, layar sentuh, dan screen reader.

> **Prinsip Utama:**
> *"Make the experience memorable, while keeping everything effortless to use."*

---

## 2. Target Pengguna (Target Audience)

- **Technical Recruiters & HR:** Membutuhkan ringkasan cepat mengenai role, tech stack, riwayat kerja, dan tautan kontak/CV.
- **Engineering Managers & Tech Leads:** Ingin melihat arsitektur proyek, kualitas kode di GitHub, live demo, dan pendekatan rekayasa perangkat lunak.
- **Calon Klien Freelance:** Mencari portofolio solusi nyata, keandalan teknis, dan kemudahan menghubungi.
- **Sesama Developer / Kolaborator:** Menikmati pengalaman frontend interaktif, inovasi visual, dan estetika desain.

---

## 3. Alur Pengguna & Struktur Halaman (Page Structure)

Website menggunakan konsep *single-page application* dengan 7 section berurutan secara logis:

```text
[ Navbar ] (Fixed / Blur Header)
    │
    ├── 1. Hero Section        ─── Focal point identitas, sapaan hangat, CTA
    ├── 2. About Section       ─── Cerita profil, filosofi kerja, minat teknis
    ├── 3. Skills Section      ─── Kategori teknologi & keahlian terstruktur
    ├── 4. Experience Section  ─── Rekam jejak kronologis karir & pencapaian
    ├── 5. Projects Section    ─── Showcase karya terbaik (demo & kode)
    ├── 6. Contact Section     ─── Form pesan & saluran jejaring profesional
    └── 7. Footer              ─── Navigasi sekunder & penutup visual ramah
```

Setiap section memiliki jangkar (*anchor ID*) unik (`#hero`, `#about`, `#skills`, `#experience`, `#projects`, `#contact`) sehingga pengguna dapat melompat langsung ke bagian yang diinginkan.

---

## 4. Pengalaman pada Setiap Section

### 4.1 Hero Section
- **Kesan:** Menarik, percaya diri, dan bersih.
- **Konten Kunci:** H1 nama & profesi, pengantar 1-2 kalimat padat, tombol aksi utama (*"View Projects"*) dan tombol sekunder (*"Contact Me"*).
- **Peran Monster:** Berada di samping konten sebagai focal point visual penyambutan dengan animasi idle melayang lembut.

### 4.2 About Section
- **Kesan:** Personal, kredibel, dan reflektif.
- **Konten Kunci:** Pendekatan dalam menyelesaikan masalah teknis, latar belakang pendidikan/karir, dan minat teknologi.
- **Peran Monster:** Duduk santai menemani bacaan narasi dengan ekspresi penasaran.

### 4.3 Skills Section
- **Kesan:** Terorganisasi, sistematis, dan jujur.
- **Konten Kunci:** Pengelompokan keahlian (Frontend, Backend, Database/DevOps, Tools). Hindari representasi persentase keahlian fiktif (seperti *"React 95%"*).
- **Peran Monster:** Mengamati kategori yang sedang dipilih atau di-hover dengan pose berpikir.

### 4.4 Experience Section
- **Kesan:** Berpengalaman, kronologis, dan terstruktur.
- **Konten Kunci:** Garis waktu (*timeline*) pekerjaan dengan nama perusahaan, jabatan, periode kerja, dan poin-poin pencapaian konkret.
- **Peran Monster:** Menemani garis waktu karir dengan ekspresi fokus.

### 4.5 Projects Section
- **Kesan:** Solutif, kredibel, dan berorientasi hasil.
- **Konten Kunci:** Kartu proyek menampilkan gambar thumbnail tajam, judul proyek, deskripsi masalah yang dipecahkan, badge teknologi, tombol *Live Demo*, dan tombol *Source Code*.
- **Peran Monster:** Mengintip ceria di dekat kartu proyek tanpa menutupi gambar maupun tombol interaksi.

### 4.6 Contact Section
- **Kesan:** Terbuka, mudah dihubungi, dan responsif.
- **Konten Kunci:** Email langsung yang dapat diklik/disalin, tautan LinkedIn, GitHub, dan formulir pesan singkat.
- **Peran Monster:** Melambaikan tangan menyambut ajakan kolaborasi.

### 4.7 Footer
- **Kesan:** Bersih, rapi, dan konsisten.
- **Konten Kunci:** Hak cipta (*copyright*), penanda teknologi, dan tautan sosial ringkas.
- **Peran Monster:** Versi kecil karakter monster beristirahat rileks, menjaga identitas karakter hingga akhir halaman.

---

## 5. Standar Interaksi & Navigasi (Interaction Design)

### 5.1 Navigasi Desktop & Mobile
- **Desktop Header:** Menempel di bagian atas (*sticky/fixed*) dengan top fade overlay dan feathered backdrop-blur agar tidak menutupi keterbacaan teks saat section berpindah. Menu menandai section aktif (*active indicator*) secara proporsional.
- **Mobile & Tablet Full-Screen Navigation:** Pada layar `< 1024px`, tombol hamburger 3-bar beranimasi halus menjadi ikon 'X'. Membuka overlay navigasi editorial yang memenuhi kanvas utama (`.portfolio-shell`) dengan tipografi ber-nomor besar (`01 HOME` hingga `06 CONTACT`).
- **Scroll & Gesture Lock:** Saat menu mobile terbuka, gesture scroll layar di belakang dinonaktifkan (`overflow-hidden`) untuk mencegah perpindahan section yang tidak disengaja.
- **Aksesibilitas & Keyboard:** Mendukung penutupan via tombol `Escape`, *focus trap* berputar di dalam modal, `aria-expanded`, serta pengembalian fokus saat menu ditutup.

### 5.2 Kontrol Scroll Alami
- **Bebas dari Scroll-Jacking Menjebak:** Pengguna bebas menggulir halaman dengan kecepatan normal mereka sendiri. Animasi scroll menyesuaikan pergerakan roda mouse/sentuhan tanpa mengunci (*lock*) posisi layar.

### 5.3 Feedback Interaksi
- Setiap elemen interaktif (tombol, tautan, kartu) wajib memberikan umpan balik visual instan (perubahan warna, sedikit elevasi, atau outline fokus).

---

## 6. Penanganan Loading, Error, & Fallback

Website dirancang dengan prinsip **Progressive Enhancement**:

1. **Non-blocking Content Loading:** Teks dan layout HTML dirender seketika tanpa menunggu model 3D selesai diunduh.
2. **Skeleton & Placeholders:** Area monster 3D memiliki placeholder visual transparan atau siluet halus selama proses unduh aset `.glb`.
3. **Graceful WebGL Fallback:** Jika browser atau perangkat pengguna tidak mendukung WebGL (atau terjadi *context loss*), canvas 3D secara otomatis digantikan oleh ilustrasi/render 2D monster berkualitas tinggi tanpa pesan error yang mengganggu.
4. **Tautan Valid:** Seluruh tautan proyek eksternal, GitHub, dan media sosial wajib mengarah ke URL valid dengan atribut `rel="noopener noreferrer"`.

---

## 7. Aksesibilitas & SEO (Accessibility & SEO Standards)

- **Semantic HTML:** Menggunakan elemen semantik baku: `<header>`, `<main>`, `<section>`, `<article>`, `<nav>`, `<footer>`.
- **Hierarki Heading:** Tepat satu elemen `<h1>` pada Hero section, `<h2>` untuk setiap judul section, dan `<h3>` untuk kartu proyek/item pengalaman.
- **Canvas a11y:** Canvas 3D Three.js wajib diberi atribut `aria-hidden="true"` sehingga pembaca layar (*screen reader*) berfokus membaca teks informasi portfolio.
- **Keyboard Navigation:** Seluruh link, tombol, dan form input dapat dijangkau dan diaktifkan menggunakan tombol `Tab` dan `Enter` dengan penanda `:focus-visible` yang tegas.
- **Metadata SEO:** Konfigurasi tag `<title>`, `<meta name="description">`, OpenGraph (`og:title`, `og:image`), dan favicon SVG tajam.
