# Ui.Vision MCP Bridge

Lets **Claude Code** (or any MCP client) build, edit and run Ui.Vision macros by
talking to the browser extension — the same tools the extension's built-in AI
chat uses (`create_macro`, `set_macro`, `run_macro`, `get_page`, `screenshot`,
vision-image helpers), plus `list_macros` / `open_macro` / `delete_macro`
(cleanup of agent-created macros — restricted to the "AI Generated" folder) and
`get_authoring_guide` (the uiv.* JS API reference — MCP clients read it before
writing their first macro; JS script macros are the preferred form). If no web
page tab is open when a macro runs, the extension opens https://ui.vision as
the play tab automatically.

While the bridge executes tool calls, the side panel shows a
**"Claude (MCP) is controlling Ui.Vision"** banner, and `run_macro` /
`set_macro` refuse to act if the editor no longer shows the macro the session
last opened — so an agent cannot silently run or edit a macro the user
switched to in the panel meanwhile.

## How it works

```
Claude Code  ── MCP (stdio) ──►  uivision-mcp-bridge.js  ◄── WebSocket (127.0.0.1) ──  Ui.Vision extension
```

The bridge is the rendezvous point: Claude Code launches it as an MCP server;
the extension's side panel dials out to its local WebSocket server (browser
extensions cannot accept incoming connections). Tool calls are forwarded to
the extension and executed there.

## Setup

1. **Register with Claude Code** (npm fetches the bridge automatically):

   ```bash
   claude mcp add uivision -- npx -y uivision-mcp-bridge
   ```

   Working from a checkout of this repo instead: `cd mcp && npm install`, then
   `claude mcp add uivision -- node /absolute/path/to/mcp/uivision-mcp-bridge.js`.

   MCP clients load their servers at **startup** — if a Claude Code session is
   already open, restart it (or start a new one) after registering, then check
   with `/mcp` that `uivision` is listed.

2. **Get the auth token**: start the bridge once (or just run Claude Code — it
   starts it for you). On first run it generates a token file
   `~/.uivision_mcp_token` in your home directory and prints the value to
   stderr. Copy it — or simply ask the AI for it: when the extension is not
   paired yet, the bridge tells the agent to read the token file and show you
   the value in chat.

3. **Enable the bridge in Ui.Vision**: open the Ui.Vision side panel →
   Settings → AI → *MCP bridge (Claude Code)* → enable it, paste the token,
   keep the default port (50888) unless you changed it.

4. **Keep the side panel open** — the tools execute in the side panel context.
   If it is closed, tool calls return "extension not connected".

Then just chat in Claude Code: *"Use Ui.Vision to build a macro that logs into
example.com and downloads the report"* — Claude creates the macro, runs it,
reads the log, and iterates. You can watch it work live in the side panel.

## Options

| Option | Default | Notes |
|---|---|---|
| `--port <n>` / `UIVISION_MCP_PORT` | `50888` | WebSocket port (127.0.0.1 only). Must match the port in Ui.Vision settings. |
| `--token <t>` / `UIVISION_MCP_TOKEN` | auto-generated | Shared secret; auto-persisted to `.uivision_mcp_token` in the user's home directory when not passed. |

## Browser support

Verified on **Chrome** (side panel) and **Firefox** (sidebar, same panel code)
— tested 2026-07-28 on Firefox 154: connect + toast, all uiv.* guard errors,
`{area}`-limited visual finds with correct coordinate rebase, and `shot.area`
authoring all behave identically. Note that the bridge holds **one** extension
connection ("newest wins"): if Chrome and Firefox both have the bridge enabled,
they steal the connection from each other on every reconnect — enable it in
only one browser at a time. Macros driving `uiv.browser.*` (CDP trusted input)
remain Chrome-only; on Firefox use `uiv.page.*` / `uiv.desktop.*`.

## Security

- The WebSocket server binds to `127.0.0.1` only — nothing is reachable from
  the network.
- Connections must authenticate with the shared token within 5 seconds or are
  dropped. Without the token, a local process cannot issue tool calls.
- The extension applies the same guardrails as its built-in AI chat: user
  macro files are never overwritten (edits are saved as copies in the
  "AI Generated" folder), and preinstalled demo macros are not run without
  explicit confirmation.

## Troubleshooting

- Ask Claude to call the `bridge_status` tool — it reports whether the
  extension is connected.
- Bridge logs go to stderr (visible via `claude --debug` or in Claude Code's
  MCP logs).
- "Port in use": another bridge instance is running, or pick a different
  `--port` (and update it in Ui.Vision settings).
