// Standalone Slack Socket Mode listener for the Invoice Processing demo.
// Run with:  npm start   (from apps/apollo-vertex/slack)
// which is:  node --env-file=../.env server.js
//
// Responsibilities: connect via Socket Mode, post the agent escalation card on
// trigger, and handle button clicks (Approve / Hold / Reject) by writing the
// shared store and updating the Slack message.

const http = require("node:http");
const { App } = require("@slack/bolt");
const {
  DEMO_INVOICE,
  buildEscalationBlocks,
  escalationFallbackText,
} = require("./escalation-card");
const store = require("./store");

const log = (...args) => console.log("[SLACK]", ...args);
const errlog = (...args) => console.error("[SLACK]", ...args);

// Slack message status line shown (via chat.update) after an action is taken.
const STATUS_LINE = {
  approve: (by, ts) =>
    `:white_check_mark: *Approved* by ${by} · <!date^${ts}^{time}|just now>`,
  hold: (by, ts) =>
    `:hourglass_flowing_sand: *Held for correction* by ${by} · <!date^${ts}^{time}|just now>`,
  reject: (by, ts) => `:x: *Rejected* by ${by} · <!date^${ts}^{time}|just now>`,
};

const LISTENER_PORT = Number(process.env.LISTENER_PORT) || 3010;

// Fallback attribution for product-originated replies in the Comms feed
// when the request body doesn't carry an explicit `posted_as`. Kept narrow:
// the human's identity normally comes from the product (data.assignee +
// public avatar URL) so the Slack post and the feed agree.
const REVIEWER_NAME = "Peter Vachon";
const REVIEWER_INITIALS = "PV";
const REVIEWER_AVATAR_LOCAL = "/peter-vachon.jpg";

// Remember the most recently posted escalation card so later steps can update
// it (chat.update) after an action is taken.
let lastMessage = null;

const required = ["SLACK_BOT_TOKEN", "SLACK_APP_TOKEN"];
const missing = required.filter((k) => !process.env[k]);
if (missing.length > 0) {
  errlog(
    `Missing env vars: ${missing.join(", ")}.`,
    "Create apps/apollo-vertex/.env from .env.example and run via `npm start`.",
  );
  process.exit(1);
}

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  appToken: process.env.SLACK_APP_TOKEN,
  // Not required for Socket Mode, passed for completeness when present.
  signingSecret: process.env.SLACK_SIGNING_SECRET || undefined,
  socketMode: true,
});

// Surface Socket Mode connection lifecycle so demo issues are easy to spot.
const sm = app.receiver?.client;
if (sm) {
  sm.on("connecting", () => log("connecting…"));
  sm.on("connected", () => log("connected — Socket Mode listener running"));
  sm.on("disconnected", () => log("disconnected"));
  sm.on("reconnecting", () => log("reconnecting…"));
}

// Resolve a Slack user's display name, cached for the listener's run so we
// don't hammer users.info.
const userNameCache = new Map();
async function resolveUserName(client, userId, fallback) {
  if (!userId) return fallback || "Someone";
  if (userNameCache.has(userId)) return userNameCache.get(userId);
  let name = fallback || userId;
  try {
    const info = await client.users.info({ user: userId });
    name =
      info.user?.real_name ||
      info.user?.profile?.real_name ||
      info.user?.name ||
      name;
  } catch {
    /* keep fallback */
  }
  userNameCache.set(userId, name);
  return name;
}

function initialsFrom(name) {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return String(name).slice(0, 2).toUpperCase();
}

