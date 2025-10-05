require('dotenv').config();
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const express = require('express');

const app = express();
app.use(express.json());

// Inisialisasi Discord Bot
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages
  ]
});

let discordChannel;

client.once('ready', () => {
  console.log(`✅ Bot Discord siap! Logged in as ${client.user.tag}`);

  // Dapatkan channel Discord berdasarkan ID
  discordChannel = client.channels.cache.get(process.env.DISCORD_CHANNEL_ID);

  if (!discordChannel) {
    console.error('❌ Channel Discord tidak ditemukan! Periksa DISCORD_CHANNEL_ID di .env');
  } else {
    console.log(`✅ Channel Discord terhubung: ${discordChannel.name}`);
  }
});

// Endpoint webhook untuk GitHub
app.post('/webhook/github', (req, res) => {
  const event = req.headers['x-github-event'];

  // Hanya proses event pull request
  if (event !== 'pull_request') {
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

  // Buat embed Discord
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

  // Kirim ke Discord
  if (discordChannel) {
    discordChannel.send({ embeds: [embed] })
      .then(() => {
        console.log(`✅ Notifikasi PR terkirim: ${pr.title}`);
        res.status(200).send('Webhook diterima dan notifikasi terkirim');
      })
      .catch(err => {
        console.error('❌ Error mengirim pesan ke Discord:', err);
        res.status(500).send('Error mengirim notifikasi');
      });
  } else {
    console.error('❌ Channel Discord tidak tersedia');
    res.status(500).send('Channel Discord tidak tersedia');
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    bot: client.user ? client.user.tag : 'not ready',
    uptime: process.uptime()
  });
});

// Jalankan server Express
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Webhook server berjalan di port ${PORT}`);
});

// Login bot Discord
client.login(process.env.DISCORD_BOT_TOKEN)
  .catch(err => {
    console.error('❌ Error login Discord bot:', err);
    process.exit(1);
  });

// Error handling
process.on('unhandledRejection', error => {
  console.error('Unhandled promise rejection:', error);
});
