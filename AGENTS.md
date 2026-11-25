# AGENTS.md — Petunjuk AI Agent: The Digital Playground

Dokumen ini adalah pedoman operasional utama bagi AI Agent yang bekerja pada project **The Digital Playground** (Minimalist Monster Portfolio).

Setiap keputusan arsitektur, implementasi kode, penataan visual, dan pembuatan komponen wajib mematuhi dokumen ini dan dokumentasi teknis di dalam direktori `docs/`.

---

## 1. Konteks Project

Project ini adalah portfolio developer interaktif dengan konsep **The Digital Playground**, memadukan:
- Web design minimalis, bersih, dan modern.
- Karakter 3D monster berbulu (*fluffy monster*) yang ramah dan ekspresif sebagai identitas visual utama.
- Animasi karakter yang interaktif dan dinamis.
- *Cinematic scrolling experience* yang menghubungkan seluruh halaman.
- Penyajian konten portfolio profesional yang jelas, terstruktur, dan mudah diakses.

**Acuan Visual Utama:** Referensi visual yang diberikan pengguna mengarahkan komposisi dan kesederhanaan layout, di mana objek-objek visual digantikan oleh karakter monster berbulu. Website ini **bukan** dunia fantasi yang ramai, bukan kota futuristik, dan bukan landing page generik penuh ornamen dekoratif.

---

## 2. Hirarki Keputusan & Aturan Dokumentasi

Sebelum memulai tugas apa pun, AI Agent **wajib** membaca dokumentasi proyek yang relevan di folder `docs/` dengan urutan berikut:

1. `docs/PROJECT_OVERVIEW.md` — Konsep umum, tujuan, dan ringkasan section
2. `docs/VISUAL_DIRECTION.md` — Panduan visual, komposisi, atmosfer, dan batasan visual
3. `docs/DESIGN_SYSTEM.md` — Token desain, warna, tipografi, spacing, dan komponen UI
4. `docs/MONSTER_CHARACTER_GUIDE.md` — Spesifikasi karakter monster, anatomi, ekspresi, dan pose
5. `docs/ANIMATION_GUIDELINES.md` — Panduan motion, easing, koordinasi animasi, dan reduced motion
6. `docs/USER_EXPERIENCE.md` — Standar UX, alur pengguna, interaksi, aksesibilitas, dan SEO
7. `docs/TECHNICAL_ARCHITECTURE.md` — Arsitektur teknis, pembagian library, rendering, dan fallback
8. `docs/COMPONENT_STRUCTURE.md` — Standar modularisasi komponen, hierarki, dan konvensi file
9. `docs/PERFORMANCE_GUIDELINES.md` — Standar performa 3D, WebGL budget, optimasi, dan mobile
10. `docs/PROJECT_STRUCTURE.md` — Struktur direktori repository dan manajemen aset
11. `docs/DEVELOPMENT_ROADMAP.md` — Tahapan implementasi bertahap (Phase 01–08)

### Aturan Membaca:
- Jangan pernah mengasumsikan isi dokumentasi.
- Jangan melewati pembacaan dokumentasi meskipun tugas tampak sederhana.
- Jika terdapat perbedaan antara dokumentasi dan implementasi aktual, lakukan investigasi dan laporkan sebelum melakukan perubahan besar.

---

## 3. Workflow Pengembangan AI Agent

Setiap tugas pengembangan harus mengikuti 5 tahap disiplin berikut:

### Tahap 1 — Sebelum Memulai Tugas (Before Starting)
1. **Baca `AGENTS.md`** untuk memastikan kepatuhan terhadap aturan dan batasan.
2. **Baca dokumentasi relevan** di folder `docs/` sesuai domain tugas.
3. **Periksa struktur project aktual** pada repository (cek dependencies, konfigurasi build, dan file existing).
4. **Periksa komponen dan implementasi yang sudah tersedia** untuk menghindari duplikasi kode atau logic.
5. **Tentukan scope pekerjaan secara ketat**: identifikasi file yang akan dibuat/diubah dan potensi risiko teknis.

### Tahap 2 — Selama Implementasi (During Implementation)
1. **Ikuti visual direction**: pertahankan kesederhanaan, kebersihan layout, dan kehadiran monster.
2. **Ikuti design system**: gunakan token warna, tipografi, spacing, dan radius yang telah ditetapkan.
3. **Gunakan arsitektur teknis yang disetujui**:
   - **React (v19) + TypeScript**: UI, layout, section, navigasi, dan konten.
   - **Three.js + React Three Fiber + Drei**: 3D monster, scene, lighting, camera, dan model animations.
   - **GSAP + ScrollTrigger**: Scroll storytelling, transisi antar-section, dan timeline animasi.
   - **Motion (`motion`)**: Transisi UI, hover interaction, dan micro-interactions.
