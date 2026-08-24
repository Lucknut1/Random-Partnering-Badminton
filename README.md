# Mabarek

Dashboard operasional liga badminton untuk check-in peserta, auto-pair ganda, live scoring, dan klasemen putra serta putri.

Production: [mabarek.vercel.app](https://mabarek.vercel.app/)

## Menjalankan aplikasi

```bash
npm install
copy .env.example .env.local
npm run dev
```

Tanpa environment Supabase, aplikasi memakai localStorage. Untuk akses admin lokal, isi `VITE_LOCAL_ADMIN_PIN`. Mode PIN hanya untuk pengembangan.

## Supabase produksi

1. Gunakan project Supabase khusus Mabarek dengan ref `wximpqgnmjnwwmqdtdtd`.
2. Jalankan seluruh migration di `supabase/migrations` secara berurutan melalui SQL Editor atau Supabase CLI.
3. Buat user admin melalui Supabase Auth.
4. Promosikan user tersebut menjadi `super_admin` memakai contoh SQL di bagian bawah migration.
5. Deploy pengirim undangan dengan `supabase functions deploy invite-league-host`.
6. Pastikan Site URL dan Redirect URLs Supabase Auth memuat domain produksi dan URL lokal yang digunakan.
7. Isi `VITE_SUPABASE_URL` dan `VITE_SUPABASE_PUBLISHABLE_KEY` di Vercel.

RLS mengizinkan publik membaca klasemen. Super admin memiliki override penuh. Host hanya dapat menulis melalui RPC terkontrol untuk liga yang ditugaskan.

## Host liga

- Super admin mengirim undangan host dari panel operasional.
- Undangan berlaku selama 7 hari.
- Undangan diterima otomatis saat pengguna membuka email undangan atau login dengan email yang sama.
- Host hanya dapat mengubah informasi operasional liga, memverifikasi hasil, dan mengoreksi skor dengan alasan wajib.
- Hasil baru berstatus menunggu dan belum memengaruhi klasemen sampai diverifikasi.
- Hasil historis yang belum memiliki status verifikasi tetap dihitung untuk menjaga kompatibilitas data lama.
- Super admin dapat mencabut undangan atau akses host kapan saja.
- Semua penunjukan, pencabutan, verifikasi, koreksi, dan perubahan informasi host masuk ke `audit_logs`.

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
