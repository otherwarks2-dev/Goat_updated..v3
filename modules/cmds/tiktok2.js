const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "tiktok2",
    aliases: ["tikt"],
    version: "1.2",
    author: "RS RIFAT",
    role: 0,
    shortDescription: "Random TikTok video",
    longDescription: "Send random TikTok video",
    category: "media",
    usePrefix: false
  },

  onStart: async function ({ message, args }) {
    return this.run({ message, args });
  },

  onChat: async function ({ message, args, event }) {
    const body = (event.body || "").toLowerCase();
    if (!body.startsWith("tt ") && !body.startsWith("tiktok ")) return;
    args = body.split(" ").slice(1);
    return this.run({ message, args });
  },

  run: async function ({ message, args }) {
    try {
      const query = args.join(" ");
      if (!query) return message.reply("⚠️ Please enter a search keyword!");

      await message.reply(`🔍 Searching for *${query}*...`);

      const apiUrl = `https://azadx69x-tiktok-api.vercel.app/tiktok/search?query=${encodeURIComponent(query)}`;
      const { data } = await axios.get(apiUrl);

      if (!data?.list?.length) return message.reply("❌ No video found!");

      const random = data.list[Math.floor(Math.random() * data.list.length)];
      const videoUrl = random.play;
      const title = random.title || "Unknown";
      const author = random.author?.nickname || "Unknown";

      const filePath = path.join(__dirname, `tiktok_${Date.now()}.mp4`);

      const writer = fs.createWriteStream(filePath);
      const response = await axios({ url: videoUrl, responseType: "stream" });
      response.data.pipe(writer);

      writer.on("finish", async () => {
        await message.reply({
          body:
`━━━━━━━━━━━━━━━━━━━━━
   ✨ TikTok Video Fetched!
╭─╼━━━━━━━━━━━━━━╾─╮
│ 🔍 Search: ${query}
│ 🎞️ Title: ${title}
│ 👤 Creator: ${author}
╰─╼━━━━━━━━━━━━━━╾─╯
   💫 Made by: Azadx69x
━━━━━━━━━━━━━━━━━━━━━━`,
          attachment: fs.createReadStream(filePath)
        });

        fs.unlinkSync(filePath);
      });

      writer.on("error", () => message.reply("❌ Error saving video!"));

    } catch (err) {
      console.error(err);
      return message.reply("❌ Error fetching video!");
    }
  }
};
