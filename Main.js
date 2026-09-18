/**
 *  GOATBOT V3 
 *  NOTES : THIS CODE MADE BY RX @RX_ABDULLAH007 (GIVE CREDIT OTHERWISE EVERYONE FUCK YOU AT 300 KM SPEED)
 **/

process.on('unhandledRejection', error => console.log(error));
process.on('uncaughtException', error => console.log(error));

// ——————————— IMPORTS ——————————— //
const defaultRequire = require;
const gradient = defaultRequire("gradient-string");
const axios = defaultRequire("axios");
const fs = defaultRequire("fs-extra");
const path = defaultRequire("path");
const readline = defaultRequire("readline");
const login = require("@rxabdullah/xdi-fca");
const https = defaultRequire("https");
const { execSync } = require('child_process');
const log = require('./utils/logger/log.js');

process.stdout.write("\x1b]2;GOAT BOT V3 - MADE BY RX\x1b\x5c");
process.env.BLUEBIRD_W_FORGOTTEN_RETURN = 0;

// ——————————— GLOBAL UTILS & VARIABLES ——————————— //
const { writeFileSync, readFileSync, existsSync, watch } = require("fs-extra");
const handlerWhenListenHasError = require("./includes/rX/handlerWhenListenHasError.js");
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

// ——————————— CONFIG PATH FUNCTIONS ——————————— //
function getConfigPath(baseName, ext = ".json") {
	const devPath = path.join(__dirname, `${baseName}.dev${ext}`);
	const normalPath = path.join(__dirname, `${baseName}${ext}`);
	if (fs.existsSync(devPath)) return devPath;
	if (fs.existsSync(normalPath)) return normalPath;
	throw new Error(`Missing ${baseName}${ext} or ${baseName}.dev${ext}`);
}

function validJSON(pathDir) {
	if (!fs.existsSync(pathDir)) throw new Error(`File "${pathDir}" not found`);
	execSync(`npx jsonlint "${pathDir}"`, { stdio: 'pipe' });
	return true;
}

// ——————————— CONFIG FILES ——————————— //
const dirConfig = getConfigPath("config", ".json");
const dirConfigCommands = getConfigPath("configCommands", ".json");
const dirAccount = getConfigPath("account", ".txt");

[dirConfig, dirConfigCommands].forEach(pathDir => validJSON(pathDir));

// Load config files once
const config = require(dirConfig);
const configCommands = require(dirConfigCommands);

// ——————————— GLOBAL OBJECTS ——————————— //
global.GoatBot = {
	startTime: Date.now() - process.uptime() * 1000,
	commands: new Map(),
	eventCommands: new Map(),
	aliases: new Map(),
	onFirstChat: [],
	onChat: [],
	onEvent: [],
	onReply: new Map(),
	onReaction: new Map(),
	onAnyEvent: [],
	config: config,
	configCommands: configCommands,
	envCommands: configCommands.envCommands,
	envEvents: configCommands.envEvents,
	envGlobal: configCommands.envGlobal,
	reLoginBot: function () { },
	Listening: null
};

// utils load after global exists
global.utils = require("./utils/utils.js");
const { colors, getText } = global.utils;

// ——————————— DATABASE / CLIENT / TEMP ——————————— //
global.db = {
	allThreadData: [],
	allUserData: [],
	allDashBoardData: [],
	allGlobalData: [],
	threadModel: null,
	userModel: null,
	dashboardModel: null,
	globalModel: null,
	threadsData: null,
	usersData: null,
	dashBoardData: null,
	globalData: null,
	receivedTheFirstMessage: {}
};

global.client = {
	dirConfig,
	dirConfigCommands,
	dirAccount,
	countDown: {},
	cache: {},
	database: {
		creatingThreadData: [],
		creatingUserData: [],
		creatingDashBoardData: [],
		creatingGlobalData: []
	},
	commandBanned: configCommands.commandBanned
};

global.temp = {
	createThreadData: [],
	createUserData: [],
	// Map<threadID, lastFailureTimestamp> — a thread that failed to create
	// (e.g. a transient api.getThreadInfo error) is only skipped for a short
	// cooldown, then retried on the next incoming message, instead of being
	// silently ignored forever until the bot restarts.
	createThreadDataError: new Map(),
	filesOfGoogleDrive: { arraybuffer: {}, stream: {}, fileNames: {} },
	contentScripts: { cmds: {}, events: {} }
};

