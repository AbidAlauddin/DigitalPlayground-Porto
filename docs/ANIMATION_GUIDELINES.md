# ANIMATION GUIDELINES

Dokumen ini menetapkan standar motion design, pembagian tanggung jawab library animasi, kurva easing, dan pedoman aksesibilitas untuk portfolio **The Digital Playground**.

Animasi adalah elemen narasi (*storytelling*) yang menghubungkan seluruh pengalaman menjelajah. Setiap gerakan harus terasa alami, memiliki bobot, dan bermakna tanpa mengorbankan performa maupun keterbacaan konten.

- Untuk ekspresi dan pose spesifik karakter monster, rujuk `MONSTER_CHARACTER_GUIDE.md`.
- Untuk arsitektur teknis dan integrasi lifecycle React, rujuk `TECHNICAL_ARCHITECTURE.md`.
- Untuk batasan performa dan budget animasi, rujuk `PERFORMANCE_GUIDELINES.md`.

---

## 1. Filosofi Gerakan (Motion Philosophy)

- **Subtle & Purposeful:** Setiap gerakan memiliki fungsi jelas—mengarahkan pandangan, memberi umpan balik interaksi, atau membangun transisi.
- **Natural & Organic:** Gerakan karakter monster memiliki perlambatan dan percepatan yang elastis dan hidup.
- **Cinematic Flow:** Perpindahan antarseksi terasa menyatu seperti pergerakan kamera sinematik, bukan pergeseran halaman yang patah.
- **Non-blocking:** Animasi tidak boleh menunda pengguna membaca informasi penting atau mengeklik tombol navigasi.
- **Accessible:** Menghormati preferensi pengguna yang sensitif terhadap gerakan berlebih.

> **Prinsip Utama:**
> *"Make the world feel alive, not constantly moving."*

---

## 2. Pembagian Tanggung Jawab Library Animasi

Untuk mencegah konflik render dan penurunan performa, tanggung jawab animasi dibagi secara tegas:

| Library | Ranah Tanggung Jawab | Contoh Penggunaan |
|---|---|---|
| **GSAP + ScrollTrigger** | Scroll storytelling, timeline sekuensial, transisi antarseksi, koordinasi posisi kamera 3D | Menggerakkan posisi monster saat scroll dari Hero ke About; timeline transisi antar-section |
| **Motion (`motion`)** | Interaksi komponen UI, transisi layout DOM, hover micro-interactions, entrance cards | Hover state tombol CTA, animasi munculnya kartu proyek, toggle menu navigasi mobile |
| **React Three Fiber / Three.js** | Skeletal animation clips karakter 3D, rigging mata, transformasi mesh, lighting scene | Animasi bernapas (*breathing*), kedipan mata (*blinking*), pose melambai (*waving*) |

### Aturan Koordinasi yang Ketat:
1. **Satu Properti, Satu Pengontrol:** Jangan pernah membiarkan GSAP dan Motion menganimasikan properti CSS yang sama (misal `transform` atau `opacity`) pada elemen DOM yang sama.
2. **Pembersihan Wajib (Cleanup):** Seluruh ScrollTrigger dan GSAP timeline wajib dibersihkan saat komponen React di-unmount menggunakan `gsap.context()` atau `ctx.revert()`.

---

## 3. Integrasi GSAP dengan React (Lifecycle & Cleanup)

Pada lingkungan React 18/19, inisialisasi animasi berbasis scroll harus dibungkus dengan pembersihan yang aman untuk mencegah *memory leaks* dan pemicu ganda (*duplicate triggers*).

### Pola Implementasi Standar:

```tsx
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function useSectionScroll(sectionRef: React.RefObject<HTMLElement>) {
  useEffect(() => {
    // Buat context GSAP terisolasi
    const ctx = gsap.context(() => {
      gsap.from(".fade-target", {
        opacity: 0,
        y: 30,
        duration: 0.8,
        ease: "power2.out",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 75%",
          toggleActions: "play none none reverse",
        },
      });
    }, sectionRef);

    // Cleanup wajib saat unmount
    return () => ctx.revert();
  }, [sectionRef]);
}
```

---

