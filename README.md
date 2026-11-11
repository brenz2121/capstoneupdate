# ToiletCare — Panduan Instalasi

Panduan ini menjelaskan pemasangan ToiletCare dari awal pada komputer Windows, mulai dari perangkat pendukung, database, hingga aplikasi dapat digunakan untuk daftar dan masuk.

Anda dapat menggunakan **MySQL Server mandiri** atau **database dari XAMPP**. Pilih salah satu; keduanya tidak perlu dipasang bersamaan. Contoh lokasi proyek dalam panduan ini adalah `C:\ToiletCare`. Sesuaikan lokasi tersebut jika folder aplikasi Anda berbeda.

## 1. Siapkan perangkat dan folder aplikasi

### Pasang Node.js

1. Buka [halaman unduhan resmi Node.js](https://nodejs.org/en/download).
2. Pilih Node.js **24 LTS** untuk Windows dalam format installer `.msi`. Aplikasi telah diuji dengan Node.js 24.17.0.
3. Jalankan installer dan sertakan npm serta opsi penambahan Node.js ke PATH.
4. Setelah instalasi selesai, buka jendela PowerShell baru, lalu periksa:

```powershell
node --version
npm.cmd --version
```

Kedua perintah harus menampilkan nomor versi. Perintah `npm.cmd` digunakan dalam panduan ini agar dapat dijalankan dari PowerShell Windows tanpa bergantung pada izin eksekusi file `npm.ps1`.

### Siapkan file aplikasi

1. Unduh arsip ZIP melalui **Code → Download ZIP** dari [repository ToiletCare](https://github.com/dirgasatyadev/ToiletCare).
2. Ekstrak dan letakkan folder aplikasi, misalnya di `C:\ToiletCare`.
3. Pastikan folder tersebut langsung berisi `package.json`, `package-lock.json`, `server.js`, `.env.example`, serta folder `client` dan `database`. Jangan memilih folder pembungkus ZIP yang masih berisi satu subfolder proyek.
4. Buka PowerShell dan pasang dependensi aplikasi:

```powershell
cd C:\ToiletCare
npm.cmd ci
npm.cmd --prefix client ci
```

Tunggu sampai masing-masing perintah selesai tanpa error. Instalasi dependensi memerlukan internet dan cukup dilakukan saat pemasangan awal atau setelah pembaruan dependensi aplikasi.

## 2. Pilih cara instalasi database

| Pilihan                 | Digunakan jika                                                          | Pengelolaan database                    |
| ----------------------- | ----------------------------------------------------------------------- | --------------------------------------- |
| A. MySQL Server mandiri | Anda ingin memasang MySQL tanpa XAMPP                                   | MySQL Configurator dan Windows Services |
| B. XAMPP                | Anda sudah menggunakan XAMPP atau memilih pengelolaan lewat panel XAMPP | XAMPP Control Panel dan phpMyAdmin      |

Keduanya menggunakan database bernama `vr_toilet_training`. Port contoh adalah `3306`. Jika port tersebut sudah digunakan database lain, gunakan instalasi yang sudah ada atau atur port berbeda, lalu sesuaikan `DB_PORT` pada langkah 5.

### Pilihan A — Instal MySQL Server mandiri

1. Unduh **MySQL Community Server 8.4 LTS** untuk Windows melalui [situs resmi MySQL](https://dev.mysql.com/downloads/mysql/8.4.html). Pilih **MSI Installer**.
2. Pasang prasyarat Microsoft Visual C++ Redistributable yang diminta installer, jika belum tersedia. Rujuk [persyaratan instalasi MySQL di Windows](https://dev.mysql.com/doc/refman/8.4/en/windows-installation.html).
3. Jalankan installer MySQL sampai selesai, lalu jalankan **MySQL Configurator** saat ditawarkan.
4. Pada konfigurasi server, pilih **Development** untuk penggunaan lokal dan aktifkan **TCP/IP**. Gunakan port `3306` jika tersedia.
5. Tentukan dan simpan kata sandi administrator database **root**. Kata sandi ini digunakan saat menyiapkan database, bukan sebagai kata sandi akun web ToiletCare.
6. Aktifkan MySQL sebagai **Windows Service**, misalnya bernama `MySQL84`, serta opsi menjalankannya saat Windows menyala. Terapkan konfigurasi sampai berhasil.
7. Buka **Services** dari menu Start Windows, cari nama service yang dipilih, dan pastikan statusnya **Running**.

Nama layar dapat berbeda mengikuti versi installer. Penjelasan opsi tersedia di [panduan MySQL Configurator](https://dev.mysql.com/doc/refman/8.4/en/mysql-configurator-workflow-server.html).

#### Impor skema melalui MySQL Command-Line Client

Jalankan perintah berikut dari PowerShell. Sesuaikan lokasi executable jika MySQL dipasang di lokasi lain:

```powershell
& "C:\Program Files\MySQL\MySQL Server 8.4\bin\mysql.exe" --host=127.0.0.1 --port=3306 --user=root -p
```

Masukkan kata sandi root ketika diminta. Di dalam prompt `mysql>`, jalankan:

```sql
SOURCE C:/ToiletCare/database/schema.sql;
USE vr_toilet_training;
SHOW TABLES;
```

Gunakan tanda `/` pada lokasi file SQL di perintah `SOURCE`. Tabel `users` dan `children` harus muncul. Perintah `SOURCE` menjalankan isi file SQL dari MySQL client; lihat [panduan impor skrip SQL MySQL](https://dev.mysql.com/doc/refman/8.4/en/mysql-batch-commands.html).

Biarkan prompt MySQL terbuka untuk langkah 3. Lewati pilihan B dan lanjutkan ke langkah 3.

### Pilihan B — Instal database melalui XAMPP

1. Unduh installer Windows dari [situs resmi XAMPP](https://www.apachefriends.org/download.html).
2. Jalankan installer. Sertakan komponen **MySQL**, **Apache**, **PHP**, dan **phpMyAdmin**. Contoh lokasi instalasi: `C:\xampp`.
3. Buka **XAMPP Control Panel**.
4. Klik **Start** pada baris **MySQL**, lalu pastikan statusnya berjalan. Catat port yang ditampilkan, biasanya `3306`.
5. Klik **Start** pada baris **Apache** untuk membuka phpMyAdmin.
6. Buka [phpMyAdmin lokal](http://localhost/phpmyadmin/). Jika Apache dikonfigurasi memakai port lain, sesuaikan alamatnya, misalnya `http://localhost:8080/phpmyadmin/`.

XAMPP menyediakan **MariaDB** walaupun label panelnya tertulis **MySQL**. Detail paket dan panel tersedia pada [FAQ resmi XAMPP Windows](https://www.apachefriends.org/faq_windows.html).

#### Impor skema melalui phpMyAdmin

1. Pada phpMyAdmin, buka halaman utama/server melalui ikon beranda.
2. Pilih tab **Import / Impor**.
3. Pilih file `C:\ToiletCare\database\schema.sql`.
4. Gunakan format **SQL**, lalu klik **Import / Go / Kirim**.
5. Pastikan proses berhasil. Pilih database `vr_toilet_training` pada panel kiri dan pastikan tabel `users` serta `children` tersedia.

File skema sudah berisi perintah pembuatan database; Anda tidak perlu membuat tabel satu per satu. Petunjuk tab impor tersedia pada [dokumentasi phpMyAdmin](https://docs.phpmyadmin.net/en/latest/import_export.html#import).

Apache digunakan untuk phpMyAdmin. Aplikasi ToiletCare sendiri dijalankan melalui Node.js, sehingga folder proyek tidak perlu dipindahkan ke `htdocs`.

## 3. Buat akun database untuk aplikasi

Akun database adalah akun yang digunakan aplikasi untuk mengakses MySQL/MariaDB. Akun ini berbeda dari akun orang tua yang nanti dibuat melalui halaman **Daftar**.

- **MySQL mandiri:** gunakan prompt MySQL yang masih terbuka dari pilihan A.
- **XAMPP:** gunakan tab **SQL** di phpMyAdmin dengan akun administrator yang memiliki izin membuat pengguna. Masuk menggunakan kredensial administrator instalasi XAMPP Anda jika diminta.

Ganti `GANTI_DENGAN_SANDI_DATABASE_ANDA` dengan kata sandi database yang Anda tentukan, lalu jalankan:

```sql
CREATE USER 'toiletcare'@'127.0.0.1'
  IDENTIFIED BY 'GANTI_DENGAN_SANDI_DATABASE_ANDA';

GRANT SELECT, INSERT
  ON vr_toilet_training.users
  TO 'toiletcare'@'127.0.0.1';

GRANT SELECT
  ON vr_toilet_training.children
  TO 'toiletcare'@'127.0.0.1';

SHOW GRANTS FOR 'toiletcare'@'127.0.0.1';
```

Simpan nama akun `toiletcare` dan kata sandinya untuk langkah 5. Jika akun tersebut sudah ada, gunakan kredensial yang berlaku dan pastikan izinnya sesuai; jangan membuat ulang atau menimpa akun yang dipakai aplikasi lain. Penjelasan perintah tersedia pada [dokumentasi pembuatan akun dan izin MySQL](https://dev.mysql.com/doc/refman/8.4/en/creating-accounts.html).

Untuk pilihan A, ketik `EXIT;` setelah selesai agar kembali ke PowerShell.

## 4. Pastikan database siap

Sebelum melanjutkan, pastikan:

- Service MySQL atau modul MySQL pada XAMPP berjalan.
- Database `vr_toilet_training` sudah tersedia.
- Tabel `users` dan `children` sudah tersedia.
- Akun database `toiletcare` sudah memiliki izin pada langkah 3.
- Anda mengetahui port database dan kata sandi akun `toiletcare`.

Impor skema tidak membuat akun web maupun akun demo. Akun web dibuat melalui halaman **Daftar** setelah aplikasi berjalan.

## 5. Isi konfigurasi aplikasi

Buka PowerShell di folder proyek. Salin contoh konfigurasi jika file `.env` belum tersedia, lalu buka file tersebut:

```powershell
cd C:\ToiletCare
if (-not (Test-Path -LiteralPath .env)) { Copy-Item -LiteralPath .env.example -Destination .env }
notepad .env
```

Isi dan simpan dengan format berikut:

```dotenv
DB_HOST=127.0.0.1
DB_USER=toiletcare
DB_PASSWORD="GANTI_DENGAN_SANDI_DATABASE_ANDA"
DB_NAME=vr_toilet_training
DB_PORT=3306
HOST=127.0.0.1
PORT=5000
JWT_SECRET=GANTI_DENGAN_SECRET_ACAK
```

| Pengaturan        | Nilai yang perlu diisi                                                             |
| ----------------- | ---------------------------------------------------------------------------------- |
| `DB_HOST`         | Gunakan `127.0.0.1` untuk database pada komputer yang sama.                        |
| `DB_USER`         | Akun aplikasi dari langkah 3, yaitu `toiletcare`.                                  |
| `DB_PASSWORD`     | Kata sandi akun `toiletcare`, bukan kata sandi root atau akun web.                 |
| `DB_NAME`         | `vr_toilet_training`.                                                              |
| `DB_PORT`         | Port database yang berjalan. Jika menggunakan `3307`, isi `3307`.                  |
| `HOST` dan `PORT` | Pertahankan `127.0.0.1` dan `5000` agar sesuai dengan konfigurasi frontend bawaan. |
| `JWT_SECRET`      | Secret acak untuk aplikasi; buat dengan perintah di bawah.                         |

Untuk membuat `JWT_SECRET`, jalankan di PowerShell:

```powershell
node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"
```

Salin hasilnya sebagai nilai `JWT_SECRET`, menggantikan teks contoh. File harus bernama tepat `.env`, bukan `.env.txt`. Simpan konfigurasi ini di komputer tempat aplikasi dijalankan; jangan sertakan kata sandi dan secret asli ke dalam repository atau dokumen yang dibagikan.

## 6. Jalankan aplikasi

Pastikan database tetap berjalan. Buka **dua jendela PowerShell**.

### Jendela pertama — backend/API

```powershell
cd C:\ToiletCare
npm.cmd start
```

Tunggu pesan bahwa API berjalan pada port `5000` dan database MySQL berhasil terhubung. Jendela ini harus tetap terbuka selama aplikasi dipakai.

Untuk memeriksa API, buka [http://127.0.0.1:5000/](http://127.0.0.1:5000/). Respons yang diharapkan:

```json
{ "message": "API Toilet Care berjalan." }
```

### Jendela kedua — tampilan web

```powershell
cd C:\ToiletCare
npm.cmd --prefix client run dev
```

Buka [http://127.0.0.1:5173/](http://127.0.0.1:5173/). Anda akan diarahkan ke halaman masuk. Jendela frontend juga harus tetap terbuka.

Untuk penggunaan sehari-hari, cukup hidupkan database dan ulangi kedua perintah di atas. Dependensi dan skema database tidak perlu dipasang ulang setiap kali aplikasi dibuka.

## 7. Buat akun dan uji masuk

1. Buka [halaman daftar](http://127.0.0.1:5173/Toiletcare/signup.html), atau klik **Daftar sekarang** pada halaman masuk.
2. Isi nama lengkap, email, kata sandi minimal 6 karakter, dan konfirmasi kata sandi yang sama.
3. Klik **Buat akun** dan tunggu pesan **Akun berhasil dibuat**.
4. Klik **Masuk ke akun**, lalu masukkan email dan kata sandi yang baru didaftarkan.
5. Pastikan dashboard terbuka dan nama akun Anda tampil.
6. Klik **Keluar** untuk mengakhiri sesi.

Jika email sudah terdaftar, masuk menggunakan akun tersebut atau gunakan email lain untuk pendaftaran baru.

## 8. Menghentikan aplikasi

Tekan **Ctrl+C** pada masing-masing jendela PowerShell backend dan frontend. Database MySQL mandiri dapat tetap berjalan sebagai Windows Service. Pada XAMPP, modul database dapat dikelola melalui tombol **Start/Stop** di Control Panel.

## 9. Mengatasi kendala instalasi

| Kendala                                          | Langkah pemeriksaan                                                                                                                                                                |
| ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `node` atau `npm.cmd` tidak dikenali             | Pastikan Node.js terpasang beserta npm dan PATH. Tutup terminal lalu buka PowerShell baru.                                                                                         |
| `mysql.exe` tidak ditemukan                      | Sesuaikan lokasi executable dengan lokasi MySQL yang dipasang. XAMPP menggunakan phpMyAdmin sesuai pilihan B, sehingga tidak memerlukan perintah lokasi MySQL mandiri.             |
| MySQL gagal menyala atau port `3306` terpakai    | Periksa apakah MySQL mandiri, XAMPP, atau database lain sudah memakai port tersebut. Jalankan satu server pada port yang dipilih. Jika port diubah, samakan `DB_PORT` pada `.env`. |
| `ECONNREFUSED` / database gagal terhubung        | Pastikan database berjalan dan `DB_HOST` serta `DB_PORT` benar.                                                                                                                    |
| `Access denied for user`                         | Cocokkan `DB_USER`, `DB_PASSWORD`, serta host akun `127.0.0.1` dengan langkah 3.                                                                                                   |
| `Unknown database` atau tabel tidak ditemukan    | Impor `database/schema.sql` pada server database yang benar. Pastikan nama database sesuai `DB_NAME`.                                                                              |
| phpMyAdmin tidak terbuka                         | Pastikan Apache dan MySQL pada XAMPP berjalan. Cocokkan port Apache dengan alamat phpMyAdmin yang dibuka.                                                                          |
| Port `5000` atau `5173` sudah digunakan          | Periksa jendela aplikasi yang sudah berjalan dan hentikan proses ToiletCare sebelumnya dengan Ctrl+C sebelum menjalankan ulang.                                                    |
| Web terbuka tetapi daftar/masuk gagal tersambung | Pastikan backend pada jendela pertama masih berjalan dan database terhubung.                                                                                                       |
| Perubahan `.env` belum terbaca                   | Hentikan backend dengan Ctrl+C, lalu jalankan kembali `npm.cmd start`.                                                                                                             |

Jika kendala berlanjut, catat pesan error dari terminal dan periksa kembali langkah konfigurasi yang berkaitan. Jangan membagikan kata sandi database, `JWT_SECRET`, atau isi `.env` lengkap.

## 10. Batas fitur saat ini

Register, login, pemeriksaan sesi, dan logout sudah terhubung. Profil anak/orang tua, progress, riwayat dan hasil latihan, notifikasi, serta laporan harian masih menggunakan data contoh. Penyimpanan profil belum tersedia. Video pembelajaran memerlukan internet dan belum berupa simulasi VR interaktif.

## Konfigurasi alternatif dan pemeriksaan

### Script MySQL khusus proyek

Perintah `scripts/install-mysql.ps1`, `npm run db:setup`, `npm run local:start`, dan `npm run local:stop` disediakan untuk **instance MySQL portabel khusus proyek** di `.local`, dengan PowerShell 7. Perintah tersebut digunakan hanya untuk pilihan instalasi portabel, terpisah dari langkah MySQL mandiri atau XAMPP di atas.

Script portabel membuat konfigurasi serta akun demo sendiri; `db:setup` juga menulis ulang `.env` untuk instance tersebut. Untuk MySQL mandiri/XAMPP, gunakan konfigurasi manual dan perintah pada langkah 3–6, sehingga kredensial database tetap sesuai.

### Build dan pemeriksaan

```powershell
npm.cmd --prefix client run lint
npm.cmd --prefix client run build
```

Setelah build, Express dapat menyajikan tampilan melalui [http://127.0.0.1:5000/Toiletcare/login.html](http://127.0.0.1:5000/Toiletcare/login.html) dengan backend tetap berjalan. Alamat root API pada port `5000` tetap mengembalikan JSON.

`npm test` saat ini memerlukan instance MySQL portabel khusus proyek, file `.local/mysql-admin.json`, dan port `3306`. Pengujian tersebut membuat serta membersihkan akun uji. Untuk instalasi menggunakan MySQL mandiri atau XAMPP, lakukan pemeriksaan daftar/masuk pada langkah 7; file kredensial instance portabel tidak diperlukan.

Panduan jalur XAMPP disusun berdasarkan dokumentasi resminya. Instalasi dan pengujian aplikasi secara langsung telah dilakukan pada MySQL 8.4.13; pengujian runtime pada MariaDB/XAMPP belum dilakukan.
