# Terminal lifecycle and browser runtime findings

## Primary sources

- https://xtermjs.org/docs/guides/security/
- https://xtermjs.org/
- https://webcontainers.io/

## Findings

xterm.js is a browser terminal emulator, not the process runtime. A real remote terminal requires a secure WebSocket transport, server-side authorization, and a real PTY or process behind that transport. The xterm.js security guidance specifically recommends secure `wss` transport, an application-level authentication protocol, restrictive origin controls, and avoiding privileged server processes.

A professional terminal should preserve one durable server workspace identity, attach multiple browser tabs to that identity, avoid replaying uncertain commands after reconnect, and distinguish transport recovery from process recovery. Reconnect can restore the terminal stream only while the server workspace and process still exist; it cannot make a suspended or deleted process continue.

WebContainers can run Node.js projects, npm, pnpm, and yarn inside the browser and can provide a useful browser fallback for JavaScript and TypeScript projects. They do not replace the AWS Linux workspace for arbitrary Bash, native C/C++, Go, Rust, .NET, GUI, APK, or unrestricted package operations. Browser storage can retain files and metadata, but it cannot turn OPFS or IndexedDB into a server PTY or native compiler host.

The AWS constrained host must therefore use a truthful hybrid model: browser storage remains available for files and browser-safe previews; the AWS service provides bounded real terminal and runner execution; when server capacity is unavailable, the UI should say that native execution is unavailable and keep editing/export available rather than showing a fake shell.
