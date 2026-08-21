const axios = require("axios");

module.exports = {
  config: {
    name: "emojimix",
    aliases: ["emoji"],
    version: "0.0.4",
    author: "RS RIFAT",
    countDown: 3,
    role: 0,
    shortDescription: "𝐄𝐦𝐨𝐣𝐢 𝐌𝐢𝐱",
    longDescription: "𝐂𝐨𝐦𝐛𝐢𝐧𝐞 𝐭𝐰𝐨 𝐞𝐦𝐨𝐣𝐢𝐬 𝐮𝐬𝐢𝐧𝐠 𝐀𝐏𝐈",
    category: "fun",
    guide: {
      en: "{pn} 😀 | 😒"
    }
  },

  onStart: async function ({ message, args }) {
    try {
      if (args.length < 2) {
        return message.reply("❌ 𝐄𝐧𝐭𝐞𝐫 𝟐 𝐞𝐦𝐨𝐣𝐢 𝐭𝐨 𝐦𝐢𝐱.");
      }

      const e1 = encodeURIComponent(args[0]);
      const e2 = encodeURIComponent(args[1]);

      const apiURL = `https://azadx69x-all-apis-top.vercel.app/api/emojimix?e1=${e1}&e2=${e2}`;

      const stream = await global.utils.getStreamFromURL(apiURL);

      return message.reply({
        body: `🙂 𝐄𝐦𝐨𝐣𝐢 𝐌𝐢𝐱\n${args[0]} + ${args[1]}`,
        attachment: stream
      });

    } catch (err) {
      console.error("EMOJIMIX CMD ERROR:", err);
      return message.reply("⛔ 𝐂𝐨𝐮𝐥𝐝 𝐧𝐨𝐭 𝐦𝐢𝐱 𝐞𝐦𝐨𝐣𝐢𝐬.");
    }
  }
};
