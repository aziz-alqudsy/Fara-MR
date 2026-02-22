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

// Helper function untuk escape HTML entities
const escapeHtml = (text) => {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
};

// Helper untuk kirim notifikasi ke semua platform
async function sendNotifications(notifications) {
  if (notifications.length === 0) {
    console.warn('⚠️ Tidak ada bot yang aktif untuk mengirim notifikasi');
    return null;
  }
  const results = await Promise.all(notifications);
  const successCount = results.filter(r => r.success).length;
  const failedCount = results.filter(r => !r.success).length;
  if (successCount > 0) {
    console.log(`✅ Berhasil mengirim ke ${successCount} platform`);
  } else {
    console.error('❌ Gagal mengirim ke semua platform');
  }
  return { successCount, failedCount, results };
}

// Helper untuk build Telegram options
function buildTelegramOptions() {
  const options = { parse_mode: 'HTML', disable_web_page_preview: true };
  if (process.env.TELEGRAM_THREAD_ID) {
    options.message_thread_id = parseInt(process.env.TELEGRAM_THREAD_ID);
  }
  return options;
}

// Helper untuk build mentions string
function buildMentions() {
  if (!process.env.TELEGRAM_USERNAMES) return '';
  const usernames = process.env.TELEGRAM_USERNAMES.split(',').map(u => u.trim());
  return usernames.map(u => `@${u}`).join(' ') + '\n\n';
}

