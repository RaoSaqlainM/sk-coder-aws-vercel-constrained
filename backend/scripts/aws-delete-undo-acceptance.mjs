const apiUrl = process.env.SK_CODER_API_URL || "https://api.medical4me.com/api";
const origin = "https://sk-code.vercel.app";

async function request(path, options = {}) {
  const response = await fetch(`${apiUrl}${path}`, options);
  const body = await response.text();
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${body.slice(0, 240)}`);
  return body ? JSON.parse(body) : null;
}

const session = await request("/execute/sessions", {
  method: "POST",
  headers: { "Content-Type": "application/json", Origin: origin },
  body: JSON.stringify({ retentionMode: "four-hours" }),
});
const headers = { "X-SK-Workspace-Access": session.terminalAccessToken, Origin: origin };

const scheduled = await request(`/execute/sessions/${session.id}/delete`, { method: "POST", headers });
if (scheduled.state !== "scheduled-delete") throw new Error("Workspace was not scheduled for deletion.");
const restored = await request(`/execute/sessions/${session.id}/cancel-delete`, { method: "POST", headers });
if (restored.state !== "active") throw new Error("Workspace delete undo did not restore the active state.");
const rescheduled = await request(`/execute/sessions/${session.id}/delete`, { method: "POST", headers });
if (rescheduled.state !== "scheduled-delete") throw new Error("Workspace could not be scheduled again after undo.");
console.log(JSON.stringify({ scheduledDelete: true, undoDelete: true, rescheduledDelete: true }));
