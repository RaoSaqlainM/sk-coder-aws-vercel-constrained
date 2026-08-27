# Deploy SK Coder on Oracle ARM64

This guide deploys the current SK Coder release as one production stack on an Oracle ARM64 Ubuntu server. It serves the frontend and API through the same public HTTPS domain, so the terminal WebSocket uses the secure browser origin automatically.

## 1. Prepare the server and domain

Create an Oracle Ubuntu ARM64 instance, keep SSH access working, and point an unused subdomain such as `code.yourdomain.com` at the instance public IP address. Wait for the DNS record to resolve before requesting a TLS certificate.

Connect to the server and confirm its architecture before copying the release:

```bash
ssh ubuntu@SERVER_IP
uname -m
sudo -v
```

The architecture command must return `aarch64`. Do not proceed with this ARM64 release on an x86 server.

Open only the public ports that the website needs. Keep the backend and frontend containers bound to loopback, as configured by the release, so they are reached through Nginx rather than directly from the internet.

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
sudo ufw status
```

Docker documents that published container ports can bypass ordinary UFW rules. The SK Coder Compose configuration therefore publishes its internal services only on `127.0.0.1`; keep that setting unchanged.[1]

## 2. Install Docker Engine and the Compose plugin

Install the official Docker packages and Compose plugin. Docker supports Ubuntu ARM64 packages and its official installation guide recommends the repository-based method for maintained installations.[1] [2]

```bash
sudo apt-get update
sudo apt-get install -y ca-certificates curl nginx certbot python3-certbot-nginx unzip
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc
sudo tee /etc/apt/sources.list.d/docker.sources >/dev/null <<EOF
Types: deb
URIs: https://download.docker.com/linux/ubuntu
Suites: $(. /etc/os-release && echo "${UBUNTU_CODENAME:-$VERSION_CODENAME}")
Components: stable
Signed-By: /etc/apt/keyrings/docker.asc
EOF
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo systemctl enable --now docker
sudo docker run --rm hello-world
sudo docker compose version
```

Use `sudo docker` for production operations unless you have deliberately configured a restricted administrator account. Membership of Docker’s `docker` group is effectively administrator-level access.

## 3. Copy the release and create private configuration

Copy the release archive to the server using a secure transfer method. The archive must be the latest release candidate supplied for this deployment, not the older AWS/Vercel frontend repository.

```bash
sudo mkdir -p /opt/sk-coder
sudo chown ubuntu:ubuntu /opt/sk-coder
scp sk-coder-oracle-release-candidate-2026-08-27.zip ubuntu@SERVER_IP:/tmp/
ssh ubuntu@SERVER_IP
rm -rf /opt/sk-coder/*
unzip -q /tmp/sk-coder-oracle-release-candidate-2026-08-27.zip -d /opt/sk-coder
cd /opt/sk-coder
```

Create the host directories used for temporary user workspaces and protect them from ordinary users:

```bash
sudo install -d -o root -g root -m 0750 /var/lib/sk-coder/workspaces
sudo install -d -o root -g root -m 0750 /var/lib/sk-coder/workspaces/.registry
cp deploy/oracle.env.example .env
chmod 600 .env
nano .env
```

In `.env`, set the real values below. Do not commit, email, upload, or place this file in the frontend build.

| Variable | Production value |
|---|---|
| `ALLOWED_ORIGINS` | `https://code.yourdomain.com` |
| `BACKEND_INSTANCE_ID` | A stable identifier, such as `sk-coder-oracle-1` |
| `ADMIN_DASHBOARD_TOKEN` | A long random secret known only to the owner |
| `RUNTIME_IMAGE` | `sk-coder-runtime:oracle-arm64` for the first local verified build, then an approved immutable image digest if you publish one later |
| `GUI_RUNTIME_IMAGE` | `sk-coder-gui:oracle-arm64` |
| `APK_RUNTIME_IMAGE` | `sk-coder-apk:oracle-arm64` |
| `DEPENDENCY_INSTALL_NETWORK_MODE` | Leave `none` until the restricted package-install path has been tested on the host |
| `DEPENDENCY_INSTALL_PROXY_URL` | Leave empty until the restricted package-install path has been deliberately enabled and tested |

Keep the supplied shared-pool values unless you have measured and reviewed a different host layout. They reserve **50 GiB total** for all anonymous user workspaces, admit new work only to **48 GiB**, retain a continuation margin for existing workspaces, and limit each individual workspace through `SESSION_MAX_BYTES`.

Validate the configuration without printing its values:

```bash
sudo node deploy/validate-production-config.mjs .env
```

## 4. Build and prove the ARM64 runtime images

Build all images on the Oracle host. This is a mandatory gate because the ARM64 image has not been proven by a local x86 build.

```bash
cd /opt/sk-coder
sudo docker compose build --pull runtime runtime-gui runtime-apk backend frontend
sudo docker image inspect sk-coder-runtime:oracle-arm64 --format '{{.Os}}/{{.Architecture}}'
```

The inspection result must be `linux/arm64`. Then run a basic toolchain probe against the image that will actually be used by user workspaces:

```bash
sudo docker run --rm sk-coder-runtime:oracle-arm64 sh -lc 'node --version && npm --version && python3 --version && javac --version && gcc --version && g++ --version && go version && rustc --version && dotnet --info && php --version && ruby --version && git --version && tmux -V'
```

If any required command fails, stop here, retain the build output, and correct the runtime image before exposing the service. Do not claim language support from a file extension alone.

## 5. Start the production stack as a system service

The root `docker-compose.yml` is the production stack. It starts the runtime images, restricted registry proxy, backend, and frontend together. Install the included service unit and start it:

```bash
cd /opt/sk-coder
sudo cp deploy/sk-coder.service /etc/systemd/system/sk-coder.service
sudo systemctl daemon-reload
sudo systemctl enable --now sk-coder.service
sudo systemctl status sk-coder.service --no-pager
sudo docker compose ps
sudo docker compose logs --tail=100 backend
```

The first successful local health check is:

```bash
curl --fail --silent --show-error http://127.0.0.1:8080/api/healthz
```

## 6. Publish the HTTPS domain

Create an Nginx virtual host for the frontend domain. The public Nginx layer forwards traffic only to the loopback frontend container. That container forwards `/api/` and the terminal WebSocket path internally to the backend.

```bash
sudo cp /opt/sk-coder/deploy/sk-coder.nginx.conf /etc/nginx/sites-available/sk-coder
sudo nano /etc/nginx/sites-available/sk-coder
sudo ln -s /etc/nginx/sites-available/sk-coder /etc/nginx/sites-enabled/sk-coder
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
sudo certbot --nginx -d code.yourdomain.com
```

In the copied Nginx file, replace `code.example.com` with the exact public hostname. Do not use an IP address for the certificate command. Certbot will add the certificate configuration after domain ownership is reachable on port 80.

Verify the public route:

```bash
curl --fail --silent --show-error https://code.yourdomain.com/api/healthz
```

## 7. Perform live acceptance checks before public launch

Open `https://code.yourdomain.com` in a private browser window. Create a small project and verify each item in order:

| Check | Expected result |
|---|---|
| File create and refresh | The project remains available in the browser. |
| Terminal | A private prompt opens without transport noise. `pwd`, `ls`, and `node --version` return real results. |
| Reconnect | Briefly disconnect and reconnect the device network; the terminal reports restoration and returns to the retained workspace without replaying an uncertain command. |
| Runner | Run a small Node, Python, C++, Java, Rust, Go, and .NET sample that matches the verified image tools. |
| Workspace storage | Confirm the workspace status in Settings and test the four-hour Delete/Undo control with a disposable project. |
| Isolation | Use a second private browser profile and confirm it cannot open the first workspace or its terminal history. |
| Capacity | Use a controlled test environment to confirm new admission stops near 48 GiB while existing workspaces remain protected. |
| Owner operations | Confirm the owner dashboard requires its separate credentials and does not reveal user files, output, tokens, or chat content. |

Leave dependency installation disabled until the restricted proxy behavior and approved registry policy have been tested. Turning on unrestricted network access for all user workspaces is not an acceptable production shortcut.

## 8. Routine operations and rollback

Use these commands for routine service checks:

```bash
sudo systemctl status sk-coder.service --no-pager
sudo docker compose -f /opt/sk-coder/docker-compose.yml ps
sudo docker compose -f /opt/sk-coder/docker-compose.yml logs --tail=200 backend
df -h /var/lib/sk-coder/workspaces
```

Before every update, retain the current source directory and the private `.env` file securely. If a new release fails the live acceptance checks, stop the service, restore the previously verified release files, retain the existing `.env` and workspace directory, then start the service again:

```bash
sudo systemctl stop sk-coder.service
sudo cp -a /opt/sk-coder-previous/. /opt/sk-coder/
sudo systemctl start sk-coder.service
sudo systemctl status sk-coder.service --no-pager
```

Do not delete `/var/lib/sk-coder/workspaces` during a rollback. That directory contains temporary retained user workspaces and lifecycle metadata.

## References

[1] [Docker Engine installation for Ubuntu](https://docs.docker.com/engine/install/ubuntu/)

[2] [Docker Compose plugin installation for Linux](https://docs.docker.com/compose/install/linux/)
