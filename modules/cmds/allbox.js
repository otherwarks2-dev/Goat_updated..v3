const moment = require("moment-timezone");

module.exports = {
  config: {
    name: "allbox",
    version: "1.0.0",
    author: "MOHAMMAD AKASH",
    countDown: 60,
    role: 1,
    shortDescription: "Manage all joined groups",
    longDescription: "List all groups and reply to Ban, Unban, Delete data, or remove the bot",
    category: "box chat",
    usages: "[page number/all]",
  },

  onStart: async function ({ event, api, commandName, threadsData }) {
    const { threadID, messageID } = event;

    try {
      let groups = [];

      if (threadsData && typeof threadsData.getAll === "function") {
        try {
          const allThreads = await threadsData.getAll();
          groups = allThreads.filter(t => t && t.isGroup).map(t => ({
            threadID: t.threadID,
            name: t.threadName || t.name || "Unnamed Group",
            messageCount: t.messageCount || 0
          }));
        } catch (e) {
          console.error(e);
        }
      }

      if (!groups.length && global.db && Array.isArray(global.db.allThreadData)) {
        groups = global.db.allThreadData.filter(t => t && t.isGroup).map(t => ({
          threadID: t.threadID,
          name: t.threadName || t.name || "Unnamed Group",
          messageCount: t.messageCount || 0
        }));
      }

      if (!groups.length && api && typeof api.getThreadList === "function") {
        try {
          const dataThreads = await api.getThreadList(100, null, ["INBOX"]);
          groups = dataThreads.filter(t => t && t.isGroup).map(t => ({
            threadID: t.threadID,
            name: t.threadName || t.name || "Unnamed Group",
            messageCount: t.messageCount || 0
          }));
        } catch (e) {
          console.error(e);
        }
      }

      if (!groups.length) return api.sendMessage("There are currently no groups!", threadID);

      // Sort groups by messageCount descending
      groups.sort((a, b) => (b.messageCount || 0) - (a.messageCount || 0));

      let msg = "🎭 GROUP LIST 🎭\n\n";
      const groupid = [];
      const groupName = [];

      groups.forEach((g, i) => {
        msg += `${i + 1}. ${g.name}\n🔰TID: ${g.threadID}\n💌MessageCount: ${g.messageCount || 0}\n\n`;
        groupid.push(g.threadID);
        groupName.push(g.name);
      });

      msg += "Reply to this message with: <ban | unban | del | out> + number or 'all'";

      api.sendMessage(msg, threadID, (err, info) => {
        if (err || !info) return;
        if (global.GoatBot && global.GoatBot.onReply) {
          global.GoatBot.onReply.set(info.messageID, {
            commandName,
            messageID: info.messageID,
            author: event.senderID,
            groupid,
            groupName,
            unsendTimeout: setTimeout(() => {
              try { api.unsendMessage(info.messageID); } catch (e) {}
            }, this.config.countDown * 1000)
          });
        }
      }, messageID);

    } catch (error) {
      console.error(error);
      api.sendMessage("Error fetching group list.", threadID);
    }
  },

  onReply: async function ({ event, Reply, api }) {
    const { author, groupid, groupName, messageID } = Reply;
    if (event.senderID !== author) return;

    const args = event.body.trim().toLowerCase().split(" ");
    if (Reply.unsendTimeout) clearTimeout(Reply.unsendTimeout);

    const action = args[0];
    const index = parseInt(args[1]) - 1;

    if (!["ban", "unban", "del", "out"].includes(action)) {
      return api.sendMessage("Invalid action. Use: ban, unban, del, out", event.threadID);
    }

    if (args[1] === "all") {
      for (let i = 0; i < groupid.length; i++) {
        await processGroup(action, i);
      }
      return api.sendMessage(`✅ ${action.toUpperCase()} executed on all groups.`, event.threadID);
    } else {
      if (index < 0 || index >= groupid.length) return api.sendMessage("Invalid number!", event.threadID);
      await processGroup(action, index);
    }

    async function processGroup(act, i) {
      const idgr = groupid[i];
      const gName = groupName[i];
      const Threads = global.GoatBot ? global.GoatBot.Threads : null;

      try {
        if (act === "ban" && Threads) {
          const data = (await Threads.getData(idgr))?.data || {};
          data.banned = 1;
          data.dateAdded = moment.tz("Asia/Dhaka").format("HH:mm:ss L");
          await Threads.setData(idgr, { data });
          if (global.data && global.data.threadBanned) {
            global.data.threadBanned.set(idgr, { dateAdded: data.dateAdded });
          }
          api.sendMessage(`✅ Banned: ${gName}`, event.threadID);
        }

        if (act === "unban" && Threads) {
          const data = (await Threads.getData(idgr))?.data || {};
          data.banned = 0;
          data.dateAdded = null;
          await Threads.setData(idgr, { data });
          if (global.data && global.data.threadBanned) {
            global.data.threadBanned.delete(idgr);
          }
          api.sendMessage(`✅ Unbanned: ${gName}`, event.threadID);
        }

        if (act === "del" && Threads) {
          const data = (await Threads.getData(idgr))?.data || {};
          await Threads.delData(idgr, { data });
          api.sendMessage(`✅ Data deleted: ${gName}`, event.threadID);
        }

        if (act === "out") {
          await api.removeUserFromGroup(api.getCurrentUserID(), idgr);
          api.sendMessage(`✅ Bot removed from: ${gName}`, event.threadID);
        }
      } catch (err) {
        console.error(`Failed executing ${act} on ${gName}`, err);
        api.sendMessage(`❌ Failed executing ${act} on ${gName}`, event.threadID);
      }
    }

    try {
      api.unsendMessage(messageID);
    } catch (e) {}
  }
};
