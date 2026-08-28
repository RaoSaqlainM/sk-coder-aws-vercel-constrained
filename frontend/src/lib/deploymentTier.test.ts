import { describe, expect, it } from "vitest";
import { awsRunnerCapabilityMessage, supportsGuiDisplayInTier, supportsServerApkRebuild, supportsServerProjectPreview, supportsServerRunner } from "./deploymentTier";

describe("AWS constrained frontend capabilities", () => {
  it("hides server project previews, GUI displays, and APK rebuilds in the AWS tier", () => {
    expect(supportsServerProjectPreview("aws-constrained")).toBe(false);
    expect(supportsGuiDisplayInTier("aws-constrained")).toBe(false);
    expect(supportsServerApkRebuild("aws-constrained")).toBe(false);
  });

  it("keeps server capabilities available for the larger deployment profile", () => {
    expect(supportsServerProjectPreview("standard")).toBe(true);
    expect(supportsGuiDisplayInTier("standard")).toBe(true);
    expect(supportsServerApkRebuild("standard")).toBe(true);
  });

  it("gates unsupported server languages while preserving the AWS image subset", () => {
    for (const language of ["node", "typescript", "python", "bash", "c", "cpp"]) {
      expect(supportsServerRunner(language, "aws-constrained")).toBe(true);
    }
    expect(supportsServerRunner("go", "aws-constrained")).toBe(false);
    expect(awsRunnerCapabilityMessage("Go")).toContain("larger Oracle profile");
  });
});
