const { createCanvas, loadImage } = require("canvas");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "jainga",
    version: "1.0",
    author: "RS RIFAT",
    countDown: 5,
    role: 0,
    shortDescription: "Jainga meme generator",
    longDescription: "Generates a jainga meme with the replied/mentioned user's avatar placed on the marked circle area",
    category: "fun",
    guide: {
      en: "{pn} reply to someone's message or mention them\nExample: {pn} @Someone"
    }
  },

  onStart: async function ({ api, event, usersData, message }) {
    const { threadID, messageID, senderID, type, messageReply, mentions } = event;

    let targetID;

    if (type === "message_reply") {
      targetID = messageReply.senderID;
    } else if (mentions && Object.keys(mentions).length > 0) {
      targetID = Object.keys(mentions)[0];
    }

    if (!targetID) {
      return message.reply(
        "âŒ Please reply to someone's message or mention them to use this command."
      );
    }

    if (targetID === senderID) {
      return message.reply("âŒ You can't use this command on yourself.");
    }

    try {
      const templateUrl = "https://i.ibb.co/cXYwNW6C/received-1600213584889282.jpg";

      const avatarTargetUrl = `https://graph.facebook.com/${targetID}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;

      const [template, avatarTarget] = await Promise.all([
        loadImage(templateUrl),
        loadImage(avatarTargetUrl)
      ]);

      // Canvas size portrait (original image size)
      const canvas = createCanvas(828, 1472);
      const ctx = canvas.getContext("2d");

      // Draw background template
      ctx.drawImage(template, 0, 0, 828, 1472);

      // Circle border (rainbow effect)
      const drawRainbowBorder = (cx, cy, radius) => {
        const colors = ["#FF0000", "#FF7F00", "#FFFF00", "#00FF00", "#0000FF", "#8B00FF"];
        const step = (Math.PI * 2) / colors.length;
        for (let i = 0; i < colors.length; i++) {
          ctx.beginPath();
          ctx.arc(cx, cy, radius + 6, step * i, step * (i + 1));
          ctx.strokeStyle = colors[i];
          ctx.lineWidth = 8;
          ctx.stroke();
        }
      };

      // Gol circle e avatar draw korar function
      const drawAvatarInCircle = (img, cx, cy, radius) => {
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(
          img,
          cx - radius,
          cy - radius,
          radius * 2,
          radius * 2
        );
        ctx.restore();
      };

      // Rainbow circle border draw
      drawRainbowBorder(414, 210, 130);

      // Avatar draw - image e marked rainbow circle er center
      // cx=414 (horizontal center), cy=210 (matha upper area), radius=130
      drawAvatarInCircle(avatarTarget, 414, 210, 130);

      const cacheDir = path.join(__dirname, "cache");
      await fs.ensureDir(cacheDir);
      const filePath = path.join(cacheDir, `jainga_${senderID}.png`);
      await fs.writeFile(filePath, canvas.toBuffer("image/png"));

      await message.reply({
        body: "ðŸ˜‚ Jainga detected! ðŸŽ¯",
        attachment: fs.createReadStream(filePath)
      });

      fs.unlink(filePath, () => {});
    } catch (err) {
      console.error("[JAINGA ERROR]", err);
      return message.reply("âŒ Failed to generate the image. Please try again.");
    }
  }
};
