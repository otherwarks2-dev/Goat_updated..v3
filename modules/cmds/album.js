const axios = require("axios");
const fs = require("fs");
const path = require("path");
const FormData = require("form-data");

module.exports = {
  config: {
    name: "album",
    aliases: ["al"],
    version: "5.1.0",
    author: "RS RIFAT",
    countDown: 2,
    role: 0,
    shortDescription: "𝐀𝐥𝐛𝐮𝐦 𝐕𝐢𝐝𝐞𝐨 Random",
    longDescription: "Random album videos",
    category: "media"
  },

  albumSystem: new Map(),
  albumBaseUrl: null,
  videoQueue: new Map(),
  
  async loadAlbumBaseUrl() {
    if (this.albumBaseUrl) return;
    try {
      const res = await axios.get(
        "https://raw.githubusercontent.com/ncazad/Azad69x/refs/heads/main/baseApiUrl.json"
      );
      this.albumBaseUrl = res.data.album.replace(/\/$/, "");
      console.log("Album API base URL loaded:", this.albumBaseUrl);
    } catch (e) {
      console.error("Failed to load album base URL:", e.message);
      this.albumBaseUrl = null;
    }
  },
  
  async fetchAlbumVideo(category) {
    await this.loadAlbumBaseUrl();
    if (!this.albumBaseUrl) return null;
    
    if (!this.videoQueue.has(category) || this.videoQueue.get(category).length === 0) {
      try {
        const res = await axios.get(`${this.albumBaseUrl}/api/album?category=${encodeURIComponent(category)}`);
        let videos = [];
        if (res.data?.url) videos.push(res.data.url);
        if (res.data?.videos?.length) videos = videos.concat(res.data.videos);

        if (!videos.length) return null;

        videos = this.shuffleArray(videos);
        this.videoQueue.set(category, videos);
      } catch (e) {
        console.error(`Failed to fetch video for ${category}:`, e.message);
        return null;
      }
    }

    const queue = this.videoQueue.get(category);
    const videoUrl = queue.shift();
    this.videoQueue.set(category, queue);
    return videoUrl;
  },
  
  shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  },
  
  async uploadToCatbox(videoPath) {
    const form = new FormData();
    form.append("reqtype", "fileupload");
    form.append("fileToUpload", fs.createReadStream(videoPath));

    const res = await axios.post("https://catbox.moe/user/api.php", form, { headers: form.getHeaders() });
    fs.unlinkSync(videoPath);
    return res.data.trim();
  },
  
  onStart: async function ({ message, event, args }) {
    const displayNames = [
      "𝐀𝐙𝐀𝐃𝐗69𝐗𝐅𝐅 🐼","𝐀𝐧𝐢𝐦𝐞 💫","𝐀𝐨𝐓 ⚡","𝐀𝐭𝐭𝐢𝐭𝐮𝐝𝐞 😼",
      "𝐁𝐚𝐛𝐲 👶","𝐂𝐚𝐭 🐈","𝐂𝐨𝐮𝐩𝐥𝐞 💑","𝐃𝐫𝐚𝐠𝐨𝐧𝐁𝐚𝐥𝐥 🐉",
      "𝐅𝐥𝐨𝐰𝐞𝐫 🌺","𝐅𝐨𝐨𝐭𝐛𝐚𝐥𝐥 ⚽","𝐅𝐫𝐞𝐞𝐅𝐢𝐫𝐞 🔥","𝐅𝐫𝐢𝐞𝐧𝐝𝐬 🫂",
      "𝐅𝐮𝐧𝐧𝐲 🤣","𝐇𝐨𝐫𝐧𝐲 💦","𝐇𝐨𝐭 🥵","𝐈𝐬𝐥𝐚𝐦𝐢𝐜 😊",
      "𝐋𝐨𝐅𝐈 🎶","𝐋𝐨𝐯𝐞 💝","𝐋𝐲𝐫𝐢𝐜𝐬 🎵","𝐒𝐚𝐝 😿"
    ];

    const realCategories = [
      "Azadx69xff","anime","aot","attitude","baby","cat","couple","dragonball",
      "flower","football","freefire","friends","funny","horny","hot","islamic",
      "lofi","love","lyrics","sad"
    ];
    
    if (args[0] && args[0].toLowerCase() === "add" && args[1]) {
      const cat = args[1].toLowerCase();
      if (!realCategories.includes(cat)) return message.reply("❌ Invalid category name.");

      if (!this.albumSystem.has(event.senderID)) this.albumSystem.set(event.senderID, []);
      this.albumSystem.get(event.senderID).push(cat);

      return message.reply(`✅ Album category "${cat}" added to your list.`);
    }
    
    const itemsPerPage = 10;
    const page = parseInt(args[0]) || 1;
    const totalPages = Math.ceil(displayNames.length / itemsPerPage);
    if (page < 1 || page > totalPages) return message.reply("❌ Invalid page");

    const startIndex = (page - 1) * itemsPerPage;
    const categoriesToShow = displayNames.slice(startIndex, startIndex + itemsPerPage);

    let text = "╭─❍𝐀𝐋𝐁𝐔𝐌 𝐕𝐈𝐃𝐄𝐎 𝐋𝐈𝐒𝐓❍─╮\n\n";
    categoriesToShow.forEach((cat, i) => text += `✦ ${i + 1}. ${cat}\n`);
    text += `\n╰─❍ 𝐏𝐚𝐠𝐞 : ${page}/${totalPages} ❍─╯\n`;
    text += "💬 𝐑𝐞𝐩𝐥𝐲 𝐚 𝐧𝐮𝐦𝐛𝐞𝐫 𝐭𝐨 𝐠𝐞𝐭 𝐚 𝐯𝐢𝐝𝐞𝐨 🐱";

    const sent = await message.reply(text);

    global.GoatBot.onReply.set(sent.messageID, {
      commandName: "album",
      author: event.senderID,
      pageCategories: categoriesToShow.map((_, i) => realCategories[startIndex + i]),
      pageDisplayNames: categoriesToShow,
      messageID: sent.messageID
    });
  },
  
  onReply: async function ({ message, event, Reply }) {
    if (event.senderID !== Reply.author) return;
    
    const num = parseInt(event.body);
    if (isNaN(num)) return;

    const index = num - 1;
    const category = Reply.pageCategories[index];
    const displayName = Reply.pageDisplayNames[index];
    if (!category) return message.reply("❌ Invalid number");

    const videoUrl = await this.fetchAlbumVideo(category);
    if (!videoUrl) return message.reply(`❌ No videos found for ${displayName}`);

    try { await message.unsend(Reply.messageID); } catch(e){}

    await message.reply({
      body: `✨ 𝐀𝐋𝐁𝐔𝐌 𝐕𝐈𝐃𝐄𝐎 🌸\n\n📁 𝐂𝐚𝐭𝐞𝐠𝐨𝐫𝐲 : ${displayName}\n\n🐸 𝐄𝐧𝐣𝐨𝐲 𝐘𝐨𝐮𝐫 𝐕𝐢𝐝𝐞𝐨 🖤`,
      attachment: await global.utils.getStreamFromURL(videoUrl)
    });
  }
};
