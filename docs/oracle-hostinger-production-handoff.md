# Oracle and Hostinger Production Handoff Checklist

## Status and Scope

This is a production handoff checklist for deploying the released source on an Oracle ARM64 instance with a custom domain.

The reviewed source is prepared for a topology in which the browser frontend reaches one HTTPS origin and one WSS terminal endpoint, while the Docker-backed backend remains bound to loopback on the server. The compose file already maps the backend to `127.0.0.1:<backend-port>`; it must not be exposed directly to the public Internet.

> **Release boundary:** browser storage keeps a recovery copy of the project, while the private server workspace holds the temporary working set for terminal, runner, preview, package, and compatible workspace tools. A source build is not a substitute for host acceptance checks.

## Intended Topology

| Layer | Intended responsibility | Public exposure |
|---|---|---|
| Browser frontend | Approved seven-tab interface and browser-authoritative project files | HTTPS only |
| Reverse proxy | TLS termination, origin routing, `/api` forwarding, and WebSocket upgrade forwarding | TCP 80 and 443 only |
| Backend service | Health, staging, terminal WebSocket, controlled installer, preview and session policy | Loopback only |
| Runtime containers | Disposable Bash, package-installation, preview, GUI, and APK execution environments | No direct host port publication |
| Workspace root | Disposable execution mirror, staging, package cache, and job scratch according to policy | Host filesystem only |
| Hostinger DNS | Domain record management before certificate issuance | DNS only |

## Pre-Release Decisions

The deployer must choose one public hostname, for example `ide.example.com`, and set `ALLOWED_ORIGINS` to the exact final browser origin. The published frontend uses the same secure origin for `/api` and the terminal WebSocket route, so the public proxy must preserve both paths.

The included `deploy/validate-production-config.mjs` rejects placeholders, unsafe browser origins, generic mutable image tags, and invalid workspace limits. It accepts either a verified immutable runtime digest or the explicit locally built Oracle ARM64 runtime tag after its target-host probe has passed.

The production host requires a Docker-capable Oracle Compute instance because the terminal relies on isolated custom runtime images and Docker-managed execution containers. The managed backend service should continue using a loopback-only port mapping; the reverse proxy is the only component that accepts public application traffic.

| Decision | Required production value | Do not use |
|---|---|---|
| Frontend API endpoint | Final `https://<domain>/api` | Temporary tunnel or review address |
| Frontend WebSocket endpoint | Final `wss://<domain>/api/ws/terminal` | Relative static-preview fallback without a proxy |
| Backend origin allowlist | Exact final frontend origin(s) | `*` or stale test origins |
| Backend port binding | `127.0.0.1:<port>` | A public Docker port mapping |
| Normal runner network | Disabled | General Internet access from Bash or preview containers |
| Installer network | Separate registry-only route through the restricted proxy | Host network or unrestricted bridge network |
| Runtime image | Pinned, built, and probe-verified image digest | An unprobed `latest` image |

## DNS, TLS, and Network Gate

Hostinger DNS records are managed in hPanel under **Domains → DNS**. The zone editor supports adding and editing A, CNAME, TXT, and other records, and Hostinger warns that DNS propagation can take up to 24 hours.[1] Before changing any production record, export the existing DNS zone or otherwise capture the current records; Hostinger documents zone export and DNS history restoration.[1]

Oracle documents that network security groups are the recommended application-level virtual firewall mechanism and that host operating-system firewall rules must align with OCI security rules.[2] [3] The final public ingress should be limited to TCP 80 and 443 for the reverse proxy; SSH should remain restricted to trusted administrator source addresses. The backend’s loopback port, Docker socket, registry proxy, workspace root, and runtime containers must not be Internet-reachable.

For certificate issuance using HTTP-01, the chosen hostname must already resolve to the proxy host, and the validation endpoint must be reachable on TCP 80. Let’s Encrypt specifies that HTTP-01 validation uses port 80 and that redirects are only followed to HTTP or HTTPS on ports 80 or 443.[4]

## Reverse Proxy Gate

The proxy must route both normal API requests and the terminal WebSocket route to the same loopback backend. For NGINX, WebSocket forwarding is not implicit: the `Upgrade` and `Connection` headers must be passed explicitly because they are hop-by-hop headers.[5] The proxy timeout must also be compatible with the terminal heartbeat and reconnect policy; NGINX notes its default upstream inactivity timeout is 60 seconds unless configured otherwise.[5]

