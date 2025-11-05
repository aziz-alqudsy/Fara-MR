# GitHub to Discord & Telegram PR Bot

Bot Discord & Telegram yang otomatis memposting notifikasi setiap ada Pull Request baru yang dibuat di GitHub organization.

## Fitur

- ✅ Notifikasi otomatis ketika PR baru dibuat
- 📊 Informasi lengkap PR (judul, deskripsi, author, branch, status)
- 🎨 Embed Discord yang menarik & format Telegram yang rapi
- 🔗 Link langsung ke PR dan repository
- 🔔 Mention role untuk notifikasi tim (Discord)
- 🧵 Support Telegram Topics/Forum - posting ke topic tertentu dalam grup
- 🔄 Dual bot support - bisa aktifkan Discord saja, Telegram saja, atau keduanya

## Prerequisites

- Node.js (v16 atau lebih tinggi)
- Bot Discord dengan token (opsional - jika mau pakai Discord)
- Bot Telegram dengan token (opsional - jika mau pakai Telegram)
- GitHub organization atau repository dengan akses admin

## Setup

### 1. Clone Repository

```bash
git clone <repository-url>
cd <repository-folder>
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Bot Discord (Opsional)

**Jika Anda ingin menggunakan Discord:**

1. Kunjungi [Discord Developer Portal](https://discord.com/developers/applications)
2. Klik "New Application" dan beri nama bot Anda
3. Pergi ke tab "Bot" dan klik "Add Bot"
4. Copy **Bot Token** (jangan bagikan ke siapapun!)
5. Aktifkan "MESSAGE CONTENT INTENT" di bagian Privileged Gateway Intents
6. Pergi ke tab "OAuth2" → "URL Generator"
7. Pilih scope: `bot`
8. Pilih permissions: `Send Messages`, `Embed Links`, `Read Message History`, `Mention Everyone` (untuk mention role)
9. Copy URL yang dihasilkan dan buka di browser untuk invite bot ke server Anda

### 4. Dapatkan Channel ID dan Role ID Discord (Opsional)

**Jika Anda menggunakan Discord:**

1. Aktifkan Developer Mode di Discord (Settings → Advanced → Developer Mode)
2. Klik kanan pada channel tempat Anda ingin menerima notifikasi
3. Klik "Copy Channel ID"
4. (Opsional) Untuk mention role saat ada PR baru:
   - Klik kanan pada role yang ingin di-mention (contoh: @fara-techlab)
   - Klik "Copy Role ID"

### 5. Setup Bot Telegram (Opsional)

**Jika Anda ingin menggunakan Telegram:**

#### 5.1. Buat Bot Telegram

1. Buka Telegram dan cari `@BotFather`
2. Kirim command `/newbot`
3. Ikuti instruksi untuk memberi nama bot
4. Copy **Bot Token** yang diberikan (format: `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`)

#### 5.2. Dapatkan Chat ID

Ada **3 cara** untuk mendapatkan Chat ID:

**Cara 1: Menggunakan Telegram Web API (Paling Mudah)**

1. Tambahkan bot Anda ke grup Telegram
2. Kirim **pesan apa saja** di grup (mention bot atau kirim pesan biasa)
3. Buka browser dan kunjungi URL ini (ganti `YOUR_BOT_TOKEN` dengan token bot Anda):
   ```
   https://api.telegram.org/botYOUR_BOT_TOKEN/getUpdates
   ```
   Contoh: `https://api.telegram.org/bot123456789:ABCdefGHI/getUpdates`

4. Cari bagian `"chat":{"id":-1001234567890,...}` di JSON response
5. Copy angka Chat ID tersebut (termasuk tanda minus `-`)

**Cara 2: Menggunakan @userinfobot**

1. Tambahkan bot `@userinfobot` ke grup Anda
2. Bot akan otomatis memberikan informasi grup termasuk Chat ID
3. Copy Chat ID yang diberikan
4. Setelah dapat Chat ID, bisa remove `@userinfobot` dari grup

**Cara 3: Jalankan bot dulu, lalu gunakan command `/getchatid`**

1. Konfigurasi `.env` dengan bot token (Chat ID bisa kosong dulu):
   ```env
   TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
   TELEGRAM_CHAT_ID=  # Kosongkan dulu
   ```
2. Jalankan bot: `npm start`
3. Kirim `/getchatid` di grup
4. Bot akan reply dengan Chat ID
5. Stop bot (Ctrl+C), masukkan Chat ID ke `.env`, lalu jalankan lagi

