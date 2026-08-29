module.exports = {
    config: {
        name: "offbot",
        version: "1.0.0",
        author: "RS RIFAT",
        role: 2, // ২ মানে শুধু Bot Admin ব্যবহার করতে পারবে
        shortDescription: {
            en: "turn the bot off"
        },
        longDescription: {
            en: "Turn off the bot execution"
        },
        category: "system",
        guide: {
            en: "{p}offbot"
        },
        countDown: 0
    },

    onStart: async function ({ api, event, message }) {
        return message.reply(`[ OK ] ${global.GoatBot.config.nickNameBot || "Bot"} is now turned off.`, () => {
            process.exit(0);
        });
    }
};
