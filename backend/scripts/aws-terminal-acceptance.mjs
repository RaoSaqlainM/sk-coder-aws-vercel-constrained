import { WebSocket } from "ws";

const apiUrl = process.env.SK_CODER_API_URL || "https://api.medical4me.com/api";
const wsUrl = (process.env.SK_CODER_WS_URL || "wss://api.medical4me.com/api/ws/terminal").replace(/\/$/, "");
const origin = "https://sk-code.vercel.app";

async function request(path, options = {}) {
  const response = await fetch(`${apiUrl}${path}`, options);
  const body = await response.text();
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${body.slice(0, 240)}`);
  return body ? JSON.parse(body) : null;
}

function runTerminal({ sessionId, token, terminalId, marker }) {
  return new Promise((resolve, reject) => {
    const connection = new WebSocket(`${wsUrl}?sessionId=${encodeURIComponent(sessionId)}&terminalId=${encodeURIComponent(terminalId)}`, ["sk-coder-v1", `skc.${token}`], { headers: { Origin: origin } });
    const timeout = setTimeout(() => {
      connection.close();
      reject(new Error("Terminal acceptance timed out."));
    }, 20_000);
    let ready = false;
    let markerSeen = false;
    let cleanOutput = true;
    connection.on("open", () => undefined);
    connection.on("message", (raw) => {
      const message = JSON.parse(raw.toString());
      if (message.type === "ready") {
        ready = true;
        connection.send(JSON.stringify({ type: "command", command: `printf ${marker}` }));
      }
      if (message.type === "stdout") {
        const data = String(message.data || "");
        if (data.includes("\u001b") || data.includes("__SK_CODER_CWD__")) cleanOutput = false;
        if (data.includes(marker)) markerSeen = true;
      }
      if (message.type === "state" && message.state === "live" && ready && markerSeen) {
        clearTimeout(timeout);
        connection.close();
        resolve({ cleanOutput });
      }
    });
    connection.on("error", (error) => {
      clearTimeout(timeout);
      reject(error);
    });
    connection.on("close", () => {
      if (!markerSeen) {
        clearTimeout(timeout);
        reject(new Error("Terminal connection closed before the command output arrived."));
      }
    });
  });
}

const session = await request("/execute/sessions", {
  method: "POST",
  headers: { "Content-Type": "application/json", Origin: origin },
  body: JSON.stringify({ retentionMode: "four-hours" }),
});

try {
  const first = await runTerminal({ sessionId: session.id, token: session.terminalAccessToken, terminalId: "acceptance-main", marker: "aws-terminal-command-ok" });
  const second = await runTerminal({ sessionId: session.id, token: session.terminalAccessToken, terminalId: "acceptance-second", marker: "aws-terminal-second-tab-ok" });
  const reconnected = await runTerminal({ sessionId: session.id, token: session.terminalAccessToken, terminalId: "acceptance-main", marker: "aws-terminal-reconnect-ok" });
  if (!first.cleanOutput || !second.cleanOutput || !reconnected.cleanOutput) throw new Error("Terminal returned unfiltered control data.");
  console.log(JSON.stringify({ terminalCommand: true, secondWorkspaceTerminal: true, reconnect: true, cleanOutput: true }));
} finally {
  await request(`/execute/sessions/${session.id}/delete`, {
    method: "POST",
    headers: { "X-SK-Workspace-Access": session.terminalAccessToken, Origin: origin },
  });
}
