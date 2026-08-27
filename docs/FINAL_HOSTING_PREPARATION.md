# Final Docker and Nginx Preparation

## Purpose

This guide prepares the SK Coder release for a future Oracle Compute host and a Hostinger-managed domain. It does not create an Oracle instance, alter DNS, issue a certificate, publish a container, or connect a production service. Complete the checks on the final server only after choosing the final hostname.

The intended design keeps the public website at one HTTPS origin. The host Nginx service accepts public traffic, the Docker frontend is available only at `127.0.0.1:8080`, and the backend is available only at `127.0.0.1:3001`. Browser projects remain browser-authoritative; server workspaces are isolated, temporary execution mirrors.

## Files to Prepare

| File | Where it belongs | What to prepare |
|---|---|---|
| `.env` | Oracle host only; never commit it | Final hostname, verified runtime image digest, storage policy, backend port, and exact browser origin. |
| `docker-compose.yml` | Repository root | Keep the loopback-only frontend and backend port mappings unchanged. |
| `frontend/nginx.conf` | Frontend container | Serves the built web app, forwards `/api` and terminal WebSockets to the Docker backend, and sends browser security headers. |
| `deploy/sk-coder.nginx.conf` | Host Nginx configuration | Replace `code.example.com` with the final Hostinger hostname and forward HTTPS traffic to `127.0.0.1:8080`. |
| `deploy/server-config.example` | Reference only | Copy its non-secret settings into the host-only `.env` file and replace every placeholder. |

## Host Environment File

Create `.env` only on the Oracle host. Begin with `deploy/server-config.example`, then set the final values below. The example domain and image digest are illustrative; do not use them as production values.

| Setting | Production requirement |
|---|---|
| `BACKEND_PORT` | Keep as `3001` unless the host uses a different private loopback port. |
| `HTTP_PORT` | Keep as `8080` for the Docker frontend’s private loopback port. |
| `ALLOWED_ORIGINS` | The exact final public origin, for example `https://code.yourdomain.com`. Do not use `*`, `localhost`, a temporary tunnel, or an HTTP origin. |
| `RUNTIME_IMAGE` | A tested image with an immutable `@sha256:` digest. Do not use `latest`. |
| `WORKSPACE_HOST_PATH` | A stable host-only directory for disposable execution mirrors, normally `/var/lib/sk-coder/workspaces`. Do not use a public web directory. |
| `SESSION_TTL_HOURS` | `72` is the current planned session retention window. |
| `SESSION_MAX_BYTES` | The maximum size of one temporary execution workspace. |
| `WORKSPACE_MAX_BYTES` | Total host space allocated to all temporary execution workspaces. |
| `WORKSPACE_SAFETY_RESERVE_BYTES` | Free disk capacity retained for the operating system and recovery. It must be lower than `WORKSPACE_MAX_BYTES`. |
| `PACKAGE_CACHE_MAX_BYTES` and `LOG_MAX_BYTES` | Explicit caps for package cache and logs so they cannot consume the host disk unnoticed. |
| `SESSION_MAX_COUNT` | Number of managed temporary execution records allowed at once. |
| `COMMAND_TIMEOUT_MS` and `OUTPUT_MAX_BYTES` | Command time and captured output safeguards. The output cap prevents one noisy command from consuming service memory without bound. |

Before starting Docker, run the repository validator on the final host:

```bash
node deploy/validate-production-config.mjs .env
```

The validator rejects placeholder domains, non-HTTPS origins, wildcard origins, unpinned runtime images, invalid limits, and a safety reserve larger than the workspace allocation.

## Docker Preparation

Install Docker Engine and the Compose plugin from the official Docker repository for the Oracle host operating system. Build the three runtime images before starting the application services. The server needs Docker because the terminal, project runner, GUI work, and package workflow use separated runtime containers.

```bash
docker compose build runtime runtime-gui runtime-apk
docker compose up -d --build
docker compose ps
curl -fsS http://127.0.0.1:8080/api/healthz
```