## 4. Kategori Animasi

### 4.1 Character Idle Animation (Animasi Karakter Tenang)
- **Breathing:** Skala vertikal tubuh membesar dan mengecil secara halus (siklus 3–4 detik).
- **Blinking:** Kelopak mata menutup cepat (120ms) dan membuka kembali pada interval acak 3–5 detik.
- **Subtle Floating:** Pergerakan naik-turun pada sumbu Y sebesar 10–15 piksel dengan kurva `sine.inOut` (siklus 2–3 detik).

### 4.2 UI Micro-Interactions (Motion)
- **Button Hover:** Perubahan skala subtil (`scale: 1.02`), translasi Y tipis (`-1px`), durasi 150–200ms.
- **Card Hover:** Pengangkatan kartu proyek (`y: -4px`) dengan bayangan yang sedikit melebar, durasi 200–250ms.
- **Badge Stagger:** Munculnya chip teknologi dengan jeda sekuensial (*stagger*) 0.05 detik per item.

### 4.3 Section Transitions (GSAP ScrollTrigger)
- Transisi halus saat pengguna menggulir halaman, menyelaraskan teks konten yang muncul perlahan (*fade-in slide-up*) dengan pergeseran posisi monster yang bersahabat.
- Hindari efek *scroll-jacking* ekstrem yang merampas kendali kecepatan scroll pengguna.

---

## 5. Standar Durasi & Kurva Easing (Timing & Easing)

| Jenis Interaksi | Durasi Rekomendasi | Kurva Easing | Catatan |
|---|---|---|---|
| **Micro-interaction (Button/Icon)** | 120ms – 200ms | `easeOut` / `power1.out` | Responsif dan seketika |
| **Card / Dropdown Hover** | 200ms – 300ms | `power2.out` | Halus dan stabil |
| **Entrance of UI Content** | 400ms – 600ms | `power2.out` | Menenangkan, tidak mengganggu baca |
| **Character Pose Transition** | 600ms – 900ms | `power2.inOut` | Alami, berbobot, tidak tersentak |
| **Section Scroll Transition** | 700ms – 1000ms | `power1.inOut` / `sine.inOut` | Terikat dengan laju scroll pengguna |
| **Persistent Scroll Bounce** | 1500ms (Loop) | `easeInOut` | Gerakan melayang subtil 4-5px pada circular icon |

---

## 6. Dukungan Reduced Motion (Aksesibilitas)

Pengguna yang memiliki sensitivitas vestibular atau mengaktifkan pengaturan sistem `prefers-reduced-motion: reduce` harus diakomodasi sepenuhnya:

### Saat Reduced Motion Aktif:
1. Matikan pergerakan kamera 3D ekstrem dan parallax scroll.
2. Hentikan animasi floating terus-menerus; karakter ditampilkan dalam pose statis yang ramah.
3. Gantikan transisi pergeseran (*slide*) dengan *instant cut* atau *fade-in* sangat cepat (<= 150ms).
4. Konten dan navigasi tetap 100% dapat diakses tanpa hambatan visual.

```ts
import { useEffect, useState } from "react";

export function useReducedMotion() {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setMatches(mediaQuery.matches);

    const listener = (event: MediaQueryListEvent) => setMatches(event.matches);
    mediaQuery.addEventListener("change", listener);
    return () => mediaQuery.removeEventListener("change", listener);
  }, []);

  return matches;
}
```

---

## 7. Checklist Verifikasi Animasi

Sebelum menganggap fitur animasi selesai:
- [ ] Gerakan terasa alami, lembut, dan tidak mengaburkan teks.
- [ ] Tidak ada konflik antara GSAP dan Motion pada elemen yang sama.
- [ ] Seluruh ScrollTrigger memiliki `ctx.revert()` saat unmount.
- [ ] Karakter beranimasi idle dengan tenang tanpa gerakan gelisah.
- [ ] Scrolling terasa mulus pada kecepatan 60 FPS di desktop.
- [ ] Preferensi `prefers-reduced-motion` berfungsi dengan benar.
- [ ] Animasi pada layar mobile disederhanakan agar hemat daya dan responsif.
