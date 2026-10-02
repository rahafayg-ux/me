# Cry Reaction Bot

A Discord bot that reacts with 😢 😭 to every message sent by **one specific user** (you) — and ignores everyone else.

## Setup

1. Create an application at <https://discord.com/developers/applications>, add a **Bot**, and copy its token.
2. Under **Bot → Privileged Gateway Intents**, enable **Message Content Intent**.
3. Invite the bot to your server (OAuth2 → URL Generator → scope `bot`, permissions: *View Channels*, *Read Message History*, *Add Reactions*).
4. Get your user ID: Discord Settings → Advanced → enable Developer Mode, then right-click your name → **Copy User ID**.
5. Configure and run:

```sh
npm install
cp .env.example .env   # then fill in DISCORD_TOKEN and OWNER_ID
node --env-file=.env index.js
```

Change the emojis by editing `CRY_EMOJIS` in `index.js`.