// ——————————— CONFIG WATCHER ——————————— //
const watchAndReloadConfig = (dir, type, prop, logName) => {
	let lastModified = fs.statSync(dir).mtimeMs;
	fs.watch(dir, (eventType) => {
		if (eventType === type) {
			const oldConfig = global.GoatBot[prop];
			setTimeout(() => {
				try {
					// NOTE: previously a "skip the first change" flag lived
					// here, meant to ignore the fs.watch fire caused by the
					// bot's own initial file touch. In practice it also
					// swallowed the FIRST real edit made after boot (e.g.
					// the very first {p}adminonly on / off), so the in-memory
					// config silently never updated on that first toggle —
					// only a second save (or a full restart) would apply it.
					// mtimeMs comparison below already prevents redundant
					// reloads, so the extra flag wasn't needed.
					if (lastModified === fs.statSync(dir).mtimeMs) return;
					global.GoatBot[prop] = JSON.parse(fs.readFileSync(dir, 'utf-8'));
					log.success(logName, `Reloaded ${dir.replace(process.cwd(), "")}`);
				} catch {
					log.warn(logName, `Can't reload ${dir.replace(process.cwd(), "")}`);
					global.GoatBot[prop] = oldConfig;
				} finally {
					lastModified = fs.statSync(dir).mtimeMs;
				}
			}, 200);
		}
	});
};

watchAndReloadConfig(dirConfigCommands, 'change', 'configCommands', 'CONFIG COMMANDS');
watchAndReloadConfig(dirConfig, 'change', 'config', 'CONFIG');

// ——————————— BOT STARTUP LOGIC ——————————— //
const axiosInstance = axios.create({
	timeout: 30000,
	httpsAgent: new https.Agent({ keepAlive: true, maxSockets: 10 })
});

const { dirAccount: accountFile } = global.client;

function filterKeysAppState(appState) {
	return appState.filter(item => ["c_user", "xs", "datr", "fr", "sb", "i_user"].includes(item.key || item.name));
}

async function stopListening() {
	return new Promise(resolve => {
		try {
			global.GoatBot.fcaApi?.stopListening?.(() => resolve()) || resolve();
		} catch {
			resolve();
		} finally {
			global.GoatBot.Listening = null;
		}
	});
}

async function safeGetUserName(userID, api) {
	try {
		const userInfo = await api.getUserInfo(userID);
		return userInfo[userID]?.name || `User_${userID}`;
	} catch {
		return `User_${userID}`;
	}
}

