# MONSTER CHARACTER GUIDE

Dokumen ini menjadi pedoman utama untuk desain visual, anatomi, ekspresi, penempatan, dan spesifikasi aset karakter monster dalam portfolio **The Digital Playground**.

Monster bukan sekadar hiasan sampingan. Karakter ini merupakan **identitas visual utama** yang memberikan jiwa, kehangatan, dan kepribadian pada seluruh website.

- Untuk arahan komposisi dan batasan visual, rujuk `VISUAL_DIRECTION.md`.
- Untuk durasi dan kurva animasi, rujuk `ANIMATION_GUIDELINES.md`.
- Untuk arsitektur controller teknis di React Three Fiber, rujuk `TECHNICAL_ARCHITECTURE.md`.

---

## 1. Konsep & Kepribadian Karakter (Core Personality)

Monster adalah makhluk kecil berbulu halus yang hidup di dalam ekosistem portfolio. Karakter ini bertindak sebagai pemandu ramah yang menemani pengunjung menjelajahi profil sang developer.

### Sifat Utama:
- **Friendly & Approachable:** Hangat, menyambut, dan tidak intimidatif.
- **Curious:** Selalu tertarik mengamati apa yang sedang dibaca pengunjung.
- **Expressive:** Mengomunikasikan suasana setiap section melalui mata dan gerakan kepala.
- **Playful & Calm:** Ceria namun tenang; tidak bergerak hiperaktif atau mengganggu konsentrasi.

> **Aturan Mutlak:** Gunakan satu spesies atau keluarga karakter yang sama di seluruh halaman website. Perbedaan antarbagian hanya berasal dari pose, ekspresi, orientasi pandangan, dan skala.

---

## 2. Karakteristik Fisik & Visual (Visual Appearance)

Acuan visual utama karakter mengikuti gambar referensi yang telah disediakan:

### 2.1 Bentuk Tubuh (Body)
- Siluet karakter bersih, seimbang, ramah, dan mudah dikenali tanpa sudut tajam yang agresif.
- **Keselarasan Satu Keluarga Karakter (Strict Visual Match):** Seluruh karakter monster (Hero: Yeti, About: Dev Cactoro, Skills: The Skill Builder Monkroose, Experience: The Career Archivist Frog) berasal dari universe karakter yang sama oleh 3D artist Quaternius (lisensi CC0 1.0 Public Domain). Karakter memiliki proporsi tubuh stylized seimbang, siluet membulat ramah, telinga bulat lembut, dan tanpa tanduk, tanpa antena, tanpa elemen sci-fi/cyborg, serta bukan kepala tudung jamur.
- Menghindari detail anatomi yang rumit atau tampak realistis menyeramkan.

### 2.2 Permukaan & Material (Surface & Material)
- **Konsistensi Palet & Material Kuartet:** Keempat monster berbagi palet warna dan shader plush yang seragam:
  - **Coat Utama:** Signature **Turquoise-Teal (`#228B82`)** dengan material `MeshPhysicalMaterial` (`sheen: 1.0`, `sheenColor: #A7F3D0`, `bumpMap` mikro-fur halus).
  - **Aksen Sekunder:** **Soft Pastel Mint-Teal (`#86D6CC`)** pada wajah, perut, telapak tangan, dan kaki.
  - **Aksen Telinga & Kelopak:** **Soft Mint-Teal (`#73C9BE` / `#7ECFC3`)** yang serasi dengan palet editorial website.
  - **Aksen Aksesori Editorial:** Topi terakota/tweed (`#D9A066` / `#334155`), dasi amber hangat (`#D97706`), dan meja/balok natural.
- **Tekstur Permukaan:** Menghadirkan kesan *tactile plush* yang lembut dan bersih tanpa Z-fighting.