4. **Hindari duplikasi komponen atau utilitas**: gunakan kembali komponen yang sudah ada.
5. **Jangan menambahkan fitur di luar scope**: kerjakan hanya apa yang diminta.
6. **Jangan mengganti atau menambah dependency** tanpa alasan teknis kuat dan persetujuan.
7. **Prioritaskan performa dan responsive behavior**: perhitungkan beban GPU, mobile viewport, dan lazy loading.

### Tahap 3 — Setelah Implementasi (After Implementation)
1. **Jalankan linting** (`npm run lint`).
2. **Jalankan production build & typecheck** (`npm run build`).
3. **Lakukan verifikasi fungsional dan responsif** sesuai perubahan yang dilakukan.
4. **Periksa tampilan melalui browser** jika environment memungkinkan.
5. **Perbarui dokumentasi progress** jika ada perubahan penting pada status pekerjaan.
6. **Perbarui file dokumentasi di `docs/`** jika terdapat keputusan implementasi yang mempengaruhi acuan proyek.

---

## 4. Pengendalian Scope (Scope Control)

AI Agent **DILARANG KERAS**:
- Mengimplementasikan seluruh roadmap sekaligus dalam satu prompt.
- Mengubah arah visual (*visual direction*) atau mengganti palet warna tanpa persetujuan.
- Menghapus fungsionalitas existing tanpa pemeriksaan mendalam.
- Menambahkan dekorasi visual berlebihan (partikel acak, sparkle, floating objects tidak bermakna, gradient berlebihan, glassmorphism acak).
- Mengklaim verifikasi/testing berhasil jika perintah verifikasi belum benar-benar dijalankan dan lolos.
- Mengubah dependency atau konfigurasi build hanya demi membuat hasil audit terlihat berhasil semu.

---

## 5. Prinsip Utama Desain & Identitas Monster

1. **Minimalisme & Keterbacaan**:
   - Ruang kosong (*whitespace*) digunakan secara sengaja untuk memberikan ketenangan visual.
   - Konten portfolio (project, skill, pengalaman, kontak) adalah prioritas informasi. Monster adalah pendamping identitas, bukan penghalang teks.
2. **Kehadiran Monster di Seluruh Section**:
   - Karakter monster wajib hadir di 7 section utama:
     1. **Hero** (focal point penyambutan)
     2. **About** (pendamping narasi profil)
     3. **Skills** (pendamping interaktif kategori teknis)
     4. **Experience** (pendamping perjalanan karir)
     5. **Projects** (pendamping showcase hasil karya)
     6. **Contact** (penyambut hangat ajakan kolaborasi)
     7. **Footer** (penutup visual yang bersahabat dan konsisten)
3. **Konsistensi Karakter**:
   - Satu keluarga karakter dengan ciri: bulu turquoise/teal yang fluffy, siluet membulat dan ramah, mata besar ekspresif.
   - Variasi hanya pada pose, ekspresi wajah, orientasi, dan interaksi yang relevan dengan konteks section.
4. **Cinematic & Natural Motion**:
   - Animasi idle yang halus (breathing, blinking, subtle floating).
   - Scroll storytelling yang terkoordinasi dengan GSAP ScrollTrigger tanpa merusak navigasi alami browser.
   - Dukungan penuh terhadap `prefers-reduced-motion`.

---

## 6. Laporan Penyelesaian Tugas (Completion Report)

Setelah menyelesaikan setiap tugas, AI Agent wajib menyajikan laporan ringkas dengan format:

```markdown
### Implementation Summary
Penjelasan ringkas fitur atau modul yang diimplementasikan.

### Files Changed
Daftar file yang dibuat, diubah, atau dihapus beserta ringkasan fungsinya.

### Design & Architectural Decisions
Keputusan visual atau teknis penting yang diambil selama implementasi.

### Verification
Hasil eksekusi nyata dari:
- Lint check (`npm run lint`)
- Build & Type check (`npm run build`)
- Responsive & Visual inspection

### Remaining Issues
Catatan pekerjaan yang belum selesai atau keterbatasan yang ditemukan.

### Documentation Updates
Dokumen di `docs/` yang diperbarui sehubungan dengan perubahan ini.
```

---

## 7. Hirarki Pengambilan Keputusan

Jika terjadi konflik dalam implementasi, urutan prioritas adalah:
1. Permintaan eksplisit dari Pengguna (*User Request*).
2. Dokumentasi proyek yang telah disetujui di `docs/`.
3. Konsistensi visual dan identitas karakter monster.
4. Pengalaman pengguna (*User Experience*) dan keterbacaan konten.
5. Performa dan efisiensi teknis (termasuk perangkat mobile).
6. Kemudahan pemeliharaan (*Maintainability*).
7. Kenyamanan implementasi developer.