async function startBot() {
	console.log(colors.hex("#f5ab00")("──────────────────────────────────────────────────"));
	if (global.GoatBot.Listening) await stopListening();
	if (!existsSync(accountFile)) { log.error("LOGIN", "Account file not found!"); process.exit(); }

	let appState;
	try { appState = JSON.parse(readFileSync(accountFile, "utf8")); }
	catch { log.error("LOGIN", "Invalid appstate.json format!"); process.exit(); }

	log.info("LOGIN", "Logging in with FCA...");
	const e2eeConfig = config.e2ee || {};
	const fcaOptions = {
		...config.optionsFca,
		enableE2EE: e2eeConfig.enable === true,
		e2eeMemoryOnly: e2eeConfig.saveType !== "path",
		...(e2eeConfig.devicePath ? { e2eeDevicePath: e2eeConfig.devicePath } : {}),
		...(e2eeConfig.deviceData ? { e2eeDeviceData: e2eeConfig.deviceData } : {})
	};
	login({ appState }, fcaOptions, async (error, api) => {
		if (error) { log.err("LOGIN", "FCA Login Failed:", error); return process.exit(); }

		global.GoatBot.fcaApi = api;
		global.botID = api.getCurrentUserID();

		log.info("LOGIN", "Login Success!");
		console.log(colors.hex("#f5ab00")("───────────────── BOT INFO ─────────────────"));

		const botName = await safeGetUserName(global.botID, api);
		log.info("BOT ID", `${global.botID} - ${botName}`);
		log.info("PREFIX", global.GoatBot.config.prefix);

		if (config.autoRefreshFbstate) {
			const newState = api.getAppState();
			writeFileSync(accountFile, JSON.stringify(filterKeysAppState(newState), null, 2));
			log.info("REFRESH", "Appstate updated successfully.");
		}

		const { threadModel, userModel, dashBoardModel, globalModel, threadsData, usersData, dashBoardData, globalData } =
			await require("./includes/rX/loadData.js")(api, c => c);

		global.GoatBot.usersData = usersData;

		await require("./includes/custom.js")({ api, threadsData, usersData, globalData, getText });
		await require("./includes/rX/loadScripts.js")(api, threadModel, userModel, dashBoardModel, globalModel, threadsData, usersData, dashBoardData, globalData, c => c);

		// Build the listener handler ONCE — requiring + invoking listen.js on
		// every single event was creating a new handler closure each time,
		// which re-wired all the internal state and caused subtle state bugs.
		const listenerHandler = require("./includes/listen.js")(
			api, threadModel, userModel, dashBoardModel, globalModel, usersData, threadsData, dashBoardData, globalData
		);

		// Track reconnect attempts for exponential backoff
		let reconnectAttempts = 0;
		const MAX_RECONNECT_DELAY = 60000; // cap at 60s

		function scheduleReconnect() {
			const delay = Math.min(5000 * Math.pow(2, reconnectAttempts), MAX_RECONNECT_DELAY);
			reconnectAttempts++;
			log.warn("LISTEN", `Reconnecting in ${delay / 1000}s (attempt #${reconnectAttempts})...`);
			setTimeout(() => startBot(), delay);
		}

		function callBackListen(err, event) {
			if (err) {
				log.err("LISTEN", "Connection Error, attempting restart...", err.message || err);
				return scheduleReconnect();
			}

			// Reset backoff on a successful event
			reconnectAttempts = 0;

			try {
				listenerHandler(event);
			} catch (e) {
				log.err("LISTEN", "Error processing listener event:", e.message || e);
			}
		}

		global.GoatBot.Listening = api.listenMqtt(callBackListen);

		// E2EE: without this call the bridge only ever connects lazily
		// (e.g. when api.sendMessage targets an @msgr/@g.us JID), and in
		// that lazy path no callback is registered — so incoming e2ee
		// messages/reactions/receipts are decrypted internally but never
		// forwarded to callBackListen, and no command ever fires even
		// though outgoing sends to e2ee threads work fine.
		//
		// FIX: We also set up an auto-reconnect for E2EE disconnects so
		// that groups don't go silent after 1-2 hours. The E2EE bridge can
		// drop its WS connection without the main MQTT listener dropping,
		// which is why group messages stop working while inbox (non-E2EE)
		// keeps running. We detect the disconnect event and reconnect the
		// bridge without a full bot restart.
		let e2eeReconnectTimer = null;

		async function connectE2EEWithRetry(attempt = 0) {
			if (typeof api.connectE2EE !== "function") return;
			try {
				await api.connectE2EE(callBackListen);
				log.info("E2EE", "E2EE bridge connected and wired to the listener.");
			} catch (e) {
				const delay = Math.min(5000 * Math.pow(2, attempt), 60000);
				log.warn("E2EE", `Failed to connect E2EE bridge (attempt #${attempt + 1}), retrying in ${delay / 1000}s:`, e && e.message ? e.message : e);
				e2eeReconnectTimer = setTimeout(() => connectE2EEWithRetry(attempt + 1), delay);
			}
		}

		// Hook into E2EE disconnect events so we can auto-reconnect the bridge
		// when Messenger's E2EE WS drops (this is what causes groups to go
		// silent after a while while inbox keeps working).
		if (typeof api.on === "function") {
			api.on("e2ee_disconnected", () => {
				log.warn("E2EE", "E2EE bridge disconnected — scheduling reconnect...");
				if (e2eeReconnectTimer) clearTimeout(e2eeReconnectTimer);
				e2eeReconnectTimer = setTimeout(() => connectE2EEWithRetry(0), 3000);
			});
		}

		await connectE2EEWithRetry(0);

		log.master("SUCCESS", "Bot is now active and listening to messages!");

		// ── MQTT KEEPALIVE WATCHDOG ──────────────────────────────────────────
		// The MQTT connection can silently stall after 1-2 hours (Facebook's
		// server drops the WS without sending a proper DISCONNECT frame).
		// When that happens, the bot appears alive (no error fires) but stops
		// receiving ALL messages — groups and inbox both go dead.
		// We track the timestamp of the last received event and restart the bot
		// if nothing arrives within the watchdog window (10 minutes default).
		global._lastMqttEventAt = Date.now();
		const WATCHDOG_INTERVAL_MS = 5 * 60 * 1000;  // check every 5 min
		const WATCHDOG_TIMEOUT_MS  = 10 * 60 * 1000; // restart if silent 10 min

		if (global._mqttWatchdog) clearInterval(global._mqttWatchdog);
		global._mqttWatchdog = setInterval(() => {
			const silent = Date.now() - global._lastMqttEventAt;
			if (silent > WATCHDOG_TIMEOUT_MS) {
				log.warn("WATCHDOG", `No MQTT event for ${Math.round(silent / 60000)} min — reconnecting bot...`);
				clearInterval(global._mqttWatchdog);
				startBot();
			}
		}, WATCHDOG_INTERVAL_MS);
	});
}

global.GoatBot.reLoginBot = startBot;

// ——————————— START BOT ——————————— //
// Git auto update no longer blocks boot (this used to time out deploys on
// hosts like Render). It now runs silently in the background after login —
// see modules/cmds/update.js (onLoad starts includes/rX/updateNotifier.js).
startBot();