### 2.3 Wajah & Mata (Face & Eyes)
- **Mata:** Berukuran besar, bulat, jernih, dan sangat ekspresif.
- **Highlight Mata:** Memiliki pantulan cahaya putih alami (*eye catchlight*) yang memberikan kesan hidup.
- **Ekspresi:** Dibangun melalui kelopak mata, pupil, dan sedikit perubahan bentuk mulut sederhana.

---

## 3. Matriks Peran & Ekspresi Monster di 7 Section

Karakter monster wajib hadir pada seluruh 7 section website dengan ekspresi dan pose yang relevan dengan konteks:

| Section | Peran Visual | Pose Karakter | Ekspresi Wajah | Interaksi Pengguna |
|---|---|---|---|---|
| **Hero** | Focal point penyambutan | Melayang halus (*subtle floating*) | Senang & bersahabat (*happy*) | Mengikuti arah pergerakan pointer secara halus. |
| **About** | Pendamping narasi profil | Duduk santai (*sitting*) | Penasaran (*curious*) | Memandang ke arah blok teks profil developer. |
| **Skills** | Pendamping eksplorasi keahlian | Pose berpikir, memiringkan kepala | Berpikir (*thinking*) | Bereaksi kecil saat pengguna mengarahkan kursor pada kategori skill. |
| **Experience** | Pendamping garis waktu karir | Berdiri tegak / berjalan santai | Fokus (*focused*) | Mendampingi alur kronologis perjalanan karir. |
| **Projects** | Pendamping showcase karya | Mengintip dari sisi kartu proyek | Antusias (*excited*) | Bereaksi ceria saat kartu proyek di-hover. |
| **Contact** | Penyambut ajakan diskusi | Melambaikan tangan (*waving*) | Menyambut hangat (*welcoming*) | Gestur mengajak berkomunikasi saat form/link aktif. |
| **Footer** | Penutup visual yang konsisten | Pose istirahat santai (*resting*) | Rileks (*relaxed*) | Idle animation tenang berukuran kecil. |

---

## 4. Animasi Karakter (Character Motion)

### 4.1 Idle Animation Dasar
Agar karakter terasa hidup tanpa membebani mata pengunjung:
- **Breathing:** Perubahan skala napas yang sangat halus (amplitudo 1–2%).
- **Blinking:** Berkedip secara alami setiap 3–6 detik dengan variasi acak.
- **Subtle Floating:** Gerakan naik-turun lembut (khususnya pada Hero section).
- **Head Tilt:** Sedikit kemiringan kepala perlahan saat mengamati konten.

### 4.2 Interaksi Pointer & Scroll
- Respons terhadap kursor dibatasi pada rotasi kepala/mata maksimal 15–20 derajat agar karakter tidak tampak patah atau terdistorsi.
- Saat pengguna melakukan scroll cepat, karakter mempertahankan pose stabil dan bertransisi secara mulus ke pose section berikutnya.

---

## 5. Spesifikasi Teknis Aset 3D (Asset Specifications)

Untuk memastikan loading cepat dan performa 60 FPS pada browser:

### 5.1 Format & Anggaran Poligon (Polygon Budget)
- **Format Model:** `.glb` (glTF binary) teroptimasi.
- **Kompresi:** Menggunakan kompresi Draco atau Meshopt jika diperlukan.
- **Batas Poligon:** Maksimal **30.000 – 50.000 triangles** untuk keseluruhan karakter.
- **Draw Calls:** Maksimal 2–4 draw calls per model.

### 5.2 Tekstur (Texture Budget)
- Resolusi tekstur maksimal `2048x2048` (desktop) atau `1024x1024` (mobile).
- Format tekstur WebP atau KTX2 yang terkompresi.

### 5.3 Animation Clips Terpadu
Semua animasi sebaiknya dikemas dalam satu file model utama:
- `idle`
- `floating`
- `thinking`
- `waving`
- `curious`
- `excited`

