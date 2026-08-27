const apiUrl = process.env.SK_CODER_API_URL || "https://api.medical4me.com/api";
const origin = "https://sk-code.vercel.app";
const workspaceLimit = 200 * 1024 * 1024;

async function request(path, options = {}) {
  const response = await fetch(`${apiUrl}${path}`, options);
  const body = await response.text();
  return { status: response.status, body };
}

const created = await request("/execute/sessions", {
  method: "POST",
  headers: { "Content-Type": "application/json", Origin: origin },
  body: JSON.stringify({ retentionMode: "four-hours" }),
});
if (created.status !== 201) throw new Error(`Workspace creation failed with ${created.status}.`);
const session = JSON.parse(created.body);
const headers = { "Content-Type": "application/json", "X-SK-Workspace-Access": session.terminalAccessToken, Origin: origin };

try {
  const oversized = await request(`/execute/sessions/${session.id}/stage/manifest`, {
    method: "POST",
    headers,
    body: JSON.stringify({ baseRevision: 0, files: [{ path: "too-large.bin", size: workspaceLimit + 1 }] }),
  });
  if (oversized.status !== 400 || !/quota|limit|exceed|space/i.test(oversized.body)) throw new Error(`Oversized stage was not rejected cleanly: ${oversized.status}.`);
  console.log(JSON.stringify({ workspaceCapBytes: workspaceLimit, oversizedStageRejectedBeforeUpload: true }));
} finally {
  await request(`/execute/sessions/${session.id}/delete`, { method: "POST", headers: { "X-SK-Workspace-Access": session.terminalAccessToken, Origin: origin } });
}