#### 5.3. Permission Bot di Grup (PENTING!)

**Bot TIDAK perlu jadi admin** untuk mengirim pesan biasa!

Namun, **jika grup menggunakan Topics/Forum**, bot harus jadi admin dengan permission:
- ✅ **Manage Topics** (untuk posting ke topic tertentu)

**Cara jadikan bot admin (untuk Topics):**
1. Klik nama grup → Edit → Administrators → Add Administrator
2. Pilih bot Anda
3. Centang **"Manage Topics"**
4. Save

**Jika tidak pakai Topics:** Bot bisa langsung mengirim pesan tanpa perlu jadi admin.

#### 5.4. Dapatkan Thread ID untuk Topics (Opsional)

**Jika grup Anda menggunakan Topics/Forum:**

1. Pastikan grup adalah "Supergroup" dengan Topics enabled
2. Pastikan bot sudah running (`npm start`)
3. Pastikan bot sudah jadi admin dengan permission "Manage Topics"
4. Buka topic/thread tertentu tempat Anda ingin bot posting
5. Kirim command `/getchatid` **di dalam topic tersebut**
6. Bot akan reply dengan **Thread ID**
7. Simpan Thread ID ini untuk konfigurasi `.env`

**Catatan:**
- Jika tidak ada Thread ID atau dikosongkan, bot akan posting ke general chat grup
- Thread ID hanya berlaku jika bot sudah jadi admin dengan permission "Manage Topics"

#### 5.5. Test Bot

Setelah semua dikonfigurasi:
1. Pastikan bot sudah running (`npm start`)
2. Kirim command `/test` di grup (atau di topic)
3. Bot akan mengirim pesan test untuk memastikan koneksi berhasil

### 6. Konfigurasi Environment Variables

1. Copy file `.env.example` menjadi `.env`:
```bash
cp .env.example .env
```

2. Edit file `.env` dan isi dengan kredensial Anda:

**Untuk Discord saja:**
```env
# Discord
DISCORD_BOT_TOKEN=your_discord_bot_token_here
DISCORD_CHANNEL_ID=your_channel_id_here
# DISCORD_ROLE_ID=your_role_id_here  # Opsional

# Telegram (kosongkan atau comment out)
# TELEGRAM_BOT_TOKEN=
# TELEGRAM_CHAT_ID=

PORT=3000
```

**Untuk Telegram saja:**
```env
# Discord (kosongkan atau comment out)
# DISCORD_BOT_TOKEN=
# DISCORD_CHANNEL_ID=

# Telegram
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
TELEGRAM_CHAT_ID=-1001234567890
# TELEGRAM_THREAD_ID=12345  # Opsional, untuk posting ke topic

PORT=3000
```

**Untuk Discord DAN Telegram (keduanya aktif):**
```env
# Discord
DISCORD_BOT_TOKEN=your_discord_bot_token_here
DISCORD_CHANNEL_ID=your_channel_id_here
# DISCORD_ROLE_ID=your_role_id_here  # Opsional

# Telegram
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
TELEGRAM_CHAT_ID=-1001234567890
# TELEGRAM_THREAD_ID=12345  # Opsional, untuk posting ke topic

PORT=3000
```

**Catatan Konfigurasi:**
- Bot akan otomatis detect platform mana yang dikonfigurasi
- Jika hanya Discord dikonfigurasi → notifikasi hanya ke Discord
- Jika hanya Telegram dikonfigurasi → notifikasi hanya ke Telegram
- Jika keduanya dikonfigurasi → notifikasi ke Discord DAN Telegram
- `TELEGRAM_THREAD_ID` opsional - jika diisi, bot posting ke topic tertentu; jika kosong, posting ke general chat

### 7. Jalankan Bot

```bash
npm start
```

Atau untuk development dengan auto-reload:
```bash
npm run dev
```

Bot akan berjalan di `http://localhost:3000`

Anda akan melihat log seperti ini:
```
✅ Bot Discord siap! Logged in as YourBot#1234
✅ Channel Discord terhubung: pr-notifications
✅ Bot Telegram siap! Logged in as @YourTelegramBot
✅ Telegram chat terhubung: Your Group Name
🚀 Webhook server berjalan di port 3000
📊 Status bot:
   - Discord: ✅ Enabled
   - Telegram: ✅ Enabled
```

### 8. Setup GitHub Webhook