### 5.4 Struktur Direktori Aset
```text
public/
├── models/
│   └── monster/
│       └── monster-main.glb       # Model 3D utama beserta skeleton & animation clips
└── images/
    └── fallback/
        └── monster-fallback.webp   # Gambar statis 2D jika WebGL gagal/dinonaktifkan
```

---

## 6. Penanganan Kegagalan & Fallback (Graceful Fallback)

Jika perangkat pengguna tidak mendukung WebGL, browser mengalami crash konteks grafis, atau preferensi reduced motion diaktifkan:
1. Sistem secara otomatis menampilkan visual fallback berupa render 2D berkualitas tinggi (`monster-fallback.webp` atau SVG).
2. Teks konten dan fungsionalitas portfolio tetap berjalan 100% tanpa hambatan.
3. Halaman tidak boleh menampilkan canvas hitam kosong atau error crash.

---

## 7. Sistem Animasi 2D Frame Sprites (MainMonster Component)

Pada halaman Home (Hero Section), diintegrasikan komponen `MainMonster` berbasis 2D frame animation sequence yang memanfaatkan kumpulan aset render di `public/monsters/main-monster/`.

### 7.1 Pemetaan & Spesifikasi Aset Aktual

```text
public/monsters/main-monster/
├── blinking/
│   ├── 1open-eyes.png   # Frame 1: Kondisi mata terbuka normal (358x458)
│   ├── 2close-eyes.png  # Frame 2: Kondisi mata tertutup / berkedip (315x458)
│   ├── 3wink-eyes.png   # Frame 3: Ekspresi mengedipkan satu mata / wink (322x458)
│   └── 4wide-eyes.jpeg  # Frame 4: Ekspresi terkejut / wide eyes (542x698, .jpeg)
│
└── waving/
    ├── 1-iddle.png        # Frame 1: Pose awal waving (256x566)
    ├── 2-waving.png       # Frame 2: Tangan kanan mulai terangkat (262x566)
    ├── 3-waving.png       # Frame 3: Tangan kanan terangkat setengah (254x566)
    ├── 4-waving.png       # Frame 4: Tangan melambai penuh (270x566)
    ├── 5-waving.png       # Frame 5: Tangan bergerak ke samping (251x566)
    ├── 6-afterwaving.png  # Frame 6: Tangan kembali turun (243x566)
    └── 7-happy.jpeg       # Frame 7: Pose gembira \o/ setelah waving (504x572, .jpeg)
```

### 7.2 Temuan Audit Visual Aset
1. **Full-Body Renders:** Setiap frame gambar adalah render tubuh utuh (*full-body character* dengan kepala, mata, tangan, badan, dan kaki), bukan layer terpisah (bukan potongan mata atau lengan saja). Aset waving sudah memiliki ekspresi mata sendiri, dan aset blinking sudah memiliki tubuh dan lengan lengkap.
2. **Keterbatasan Layering Independen:** Karena seluruh aset adalah gambar solid full-body, pemisahan layer secara fisik (menumpuk kepala berkedip di atas tubuh waving) tidak memungkinkan secara estetika tanpa menghasilkan tabrakan visual dan artefak.
3. **Penyelarasan Skala & Baseline Kaki:** Dimensi kanvas bawaan bervariasi (blinking tinggi 458px, waving tinggi 566px dengan 196px area kosong di bawah kaki, happy tinggi 572px).
4. **Solusi Normalisasi Offscreen Canvas (`monsterAssets.ts`):**
   - Saat preloading, sistem memproses setiap frame pada offscreen canvas 500×500px:
     1. Menghilangkan artefak pola checkerboard bawaan secara otomatis menggunakan BFS border flood-fill.
     2. Menemukan bounding box aktual karakter monster.
     3. Menstandarisasi skala tinggi monster (`TARGET_HEIGHT = 380px`).
     4. Mengunci titik pijakan kaki pada baseline seragam (`TARGET_FEET_Y = 460px`) dan titik tengah horizontal (`TARGET_CENTER_X = 250px`).
   - Hasilnya: peralihan frame antara idle, blinking, waving, dan happy pose berlangsung dengan **zero layout shift**, tanpa lompatan vertikal, dan dengan transparansi murni terhadap background canvas `#FCFBF9`.

