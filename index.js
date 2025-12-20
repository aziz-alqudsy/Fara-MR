require('dotenv').config();
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const TelegramBot = require('node-telegram-bot-api');
const express = require('express');

const app = express();
app.use(express.json());

// ======== DISCORD BOT SETUP ========
const discordClient = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages
  ]
});

let discordChannel;
let isDiscordEnabled = false;

if (process.env.DISCORD_BOT_TOKEN && process.env.DISCORD_CHANNEL_ID) {
  isDiscordEnabled = true;

  discordClient.once('ready', () => {
    console.log(`✅ Bot Discord siap! Logged in as ${discordClient.user.tag}`);

    // Dapatkan channel Discord berdasarkan ID
    discordChannel = discordClient.channels.cache.get(process.env.DISCORD_CHANNEL_ID);

    if (!discordChannel) {
      console.error('❌ Channel Discord tidak ditemukan! Periksa DISCORD_CHANNEL_ID di .env');
      isDiscordEnabled = false;
    } else {
      console.log(`✅ Channel Discord terhubung: ${discordChannel.name}`);
    }
  });

  // Login bot Discord
  discordClient.login(process.env.DISCORD_BOT_TOKEN)
    .catch(err => {
      console.error('❌ Error login Discord bot:', err);
      isDiscordEnabled = false;
    });
} else {
  console.log('ℹ️ Discord bot tidak dikonfigurasi (DISCORD_BOT_TOKEN atau DISCORD_CHANNEL_ID tidak ada)');
}

// ======== TELEGRAM BOT SETUP ========
let telegramBot;
let isTelegramEnabled = false;

if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
  isTelegramEnabled = true;

  // Disable polling karena hanya untuk webhook (tidak perlu receive commands)
  telegramBot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: false });

  telegramBot.getMe().then((botInfo) => {
    console.log(`✅ Bot Telegram siap! Logged in as @${botInfo.username}`);

    // Test koneksi ke chat
    telegramBot.getChat(process.env.TELEGRAM_CHAT_ID)
      .then(chat => {
        console.log(`✅ Telegram chat terhubung: ${chat.title || chat.username || chat.id}`);
      })
      .catch(err => {
        console.error('❌ Telegram chat tidak ditemukan! Periksa TELEGRAM_CHAT_ID di .env');
        console.error('Error:', err.message);
        isTelegramEnabled = false;
      });
  }).catch(err => {
    console.error('❌ Error inisialisasi Telegram bot:', err);
    isTelegramEnabled = false;
  });

  // Note: Telegram commands disabled karena polling=false
  // Bot hanya digunakan untuk mengirim notifikasi webhook, tidak menerima commands
} else {
  console.log('ℹ️ Telegram bot tidak dikonfigurasi (TELEGRAM_BOT_TOKEN atau TELEGRAM_CHAT_ID tidak ada)');
}

// Peringatan jika tidak ada bot yang dikonfigurasi
if (!isDiscordEnabled && !isTelegramEnabled) {
  console.warn('⚠️ PERINGATAN: Tidak ada bot (Discord/Telegram) yang dikonfigurasi!');
  console.warn('⚠️ Webhook akan tetap berjalan tapi notifikasi tidak akan dikirim.');
}

// Root endpoint untuk test ping GitHub
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'GitHub Discord & Telegram PR Bot is running',
    endpoints: {
      health: '/health',
      webhook: '/webhook/github (POST)'
    },
    bots: {
      discord: isDiscordEnabled,
      telegram: isTelegramEnabled
    }
  });
});

app.post('/', (req, res) => {
  console.log('⚠️ Request diterima di root path /, redirect ke /webhook/github');
  res.status(200).send('Please use /webhook/github endpoint');
});