The reverse proxy configuration must be validated as an artifact before activation. It must enforce TLS for the final hostname, preserve `/api` paths, forward the terminal upgrade on `/api/ws/terminal`, keep the backend upstream at loopback, and set only the expected forwarded host/protocol headers. Certificate and proxy configuration changes require a separate explicit deployment authorization.

## Runtime and Storage Gate

| Area | Required acceptance proof | Failure outcome |
|---|---|---|
| Runtime image | Record image digest; run each advertised version/tool probe in the active image | Do not advertise an unprobed profile |
| Isolated Bash | Clean prompt, `pwd`, same-tab reconnect, Ctrl+C, and independent tab transcripts | Hold release of terminal route |
| Browser staging | Small, multi-file, and large practical browser projects stage and run without an arbitrary product-size bridge cap | Explain quota/safety-reserve failure; preserve browser files |
| Package installer | npm, pnpm, and Yarn fixtures install via the registry-only proxy and are visible in the same Bash workspace | Disable installer route until fixed |
| Workspace cleanup | Scheduled deletion, expiry, and capacity cleanup remove temporary server mirrors without deleting browser-authoritative files | Stop release pending cleanup repair |
| Preview | Token-bound preview fixture does not expose an arbitrary container port publicly | Disable preview route pending repair |
| GUI and APK | Each feature is probed separately with its own runtime and cleanup boundary | Do not infer support from terminal success |

## Final Release Sequence

| Order | Controlled action | Required observation |
|---|---|---|
| 1 | Back up the Hostinger DNS zone and identify the final hostname | Current records are recoverable |
| 2 | Create the final DNS record pointing only to the Oracle public address | Public resolution reaches the intended host |
| 3 | Build pinned runtime images on Oracle and run the per-profile probes | Image digests and probe results recorded |
| 4 | Configure the loopback backend, restricted installer route, workspace limits, and exact final allowlist | Health endpoint succeeds only through the intended proxy path |
| 5 | Configure and validate the reverse proxy before public use | HTTPS health request and WSS handshake both succeed |
| 6 | Obtain and renew TLS certificates for the final hostname | Certificate name and renewal path verified |
| 7 | Build and start the frontend through the production Compose stack | Browser reaches the same secure origin for the app, API, and terminal route |
| 8 | Run one browser acceptance pass per fixture, stopping at the first failed fixture | Terminal, staging, installer, and supported profiles have observable evidence |
| 9 | Only after all gates pass, request authorization for a commit, push, and publication | No temporary host or DNS configuration is mistaken for production |

## Production Acceptance Fixtures

The final browser review should use a clean browser profile and one workspace at a time. It must validate: initial connection, one harmless Bash marker, same-tab reconnect without silent command replay, an independent second shell tab, browser-to-workspace staging, npm/pnpm/Yarn controlled installation, Node package script, Python multi-file, C++ multi-file, Java multi-file, .NET multi-file, Rust Cargo, and Go module fixtures. AI Terminal acceptance is limited to a provider that the user configures securely: it must create a proposal and require an explicit **Run once** approval; it must never auto-run a command.

## Explicit Non-Claims

This source does not provide unrestricted administrator Bash, Docker access, system package manager access, arbitrary network access, a universal language guarantee, unlimited runtime capacity, or lifetime availability. Production acceptance requires the Oracle ARM64 runtime probe, HTTPS and terminal checks, workspace isolation check, and cleanup check described above.

## References

[1] [Hostinger — How to Manage DNS Records at Hostinger](https://www.hostinger.com/support/1583249-how-to-manage-dns-records-at-hostinger/)

[2] [Oracle Cloud Infrastructure — Security Lists](https://docs.oracle.com/iaas/Content/Network/Concepts/securitylists.htm)

[3] [Oracle Cloud Infrastructure — Security Rules](https://docs.oracle.com/iaas/Content/Network/Concepts/securityrules.htm)

[4] [Let’s Encrypt — Challenge Types](https://letsencrypt.org/docs/challenge-types/)

[5] [NGINX — WebSocket Proxying](https://nginx.org/en/docs/http/websocket.html)
