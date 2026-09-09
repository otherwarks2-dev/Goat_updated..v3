module.exports = {
  config: {
    name: "botnick",
    aliases: ["sn"],
    version: "1.0",
    author: "BaYjid",
    countDown: 5,
    role: 1,
    shortDescription: {
      en: "Change nickname of the bot in all group chats"
    },
    longDescription: {
      en: "Change nickname of the bot in all group chats"
    },
    category: "owner",
    guide: {
      en: "{pn} <new nickname>"
    },
    envConfig: {
      delayPerGroup: 250
    }
  },

  langs: {
    en: {
      missingNickname: "Please enter the new nickname for the bot",
      changingNickname: "Start changing bot nickname to '%1' in %2 group chats",
      errorChangingNickname: "An error occurred while changing nickname in %1 groups:\n%2",
      successMessage: "✅ Successfully changed nickname in all group chats to '%1'",
      sendingNotification: "Sending notification to %1 group chats."
    }
  },

  onStart: async function({ api, args, threadsData, message, getLang }) {
    const newNickname = args.join(" ");

    if (!newNickname) {
      return message.reply(getLang("invalidInput"));
    }

    const botID = api.getCurrentUserID ? api.getCurrentUserID() : (global.GoatBot?.botID || null);
    const isBotActiveGroup = t => {
      if (!t || t.isGroup !== true) return false;
      if (t.threadID && String(t.threadID).includes("@msgr")) return false;
      if (t.isSubscribed === false) return false;
      if (Array.isArray(t.members) && botID) {
        const botMember = t.members.find(m => String(m.userID) === String(botID));
        if (botMember && botMember.inGroup === false) return false;
      }
      return true;
    };

    const allThreadID = (await threadsData.getAll()).filter(isBotActiveGroup);
    const threadIds = allThreadID.map(thread => thread.threadID);

    const nicknameChangePromises = threadIds.map(async threadId => {
      try {
        await api.changeNickname(newNickname, threadId, api.getCurrentUserID());
        return threadId;
      } catch (error) {
        console.error(`Failed to change nickname for thread ${threadId}: ${error.message}`);
        return null;
      }
    });

    const failedThreads = (await Promise.allSettled(nicknameChangePromises))
      .filter(result => result.status === "rejected")
      .map(result => result.reason.message);

    if (failedThreads.length === 0) {
      message.reply(getLang("successMessage", newNickname));
    } else {
      message.reply(getLang("partialSuccessMessage", newNickname, failedThreads.join(", ")));
    }
    message.reply(getLang("sendingNotification", allThreadID.length));
  }
};