// Endpoint webhook untuk GitHub
app.post('/webhook/github', async (req, res) => {
  const event = req.headers['x-github-event'];
  console.log(`📥 Webhook diterima: ${event}`);

  // Hanya proses event pull request
  if (event !== 'pull_request') {
    console.log(`ℹ️ Event ${event} diabaikan`);
    return res.status(200).send('Event diabaikan');
  }

  const payload = req.body;
  const action = payload.action;

  // Hanya kirim notifikasi untuk PR yang baru dibuat
  if (action !== 'opened') {
    return res.status(200).send('Action diabaikan');
  }

  const pr = payload.pull_request;
  const repo = payload.repository;

  const notifications = [];

  // ======== KIRIM KE DISCORD ========
  if (isDiscordEnabled && discordChannel) {
    const embed = new EmbedBuilder()
      .setColor('#0366d6')
      .setTitle(`🔔 Pull Request Baru: ${pr.title}`)
      .setURL(pr.html_url)
      .setAuthor({
        name: pr.user.login,
        iconURL: pr.user.avatar_url,
        url: pr.user.html_url
      })
      .addFields(
        { name: '📦 Repository', value: `[${repo.full_name}](${repo.html_url})`, inline: true },
        { name: '🌿 Branch', value: `${pr.head.ref} → ${pr.base.ref}`, inline: true },
        { name: '📊 Status', value: pr.draft ? '📝 Draft' : '✅ Ready for Review', inline: true }
      )
      .setDescription(pr.body ? (pr.body.length > 300 ? pr.body.substring(0, 300) + '...' : pr.body) : '_Tidak ada deskripsi_')
      .setTimestamp(new Date(pr.created_at))
      .setFooter({ text: `${repo.organization?.login || repo.owner.login}` });

    // Mention role jika DISCORD_ROLE_ID tersedia
    const roleId = process.env.DISCORD_ROLE_ID;
    const content = roleId ? `<@&${roleId}>` : undefined;

    const discordPromise = discordChannel.send({
      content: content,
      embeds: [embed]
    })
      .then(() => {
        console.log(`✅ Discord: Notifikasi PR terkirim - ${pr.title}`);
        return { platform: 'Discord', success: true };
      })
      .catch(err => {
        console.error('❌ Discord: Error mengirim pesan:', err);
        return { platform: 'Discord', success: false, error: err.message };
      });

    notifications.push(discordPromise);
  }

  // ======== KIRIM KE TELEGRAM ========
  if (isTelegramEnabled && telegramBot) {
    const statusEmoji = pr.draft ? '📝' : '✅';
    const statusText = pr.draft ? 'Draft' : 'Ready for Review';

    // Helper function untuk escape HTML entities
    const escapeHtml = (text) => {
      if (!text) return '';
      return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    };

    let telegramMessage = `🔔 <b>Pull Request Baru</b>\n\n`;

    // Tambahkan mentions jika TELEGRAM_USERNAMES tersedia
    if (process.env.TELEGRAM_USERNAMES) {
      const usernames = process.env.TELEGRAM_USERNAMES.split(',').map(u => u.trim());
      const mentions = usernames.map(username => `@${username}`).join(' ');
      telegramMessage += `${mentions}\n\n`;
    }

    telegramMessage += `<b>${escapeHtml(pr.title)}</b>\n\n`;
    telegramMessage += `👤 Author: <a href="${pr.user.html_url}">${escapeHtml(pr.user.login)}</a>\n`;
    telegramMessage += `📦 Repository: <a href="${repo.html_url}">${escapeHtml(repo.full_name)}</a>\n`;
    telegramMessage += `🌿 Branch: <code>${escapeHtml(pr.head.ref)}</code> → <code>${escapeHtml(pr.base.ref)}</code>\n`;
    telegramMessage += `📊 Status: ${statusEmoji} ${statusText}\n\n`;

    if (pr.body) {
      const description = pr.body.length > 300 ? pr.body.substring(0, 300) + '...' : pr.body;
      telegramMessage += `📝 Deskripsi:\n${escapeHtml(description)}\n\n`;
    }

    telegramMessage += `🔗 <a href="${pr.html_url}">Lihat Pull Request</a>`;

    const telegramOptions = {
      parse_mode: 'HTML',
      disable_web_page_preview: true
    };

    // Tambahkan thread_id jika tersedia
    if (process.env.TELEGRAM_THREAD_ID) {
      telegramOptions.message_thread_id = parseInt(process.env.TELEGRAM_THREAD_ID);
    }

    const telegramPromise = telegramBot.sendMessage(
      process.env.TELEGRAM_CHAT_ID,
      telegramMessage,
      telegramOptions
    )
      .then(() => {
        console.log(`✅ Telegram: Notifikasi PR terkirim - ${pr.title}`);
        return { platform: 'Telegram', success: true };
      })
      .catch(err => {
        console.error('❌ Telegram: Error mengirim pesan:', err);
        return { platform: 'Telegram', success: false, error: err.message };
      });

    notifications.push(telegramPromise);
  }

  // Tunggu semua notifikasi terkirim
  if (notifications.length > 0) {
    const results = await Promise.all(notifications);
    const successCount = results.filter(r => r.success).length;
    const failedCount = results.filter(r => !r.success).length;

    if (successCount > 0) {
      console.log(`✅ Berhasil mengirim ke ${successCount} platform`);
      return res.status(200).json({
        message: 'Webhook diterima',
        sent: successCount,
        failed: failedCount,
        results: results
      });
    } else {
      console.error('❌ Gagal mengirim ke semua platform');
      return res.status(500).json({
        message: 'Gagal mengirim notifikasi',
        results: results
      });
    }
  } else {
    console.warn('⚠️ Tidak ada bot yang aktif untuk mengirim notifikasi');
    return res.status(200).send('Webhook diterima tapi tidak ada bot yang aktif');
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  const health = {
    status: 'ok',
    uptime: process.uptime(),
    bots: {}
  };

  if (isDiscordEnabled) {
    health.bots.discord = {
      enabled: true,
      ready: discordClient.user ? discordClient.user.tag : 'not ready',
      channel: discordChannel ? discordChannel.name : 'not connected'
    };
  } else {
    health.bots.discord = { enabled: false };
  }

  if (isTelegramEnabled) {
    health.bots.telegram = {
      enabled: true,
      ready: telegramBot ? 'ready' : 'not ready'
    };
  } else {
    health.bots.telegram = { enabled: false };
  }

  res.status(200).json(health);
});

// Jalankan server Express
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Webhook server berjalan di port ${PORT}`);
  console.log(`📊 Status bot:`);
  console.log(`   - Discord: ${isDiscordEnabled ? '✅ Enabled' : '❌ Disabled'}`);
  console.log(`   - Telegram: ${isTelegramEnabled ? '✅ Enabled' : '❌ Disabled'}`);
});

// Error handling
process.on('unhandledRejection', error => {
  console.error('Unhandled promise rejection:', error);
});
