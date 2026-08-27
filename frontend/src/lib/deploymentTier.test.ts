import { describe, expect, it } from "vitest";
import { supportsGuiDisplayInTier, supportsServerApkRebuild, supportsServerProjectPreview } from "./deploymentTier";

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
});
