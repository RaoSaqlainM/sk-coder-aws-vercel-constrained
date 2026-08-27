# SK Coder Oracle and Hostinger Release

This package contains the staged SK Coder frontend, backend, runtime images, deployment configuration, production environment template, and operational documentation. It does not contain production credentials, SSH keys, local dependency directories, compiled output, browser workspaces, logs, or Docker data.

## Before the first production start

Copy `deploy/oracle.env.example` to a private `.env` file on the Oracle host. Set the real public frontend origin, HTTPS domain, session secret, dashboard secret, and any optional provider values there. Do not commit the resulting `.env` file or place it in a frontend environment variable.

Build the runtime images on the Oracle ARM64 host. Configure the reverse proxy for the real Hostinger domain and HTTPS/WSS before exposing the backend. The browser frontend must use the matching HTTPS API URL and WSS terminal URL.

## Required production checks

Run the deployment checks on Oracle before public use. Confirm HTTPS health, WSS terminal connection, terminal refresh/reconnect, C++, Python, Java, Rust, Go, Node, one controlled package installation, archive import/extract, OPFS import/export, cleanup expiration, and protected owner dashboard access.

The dashboard is an administrator-only operational view. It reports safe capacity and operation metadata; it must not expose source files, terminal output, user data, API keys, or chat content.

## Important boundaries

No server can truthfully guarantee uninterrupted operation forever. The production configuration contains queues, exact resource cleanup, health checks, bounded storage, browser-first project persistence, and reconnect behavior to reduce predictable failure modes. A second independently operated backend is still required for true host-failure terminal continuity.
