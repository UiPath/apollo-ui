# Slack listener — Invoice Processing demo

A standalone Node listener that drives the bidirectional Slack flow in the
Invoice Processing prototype. The prototype itself runs fine without this
listener — the Slack escalation just won't post, and a toast surfaces the
error. Wire it up if you want the full roundtrip.

## What it does

- Connects to Slack in **Socket Mode** (no public webhook required).
- Posts the agent's escalation card to `#ap-exceptions` when the reviewer
  flags an invoice with reason "Escalating to manager".
- Handles button clicks on the card (Approve / Hold / Reject) and writes
  the resolution to a shared JSON file the prototype polls.
- Ingests human thread replies on the card and surfaces them in the
  prototype's Comms feed.
- Posts replies from the prototype's Comms input back into the thread,
  attributed to the human via `chat:write.customize`.

Everything is intentionally demo-grade — the team is expected to rewrite
this against real infra later.

## Run it

```bash
cd apps/apollo-vertex/slack
npm install
npm start
```

Reset between rehearsals (deletes the bot's own messages in the channel
and clears the shared store):

```bash
npm run reset-demo
```

## Configuration

The listener reads env vars from `apps/apollo-vertex/.env` (one level up).
Copy `.env.example` to `.env` and fill in real values:

| Var                    | What it is                                          |
| ---------------------- | --------------------------------------------------- |
| `SLACK_BOT_TOKEN`      | Bot User OAuth Token — starts `xoxb-`               |
| `SLACK_APP_TOKEN`      | App-Level Token for Socket Mode — starts `xapp-`    |
| `SLACK_SIGNING_SECRET` | Optional under Socket Mode; included for parity     |
| `SLACK_CHANNEL_ID`     | Channel ID for `#ap-exceptions` — starts `C`        |
| `LISTENER_PORT`        | Local HTTP endpoint port (default `3010`)           |

`.env` is gitignored. `.env.example` is the template you copy from.

## Slack app setup

In the Slack workspace, create an app **from manifest** with the YAML
below, then install it to the workspace. Grab the tokens from
**OAuth & Permissions** (bot token) and **Basic Information → App-Level
Tokens** (app token with `connections:write`).

```yaml
display_information:
  name: Invoice Agent
features:
  bot_user:
    display_name: Invoice Agent
    always_online: true
oauth_config:
  scopes:
    bot:
      - chat:write
      - chat:write.customize
      - users:read
      - channels:history
settings:
  event_subscriptions:
    bot_events:
      - message.channels
  interactivity:
    is_enabled: true
  socket_mode_enabled: true
```

After installing the app, invite the bot into `#ap-exceptions`
(`/invite @Invoice Agent`) so it can post.

## Hardcoded reviewer identity

Two places assume the reviewer is **Peter Vachon**:

- `REVIEWER_NAME` in `slack/server.js` (fallback for Comms attribution
  when the prototype's request body omits identity).
- `REVIEWER_NAME` / `REVIEWER_AVATAR_PUBLIC` in
  `templates/invoice-review/InvoiceReviewTemplate.tsx`. The public avatar
  URL points at Peter's Slack CDN image so `chat:write.customize` can
  render it.

If someone else demos, either:
1. Swap those constants for the new presenter, or
2. Stub the prototype to read identity from a config — TODO when the team
   rewrites this.

## File layout

```
slack/
├── server.js           # Bolt app + HTTP endpoint
├── store.js            # JSON-file shared store (data/demo-state.json)
├── escalation-card.js  # Block Kit card builder
├── reset-demo.js       # Deletes bot's messages + resets store
└── package.json        # Isolated npm install (not part of pnpm workspace)
```

The shared store lives at `apps/apollo-vertex/data/demo-state.json`
(gitignored; auto-created on first listener run).

## Architecture in one sentence

Listener writes a JSON file → prototype polls `/api/demo-state` every 2s
→ store changes appear in the UI; user replies hit `/api/demo-reply`
which proxies to the listener at `localhost:3010/reply`.