1. Pergi ke GitHub organization atau repository Anda
2. Klik **Settings** → **Webhooks** → **Add webhook**
3. Isi form webhook:
   - **Payload URL**: `http://your-server-url:3000/webhook/github`
     - Untuk testing lokal, gunakan [ngrok](https://ngrok.com/) untuk expose localhost:
       ```bash
       ngrok http 3000
       ```
     - Gunakan URL yang diberikan ngrok (contoh: `https://xxxx-xx-xx-xx-xx.ngrok.io/webhook/github`)
   - **Content type**: `application/json`
   - **Which events would you like to trigger this webhook?**: Pilih "Let me select individual events" → centang **Pull requests**
   - **Active**: ✅ Centang
4. Klik **Add webhook**

## Testing

1. **Test koneksi bot** (untuk Telegram)
   - Kirim `/test` di grup/topic Telegram
   - Bot akan reply untuk memastikan koneksi berhasil

2. **Test webhook GitHub**
   - Pastikan bot sudah berjalan dan terkoneksi
   - Buat PR baru di repository GitHub yang sudah di-setup webhook-nya
   - Notifikasi akan muncul di platform yang dikonfigurasi (Discord/Telegram/Keduanya)

3. **Cek health endpoint**
   - Buka browser ke `http://localhost:3000/health`
   - Anda akan melihat status bot dan uptime

## Telegram Bot Commands

Bot Telegram memiliki beberapa command helper:

- `/getchatid` - Mendapatkan Chat ID dan Thread ID (jika di dalam topic)
- `/test` - Mengirim test notification untuk memastikan bot bekerja

## Contoh Notifikasi

### Discord

Ketika ada PR baru dibuat, bot akan mengirim pesan embed seperti ini di Discord channel:

```
📝 Pull Request Baru Dibuat!

Judul: Add user authentication feature
Author: johndoe
Status: open

Deskripsi:
This PR adds JWT-based authentication system with login and registration endpoints.

Branch: feature/auth → main
Repository: my-organization/my-repo

🔗 Lihat PR: https://github.com/my-organization/my-repo/pull/123
🔗 Repository: https://github.com/my-organization/my-repo
```

Pesan akan ditampilkan dalam format **Discord Embed** dengan:
- Warna biru untuk PR baru
- Icon 🔔 di judul
- Informasi lengkap PR (judul, author, status, deskripsi, branch)
- Link clickable ke PR dan repository
- Timestamp kapan notifikasi dikirim

### Telegram

Ketika ada PR baru dibuat, bot akan mengirim pesan seperti ini di Telegram grup/topic:

```
🔔 Pull Request Baru

Add user authentication feature

👤 Author: johndoe
📦 Repository: my-organization/my-repo
🌿 Branch: feature/auth → main
📊 Status: ✅ Ready for Review

📝 Deskripsi:
This PR adds JWT-based authentication system with login and registration endpoints.

🔗 Lihat Pull Request
```

Pesan akan ditampilkan dengan:
- Format Markdown yang rapi
- Link clickable ke PR, repository, dan profile author
- Jika di grup dengan Topics: posting otomatis ke topic yang dikonfigurasi
- Informasi lengkap dan mudah dibaca

## Struktur Project

```
.
├── index.js           # File utama aplikasi
├── package.json       # Dependencies dan scripts
├── .env              # Environment variables (jangan commit!)
├── .env.example      # Template environment variables
├── .gitignore        # File yang diabaikan git
└── README.md         # Dokumentasi
```

## Troubleshooting

### Discord

**Bot tidak terkoneksi ke Discord**
- Pastikan `DISCORD_BOT_TOKEN` benar
- Pastikan bot sudah di-invite ke server dengan permissions yang cukup

**Notifikasi Discord tidak muncul**
- Pastikan `DISCORD_CHANNEL_ID` benar
- Pastikan bot punya permission untuk mengirim pesan di channel tersebut
- Cek logs server untuk error

**Role tidak ter-mention**
- Pastikan `DISCORD_ROLE_ID` sudah diisi dengan benar di file `.env`
- Pastikan bot memiliki permission `Mention Everyone` saat invite
- Pastikan role yang ingin di-mention memiliki setting "Allow anyone to @mention this role" aktif di Discord Server Settings → Roles

### Telegram

**Bot tidak terkoneksi ke Telegram**
- Pastikan `TELEGRAM_BOT_TOKEN` benar (format: `123456789:ABCdef...`)
- Pastikan bot tidak di-delete dari @BotFather
- Cek logs untuk error spesifik

**Notifikasi Telegram tidak muncul**
- Pastikan `TELEGRAM_CHAT_ID` benar (format: `-1001234567890` untuk grup)
- Pastikan bot sudah ditambahkan ke grup/channel
- Bot TIDAK perlu jadi admin untuk mengirim pesan biasa (kecuali untuk Topics)
- Cek logs server untuk error

**Bot tidak bisa posting ke Topic**
- Pastikan grup menggunakan "Supergroup" dengan Topics enabled
- Pastikan `TELEGRAM_THREAD_ID` benar (kirim `/getchatid` di topic untuk cek)
- Pastikan bot **sudah jadi admin** dengan permission **"Manage Topics"**
- Jika masih error, coba kosongkan `TELEGRAM_THREAD_ID` untuk posting ke general chat
- Topics/Forum memerlukan bot sebagai admin, tidak bisa posting sebagai member biasa

**Command `/getchatid` atau `/test` tidak berfungsi**
- **PENTING:** Bot harus sudah running (`npm start` atau `npm run dev`) sebelum command bisa digunakan
- Tunggu beberapa detik setelah start bot untuk polling siap (lihat log "Bot Telegram siap")
- Bot bisa menerima command sebagai member biasa, tidak perlu jadi admin
- Jika tetap tidak berfungsi, gunakan cara alternatif untuk dapat Chat ID (lihat bagian 5.2 di Setup)

**Error "ETELEGRAM: 400 Bad Request: chat not found"**
- Chat ID salah atau bot belum ditambahkan ke grup
- Pastikan bot sudah ada di grup sebelum menjalankan
- Gunakan Web API untuk mendapatkan Chat ID yang benar: `https://api.telegram.org/botYOUR_TOKEN/getUpdates`

### Webhook GitHub

**Webhook GitHub tidak terkirim**
- Pastikan URL webhook bisa diakses dari internet (gunakan ngrok untuk testing lokal)
- Cek "Recent Deliveries" di GitHub webhook settings untuk melihat status delivery
- Pastikan event "Pull requests" sudah dicentang di webhook settings

**Notifikasi tidak ke semua platform**
- Cek logs untuk melihat platform mana yang gagal
- Pastikan semua credentials dikonfigurasi dengan benar di `.env`
- Test endpoint `/health` untuk cek status bot: `http://localhost:3000/health`

## Deployment ke Render.com (24/7 Online)

Render.com menyediakan hosting gratis yang sempurna untuk bot Discord & Telegram ini. Berikut langkah-langkahnya:

### 1. Persiapan Repository

Pastikan kode sudah di-push ke GitHub repository:

```bash
git init
git add .
git commit -m "Initial commit: Discord GitHub PR Bot"
git remote add origin <your-github-repo-url>
git push -u origin main
```

### 2. Deploy ke Render.com

1. **Buat Akun Render**
   - Kunjungi [render.com](https://render.com)
   - Sign up menggunakan akun GitHub Anda

2. **Buat Web Service Baru**
   - Di dashboard Render, klik **"New +"** → **"Web Service"**
   - Connect repository GitHub Anda yang berisi bot ini
   - Klik **"Connect"** pada repository

3. **Konfigurasi Web Service**

   Isi form dengan informasi berikut:

   - **Name**: `github-discord-pr-bot` (atau nama apapun yang Anda inginkan)
   - **Region**: Pilih region terdekat (contoh: Singapore)
   - **Branch**: `main` (atau branch yang Anda gunakan)
   - **Root Directory**: Kosongkan (kecuali bot ada di subfolder)
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: Pilih **"Free"** (cukup untuk bot ini)

4. **Set Environment Variables**

   Scroll ke bagian **"Environment Variables"** dan tambahkan sesuai bot yang ingin diaktifkan:

   **Untuk Discord:**
   - Key: `DISCORD_BOT_TOKEN` → Value: `<your-discord-bot-token>`
   - Key: `DISCORD_CHANNEL_ID` → Value: `<your-discord-channel-id>`
   - Key: `DISCORD_ROLE_ID` → Value: `<your-discord-role-id>` (opsional)

   **Untuk Telegram:**
   - Key: `TELEGRAM_BOT_TOKEN` → Value: `<your-telegram-bot-token>`
   - Key: `TELEGRAM_CHAT_ID` → Value: `<your-telegram-chat-id>`
   - Key: `TELEGRAM_THREAD_ID` → Value: `<your-thread-id>` (opsional, untuk topic)

   **Wajib:**
   - Key: `PORT` → Value: `3000`

   **Catatan:** Anda bisa tambahkan environment variable untuk Discord saja, Telegram saja, atau keduanya.

5. **Deploy**
   - Klik **"Create Web Service"**
   - Render akan otomatis build dan deploy bot Anda
   - Tunggu hingga status berubah menjadi **"Live"** (sekitar 2-5 menit)

### 3. Dapatkan URL Public

Setelah deploy berhasil:
- URL public bot Anda akan muncul di dashboard (contoh: `https://github-discord-pr-bot-xxxx.onrender.com`)
- Copy URL ini untuk digunakan di GitHub webhook

### 4. Setup GitHub Webhook dengan URL Render

1. Pergi ke GitHub organization atau repository Anda
2. Klik **Settings** → **Webhooks** → **Add webhook**
3. Isi form webhook:
   - **Payload URL**: `https://github-discord-pr-bot-xxxx.onrender.com/webhook/github`
     (ganti dengan URL Render Anda)
   - **Content type**: `application/json`
   - **Secret**: Kosongkan (optional)
   - **SSL verification**: Enable SSL verification
   - **Which events would you like to trigger this webhook?**:
     - Pilih **"Let me select individual events"**
     - Centang **"Pull requests"**
     - Uncheck yang lain
   - **Active**: ✅ Centang
4. Klik **"Add webhook"**
5. GitHub akan mengirim test ping, pastikan statusnya hijau (✓)

### 5. Verifikasi Deployment

1. **Cek Health Endpoint**
   - Buka browser dan kunjungi: `https://your-render-url.onrender.com/health`
   - Anda harus melihat response JSON dengan status bot

2. **Cek Logs di Render**
   - Di dashboard Render, klik tab **"Logs"**
   - Pastikan muncul pesan sesuai bot yang dikonfigurasi:
     ```
     ✅ Bot Discord siap! Logged in as YourBot#1234
     ✅ Channel Discord terhubung: your-channel-name
     ✅ Bot Telegram siap! Logged in as @YourTelegramBot
     ✅ Telegram chat terhubung: Your Group Name
     🚀 Webhook server berjalan di port 3000
     📊 Status bot:
        - Discord: ✅ Enabled
        - Telegram: ✅ Enabled
     ```

3. **Test Telegram Bot (jika menggunakan Telegram)**
   - Kirim command `/test` di grup Telegram
   - Bot akan reply untuk memastikan koneksi berhasil

4. **Test dengan PR Baru**
   - Buat Pull Request baru di repository GitHub
   - Notifikasi harus muncul di platform yang dikonfigurasi dalam beberapa detik

### 6. Monitoring dan Maintenance

**Cek Status Bot:**
- Dashboard Render menampilkan uptime, CPU, dan memory usage
- Tab "Logs" untuk melihat real-time logs
- Tab "Metrics" untuk melihat request metrics

**Auto-Deploy:**
- Setiap kali Anda push ke branch `main`, Render akan otomatis deploy ulang
- Tidak perlu konfigurasi tambahan

**Keep Bot Alive (Penting untuk Free Tier):**
- Free tier Render akan "sleep" setelah 15 menit tidak ada activity
- Gunakan cron job atau uptime monitoring untuk ping bot setiap 10 menit:
  - [Cron-job.org](https://cron-job.org)
  - [UptimeRobot](https://uptimerobot.com)
  - Ping ke: `https://your-render-url.onrender.com/health`

### Troubleshooting Render

**Build Failed:**
- Pastikan `package.json` ada di root directory
- Cek logs untuk error message spesifik

**Bot tidak connect ke Discord:**
- Verifikasi environment variables di Render settings
- Pastikan tidak ada typo di `DISCORD_BOT_TOKEN`

**Webhook tidak terkirim:**
- Pastikan URL webhook di GitHub sudah benar (harus HTTPS)
- Cek "Recent Deliveries" di GitHub webhook settings
- Pastikan Render service status "Live"

**Service Keep Sleeping (Free Tier):**
- Setup uptime monitor untuk ping setiap 10 menit
- Atau upgrade ke paid plan ($7/month) untuk always-on instance

## Alternative Deployment Options

Jika ingin alternatif lain:
- **Railway.app** - Setup mirip dengan Render, free tier $5/month credit
- **Heroku** - Tidak gratis lagi sejak 2022
- **DigitalOcean App Platform** - $5/month minimum
- **VPS/Cloud Server** - Lebih fleksibel tapi butuh setup manual

## License

ISC
