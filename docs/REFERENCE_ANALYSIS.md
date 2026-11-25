# REFERENCE ANALYSIS — THE DIGITAL PLAYGROUND

Dokumen ini mencatat hasil analisis mendalam terhadap berkas video referensi yang tersimpan di `docs/media_docs/reference.mov`.

Analisis ini membedakan secara tegas antara:
1. **Fakta Pengamatan Video (Empirical Observation):** Perilaku visual, interaksi, dan alur yang teramati secara nyata dalam rekaman video referensi.
2. **Interpretasi & Kesimpulan Agent:** Makna desain dan alasan di balik pilihan interaksi.
3. **Keputusan Implementasi untuk The Digital Playground:** Bagaimana karakteristik tersebut diadaptasikan ke dalam proyek portfolio developer ini sesuai panduan `AGENTS.md` dan spesifikasi pengguna.

---

## 1. Identifikasi Berkas Referensi

- **Lokasi Berkas:** `docs/media_docs/reference.mov`
- **Metadata Teknis:**
  - Format: QuickTime / MP4 (H.264 / AAC)
  - Resolusi: 1326 x 938 px (aspek rasio ~1.41:1 desktop viewport)
  - Frame Rate: 60 fps
  - Durasi: 7.00 detik
  - Tipe Rekaman: Interaksi layar desktop (rekaman ReplayKit)

---

## 2. Pengamatan Visual & Interaksi Video (Berdasarkan Ekstraksi Frame)

### 2.1 Struktur Halaman & Alur Perpindahan
- **Frame 001 (0.0s – 1.5s): Hero Section**
  - Komposisi split horizontal: Bagian kiri memuat tipografi perkenalan (`Hello, my name's Jack. I'm a Visual Designer.`), sedangkan bagian kanan memuat panggung 3D isometrik dengan blok-blok geometris berwarna-warni.
  - Pojok kiri bawah memiliki indikator `Scroll down` dengan ikon panah atas-bawah melingkar.
- **Frame 002 – 005 (1.5s – 3.0s): Transisi Scroll ke Section 2 (About / What I Do)**
  - Pengguna melakukan satu gesture scroll ke bawah. Seluruh halaman berpindah secara vertikal dalam satu gerakan mulus (*full-page transition*).
  - Section berikutnya langsung mengambil alih satu viewport penuh.
  - Menampilkan headline besar yang kuat: `Think. Make. Solve.` dan subjudul `I enjoy creating delightful, human-centered digital experiences.`
- **Frame 006 – 009 (3.0s – 4.5s): Section 3 (Services / Skills Showcase)**
  - Menampilkan showcase kartu horizontal: 3 item keahlian dengan grafis bulat berwarna-warni (`User Interface`, `User Experience`, `UI Design Kit`).
  - Kartu tengah terpilih memiliki kartu putih berelevasi dengan tombol `Find out more`.
- **Frame 010 – 011 (4.5s – 5.5s): Navigasi Carousel & Transisi Section**
  - Terdapat kontrol navigasi numerik (`01 . 02`) dengan tombol panah melingkar dan tautan `Contact me`.
  - Berpindah ke section dengan latar belakang ungu pekat (*Who I Work With / Art Direction*).
- **Frame 012 – 014 (5.5s – 7.0s): Scroll Back to Top (Hero)**
  - Pengguna melakukan scroll kembali ke atas; viewport secara instan dan mulus meluncur kembali ke Hero section awal.

### 2.2 Sistem Scrolling (Scroll Mechanism)
1. **Full-Page Snapping:** Website tidak bergulir secara bebas piksel-demi-piksel seperti dokumen panjang biasa. Setiap section bertindak sebagai slide mandiri yang memenuhi layar (`100vh` / `100svh`).
2. **Satu Gesture = Satu Perpindahan:** Satu putaran roda scroll atau sapuan trackpad memicu transisi penuh ke section berikutnya.
3. **Ketiadaan Scroll-Jank:** Transisi berlangsung dengan kurva perlambatan halus (*smooth deceleration*), memberikan waktu bagi mata pengunjung untuk mencerna konten baru.
4. **Alur Dua Arah:** Scroll ke bawah menuju section berikutnya; scroll ke atas kembali ke section sebelumnya.

### 2.3 Tipografi & Whitespace
1. **Headline Ekstra Besar & Tegas:** Judul menggunakan bobot tebal (*bold/extrabold*) dengan ukuran relatif besar terhadap kontainer, memberikan hierarki baca yang sangat kontras terhadap teks deskripsi.
2. **Eyebrow Text dengan Garis Aksen:** Setiap section diawali dengan label kategori kecil bergaris horizontal di kirinya (misal: `— Jack Gross`, `— What I Do`, `— Who I Work With`).
3. **Whitespace yang Lapang:** Konten tidak dijejalkan. Ruang kosong di sekitar elemen visual dan teks sangat lega, memberikan kesan premium dan tenang.

---

## 3. Hal yang Diadaptasi ke The Digital Playground

| Elemen Referensi | Bentuk Asli di Video | Adaptasi di The Digital Playground |
|---|---|---|
| **Objek Visual Kanan/Pusat** | Objek geometris kubus, bola, platform 3D | Digantikan oleh **Container Placeholder Karakter Monster 3D** (pada tahap ini disiapkan wadah responsif tanpa gambar/model). |
| **Sistem Navigasi Scroll** | Full-page section scroll berbasis gesture | Menggunakan **GSAP Observer / Timeline Controller** dengan penguncian jeda (*cooldown lock*) agar 1 gesture = 1 section. |
| **Bingkai Halaman (Frame)** | Tepi layar browser standar | **Warm Pastel Outer Frame** dengan area utama putih/off-white ber-rounded corner halus dan margin viewport yang elegan. |
| **Navbar** | Logo `FOLIO.` + Dribbble/Instagram link | **Text-Only Navbar** (`HOME`, `ABOUT`, `SKILLS`, `EXPERIENCE`, `PROJECTS`, `CONTACT`) dengan penanda section aktif berbasis warna/opacity. |
| **Tipografi** | Sans-serif tebal (Plus Jakarta Sans / Inter style) | Diimplementasikan menggunakan `Plus Jakarta Sans` dengan ukuran proporsional dan eyebrow line. |
| **Struktur Bagian** | Hero, What I Do, Services, Clients | 6 Section terstandar portfolio developer: `Hero`, `About`, `Skills`, `Experience`, `Projects`, `Contact`. |

---

## 4. Hal yang Dihindari / Tidak Ditiru

1. **Jangan Meniru Objek Geometris Asli:** Tidak menggunakan kubus, balok ungu/kuning, atau bola 3D acak karena fokus karakter utama proyek ini adalah **Fluffy Monster Mascot**.
2. **Jangan Menggunakan Asset Monster Dulu:** Tidak menaruh ilustrasi monster palsu, stiker, emoji, atau model 3D dummy pada tahap ini sesuai batasan ketat instruksi.
3. **Jangan Memasang Navbar Berbentuk Pill / Card:** Navbar wajib murni teks tanpa kotak background, tanpa ikon, dan tanpa border.
4. **Hindari Rigid Scroll-Lock pada Mobile:** Pada layar sentuh smartphone, gunakan alur vertikal yang fleksibel agar konten tidak terpotong dan navigasi tetap nyaman.