// Handle button clicks on the escalation card. action_id matches
// `invoice_action_*`; the button `value` carries { invoice_id, action }.
app.action(/^invoice_action_.+$/, async ({ ack, body, client, action }) => {
  // Must ack within 3 seconds or Slack shows the user an error.
  await ack();

  let payload = {};
  try {
    payload = JSON.parse(action.value || "{}");
  } catch {
    errlog("could not parse action value:", action.value);
  }
  const invoiceId = payload.invoice_id;
  const act = payload.action; // approve | hold | reject

  // Resolve a friendly display name (users:read scope); fall back gracefully.
  const by = await resolveUserName(
    client,
    body.user?.id,
    body.user?.username || body.user?.name,
  );

  log(`action received: ${act} on ${invoiceId} by ${by}`);

  // 1) Update the shared store the prototype polls.
  try {
    store.resolveInvoice(invoiceId, { action: act, by });
    log(`store updated: ${invoiceId} → ${store.STATUS_BY_ACTION[act] || act}`);
  } catch (e) {
    errlog("store write failed:", e?.message || e);
  }

  // 2) Update the Slack message: drop the buttons, add a status line.
  try {
    const keptBlocks = (body.message?.blocks || []).filter(
      (b) => b.type !== "actions",
    );
    const tsNow = Math.floor(Date.now() / 1000);
    const lineFn = STATUS_LINE[act];
    const statusText = lineFn
      ? lineFn(by, tsNow)
      : `*${act}* by ${by} · <!date^${tsNow}^{time}|just now>`;
    await client.chat.update({
      channel: body.channel.id,
      ts: body.message.ts,
      text: `${invoiceId} ${act} by ${by}`,
      blocks: [
        ...keptBlocks,
        { type: "context", elements: [{ type: "mrkdwn", text: statusText }] },
      ],
    });
    log(`chat.update ok: ${invoiceId} marked ${act}`);
  } catch (e) {
    errlog("chat.update failed:", e?.data ? JSON.stringify(e.data) : e.message);
  }
});

// Ingest thread replies on cards we've posted into the invoice's Comms feed.
// Requires the `message.channels` bot event subscription (Socket Mode).
app.message(async ({ message, client }) => {
  const ignore = (reason) => log(`ignored message: ${reason}`);

  // Edits/deletes are out of scope for v1.
  if (
    message.subtype === "message_changed" ||
    message.subtype === "message_deleted"
  ) {
    return ignore(`subtype ${message.subtype} (edits/deletes skipped)`);
  }
  // Never re-ingest the bot's own messages — they're already in the product.
  if (message.subtype === "bot_message" || message.bot_id) {
    return ignore("bot message");
  }
  // Thread replies only — top-level channel posts are ignored.
  if (!message.thread_ts) return ignore("not a thread reply");

  const invoiceId = store.invoiceForThread(message.thread_ts);
  if (!invoiceId)
    return ignore(`thread ${message.thread_ts} is not a known card`);

  const body = (message.text || "").trim();
  if (!body) return ignore("empty text (non-text message skipped)");

  const name = await resolveUserName(client, message.user);
  const added = store.addMessage(invoiceId, {
    id: `slack-${message.ts}`,
    source: "slack",
    subtype: "plain",
    from: { name, initials: initialsFrom(name), type: "human" },
    toOrChannel: "reply in #ap-exceptions",
    timestamp: new Date(Number(message.ts) * 1000).toISOString(),
    body,
    external_id: message.ts,
  });

  if (added) {
    log(`ingested message from ${name} in thread ${message.thread_ts}`);
  } else {
    ignore(`duplicate ${message.ts}`);
  }
});

// Post the agent's escalation card to the demo channel.
// opts: { invoiceId, escalatedBy, note }
async function postEscalation(opts = {}) {
  const invoiceId = opts.invoiceId || DEMO_INVOICE.id;
  log(
    `escalation triggered → posting card for ${invoiceId}` +
      (opts.escalatedBy ? ` (by ${opts.escalatedBy})` : ""),
  );
  // Start clean so the prototype doesn't pick up a prior rehearsal's result.
  store.resetInvoice(invoiceId);
  const res = await app.client.chat.postMessage({
    channel: process.env.SLACK_CHANNEL_ID,
    // No identity overrides — posts as the app's default identity.
    text: escalationFallbackText(invoiceId),
    blocks: buildEscalationBlocks({
      invoiceId,
      escalatedBy: opts.escalatedBy,
      note: opts.note,
    }),
  });
  lastMessage = { channel: res.channel, ts: res.ts };
  // Map the card's ts → invoice so thread replies route back here, and so
  // reset can delete the card by exact ts.
  store.recordCard(res.ts, invoiceId);
  log(`chat.postMessage ok — ts: ${res.ts}`);
  return { ok: true, ts: res.ts, channel: res.channel };
}

// Collect a JSON request body (small payloads only).
function readJsonBody(req) {
  return new Promise((resolve) => {
    let data = "";
    req.on("data", (c) => {
      data += c;
      if (data.length > 1e6) req.destroy(); // guard
    });
    req.on("end", () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch {
        resolve({});
      }
    });
    req.on("error", () => resolve({}));
  });
}

