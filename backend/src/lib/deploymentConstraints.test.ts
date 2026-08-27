import { describe, expect, it } from "vitest";
import { AWS_RUNTIME_WAIT_MESSAGE, hasAvailableRuntimeSlot, supportsRunnerInDeployment, workspaceStateAllowsAccess } from "./deploymentConstraints.js";

describe("AWS constrained runtime policy", () => {
    it("accepts the declared Node, TypeScript, Python, Bash, C, and C++ runner aliases", () => {
        for (const language of ["node", "ts", "python", "bash", "c", "cpp", "CC"])
            expect(supportsRunnerInDeployment(language, "aws-constrained")).toBe(true);
    });

    it("rejects unsupported server runtimes only in the constrained AWS tier", () => {
        for (const language of ["go", "rust", "java", "csharp", "php"])
            expect(supportsRunnerInDeployment(language, "aws-constrained")).toBe(false);
        expect(supportsRunnerInDeployment("go", "standard")).toBe(true);
    });

    it("reports a clear wait condition when the one-runtime limit is occupied", () => {
        expect(hasAvailableRuntimeSlot(0, 1)).toBe(true);
        expect(hasAvailableRuntimeSlot(1, 1)).toBe(false);
        expect(AWS_RUNTIME_WAIT_MESSAGE).toContain("browser storage");
    });

    it("permits only the delete-undo lifecycle route to use a scheduled workspace access token", () => {
        expect(workspaceStateAllowsAccess("active")).toBe(true);
        expect(workspaceStateAllowsAccess("scheduled-delete")).toBe(false);
        expect(workspaceStateAllowsAccess("scheduled-delete", true)).toBe(true);
        expect(workspaceStateAllowsAccess("deleted", true)).toBe(false);
    });
});
