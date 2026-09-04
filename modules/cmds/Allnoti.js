const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "allnoti",
    version: "3.0",
    author: "〲MAMUNツ࿐ T.T o.O",
    role: 1,
    shortDescription: "Owner Broadcast",
    longDescription: "Send notification with owner name",
    category: "admin",
    guide: "{pn} <message>"
  },

  onStart: async function ({ api, event, args, threadsData }) {
    const msg = args.join(" ");
    if (!msg) return api.sendMessage("⚠️ Message dao!", event.threadID);

    let attachment = null;

    // Reply image support
    if (event.messageReply && event.messageReply.attachments && event.messageReply.attachments.length > 0) {
      try {
        const url = event.messageReply.attachments[0].url;
        const filePath = path.join(__dirname, "cache", "owner.jpg");

        const res = await axios.get(url, { responseType: "arraybuffer" });
        fs.writeFileSync(filePath, res.data);

        attachment = fs.createReadStream(filePath);
      } catch (e) {
        console.error("Error saving attachment for allnoti:", e);
      }
    }

    let threads = [];

    if (threadsData && typeof threadsData.getAll === "function") {
      try {
        const allThreads = await threadsData.getAll();
        threads = allThreads.filter(t => t && t.isGroup);
      } catch (e) {
        console.error(e);
      }
    }

    if (!threads.length && global.db && Array.isArray(global.db.allThreadData)) {
      threads = global.db.allThreadData.filter(t => t && t.isGroup);
    }

    if (!threads.length && api && typeof api.getThreadList === "function") {
      try {
        const threadList = await api.getThreadList(100, null, ["INBOX"]);
        threads = threadList.filter(t => t && t.isGroup);
      } catch (e) {
        console.error(e);
      }
    }

    let success = 0;
    let failed = 0;

    for (const thread of threads) {
      try {
        await new Promise(resolve => setTimeout(resolve, 1500));

        await api.sendMessage(
          {
            body: `🔔 𝙉𝙊𝙏𝙄𝙁𝙄𝘾𝘼𝙏𝙄𝙊𝙉\n━━━━━━━━━━━━━━━\n📢 From Owner: 〲MAMUNツ࿐ T.T o.O\n\n${msg}\n━━━━━━━━━━━━━━━`,
            attachment: attachment
          },
          thread.threadID
        );

        success++;
      } catch (e) {
        failed++;
      }
    }

    api.sendMessage(
      `✅ Done Owner Broadcast\n✔️ Success: ${success}\n❌ Failed: ${failed}`,
      event.threadID
    );
  }
};
