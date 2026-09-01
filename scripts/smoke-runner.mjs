const api = (process.env.SK_CODER_API_URL || "https://api.medical4me.com/api").replace(/\/$/, "");
const deviceId = process.env.SK_CODER_DEVICE_ID || `smoke-${crypto.randomUUID()}`;
const tests = [
  { name: "node", language: "node", code: 'console.log("runner-ok-node");' },
  { name: "typescript", language: "typescript", code: 'const value: number = 6 * 7;\nconsole.log(`runner-ok-ts ${value}`);' },
  { name: "python-numpy", language: "python", code: 'import numpy as np\nprint("runner-ok-pynum", int(np.array([1, 2, 3]).sum()))' },
  { name: "c", language: "c", code: '#include <stdio.h>\nint main(void) { puts("runner-ok-c"); return 0; }' },
  { name: "cpp", language: "cpp", code: '#include <iostream>\nint main() { std::cout << "runner-ok-cpp" << std::endl; return 0; }' },
  { name: "bash", language: "bash", code: 'printf "runner-ok-bash\\n"' },
];

const results = [];
for (const test of tests) {
  const response = await fetch(`${api}/execute`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-device-id": deviceId },
    body: JSON.stringify({ language: test.language, code: test.code }),
    signal: AbortSignal.timeout(125000),
  });
  const body = await response.json().catch(() => ({}));
  results.push({ name: test.name, http: response.status, exitCode: body.exitCode ?? null, stdout: body.stdout ?? "", stderr: body.stderr ?? "" });
}

for (const result of results)
  console.log(JSON.stringify(result));

if (results.some((result) => result.http !== 200 || result.exitCode !== 0))
  process.exitCode = 1;
