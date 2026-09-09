const assert = require("assert");

// Helper mock structures to test listbox and allbox behavior
const listbox = require("../modules/cmds/listbox.js");
const allbox = require("../modules/cmds/allbox.js");

async function runTests() {
  console.log("Starting unit tests for group list commands...");

  const BOT_ID = "100000000000001";

  const mockApi = {
    getCurrentUserID: () => BOT_ID,
    sendMessage: (msg, threadID, cb) => {
      if (typeof cb === "function") {
        cb(null, { messageID: "msg_123" });
      }
      return Promise.resolve({ messageID: "msg_123" });
    }
  };

  const mockEvent = {
    threadID: "123456789",
    senderID: "987654321",
    messageID: "msg_000"
  };

  // Sample threads data
  const sampleThreads = [
    {
      threadID: "1001",
      threadName: "Active Group 1",
      isGroup: true,
      members: [
        { userID: BOT_ID, inGroup: true },
        { userID: "987654321", inGroup: true }
      ]
    },
    {
      threadID: "1002",
      threadName: undefined, // test name fallback
      isGroup: true,
      members: [
        { userID: BOT_ID, inGroup: true }
      ]
    },
    {
      threadID: "1003",
      threadName: "Left Group",
      isGroup: true,
      members: [
        { userID: BOT_ID, inGroup: false }, // bot left!
        { userID: "987654321", inGroup: true }
      ]
    },
    {
      threadID: "1004@msgr", // DMs or E2EE msgr thread
      threadName: "DM thread",
      isGroup: true,
      members: [
        { userID: BOT_ID, inGroup: true }
      ]
    },
    {
      threadID: "1005",
      threadName: "Non-group thread",
      isGroup: false,
      members: [
        { userID: BOT_ID, inGroup: true }
      ]
    },
    {
      threadID: "1006",
      threadName: "undefined", // string "undefined"
      isGroup: true,
      members: [
        { userID: BOT_ID, inGroup: true }
      ]
    }
  ];

  const mockThreadsData = {
    getAll: async () => sampleThreads
  };

  // Test listbox.onStart
  let sentMessage = "";
  const testApiListbox = {
    ...mockApi,
    sendMessage: (msg, threadID, cb) => {
      sentMessage = msg;
      if (typeof cb === "function") cb(null, { messageID: "msg_listbox" });
      return Promise.resolve({ messageID: "msg_listbox" });
    }
  };

  await listbox.onStart({
    api: testApiListbox,
    event: mockEvent,
    commandName: "listbox",
    threadsData: mockThreadsData
  });

  // Verify listbox output
  assert(sentMessage.includes("𝗧𝗼𝘁𝗮𝗹 𝗚𝗿𝗼𝘂𝗽𝘀: 3"), `Expected 3 total groups, got:\n${sentMessage}`);
  assert(sentMessage.includes("Active Group 1"), "Should include Active Group 1");
  assert(sentMessage.includes("Unnamed Group"), "Should fallback undefined name to Unnamed Group");
  assert(!sentMessage.includes("Left Group"), "Should NOT include Left Group");
  assert(!sentMessage.includes("1004@msgr"), "Should NOT include @msgr threads");
  assert(!sentMessage.includes("Non-group thread"), "Should NOT include non-group threads");

  console.log("✔ listbox test passed!");

  // Test allbox.onStart
  let allboxMessage = "";
  const testApiAllbox = {
    ...mockApi,
    sendMessage: (msg, threadID, cb) => {
      allboxMessage = msg;
      if (typeof cb === "function") cb(null, { messageID: "msg_allbox" });
      return Promise.resolve({ messageID: "msg_allbox" });
    }
  };

  await allbox.onStart({
    api: testApiAllbox,
    event: mockEvent,
    commandName: "allbox",
    threadsData: mockThreadsData
  });

  assert(allboxMessage.includes("GROUP LIST"), "Should contain GROUP LIST header");
  assert(allboxMessage.includes("Active Group 1"), "Should contain Active Group 1");
  assert(allboxMessage.includes("Unnamed Group"), "Should contain Unnamed Group");
  assert(!allboxMessage.includes("Left Group"), "Should NOT contain Left Group");

  console.log("✔ allbox test passed!");

  console.log("All unit tests passed successfully!");
}

runTests().catch(err => {
  console.error("Test failed:", err);
  process.exit(1);
});
