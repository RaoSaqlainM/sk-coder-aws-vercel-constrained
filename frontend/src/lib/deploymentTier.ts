export function isAwsConstrainedTier(tier: string | undefined) {
  return tier === "aws-constrained";
}

export function supportsServerProjectPreview(tier: string | undefined) {
  return !isAwsConstrainedTier(tier);
}

export function supportsGuiDisplayInTier(tier: string | undefined) {
  return !isAwsConstrainedTier(tier);
}

export function supportsServerApkRebuild(tier: string | undefined) {
  return !isAwsConstrainedTier(tier);
}
