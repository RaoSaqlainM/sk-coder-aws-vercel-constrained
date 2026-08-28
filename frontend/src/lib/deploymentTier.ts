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

const AWS_SERVER_RUNNERS = new Set(["node", "javascript", "js", "mjs", "cjs", "typescript", "ts", "tsx", "python", "python3", "py", "bash", "shell", "sh", "c", "cpp", "cc", "cxx"]);

export function supportsServerRunner(language: string, tier: string | undefined) {
  return !isAwsConstrainedTier(tier) || AWS_SERVER_RUNNERS.has(language.trim().toLowerCase());
}

export function awsRunnerCapabilityMessage(language: string) {
  return `${language} is not installed in the constrained AWS runtime. Use the browser preview for browser files or the larger Oracle profile for this server runner.`;
}
