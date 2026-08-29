const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "edit",
    version: "1.1.1",
    aliases: ["qwen"],
    author: "RS RIFAT",
    role: 0,
    shortDescription: {
      en: "Edit image using Qwen API"
    },
    longDescription: {
      en: "Edit image using Qwen API (supports 1 or 2 source images)"
    },
    category: "AI",
    guide: {
      en: "{p}edit <text> (reply to an image)\n{p}edit -a <text> (reply to an image, then reply to bot's message with 2nd photo)"
    },
    countDown: 30
  },

  onStart: async function ({ api, event, args, message, Command }) {
    const addMode = args.length > 0 && (args[0] === "-a" || args[0] === "--add");
    const promptArgs = addMode ? args.slice(1) : args;
    const prompt = promptArgs.join(" ").trim();

    if (!prompt) {
      return message.reply(
        addMode
          ? "⚠️ Usage: {p}edit -a <text> (reply to an image)"
          : "⚠️ Please provide some text for the image."
      );
    }

    const imgUrl = getReplyImageUrl(event);
    if (!imgUrl) {
      return message.reply("⚠️ Please reply to an image.");
    }

    if (addMode) {
      api.setMessageReaction("🫩", event.messageID, () => {}, true);
    } else {
      api.setMessageReaction("🐣", event.messageID, () => {}, true);
      return runEditRequest({ api, event, prompt, imageUrls: [imgUrl], reactionMsgID: event.messageID, message });
    }

    return message.reply(
      "📷 𝐀𝐝𝐝 𝐚𝐧𝐨𝐭𝐡𝐞𝐫 𝐩𝐡𝐨𝐭𝐨 — reply to this message with the 2nd image.",
      (err, info) => {
        if (err || !info) {
          api.setMessageReaction("❌", event.messageID, () => {}, true);
          return;
        }

        Command.handleReply.push({
          name: this.config.name,
          messageID: info.messageID,
          author: event.senderID,
          prompt,
          imageUrls: [imgUrl],
          reactionMsgID: event.messageID,
        });
      }
    );
  },

  onReply: async function ({ api, event, Reply, message }) {
    if (event.senderID !== Reply.author) {
      return;
    }

    const secondUrl = getOwnImageUrl(event);
    if (!secondUrl) {
      return message.reply("⚠️ Please reply to this message with a photo (image attachment).");
    }

    api.setMessageReaction("🐣", event.messageID, () => {}, true);

    return runEditRequest({
      api,
      event,
      prompt: Reply.prompt,
      imageUrls: [...Reply.imageUrls, secondUrl],
      reactionMsgID: event.messageID,
      message
    });
  }
};

const API_BASE = "https://qwen-xdi.onrender.com/edit";

function getReplyImageUrl(event) {
  if (
    event.messageReply &&
    event.messageReply.attachments &&
    event.messageReply.attachments[0]
  ) {
    return event.messageReply.attachments[0].url;
  }
  return null;
}

function getOwnImageUrl(event) {
  if (event.attachments && event.attachments[0]) {
    return event.attachments[0].url;
  }
  return null;
}

/** Shared: build the backend request and send back the edited image. */
async function runEditRequest({ api, event, prompt, imageUrls, reactionMsgID, message }) {
  try {
    const params = new URLSearchParams();
    params.set("image", imageUrls[0]);
    if (imageUrls[1]) params.set("image2", imageUrls[1]);
    params.set("prompt", prompt);

    const requestURL = `${API_BASE}?${params.toString()}`;

    const res = await axios.get(requestURL, { timeout: 120000 });
    const data = res.data;
    const finalImageURL = data && data.success ? data.imageUrl : null;

    if (!finalImageURL) {
      const errMsg = (data && (data.error || data.message)) || "Unknown reason";
      api.setMessageReaction("⚠️", reactionMsgID, () => {}, true);
      return message.reply(`❌ API Error: ${errMsg}`);
    }

    const cacheDir = path.join(__dirname, "cache");
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

    const imageResponse = await axios.get(finalImageURL, {
      responseType: "arraybuffer",
      timeout: 60000
    });

    const filePath = path.join(cacheDir, `${Date.now()}.jpg`);
    fs.writeFileSync(filePath, Buffer.from(imageResponse.data));

    api.setMessageReaction("🧃", reactionMsgID, () => {}, true);
    
    return message.reply(
      {
        body: "> 🎀 𝐃𝐨𝐧𝐞",
        attachment: fs.createReadStream(filePath)
      },
      () => {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      }
    );
  } catch (err) {
    api.setMessageReaction("❌", reactionMsgID, () => {}, true);
    return message.reply("❌ Error while processing the image.");
  }
                                 }
