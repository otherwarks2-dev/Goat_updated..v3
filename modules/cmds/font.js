const axios = require("axios");

let fontPages = {};

const fontPreviews = {
  1: "Ă̈z̆̈ă̈d̆̈",
  2: "A̷z̷a̷d̷",
  3: "𝗔𝗭𝗔𝗗",
  4: "𝘈𝘡𝘈𝘋",
  5: "[A][Z][A][D]",
  6: "𝕬𝖟𝖆𝖉",
  7: "ＡＺＡＤ",
  8: "ᴬᶻᴬᴰ",
  9: "∀zɐᗡ",
  10: "🄰🅉🄰🄳",
  11: "🅰🆉🅰🅳",
  12: "𝒜𝓏𝒶𝒹",
  13: "𝓐𝔃𝓪𝓭",
  14: "𝔄𝔷𝔞𝔡",
  15: "𝔸𝕫𝕒𝕕",
  16: "A̸z̸a̸d̸",
  17: "A̽z̽a̽d̽",
  18: "A⃠z⃠a⃠d⃠",
  19: "A҉z҉a҉d҉",
  20: "A̶z̶a̶d̶",
  21: "Ȃz̑ȃd̑",
  22: "A̾z̾a̾d̾",
  23: "A͡z͡a͡d͡",
  24: "A⃗z⃗a⃗d⃗",
  25: "A⃘z⃘a⃘d⃘",
  26: "Ăz̆ăd̆",
  27: "A̲z̲a̲d̲",
  28: "A̅z̅a̅d̅",
  29: "A͇z͇a͇d͇",
  30: "A̺z̺a̺d̺",
  31: "A̬z̬a̬d̬",
  32: "A⃔z⃔a⃔d⃔",
  33: "A⃕z⃕a⃕d⃕",
  34: "Ảz̉ảd̉",
  35: "A͆z͆a͆d͆",
  36: "A̽z̽a̽d̽",
  37: "A̫z̫a̫d̫",
  38: "A⃒z⃒a⃒d⃒",
  39: "A͓̽z͓̽a͓̽d͓̽",
  40: "A⃘z⃘a⃘d⃘",
  41: "A⃖z⃖a⃖d⃖",
  42: "A⃗z⃗a⃗d⃗",
  43: "A⃒z⃒a⃒d⃒",
  44: "A⃩z⃩a⃩d⃩",
  45: "A⃗z⃗a⃗d⃗",
  46: "A⃒z⃒a⃒d⃒",
  47: "A̤z̤a̤d̤",
  48: "A̰z̰a̰d̰",
  49: "A̾z̾a̾d̾",
  50: "A⃜z⃜a⃜d⃜"
};

module.exports = {
  config: {
    author: "RS RIFAT",
    name: "font",
    aliases: ["fonts"],
    version: "2.3.0",
    role: 0,
    shortDescription: "Convert text to stylish fonts using API",
    longDescription: "Generate stylish fonts from text using 50 different styles via API",
    category: "utility",
    guide: {
      en: "{pn} list - show all font styles\n{pn} <style number> <text> - convert text to font\nExample: {pn} 12 HelloWorld"
    }
  },

  onStart: async function({ api, event, args }) {
    try {
      const threadID = event.threadID;
      const messageID = event.messageID;

      if (!args.length) {
        return api.sendMessage({
          body: `🎨 𝗙𝗢𝗡𝗧 𝗚𝗘𝗡𝗘𝗥𝗔𝗧𝗢𝗥 🎨\n━━━━━━━━━━━━━━━━\n\n📖 Usage:\n• font list - Show all 50 styles\n• font <number> <text> - Convert text\n\n📌 Example:\nfont list\nfont 12 HelloWorld`
        }, threadID, messageID);
      }

      const arg0 = args[0].toLowerCase();

      if (arg0 === "list") {
        fontPages[threadID] = 1;
        return showFontList(threadID, fontPages[threadID], api, messageID);
      }

      if ((arg0 === "next" || arg0 === "prev" || arg0 === "page") && fontPages[threadID]) {
        let page = fontPages[threadID];
        if (arg0 === "next") page++;
        else if (arg0 === "prev") page = Math.max(page - 1, 1);
        else if (arg0 === "page" && args[1]) {
          const requestedPage = parseInt(args[1]);
          if (!isNaN(requestedPage) && requestedPage > 0) page = requestedPage;
        }
        fontPages[threadID] = page;
        return showFontList(threadID, page, api, messageID);
      }

      const styleNum = parseInt(arg0);
      if (!isNaN(styleNum)) {
        const text = args.slice(1).join(" ");
        if (!text) return api.sendMessage(`❌ Please provide text to convert.\nUsage: font ${styleNum} <text>`, threadID, messageID);

        try {
          const url = `https://azadx69x-all-apis-top.vercel.app/api/fontstyle`;
          const res = await axios.get(url, { params: { text, style: styleNum }, timeout: 10000 });

          if (res.data.success && res.data.output) {
            return api.sendMessage({
              body: `✨ 𝗙𝗢𝗡𝗧 𝗦𝗧𝗬𝗟𝗘 ${styleNum} ✨\n━━━━━━━━━━━━━━━━\n${res.data.output}`
            }, threadID, messageID);
          }
        } catch (err) {
          console.error("API Error:", err.message);
        }
        
        const output = convertTextLocally(styleNum, text);
        return api.sendMessage({
          body: `✨ 𝗙𝗢𝗡𝗧 𝗦𝗧𝗬𝗟𝗘 ${styleNum} (Local Fallback) ✨\n━━━━━━━━━━━━━━━━\n${output}\n⚠️ Note: API unavailable`
        }, threadID, messageID);
      }

      return api.sendMessage(`❌ Invalid command format!\nUsage:\n• font list - Show all 50 styles\n• font <1-50> <text>\nExample: font 12 HelloWorld`, threadID, messageID);

    } catch (error) {
      console.error("Font command error:", error);
      return api.sendMessage("❌ An error occurred while processing the font command.", event.threadID, event.messageID);
    }
  }
};

function showFontList(threadID, page, api, messageID) {
  const perPage = 15;
  const totalPages = Math.ceil(50 / perPage);
  const startIndex = (page - 1) * perPage;
  const endIndex = Math.min(startIndex + perPage, 50);

  let message = `🎨 𝗙𝗢𝗡𝗧 𝗦𝗧𝗬𝗟𝗘𝗦 🎨\n📄 Page: ${page}/${totalPages}\n━━━━━━━━━━━━━━━━\n`;
  for (let i = startIndex; i < endIndex; i++) message += `${i + 1}.➤ ${fontPreviews[i + 1]}\n`;

  message += `\n📖 Usage: font <number> <text>\n📌 Example: font 12 HelloWorld\n⏭️ Navigation: Reply "next" or "prev"`;

  return api.sendMessage({ body: message }, threadID, messageID);
}

function convertTextLocally(styleNum, text) {
  const base = "Azad";
  const preview = fontPreviews[styleNum] || base;

  const map = {};
  for (let i = 0; i < base.length; i++) map[base[i]] = preview[i] || base[i];

  return text.split('').map(c => map[c] || c).join('');
}
