# ShuttleRank

Dashboard operasional liga badminton untuk check-in peserta, auto-pair ganda, live scoring, dan klasemen putra serta putri.

Production: [ur-random-partnering.vercel.app](https://ur-random-partnering.vercel.app/)

## Menjalankan aplikasi

```bash
npm install
copy .env.example .env.local
npm run dev
```

Tanpa environment Supabase, aplikasi memakai localStorage. Untuk akses admin lokal, isi `VITE_LOCAL_ADMIN_PIN`. Mode PIN hanya untuk pengembangan.

## Supabase produksi

1. Gunakan project Mini ShuttleRank dengan ref `wximpqgnmjnwwmqdtdtd`.
2. Jalankan `supabase/migrations/001_initial.sql` melalui SQL Editor atau Supabase CLI.
3. Buat user admin melalui Supabase Auth.
4. Promosikan user tersebut menjadi `super_admin` memakai contoh SQL di bagian bawah migration.
5. Isi `VITE_SUPABASE_URL` dan `VITE_SUPABASE_PUBLISHABLE_KEY` di Vercel.

RLS mengizinkan publik membaca klasemen. Hanya akun `super_admin` yang dapat menulis snapshot aplikasi.

## Aturan inti

- Peserta hanya masuk klasemen setelah pernah check-in pada liga terkait.
- Menang memberi 3 poin. Kalah memberi 0 poin.
- Urutan klasemen memakai poin, menang, kalah paling sedikit, selisih skor, lalu skor masuk.
- Auto-pair mendahulukan pemain yang belum bermain, lalu MD dan WD. XD hanya dibuat jika diizinkan dan waktu cukup.
- Format skor mendukung BWF 21 dengan deuce sampai 30 dan Race 42.

## Verifikasi

```bash
npm run build
npm audit --omit=dev
```

## Deploy Vercel

Hubungkan repository ke Vercel. Build command menggunakan `npm run build` dan output directory `dist`.