### 7.3 Manajemen State & Prioritas Animasi
- **Prioritas 1 (Tertinggi) — `waving`:**
  - Dipicu oleh hover pada desktop atau tap pada mobile.
  - Memutar frame `wave_0` hingga `wave_5` secara sekuensial (~130ms per frame, total ~780ms).
  - Selama waving aktif, siklus blinking otomatis di-pause agar tidak merusak rangkaian gerak.
- **Prioritas 2 — `happy`:**
  - Menampilkan Frame 7 (`7-happy.jpeg`).
  - Desktop: Ditahan selama pointer kursor berada di atas monster. Saat kursor keluar, kembali ke idle.
  - Mobile: Ditahan selama 850ms, kemudian otomatis kembali ke idle.
- **Prioritas 3 — `idle` (Blinking):**
  - Monster berada pada pose `blink_open`.
  - Berkedip otomatis dengan interval acak 2.5s – 5.0s.
  - Durasi mata tertutup 140ms (`blink_close`).
  - Variasi ekspresi wink (`blink_wink`, durasi 200ms) muncul dengan probabilitas 10%.
  - Disertai animasi melayang halus (*subtle floating idle*, 3.2s infinite ease-in-out).

### 7.4 Aksesibilitas & Responsivitas
- **Dukungan Touch:** Dilengkapi deteksi perpindahan sentuhan (`Math.hypot(dx, dy) < 12px`). Gestur scroll dan swipe diabaikan sehingga tidak memicu waving secara tidak sengaja.
- **Dukungan Keyboard:** Dilengkapi `role="button"`, `tabIndex={0}`, dan event handler `Enter`/`Space`.
- **Prefers-Reduced-Motion:** Jika aktif, animasi waving dan floating otomatis dinonaktifkan, dan monster tetap tampil ramah dalam pose statis.

---

## 8. Sistem Rigging Mata 3D — Monster Skills (The Skill Builder)

Pada Section 03 (Skills), model 3D `builder-mascot.glb` menggunakan integrasi prosedural sepasang mata 3D ekspresif yang terikat langsung (*hard-bound*) pada tulang kepala (`Head` bone).

### 8.1 Arsitektur Skeletal Attachment & Sockets
- **Masalah Detachment Terdahulu:** Menghitung posisi mata menggunakan transformasi unskinned bind-pose (`origMesh.matrixWorld`) menyebabkan distorsi koordinat saat carrier diposisikan off-screen, sehingga mata tampak melayang di pojok kanan atas.
- **Solusi Skeletal Inverse Bind Matrix:**
  Koordinat socket mata diekstrak langsung dari invers bind matrix tulang kepala (`origEyeMesh.skeleton.boneInverses[headIdx]`) pada vertex centroid `Eye_White` (`Monkroose_4`):
  - **Socket Mata Kiri (Head Space):** `Vector3(-0.003388, 0.003466, 0.001834)`
  - **Socket Mata Kanan (Head Space):** `Vector3(0.003403, 0.003466, 0.001831)`
  - **Orientasi Gaze Forward Normal:**
    - Kiri: `Vector3(-0.266, 0.365, 0.892).normalize()`
    - Kanan: `Vector3(0.266, 0.365, 0.892).normalize()`
- **Hierarki Parent-Child:**
  Objek `CustomEye_L` dan `CustomEye_R` ditambahkan langsung sebagai child dari node tulang `Head` (`headNode.add(eyeMount)`). Transformasi posisi dan rotasi sepenuhnya berada di dalam *local coordinate space* `Head`, sehingga mata secara absolut terkunci mengikuti setiap gerakan kepala (menoleh, mengangguk, bernapas, berjalan, dan tertidur) tanpa pernah lepas atau terpisah dari wajah karakter.

