module.exports = {
  config: {
    name: "slot",
    version: "1.1",
    author: "RS RIFAT",
    countDown: 5,
    role: 0,
    category: "game",
    description: "🎰 Balanced Slot! Fair wins and losses",
    usage: "slot <amount>"
  },

  onStart: async function({ event, api, usersData, args }) {
    const userId = event.senderID;
    const threadID = event.threadID;
    const bet = parseInt(args[0]);
    
    let user = await usersData.get(userId);
    if (!user) {
      user = { money: 1000 };
      await usersData.set(userId, user);
    }

    if (!bet || bet <= 0)
      return api.sendMessage(`⚠️ Invalid bet!`, threadID, event.messageID);

    if (user.money < bet)
      return api.sendMessage(`❌ Not enough balance.\n💰 Balance: ${user.money}$`, threadID, event.messageID);

    user.money -= bet;

    const symbols = ["🍒","🍋","🔔","⭐","💎","7️⃣","🍀","🍉","🍇","🥭","🍌","🍓","🍍","🍎","🌟","💰"];

    const rareMultipliers = { 
      "💎":8, "⭐":6, "7️⃣":10, "🍀":5, "🔔":4, "💰":12, "🌟":5 
    };

    const draw = () => symbols[Math.floor(Math.random() * symbols.length)];
    const s1 = draw(), s2 = draw(), s3 = draw();

    let winAmount = 0, status = "";

    if (s1 === s2 && s2 === s3) {
      winAmount = bet * (rareMultipliers[s1] || 3);
      status = `🎉🎊 JACKPOT! TRIPLE ${s1}! You won ${winAmount}$! 🎊🎉`;
    } else if (s1 === s2 || s1 === s3 || s2 === s3) {
      const doubleMultipliers = { "💎":4, "⭐":3, "7️⃣":5, "🍀":2, "🔔":2, "💰":6, "🌟":2 };
      const matchedSymbol = s1 === s2 ? s1 : s1 === s3 ? s1 : s2;
      winAmount = bet * (doubleMultipliers[matchedSymbol] || 1.5);
      status = `✅ MATCH! You won ${winAmount}$!`;
    } else {
      status = `😢 No match! You lost ${bet}$`;
    }

    user.money += winAmount;

    await usersData.set(userId, user);

    const createMessage = (a, b, c, st, bal) => `
╔═════════════════════╗
║               🎰 SLOTS 🎰       
╠═════════════════════╣
║               ${a}   ${b}   ${c}       
╠═════════════════════╣
║ ${st} 
╠═════════════════════╣
║ 📥 Bet: ${bet}$   │ 🪙 Balance: ${bal}$ 
╚═════════════════════╝
`;

    const finalStatus = winAmount >= bet * 8 ? `💥🔥 ${status} 🔥💥` : status;

    await api.sendMessage(createMessage(s1, s2, s3, finalStatus, user.money), threadID, event.messageID);
  }
};
