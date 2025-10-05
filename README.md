# GitHub to Discord PR Bot

Bot Discord yang otomatis memposting notifikasi setiap ada Pull Request baru yang dibuat di GitHub organization.

## Fitur

- ✅ Notifikasi otomatis ketika PR baru dibuat
- 📊 Informasi lengkap PR (judul, deskripsi, author, branch, status)
- 🎨 Embed Discord yang menarik
- 🔗 Link langsung ke PR dan repository
- 🔔 Mention role untuk notifikasi tim (opsional)

## Prerequisites

- Node.js (v16 atau lebih tinggi)
- Bot Discord dengan token
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

### 3. Buat Bot Discord

1. Kunjungi [Discord Developer Portal](https://discord.com/developers/applications)
2. Klik "New Application" dan beri nama bot Anda
3. Pergi ke tab "Bot" dan klik "Add Bot"
4. Copy **Bot Token** (jangan bagikan ke siapapun!)
5. Aktifkan "MESSAGE CONTENT INTENT" di bagian Privileged Gateway Intents
6. Pergi ke tab "OAuth2" → "URL Generator"
7. Pilih scope: `bot`
8. Pilih permissions: `Send Messages`, `Embed Links`, `Read Message History`, `Mention Everyone` (untuk mention role)
9. Copy URL yang dihasilkan dan buka di browser untuk invite bot ke server Anda

### 4. Dapatkan Channel ID dan Role ID Discord

1. Aktifkan Developer Mode di Discord (Settings → Advanced → Developer Mode)
2. Klik kanan pada channel tempat Anda ingin menerima notifikasi
3. Klik "Copy Channel ID"
4. (Opsional) Untuk mention role saat ada PR baru:
   - Klik kanan pada role yang ingin di-mention (contoh: @fara-techlab)
   - Klik "Copy Role ID"

### 5. Konfigurasi Environment Variables

1. Copy file `.env.example` menjadi `.env`:
```bash
cp .env.example .env
```

2. Edit file `.env` dan isi dengan kredensial Anda:
```env
DISCORD_BOT_TOKEN=your_discord_bot_token_here
DISCORD_CHANNEL_ID=your_channel_id_here
DISCORD_ROLE_ID=your_role_id_here  # Opsional, untuk mention role
PORT=3000
```

**Catatan:** `DISCORD_ROLE_ID` bersifat opsional. Jika diisi, bot akan mention role tersebut setiap kali ada PR baru. Jika tidak diisi, bot hanya mengirim notifikasi tanpa mention.

### 6. Jalankan Bot

```bash
npm start
```

Atau untuk development dengan auto-reload:
```bash
npm run dev
```

Bot akan berjalan di `http://localhost:3000`

### 7. Setup GitHub Webhook

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

1. Pastikan bot sudah berjalan dan terkoneksi ke Discord
2. Buat PR baru di repository GitHub yang sudah di-setup webhook-nya
3. Notifikasi akan muncul di channel Discord yang sudah dikonfigurasi

## Contoh Notifikasi Discord

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
- Warna hijau untuk PR baru
- Icon 📝 di judul
- Informasi lengkap PR (judul, author, status, deskripsi, branch)
- Link clickable ke PR dan repository
- Timestamp kapan notifikasi dikirim

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

### Bot tidak terkoneksi ke Discord
- Pastikan `DISCORD_BOT_TOKEN` benar
- Pastikan bot sudah di-invite ke server dengan permissions yang cukup

### Notifikasi tidak muncul
- Pastikan `DISCORD_CHANNEL_ID` benar
- Pastikan bot punya permission untuk mengirim pesan di channel tersebut
- Cek logs server untuk error

### Role tidak ter-mention
- Pastikan `DISCORD_ROLE_ID` sudah diisi dengan benar di file `.env`
- Pastikan bot memiliki permission `Mention Everyone` saat invite
- Pastikan role yang ingin di-mention memiliki setting "Allow anyone to @mention this role" aktif di Discord Server Settings → Roles

### Webhook GitHub tidak terkirim
- Pastikan URL webhook bisa diakses dari internet (gunakan ngrok untuk testing lokal)
- Cek "Recent Deliveries" di GitHub webhook settings untuk melihat status delivery

## Deployment ke Render.com (24/7 Online)

Render.com menyediakan hosting gratis yang sempurna untuk bot Discord ini. Berikut langkah-langkahnya:

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

   Scroll ke bagian **"Environment Variables"** dan tambahkan:

   - Key: `DISCORD_BOT_TOKEN` → Value: `<your-discord-bot-token>`
   - Key: `DISCORD_CHANNEL_ID` → Value: `<your-discord-channel-id>`
   - Key: `DISCORD_ROLE_ID` → Value: `<your-discord-role-id>` (opsional, untuk mention role)
   - Key: `PORT` → Value: `3000`

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
   - Pastikan muncul pesan:
     ```
     ✅ Bot Discord siap! Logged in as YourBot#1234
     ✅ Channel Discord terhubung: your-channel-name
     🚀 Webhook server berjalan di port 3000
     ```

3. **Test dengan PR Baru**
   - Buat Pull Request baru di repository GitHub
   - Notifikasi harus muncul di channel Discord dalam beberapa detik

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
