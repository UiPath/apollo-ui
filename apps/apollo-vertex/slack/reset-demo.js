// Reset the demo to a clean state between rehearsals.
//   npm run reset-demo   (from apps/apollo-vertex/slack)
//
// 1) Deletes the bot's own messages from #ap-exceptions (Slack only lets a bot
//    delete its own messages — human replies must be removed manually).
// 2) Resets the shared invoice store to the known starting state.
// Idempotent: safe to run repeatedly.

const { WebClient } = require("@slack/web-api");
const store = require("./store");

const log = (...args) => console.log("[RESET]", ...args);
const web = new WebClient(process.env.SLACK_BOT_TOKEN);
const channel = process.env.SLACK_CHANNEL_ID;

(async () => {
  if (!process.env.SLACK_BOT_TOKEN || !channel) {
    console.error(
      "[RESET] Missing SLACK_BOT_TOKEN or SLACK_CHANNEL_ID in .env",
    );
    process.exit(1);
  }

  let botUserId = null;
  try {
    const auth = await web.auth.test();
    botUserId = auth.user_id;
    log(`bot identity: ${auth.user} (${botUserId})`);
  } catch (e) {
    log("auth.test failed:", e.data?.error || e.message);
  }

  let deleted = 0;
  let skippedHuman = 0;
  let failed = 0;
  const alreadyDeleted = new Set();

  // 1) Delete cards by the exact timestamps the listener recorded. This is the
  //    reliable path — chat.delete by ts doesn't depend on conversations.history
  //    consistency (which lags for very recent messages).
  const tracked = Object.keys(store.readState().cards || {});
  if (tracked.length) log(`deleting ${tracked.length} tracked card(s) by ts`);
  for (const ts of tracked) {
    try {
      await web.chat.delete({ channel, ts });
      deleted++;
      alreadyDeleted.add(ts);
    } catch (e) {
      const err = e.data?.error || e.message;
      if (err === "message_not_found") {
        alreadyDeleted.add(ts); // already gone — fine
      } else {
        failed++;
        log(`could not delete tracked ${ts}: ${err}`);
      }
    }
  }

  // 2) Backup sweep: catch any bot content not tracked (e.g., posted before
  //    tracking, or manual test posts). Best-effort; history can lag.
  try {
    const hist = await web.conversations.history({ channel, limit: 200 });
    const messages = hist.messages || [];
    for (const m of messages) {
      if (m.subtype) continue; // leave system messages (joins, etc.)
      if (alreadyDeleted.has(m.ts)) continue;
      const isOurs = Boolean(m.bot_id) || (botUserId && m.user === botUserId);
      if (!isOurs) {
        skippedHuman++;
        continue;
      }
      try {
        await web.chat.delete({ channel, ts: m.ts });
        deleted++;
      } catch (e) {
        failed++;
        log(`could not delete ${m.ts}: ${e.data?.error || e.message}`);
      }
    }
  } catch (e) {
    log("conversations.history failed:", e.data?.error || e.message);
  }

  store.resetAll(); // clears invoices + postedMessages back to initial

  log(`deleted ${deleted} bot message(s); ${failed} failed`);
  log("store reset → INV-GRN-001 = awaiting_decision");
  if (skippedHuman > 0) {
    log(
      `left ${skippedHuman} non-bot message(s) in place — the bot can't delete human replies; remove those manually if needed`,
    );
  }
  log("done. Reload the prototype (⌘R) to clear any in-browser state.");
})();
