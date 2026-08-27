# SK Coder AWS and Vercel

SK Coder is a browser coding workspace with local browser project persistence, private server workspaces, interactive terminal access, supported language runners, file and archive workflows, AI assistance, and a protected owner dashboard.

This repository is the **small AWS deployment profile**. It is intentionally different from the larger Oracle release: it protects the host by limiting every retained server workspace to 200 MiB and allowing one active runtime at a time.

Begin with **[AWS_VERCEL_RELEASE.md](AWS_VERCEL_RELEASE.md)** for the AWS backend, HTTPS/WSS, owner dashboard, and Vercel deployment sequence.

| Path | Purpose |
|---|---|
| `frontend/` | Vite frontend for Vercel hosting. |
| `backend/` | Private workspace API, terminal WebSocket bridge, runners, cleanup, and owner metrics. |
| `runtime/` | Small isolated Node.js, TypeScript, Python, Bash, C, and C++ runtime image. |
| `deploy/` | AWS server settings template, system service, registry proxy, and Nginx templates. |
| `docker-compose.yml` | AWS backend, registry proxy, and owner-dashboard stack. |

No private keys, live settings, user workspaces, Docker volumes, cached dependencies, or logs belong in this repository.