### 8.2 Struktur Komponen & Material Mata
- **Sclera:** `MeshPhysicalMaterial` putih bersih glossy (`roughness: 0.12`, `clearcoat: 0.95`).
- **Iris:** `MeshStandardMaterial` signature deep teal (`#0D6E68`).
- **Pupil & Catchlights:** Dark pupil dengan dual specular highlights putih (`catchBig` & `catchSmall`) untuk kesan tatapan hidup.
- **Kelopak Mata (Upper & Lower Lids):** `MeshPhysicalMaterial` berwarna soft mint (`#73C9BE`) yang bergerak menutup saat berkedip (blinking) dan tertutup penuh saat fase tidur (`sleeping`).

### 8.3 Sistem Carry Anchor & Pose Pegangan Dua Tangan (Two-Hand Block Grip)
- **Carry Anchor Hierarchy (`CarryAnchor`):**
  Node `<group ref={carryAnchorRef} name="CarryAnchor" />` dipasang di dalam `monsterRootRef` dan disinkronkan setiap frame dengan titik tengah (*midpoint*) antara telapak tangan kiri (`Middle2L`) dan telapak tangan kanan (`Middle2R`) di depan torso (`Y ≈ 1.00`, `Z ≈ 0.66`). Posisi balok yang sedang dibawa ditransformasikan langsung dari *world matrix* `CarryAnchor` ke *local space* `stageGroupRef`, sehingga balok bergerak menyatu dengan tangan dan ayunan langkah tubuh tanpa pernah tertinggal atau melayang.
- **Kalibrasi Kinematika Lengan & Tangan (`LOW_GRIP`, `MID_CARRY`, `HIGH_GRIP`):**
  Rotasi tulang `ShoulderL/R`, `UpperArmL/R`, dan `LowerArmL/R` dikalibrasi langsung terhadap *GPU-skinned vertex bounding box* dari `Monkroose_3` (mesh tangan mint) serta mereset tulang jari (`Index1..3`, `Middle1..3`, `Pinky1..3`, `Thumb1..2`) agar kedua telapak tangan (`X = ±0.240..±0.648`, `Y = 0.683..1.317`, `Z = 0.276..1.033`) menempel presisi mengapit sisi kiri dan kanan balok (`X = ±0.267`, `Y = 0.73..1.21`, `Z = 0.40..0.92`) tanpa clipping ke dalam balok maupun dada.
- **Transisi Pickup, Carry, Placement & Release:**
  Dikendalikan oleh state kontinu `gripWeight` (`0 -> 1`), `carryHeightNorm` (`-1` pickup/baris bawah, `0` dada/torso, `+1` baris atas), dan `releaseSpread` (membuka telapak tangan ke samping saat melepaskan balok di atas piramida sebelum kembali ke pose idle).

---

## 9. Sistem Karakter 3D Section 04 — The Career Archivist (The Little Office Keeper)

Pada Section 04 (Experience), karakter monster mengusung konsep **The Career Archivist — The Little Office Keeper**, seorang pekerja arsip miniatur yang bertugas menyusun, memeriksa, dan memverifikasi dokumen rekam jejak karier.

### 9.1 Proporsi Karakter & Artikulasi Tangan (22 Skeletal Finger Joints)
- **Karakter:** Model `archivist-mascot.glb` (keluarga maskot bertubuh mint/teal yang sama dengan Home, About, dan Skills), mengenakan kemeja kerja putih, topi newsboy cap bertekstur tweed, dasi amber dengan physics micro-sway, ID badge gantung *ARCHIVIST*, serta kacamata baca bundar berbingkai kuningan (*brass wireframe glasses*).
- **Kalibrasi Proporsi Tangan (`HAND_SCALE = 0.72`):**
  Untuk mencegah tangan monster terlihat seperti dayung/sirip besar yang menutupi seluruh dokumen dan stempel, dimensi tangan direduksi sebesar 28% secara proporsional dengan menskalakan 4 root finger bones pada kedua tangan:
  - Tangan Kiri: `Thumb1.L`, `Index1.L`, `Middle1.L`, `Pinky1.L`
  - Tangan Kanan: `Thumb1.R`, `Index1.R`, `Middle1.R`, `Pinky1.R`
