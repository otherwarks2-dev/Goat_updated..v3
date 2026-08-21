const axios = require('axios');
const FormData = require('form-data');

module.exports = {
  config: {
    name: "imgbb",
    aliases: ["i"],
    version: "1.9",
    author: "RS RIFAT",//Author change korle tor marechudi
    countDown: 5,
    role: 0,
    shortDescription: { en: "Convert an image to image URL" },
    longDescription: { en: "Upload image to Imgbb by replying to a photo or sending it directly" },
    category: "tools",
    guide: { en: "{pn} reply to an image or send an image directly" }
  },

  onStart: async function({ api, event }) {
    let attachment = event.messageReply?.attachments?.[0] || event.attachments?.[0];
    if (!attachment) return api.sendMessage('Please reply to a valid image.', event.threadID, event.messageID);

    const imageUrl = attachment.url || attachment.previewUrl;
    if (!imageUrl) return api.sendMessage('Please reply to a valid image.', event.threadID, event.messageID);

    try {
      const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
      const imageBuffer = Buffer.from(imageResponse.data, 'binary');

      const form = new FormData();
      form.append('key', 'd579af626f6e98719d175780e78a9e16');
      form.append('image', imageBuffer.toString('base64'));

      const response = await axios.post('https://api.imgbb.com/1/upload', form, { headers: form.getHeaders() });
      const result = response.data.data;

      const formatBox = ({ title, link, author, type, size }) => {
        const width = 50;
        const pad = (text) => {
          const len = text.replace(/[\u{1F300}-\u{1F6FF}]/gu, '').length;
          const spaces = width - len - 2;
          return text + ' '.repeat(spaces > 0 ? spaces : 0);
        };
        const wrapText = (text, maxWidth) => {
          const regex = new RegExp(`.{1,${maxWidth}}`, 'g');
          return text.match(regex) || [];
        };
        const wrappedLink = wrapText(link, width - 4);
        let box = `╔${'═'.repeat(width)}╗\n`;
        box += `║ ${pad(title)} ║\n`;
        box += `╠${'═'.repeat(width)}╣\n`;
        wrappedLink.forEach(line => {
          box += `║ ${pad(line)} ║\n`;
        });
        if (type) box += `║ ${pad('🖼️ Type: ' + type)} ║\n`;
        if (size) box += `║ ${pad('📦 Size: ' + size + ' bytes')} ║\n`;
        box += `╚${'═'.repeat(width)}╝\n`;
        box += `✨ Author ${author}`;
        return box;
      };

      const msg = formatBox({
        title: '✅ 𝗜𝗠𝗚𝗕𝗕 𝗨𝗣𝗟𝗢𝗔𝗗 𝗦𝗨𝗖𝗖𝗘𝗦𝗦',
        link: result.url,
        author: this.config.author,
        type: result.image.format,
        size: result.image.size
      });

      return api.sendMessage(msg, event.threadID, event.messageID);

    } catch (err) {
      console.error(err);
      return api.sendMessage('❌ Failed to upload image to Imgbb.', event.threadID, event.messageID);
    }
  }
};
