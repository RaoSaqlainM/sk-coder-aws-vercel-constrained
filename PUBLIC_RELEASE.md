# SK Coder Public Release

This repository is the current public source release for deploying SK Coder on an Oracle ARM64 server with a custom HTTPS domain.

## Start here

1. Read [ORACLE_ARM64_DEPLOYMENT_GUIDE.md](./ORACLE_ARM64_DEPLOYMENT_GUIDE.md) before starting the server.
2. Clone this repository onto the Oracle ARM64 host.
3. Copy `deploy/oracle.env.example` to a server-local `.env` file and enter only your own real domain and secrets there.
4. Build the runtime images on the Oracle ARM64 host and run the toolchain probe from the guide.
5. Start the stack with `sudo systemctl enable --now sk-coder.service` after following the guide’s service-installation step.
6. Configure Nginx and obtain an HTTPS certificate for the final domain.
7. Run the browser, terminal, workspace, isolation, and cleanup acceptance checks before public launch.

## Important security rules

Do not commit or upload `.env`, SSH keys, PEM files, API keys, dashboard tokens, browser workspace data, Docker data, or user projects. The public source includes templates only. Your server key remains on your own computer or server and is never part of the application repository.

The default shared workspace plan reserves 50 GiB for all anonymous user workspaces together, admits new work to 48 GiB, preserves continuation capacity for existing workspaces, retains normal workspaces for up to 72 hours, and provides a four-hour Undo period after server-copy deletion.