- **Pose Jari Spesifik (Hand Pose Presets):**
  1. `relaxed`: Jari melengkung lembut ke bawah, bertumpu secara alami di atas meja kerja.
  2. `documentHold`: Ibu jari di atas kertas dan 3 jari lainnya mengapit tepi dokumen tanpa menutupi teks.
  3. `folderHold`: Pegangan dua tangan mengapit tepi luar map arsip teal.
  4. `stampGrip`: Ibu jari dan jari-jari melingkar ergonomis memegang gagang kayu stempel dengan telapak tangan di atas knob bulat.
  5. `waveOpen`: Telapak tangan terbuka ramah dengan jari melebar untuk lambaian tangan perayaan.

### 9.2 Kalibrasi Dimensi Properti Kantor Miniatur
- **Dokumen Karier (`deskDocMesh`):** `[0.30, 0.42]` — aspek rasio A4 realistis dengan tekstur sertifikat pencapaian karier; bertransisi menampilkan cap stempel merah permanen saat dicap.
- **Map Arsip (`heldFolder`):** `[0.34, 0.46, 0.024]` — dimensi sedikit lebih besar dari dokumen A4 sehingga lembar dokumen bersarang rapi di dalamnya.
- **Tumpukan Map Arsip Meja:** `[0.26, 0.012, 0.36]` — tumpukan map arsip bersusun 3 warna di sisi kanan meja.
- **Stempel Meja Kayu & Kuningan:**
  - Gagang kayu bubut: silinder `r = 0.014–0.022`, tinggi `0.070`
  - Knob bulat atas: bola `r = 0.024`
  - Kerah kuningan: silinder `r = 0.024`, tebal `0.009`
  - Bantalan karet cap: balok `[0.052, 0.010, 0.052]`
- **Kabinet Arsip Mini 2 Laci:**
  - Laci atas teranimasi membuka secara halus pada sumbu Z (`targetDrawerZ = 0.22`) selama fase pengarsipan (`organize`) dengan tab folder warna-warni terlihat di dalamnya.

### 9.3 Alur Aktivitas Otomatis Tanpa Tombol UI
State machine otomatis mengalir berkesinambungan tanpa memerlukan tombol kontrol intervensi manual:
1. `idle` (2.5s): Monster berdiri santai di balik meja, bernapas, berkedip ramah, tangan bertumpu natural.
2. `inspect` (3.5s): Menunduk memeriksa dokumen di atas meja, tangan kiri menahan sudut kertas, tangan kanan menelusuri baris teks.
3. `organize` (3.5s): Berputar ke kabinet, membuka laci atas, mengambil map berkas arsip dengan dua tangan, lalu membawanya kembali ke meja.
4. `stamp` (2.8s): Mengambil stempel dari bantalan tinta merah, menekan stempel kuat-kuat di atas dokumen (*firm impact*), cap segel merah terverifikasi muncul di dokumen.
5. `review` (2.2s): Mengangguk puas memeriksa hasil verifikasi rekam jejak.
6. `celebrate` (1.8s): Melambaikan tangan kanan dengan ramah ke arah audiens, mata tersenyum ceria, lalu siklus kembali ke `idle`.

---

## 10. Sistem Karakter 3D Section 05 — The Showcase Operator (The Little Project Controller)

Pada Section 05 (Projects), karakter kelima dalam keluarga maskot mengusung konsep **The Showcase Operator — The Little Project Controller**, operator mini yang secara langsung mengendalikan pagination proyek (`01`–`06`) secara berurutan dan tersinkronisasi dengan state carousel existing.

