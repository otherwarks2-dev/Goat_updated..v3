const { createCanvas, loadImage } = require("canvas");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
 config: {
 name: "pussy2",
 version: "1.0",
 author: "EryXenX",
 countDown: 5,
 role: 0,
 shortDescription: "Pussy2 meme",
 longDescription: "Generates a meme: replied/mentioned user's avatar placed in the circle",
 category: "fun",
 guide: {
 en: "{pn} reply to someone's message or mention them\nExample: {pn} @Someone"
 }
 },

 onStart: async function ({ api, event, message }) {
 const { senderID, type, messageReply, mentions } = event;

 let targetID;

 if (type === "message_reply") {
 targetID = messageReply.senderID;
 } else if (mentions && Object.keys(mentions).length > 0) {
 targetID = Object.keys(mentions)[0];
 }

 if (!targetID) {
 return message.reply(
 "Please reply to someone's message or mention them to use this command."
 );
 }

 try {
 const templateUrl = "https://i.ibb.co.com/gL1fRDR3/18960407.png";

 const avatarTargetUrl = `https://graph.facebook.com/${targetID}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;

 const [template, avatar] = await Promise.all([
 loadImage(templateUrl),
 loadImage(avatarTargetUrl)
 ]);

 const canvas = createCanvas(template.width, template.height);
 const ctx = canvas.getContext("2d");

 ctx.drawImage(template, 0, 0, template.width, template.height);

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

 const w = template.width;
 const h = template.height;

 drawAvatarInCircle(avatar, w * 0.47, h * 0.2, w * 0.15);

 const cacheDir = path.join(__dirname, "cache");
 await fs.ensureDir(cacheDir);
 const filePath = path.join(cacheDir, `pussy2_${senderID}.png`);
 await fs.writeFile(filePath, canvas.toBuffer("image/png"));

 await message.reply({
 body: "",
 attachment: fs.createReadStream(filePath)
 });

 fs.unlink(filePath, () => {});
 } catch (err) {
 console.error(err);
 return message.reply("Failed to generate the image. Please try again.");
 }
 }
};
