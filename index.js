const { Client, GatewayIntentBits, Partials } = require('discord.js');

const { DISCORD_TOKEN, OWNER_ID } = process.env;

if (!DISCORD_TOKEN || !OWNER_ID) {
  console.error('Missing DISCORD_TOKEN or OWNER_ID. Copy .env.example to .env and fill it in.');
  process.exit(1);
}

// Reactions added to each of your messages, in order.
const CRY_EMOJIS = ['😢', '😭'];

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.DirectMessages,
    // Privileged intent: enable "Message Content Intent" in the developer portal.
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Channel], // needed to receive DMs
});

client.once('clientReady', () => {
  console.log(`Logged in as ${client.user.tag}, reacting only to user ${OWNER_ID}`);
});

client.on('messageCreate', async (message) => {
  // Only react to messages from the configured user.
  if (message.author.id !== OWNER_ID) return;

  for (const emoji of CRY_EMOJIS) {
    try {
      await message.react(emoji);
    } catch (err) {
      console.error(`Failed to react with ${emoji}:`, err.message);
      break; // missing permissions / deleted message – no point continuing
    }
  }
});

client.login(DISCORD_TOKEN);
