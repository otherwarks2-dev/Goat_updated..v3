const axios = require('axios');
const { config } = global.GoatBot;
const { log, getText } = global.utils;
if (global.timeOutUptime != undefined)
	clearTimeout(global.timeOutUptime);
if (!config.autoUptime.enable)
	return;

const PORT = config.dashBoard?.port || (!isNaN(config.serverUptime.port) && config.serverUptime.port) || 3001;

let myUrl = config.autoUptime.url || `https://${process.env.REPL_OWNER
	? `${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`
	: process.env.API_SERVER_EXTERNAL == "https://api.glitch.com"
		? `${process.env.PROJECT_DOMAIN}.glitch.me`
		: `localhost:${PORT}`}`;
myUrl.includes('localhost') && (myUrl = myUrl.replace('https', 'http'));
myUrl += '/uptime';

// FIX: The original code used setInterval INSIDE a setTimeout, which created
// a NEW interval every time autoUptime() was called — causing runaway memory
// leaks and duplicate pings. Now we use a simple recursive setTimeout so
// only one ping fires at a time, and the interval stays consistent.
let status = 'ok';
const INTERVAL_MS = (config.autoUptime.timeInterval || 180) * 1000;

async function autoUptime() {
	try {
		await axios.get(myUrl);
		if (status != 'ok') {
			status = 'ok';
			log.info("UPTIME", "Bot is online");
			// Custome notification here
		}
	}
	catch (e) {
		const err = e.response?.data || e;
		if (status == 'ok') {
			status = 'failed';
			if (err.statusAccountBot == "can't login") {
				log.err("UPTIME", "Can't login account bot");
				// Custome notification here
			}
			else if (err.statusAccountBot == "block spam") {
				log.err("UPTIME", "Your account is blocked");
				// Custome notification here
			}
		}
	}
	// Schedule next ping (recursive setTimeout, NOT setInterval inside callback)
	global.timeOutUptime = setTimeout(autoUptime, INTERVAL_MS);
}

// First ping after the configured interval
global.timeOutUptime = setTimeout(autoUptime, INTERVAL_MS);
log.info("AUTO UPTIME", getText("autoUptime", "autoUptimeTurnedOn", myUrl));
