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
  const installed = await request(`/execute/sessions/${session.id}/dependencies`, {
    method: "POST",
    headers,
    body: JSON.stringify({ manager: "npm", mode: "install", cwd: "/", packages: ["is-number@7.0.0"] }),
  });
  if (installed.exitCode !== 0 || installed.lifecycleScriptsDisabled !== true) throw new Error("Controlled installer did not complete with lifecycle scripts disabled.");
  const verified = await request(`/execute/sessions/${session.id}/command`, {
    method: "POST",
    headers,
    body: JSON.stringify({ command: "test -d node_modules/is-number && printf aws-installer-workspace-ok" }),
  });
  if (verified.exitCode !== 0 || !String(verified.stdout).includes("aws-installer-workspace-ok")) throw new Error("Installed package was not available only within its workspace.");
  console.log(JSON.stringify({ npmInstall: true, lifecycleScriptsDisabled: true, workspaceScopedPackage: true }));
} finally {
  await request(`/execute/sessions/${session.id}/delete`, { method: "POST", headers: { "X-SK-Workspace-Access": session.terminalAccessToken, Origin: origin } });
}