// Post a reply from the product back into the card's Slack thread. Human
// replies arrive with a `postedAs` block so Slack attributes the message to
// the reviewer via chat:write.customize; agent-authored content omits it
// (and posts as the app's default identity). The bot-authored message is
// filtered from ingestion, so we record it in the store ourselves.
//
// postedAs.avatarUrl MUST be publicly reachable — Slack's CDN fetches it
// server-side, so localhost paths won't render.
async function postThreadReply({ invoiceId, text, postedAs }) {
  const body = (text || "").trim();
  if (!body) return { ok: false, error: "empty reply" };
  const threadTs = store.threadForInvoice(invoiceId);
  if (!threadTs) {
    return {
      ok: false,
      error: `No active Slack card thread for ${invoiceId} — escalate first.`,
    };
  }
  const postArgs = {
    channel: process.env.SLACK_CHANNEL_ID,
    thread_ts: threadTs,
    text: body,
  };
  if (postedAs?.name) postArgs.username = postedAs.name;
  if (postedAs?.avatarUrl) postArgs.icon_url = postedAs.avatarUrl;
  const res = await app.client.chat.postMessage(postArgs);
  const displayName = postedAs?.name || REVIEWER_NAME;
  store.addMessage(invoiceId, {
    id: `slack-${res.ts}`,
    source: "slack",
    subtype: "plain",
    from: {
      name: displayName,
      initials: initialsFrom(displayName) || REVIEWER_INITIALS,
      type: "human",
      avatarUrl: postedAs?.avatarUrl || REVIEWER_AVATAR_LOCAL,
    },
    toOrChannel: "reply in #ap-exceptions",
    timestamp: new Date(Number(res.ts) * 1000).toISOString(),
    body,
    external_id: res.ts,
  });
  log(
    `posted product reply to thread ${threadTs} (${invoiceId})` +
      (postedAs?.name ? ` as ${postedAs.name}` : ""),
  );
  return { ok: true, ts: res.ts };
}

// Small local HTTP endpoint so the prototype's "Trigger escalation" affordance
// (or a curl) can ask the listener to post the card. Kept off port 3000.
function startHttpTrigger() {
  const server = http.createServer((req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    if (req.method === "OPTIONS") {
      res.writeHead(204);
      return res.end();
    }
    if (req.method === "GET" && req.url === "/health") {
      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ ok: true, connected: true }));
    }
    if (req.method === "POST" && req.url === "/trigger-escalation") {
      readJsonBody(req)
        .then((body) =>
          postEscalation({
            invoiceId: body.invoice_id,
            escalatedBy: body.by,
            note: body.note,
          }),
        )
        .then((r) => {
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify(r));
        })
        .catch((e) => {
          const detail = e?.data ? JSON.stringify(e.data) : e?.message;
          errlog("trigger failed:", detail);
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ ok: false, error: detail }));
        });
      return;
    }
    if (req.method === "POST" && req.url === "/reply") {
      readJsonBody(req)
        .then((body) =>
          postThreadReply({
            invoiceId: body.invoice_id,
            text: body.text,
            postedAs: body.posted_as
              ? {
                  name: body.posted_as.name,
                  avatarUrl: body.posted_as.avatar_url,
                }
              : undefined,
          }),
        )
        .then((r) => {
          res.writeHead(r.ok ? 200 : 400, {
            "Content-Type": "application/json",
          });
          res.end(JSON.stringify(r));
        })
        .catch((e) => {
          const detail = e?.data ? JSON.stringify(e.data) : e?.message;
          errlog("reply failed:", detail);
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ ok: false, error: detail }));
        });
      return;
    }
    res.writeHead(404);
    res.end("not found");
  });
  server.listen(LISTENER_PORT, () =>
    log(
      `HTTP trigger on http://localhost:${LISTENER_PORT} (POST /trigger-escalation)`,
    ),
  );
}

(async () => {
  try {
    await app.start();
    log(
      `channel target: ${process.env.SLACK_CHANNEL_ID || "(SLACK_CHANNEL_ID unset)"}`,
    );
    startHttpTrigger();
  } catch (err) {
    errlog("failed to start:", err?.message || err);
    process.exit(1);
  }
})();

process.on("SIGINT", () => {
  log("shutting down");
  process.exit(0);
});
