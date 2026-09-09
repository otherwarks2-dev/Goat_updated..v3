const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "ntc",
    version: "5.1.1",
    author: "RS.RIFAT",
    countDown: 5,
    role: 1, // Admin priority
    description: "Send stylish notice to groups by replying with serial numbers",
    category: "admin",
    guide: {
      en: "[all <msg> | list | reply with <serial(s)> <msg>]"
    }
  },

  onStart: async function ({ api, event, args, message, threadsData }) {
    const OWNER_UID = ["61557500431580"];
    const DATA_FILE = path.join(__dirname, "ntcGroups.json");

    if (!OWNER_UID.includes(event.senderID)) {
      return message.reply("❌ You are not authorized to use ntc!");
    }

    // Load or initialize state
    if (!global.ntcState) global.ntcState = { listMsgID: null, groupsData: {} };

    // Function to get active group threads
    const getGroupThreads = async () => {
      let groups = [];
      if (threadsData && typeof threadsData.getAll === "function") {
        try {
          const allThreads = await threadsData.getAll();
          groups = allThreads.filter(t => t && t.isGroup && !t.threadID?.includes("@msgr"));
        } catch (e) {
          console.error(e);
        }
      }
      if (!groups.length && global.db && Array.isArray(global.db.allThreadData)) {
        groups = global.db.allThreadData.filter(t => t && t.isGroup && !t.threadID?.includes("@msgr"));
      }
      if (!groups.length && api && typeof api.getThreadList === "function") {
        try {
          const threadList = await api.getThreadList(100, null, ["INBOX"]);
          groups = threadList.filter(t => t && t.isGroup && !t.threadID?.includes("@msgr"));
        } catch (e) {
          console.error(e);
        }
      }
      return groups;
    };

    // Function to save groups
    const saveGroups = (groups) => {
      const data = {};
      groups.forEach((g, index) => {
        const i = index + 1;
        const memberCount = g.participantIDs?.length || g.members?.length || 0;
        data[i] = {
          serial: `#${i}`,
          name: `📌 ${g.threadName || g.name || "Unknown"}`,
          threadID: g.threadID,
          members: `👥 ${memberCount}`
        };
      });
      try {
        fs.writeJsonSync(DATA_FILE, data, { spaces: 2 });
      } catch (e) {
        console.error(e);
      }
      return data;
    };

    const makeStylishNotice = (bodyMsg) => {
      return `ㅤ️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️𝙽𝙾𝚃𝙸𝙵𝙸𝙲𝙰𝚃𝙸𝙾𝙽 𝙵𝚁𝙾𝙼 __-么 RS- __-RIFAT-_\n☆━━━━━━━━━━━━━━━━━━☆\n${bodyMsg}`;
    };

    try {
      // LIST COMMAND
      if (args[0] === "list") {
        const activeGroups = await getGroupThreads();
        global.ntcState.groupsData = saveGroups(activeGroups);

        let text = "📋 𝗚𝗿𝗼𝘂𝗽 𝗟𝗶𝘀𝘁 📋\n────────────────────\n";
        for (let i in global.ntcState.groupsData) {
          const g = global.ntcState.groupsData[i];
          text += `${i} ${g.name}\n🆔 UID: ${g.threadID}\n${g.members}\n\n`;
        }

        return message.reply(text, (err, info) => {
          if (err || !info) return;
          global.ntcState.listMsgID = info.messageID;
          if (global.GoatBot && global.GoatBot.onReply) {
            global.GoatBot.onReply.set(info.messageID, {
              commandName: this.config.name,
              messageID: info.messageID,
              author: event.senderID
            });
          }
        });
      }

      // SEND TO ALL
      else if (args[0] === "all") {
        const msg = args.slice(1).join(" ");
        if (!msg) return message.reply("⚠️ Usage: ntc all <Message>");

        if (!Object.keys(global.ntcState.groupsData).length) {
          const activeGroups = await getGroupThreads();
          global.ntcState.groupsData = saveGroups(activeGroups);
        }

        const notice = makeStylishNotice(msg);
        let count = 0;
        for (let i in global.ntcState.groupsData) {
          try {
            await api.sendMessage(notice, global.ntcState.groupsData[i].threadID);
            count++;
          } catch (e) {
            console.error(`Failed to send ntc to group ${global.ntcState.groupsData[i].threadID}`, e);
          }
        }
        return message.reply(`✅ Notice sent to ${count} groups.`);
      }

      else {
        return message.reply("⚡ Usage: ntc [all <msg> | list | reply with <serial(s)> <msg>]");
      }
    } catch (e) {
      console.error(e);
      return message.reply("❌ Error executing command!");
    }
  },

  onReply: async function ({ api, event, Reply, message }) {
    const OWNER_UID = ["61557500431580"];
    if (!OWNER_UID.includes(event.senderID)) return;

    const { groupsData } = global.ntcState || {};
    if (!groupsData) return;

    const parts = event.body.trim().split(" ");
    const serials = parts.filter(x => /^\d+$/.test(x));
    const msg = parts.filter(x => !/^\d+$/.test(x)).join(" ");

    if (!serials.length || !msg) {
      return message.reply("⚠️ Reply format: <serial(s)> <message>");
    }

    const makeStylishNotice = (bodyMsg) => {
      return `ㅤ️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️𝙽𝙾𝚃𝙸𝙵𝙸𝙲𝙰𝚃𝙸𝙾𝙽 𝙵𝚁𝙾𝙼 __-么 RS- __-RIFAT-_\n☆━━━━━━━━━━━━━━━━━━☆\n${bodyMsg}`;
    };

    const failed = [];
    for (let s of serials) {
      const target = groupsData[s];
      if (!target) { failed.push(s); continue; }
      try {
        await api.sendMessage(makeStylishNotice(msg), target.threadID);
      } catch (e) {
        failed.push(s);
      }
    }

    if (Reply && Reply.messageID) {
      try {
        api.unsendMessage(Reply.messageID);
      } catch (e) {}
    }

    let response = "✅ Notice sent successfully!";
    if (failed.length) response += `\n⚠️ Failed serials: ${failed.join(", ")}`;
    return message.reply(response);
  }
};