### 10.1 Aset Model, Material & Outfit Operator
- **Sumber Aset:** `public/monsters/showcase-operator/operator-mascot.glb` (berbasis Quaternius CC0 Cute Monster Pack `Dino` dengan 43-bone `CharacterArmature` identik dengan Home, About, Skills, dan Experience).
- **Konsistensi Visual:** Menggunakan material bulu turquoise-teal (`#228B82`) + pastel mint (`#86D6CC`), menyembunyikan taring/lidah (`Dino_Teeth`, `Dino_Tongue`), serta mengekstrak koordinat soket mata dari `Eye_White` inverse-bind matrix untuk tepat 2 mata glossy 3D (`OperatorEye_L`, `OperatorEye_R`) dengan kelopak `#228B82` dan rotasi gaze sferis.
- **Outfit & Aksesori:**
  - **Operator Headset (`OperatorHeadset`):** Headband ramping dark-slate (`#1E293B`), dual cushioned ear cups dengan aksen teal (`#0D9488`), dan boom microphone melengkung di pipi kanan.
  - **Casual Operator Cap (`OperatorCap`):** Topi operator kasual dark-slate dengan brim teal di atas mahkota kepala tanpa menutupi mata.
  - **Work Collar, Vest & ID Badge (`OperatorOutfit`, `OperatorBadge`):** Kerah kemeja putih, lapel rompi kasual, dan kartu identitas akrilik bertuliskan `"PROJECT OPERATOR"` (`operatorTextures.ts`).
  - **Operator Glove Cuffs (`OperatorGloveCuff_L/R`):** Manset sarung tangan putih dengan trim amber (`#D97706`) pada kedua pergelangan untuk memperjelas gestur menekan tombol.

### 10.2 Integrasi Pagination Existing & Sinkronisasi Koordinat DOM-3D
- **Satu Sumber State:** Monster memanggil langsung setter `activeProjectIdx` milik `ProjectsSection.tsx` (tanpa pagination palsu atau state carousel terpisah).
- **Pengukuran Posisi Tombol Real-Time (`measurePaginationPositions`):** Koordinat horizontal tombol DOM `01`–`06` (`paginationBtnRefs`) diukur terhadap `operatorContainerRef` saat mount dan `ResizeObserver`/`resize`, lalu diproyeksikan (`ndcXToWorldX`) ke bidang jangkauan 3D agar 2-Bone Arm IK (`solveArmIK`) mengarahkan tangan monster tepat ke bawah tombol target di semua ukuran layar (desktop, tablet, mobile).
- **Rangkaian Animasi Otomatis (`01 → 02 → 03 → 04 → 05 → 06 → 01`):**
  1. `idle` (1.5s): Menunggu santai, bernapas, berkedip, melihat nomor aktif, sesekali membetulkan headset setiap 3 siklus.
  2. `reach` (0.62s): Melangkah/bergeser mendekati tombol berikutnya, mengangkat lengan terdekat menuju posisi tombol target.
  3. `press` (0.26s): Menekan tombol target → memicu visual feedback tekanan (`scale-[0.86] translate-y-[2px]`) dan mengganti `activeProjectIdx`.
  4. `react` (0.55s): Menoleh bangga ke preview proyek di kanan dengan anggukan senang dan squint ceria.
  5. `return` (0.45s): Menurunkan tangan kembali ke pose santai.
- **Prioritas Interaksi Manual & Aksesibilitas:** Klik manual pada pagination/`‹`/`›` langsung membatalkan siklus autoplay berjalan, memicu `manual_react`, dan menjeda autoplay selama 6 detik (`MANUAL_RESUME_DELAY_MS`); hover pada pagination menahan autoplay; tombol `Auto`/`Paused` dan dukungan `prefers-reduced-motion` tersedia penuh.
