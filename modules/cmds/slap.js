const DIG = require("discord-image-generation");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "slap",
    version: "1.2",
    author: "RS RIFAT",
    countDown: 5,
    role: 0,
    shortDescription: { en: "Batslap image" },
    category: "image",
    guide: { en: "{pn} @tag | Reply to a message" }
  },

  langs: {
    en: {
      noTag: "❌ **𝗣𝗹𝗲𝗮𝘀𝗲 𝘁𝗮𝗴 𝘀𝗼𝗺𝗲𝗼𝗻𝗲 𝗼𝗿 𝗿𝗲𝗽𝗹𝘆 𝘁𝗼 𝘁𝗵𝗲𝗶𝗿 𝗺𝗲𝘀𝘀𝗮𝗴𝗲 𝘁𝗼 𝘀𝗹𝗮𝗽 𝘁𝗵𝗲𝗺.**"
    }
  },

  onStart: async function ({ event, message, usersData, args, getLang }) {
    const uid1 = event.senderID;
    let uid2;

    // 1. Check if replying to a message
    if (event.type === "message_reply") {
      uid2 = event.messageReply.senderID;
    } 
    // 2. Check for mentions
    else if (Object.keys(event.mentions).length > 0) {
      uid2 = Object.keys(event.mentions)[0];
    }

    if (!uid2) return message.reply(getLang("noTag"));

    try {
      const avatarURL1 = await usersData.getAvatarUrl(uid1);
      const avatarURL2 = await usersData.getAvatarUrl(uid2);

      // Generate the image
      const img = await new DIG.Batslap().getImage(avatarURL1, avatarURL2);
      
      // Ensure cache directory exists
      const cachePath = path.join(__dirname, "cache");
      if (!fs.existsSync(cachePath)) fs.mkdirSync(cachePath);
      
      const pathSave = path.join(cachePath, `slap_${uid1}_${uid2}.png`);
      fs.writeFileSync(pathSave, Buffer.from(img));

      // Clean up mention from text if any
      const content = args.join(" ").replace(/@\[\d+:\d+\]/g, "").trim();

      return message.reply({
        body: `${content || "👋 **𝗧𝗮𝗸𝗲 𝘁𝗵𝗶𝘀!!**"}`,
        attachment: fs.createReadStream(pathSave)
      }, () => {
        if (fs.existsSync(pathSave)) fs.unlinkSync(pathSave);
      });

    } catch (e) {
      console.error(e);
      return message.reply("❌ **𝗔𝗻 𝗲𝗿𝗿𝗼𝗿 𝗼𝗰𝗰𝘂𝗿𝗿𝗲𝗱 𝘄𝗵𝗶𝗹𝗲 𝗴𝗲𝗻𝗲𝗿𝗮𝘁𝗶𝗻𝗴 𝘁𝗵𝗲 𝗶𝗺𝗮𝗴𝗲.**");
    }
  }
};