// Endpoint webhook untuk GitHub
app.post('/webhook/github', async (req, res) => {
  const event = req.headers['x-github-event'];
  console.log(`📥 Webhook diterima: ${event}`);

  const payload = req.body;
  const repo = payload.repository;
  const notifications = [];

  // ======== HANDLE EVENT: PULL REQUEST ========
  if (event === 'pull_request') {
    // Hanya kirim notifikasi untuk PR yang baru dibuat
    if (payload.action !== 'opened') {
      return res.status(200).send('Action diabaikan');
    }

    const pr = payload.pull_request;

    // Kirim ke Discord
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

      const roleId = process.env.DISCORD_ROLE_ID;
      const content = roleId ? `<@&${roleId}>` : undefined;

      notifications.push(
        discordChannel.send({ content, embeds: [embed] })
          .then(() => { console.log(`✅ Discord: Notifikasi PR terkirim - ${pr.title}`); return { platform: 'Discord', success: true }; })
          .catch(err => { console.error('❌ Discord: Error mengirim pesan:', err); return { platform: 'Discord', success: false, error: err.message }; })
      );
    }

    // Kirim ke Telegram
    if (isTelegramEnabled && telegramBot) {
      const statusEmoji = pr.draft ? '📝' : '✅';
      const statusText = pr.draft ? 'Draft' : 'Ready for Review';

      let msg = `🔔 <b>Pull Request Baru</b>\n\n`;
      msg += buildMentions();
      msg += `<b>${escapeHtml(pr.title)}</b>\n\n`;
      msg += `👤 Author: <a href="${pr.user.html_url}">${escapeHtml(pr.user.login)}</a>\n`;
      msg += `📦 Repository: <a href="${repo.html_url}">${escapeHtml(repo.full_name)}</a>\n`;
      msg += `🌿 Branch: <code>${escapeHtml(pr.head.ref)}</code> → <code>${escapeHtml(pr.base.ref)}</code>\n`;
      msg += `📊 Status: ${statusEmoji} ${statusText}\n\n`;
      if (pr.body) {
        const desc = pr.body.length > 300 ? pr.body.substring(0, 300) + '...' : pr.body;
        msg += `📝 Deskripsi:\n${escapeHtml(desc)}\n\n`;
      }
      msg += `🔗 <a href="${pr.html_url}">Lihat Pull Request</a>`;

      notifications.push(
        telegramBot.sendMessage(process.env.TELEGRAM_CHAT_ID, msg, buildTelegramOptions())
          .then(() => { console.log(`✅ Telegram: Notifikasi PR terkirim - ${pr.title}`); return { platform: 'Telegram', success: true }; })
          .catch(err => { console.error('❌ Telegram: Error mengirim pesan:', err); return { platform: 'Telegram', success: false, error: err.message }; })
      );
    }

  // ======== HANDLE EVENT: PUSH KE MAIN/MASTER ========
  } else if (event === 'push') {
    const branch = payload.ref; // contoh: "refs/heads/main"
    const isMainBranch = branch === 'refs/heads/main' || branch === 'refs/heads/master';

    if (!isMainBranch) {
      console.log(`ℹ️ Push ke branch ${branch} diabaikan`);
      return res.status(200).send('Push bukan ke main/master, diabaikan');
    }

    // Abaikan jika tidak ada commits (misalnya delete branch)
    if (!payload.commits || payload.commits.length === 0) {
      return res.status(200).send('Tidak ada commits, diabaikan');
    }

    const pusher = payload.pusher;
    const headCommit = payload.head_commit;
    const branchName = branch.replace('refs/heads/', '');
    const commitCount = payload.commits.length;

    console.log(`🚀 Push ke ${branchName} oleh ${pusher.name} (${commitCount} commit)`);

    // Kirim ke Discord
    if (isDiscordEnabled && discordChannel) {
      const commitList = payload.commits.slice(0, 5)
        .map(c => `• [\`${c.id.substring(0, 7)}\`](${c.url}) ${c.message.split('\n')[0]}`)
        .join('\n');

      const embed = new EmbedBuilder()
        .setColor('#28a745')
        .setTitle(`🚀 Push Langsung ke ${branchName}`)
        .setURL(payload.compare)
        .setAuthor({ name: pusher.name })
        .addFields(
          { name: '📦 Repository', value: `[${repo.full_name}](${repo.html_url})`, inline: true },
          { name: '🌿 Branch', value: branchName, inline: true },
          { name: '📝 Commits', value: `${commitCount} commit`, inline: true }
        )
        .setDescription(commitList)
        .setTimestamp(new Date(headCommit.timestamp))
        .setFooter({ text: `${repo.organization?.login || repo.owner.login}` });

      const roleId = process.env.DISCORD_ROLE_ID;
      const content = roleId ? `<@&${roleId}>` : undefined;

      notifications.push(
        discordChannel.send({ content, embeds: [embed] })
          .then(() => { console.log(`✅ Discord: Notifikasi push terkirim`); return { platform: 'Discord', success: true }; })
          .catch(err => { console.error('❌ Discord: Error mengirim pesan:', err); return { platform: 'Discord', success: false, error: err.message }; })
      );
    }

    // Kirim ke Telegram
    if (isTelegramEnabled && telegramBot) {
      const commitList = payload.commits.slice(0, 5)
        .map(c => `• <code>${c.id.substring(0, 7)}</code> ${escapeHtml(c.message.split('\n')[0])}`)
        .join('\n');

      let msg = `🚀 <b>Push Langsung ke ${escapeHtml(branchName)}</b>\n\n`;
      msg += buildMentions();
      msg += `👤 Pusher: <b>${escapeHtml(pusher.name)}</b>\n`;
      msg += `📦 Repository: <a href="${repo.html_url}">${escapeHtml(repo.full_name)}</a>\n`;
      msg += `🌿 Branch: <code>${escapeHtml(branchName)}</code>\n`;
      msg += `📝 Commits: ${commitCount} commit\n\n`;
      msg += `${commitList}\n\n`;
      if (commitCount > 5) {
        msg += `<i>... dan ${commitCount - 5} commit lainnya</i>\n\n`;
      }
      msg += `🔗 <a href="${payload.compare}">Lihat Perubahan</a>`;

      notifications.push(
        telegramBot.sendMessage(process.env.TELEGRAM_CHAT_ID, msg, buildTelegramOptions())
          .then(() => { console.log(`✅ Telegram: Notifikasi push terkirim`); return { platform: 'Telegram', success: true }; })
          .catch(err => { console.error('❌ Telegram: Error mengirim pesan:', err); return { platform: 'Telegram', success: false, error: err.message }; })
      );
    }

  // ======== EVENT LAIN: ABAIKAN ========
  } else {
    console.log(`ℹ️ Event ${event} diabaikan`);
    return res.status(200).send('Event diabaikan');
  }

  // Tunggu semua notifikasi terkirim
  const result = await sendNotifications(notifications);
  if (!result) {
    return res.status(200).send('Webhook diterima tapi tidak ada bot yang aktif');
  }
  if (result.successCount > 0) {
    return res.status(200).json({ message: 'Webhook diterima', sent: result.successCount, failed: result.failedCount, results: result.results });
  } else {
    return res.status(500).json({ message: 'Gagal mengirim notifikasi', results: result.results });
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

// Test endpoint untuk verifikasi webhook GitHub
app.get('/webhook/github', (_req, res) => {
  res.status(200).json({
    message: 'GitHub Webhook endpoint is ready',
    note: 'Send POST request with GitHub PR event to test',
    health: {
      discord: isDiscordEnabled && discordChannel ? 'ready' : 'not ready',
      telegram: isTelegramEnabled && telegramBot ? 'ready' : 'not ready'
    }
  });
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
