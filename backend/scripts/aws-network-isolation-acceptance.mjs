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

const headers = { "Content-Type": "application/json", "X-SK-Workspace-Access": session.terminalAccessToken, Origin: origin };

try {
  const result = await request(`/execute/sessions/${session.id}/command`, {
    method: "POST",
    headers,
    body: JSON.stringify({ command: "node -e \"fetch('https://registry.npmjs.org/is-number',{signal:AbortSignal.timeout(4000)}).then(()=>process.exit(1)).catch(()=>process.stdout.write('aws-workspace-network-blocked'))\"" }),
  });
  if (result.exitCode !== 0 || !String(result.stdout).includes("aws-workspace-network-blocked")) throw new Error("Normal workspace unexpectedly reached the registry.");
  console.log(JSON.stringify({ normalWorkspaceRegistryBlocked: true }));
} finally {
  await request(`/execute/sessions/${session.id}/delete`, { method: "POST", headers: { "X-SK-Workspace-Access": session.terminalAccessToken, Origin: origin } });
}
