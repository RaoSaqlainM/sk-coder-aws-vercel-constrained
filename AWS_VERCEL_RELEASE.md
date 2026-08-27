# SK Coder AWS and Vercel Release

This release is designed for the small AWS server profile. It provides a Vercel-hosted editor, a private HTTPS and WebSocket backend, 200 MiB server workspaces, a protected owner dashboard, browser project persistence, one active server runtime at a time, and controlled npm, pnpm, and Yarn installs from the npm registry.

## What this server can run

| Available on this AWS profile | Kept in the browser or requires the Oracle profile |
|---|---|
| Node.js, TypeScript, Python, Bash, C, and C++ | .NET, Java, Kotlin, Go, Rust, PHP, Ruby, GUI sessions, emulators, server project previews, and APK rebuild jobs |
| One active private terminal workspace | Parallel terminal containers |
| One runner task at a time | Large builds or memory-intensive tasks |
| 200 MiB per temporary server workspace | Larger server workspaces |
| Browser files, imports, exports, archive workflows, and browser-safe previews | A server terminal when the workspace pool or active runtime slot is busy |

The browser copy uses OPFS and IndexedDB where supported. It preserves files for editing and later staging, but it cannot provide a full operating-system terminal or native compiler without the server.

## Deploy the AWS backend

1. Clone this repository to `/opt/sk-coder-aws` on the AWS server.
2. Install Docker Engine, the Docker Compose plugin, Nginx, Certbot, and Apache password tools.
3. Copy `deploy/aws-server-settings.example` to `/etc/sk-coder/settings`. Set `ADMIN_DASHBOARD_TOKEN` to a long random value. Keep that file readable only by root.
4. Copy `deploy/sk-coder-aws.service` to `/etc/systemd/system/`, then run `sudo systemctl daemon-reload` and `sudo systemctl enable --now sk-coder-aws`.
5. Copy `deploy/nginx-api.medical4me.com.conf` to Nginx sites-enabled after DNS for `api.medical4me.com` points to this server.
6. Create the owner password file with `sudo htpasswd -c /etc/nginx/sk-coder-owner.htpasswd YOUR_OWNER_NAME`.
7. Test Nginx, obtain the API-domain certificate with Certbot, then reload Nginx.
8. Run `curl -fsS https://api.medical4me.com/api/healthz` and open the Vercel frontend to complete terminal and runner checks.

The service builds the runtime image on the server. It may take several minutes on a low-capacity host; keep the SSH session connected until the first build completes.

## Deploy the Vercel frontend

Import this repository into Vercel and select the `frontend` directory as the project root. Set these Production environment variables in Vercel:

| Variable | Value |
|---|---|
| `VITE_API_URL` | `https://api.medical4me.com/api` |
| `VITE_WS_URL` | `wss://api.medical4me.com/api/ws/terminal` |
| `VITE_DEPLOYMENT_TIER` | `aws-constrained` |

Deploy the project, then attach `sk-code.vercel.app` or your chosen Vercel domain. The owner dashboard is intentionally served only from `https://api.medical4me.com/owner/`, behind HTTP authentication and the separate owner token, not from the public editor domain.

## Before calling the service live

Run the backend health check, create a small private workspace, run Node.js and Python, verify a short npm install, refresh the browser, confirm the terminal reconnects, open the owner dashboard, and test scheduled workspace deletion. Never publish the owner token, the SSH key, `/etc/sk-coder/settings`, user workspaces, or Docker volumes.