The backend and frontend Compose ports must remain loopback-only. Do not change `127.0.0.1:${BACKEND_PORT}:3001` or `127.0.0.1:${HTTP_PORT}:80` into public `0.0.0.0` mappings. Host Nginx is the only public entry point.

## Container Nginx Validation

Run this check on the Oracle host after the frontend image builds. It validates the exact Nginx configuration inside the final frontend image. It does not change the website, DNS, or browser data.

```bash
docker build --tag sk-coder-frontend-check --file frontend/Dockerfile frontend
docker run --rm sk-coder-frontend-check nginx -t
```

Then run the image on a private temporary port and check the headers:

```bash
docker run --rm -d --name sk-coder-header-check -p 127.0.0.1:18080:80 sk-coder-frontend-check
curl -I http://127.0.0.1:18080/
docker stop sk-coder-header-check
```

The response should include `Content-Security-Policy`, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, and `Permissions-Policy`. These headers control browser safety rules; they do not add user, file, folder, project, import, export, or browser-storage limits.

## Host Nginx and Hostinger DNS

In Hostinger, create one `A` record for the chosen hostname, such as `code.yourdomain.com`, pointing to the Oracle public IPv4 address. Preserve or export the existing DNS zone before changing any live records. Wait for the name to resolve to the Oracle host before requesting a TLS certificate.

Copy `deploy/sk-coder.nginx.conf` to the host Nginx site directory and replace both occurrences of `code.example.com` with the final hostname. Keep the upstream at `http://127.0.0.1:8080`; the Docker frontend then routes API and terminal traffic internally. Validate the host configuration before reload:

```bash
sudo nginx -t
sudo systemctl reload nginx
sudo certbot --nginx -d code.yourdomain.com
```

Certbot adds the final HTTPS certificate configuration after the hostname resolves. The host firewall and Oracle security rules should expose only TCP `80` and `443` publicly. SSH should be restricted to trusted administrator addresses. Do not expose `8080`, `3001`, the Docker socket, registry proxy, workspace root, or runtime container ports publicly.

## Final Acceptance Order

| Order | Required confirmation |
|---|---|
| 1 | Oracle host has current system updates, Docker Engine, Compose plugin, host Nginx, and Certbot. |
| 2 | The final `.env` passes the repository validator. |
| 3 | Runtime image digests and each advertised runtime profile are tested on the same Oracle host. |
| 4 | Docker services start with frontend and backend bound only to loopback. |
| 5 | Frontend-container `nginx -t` passes and its private header response is checked. |
| 6 | Hostinger DNS resolves the final hostname to Oracle. |
| 7 | Host Nginx syntax passes, HTTPS is issued, `/api/healthz` succeeds, and the terminal WebSocket handshake succeeds. |
| 8 | A clean browser acceptance pass verifies Files, import/export, terminal staging, approved AI actions, and each runtime profile that is advertised. |

## Security Boundary

These files provide deployment structure and browser-facing Nginx headers. They are not a substitute for operating-system updates, restricted SSH, Oracle security rules, TLS renewal, rate limiting, backend validation, secret rotation, monitoring, backups, or runtime-image acceptance tests. Do not publish until the final host checks pass.

## References

[Docker Engine installation on Ubuntu](https://docs.docker.com/engine/install/ubuntu/)

[Docker Compose plugin installation](https://docs.docker.com/compose/install/linux/)

[Hostinger DNS record management](https://www.hostinger.com/support/1583249-how-to-manage-dns-records-at-hostinger/)

[Oracle Cloud Infrastructure security rules](https://docs.oracle.com/iaas/Content/Network/Concepts/securityrules.htm)

[NGINX WebSocket proxying](https://nginx.org/en/docs/http/websocket.html)

[Let’s Encrypt challenge types](https://letsencrypt.org/docs/challenge-types/)
