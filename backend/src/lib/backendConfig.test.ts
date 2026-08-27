import { afterEach, describe, expect, it, vi } from "vitest";

const keys = ["WORKSPACE_MEMORY_MB", "RUNNER_MEMORY_MB", "INSTALLER_MEMORY_MB", "SESSION_MAX_BYTES", "WORKSPACE_MAX_BYTES"] as const;
const initial = Object.fromEntries(keys.map((key) => [key, process.env[key]]));

afterEach(() => {
    for (const key of keys) {
        const value = initial[key];
        if (value === undefined) delete process.env[key];
        else process.env[key] = value;
    }
    vi.resetModules();
});

describe("backend resource configuration", () => {
    it("applies constrained AWS memory and workspace values from deployment settings", async () => {
        process.env.WORKSPACE_MEMORY_MB = "192";
        process.env.RUNNER_MEMORY_MB = "192";
        process.env.INSTALLER_MEMORY_MB = "192";
        process.env.SESSION_MAX_BYTES = "209715200";
        process.env.WORKSPACE_MAX_BYTES = "1073741824";
        vi.resetModules();
        const config = await import("./backendConfig.js");
        expect(config.WORKSPACE_MEMORY_MB).toBe(192);
        expect(config.RUNNER_MEMORY_MB).toBe(192);
        expect(config.INSTALLER_MEMORY_MB).toBe(192);
        expect(config.SESSION_MAX_BYTES).toBe(209715200);
        expect(config.WORKSPACE_MAX_BYTES).toBe(1073741824);
    });
});
