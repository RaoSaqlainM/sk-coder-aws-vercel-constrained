export const AWS_CONSTRAINED_RUNNER_LANGUAGES = new Set(["node", "nodejs", "javascript", "js", "mjs", "cjs", "typescript", "ts", "tsx", "python", "py", "bash", "shell", "c", "cpp", "cc"]);
export const AWS_RUNTIME_WAIT_MESSAGE = "All active runtime slots are busy. Keep the project in browser storage and retry when a running terminal becomes idle.";

export function supportsRunnerInDeployment(language: string, deploymentTier: string) {
    return deploymentTier !== "aws-constrained" || AWS_CONSTRAINED_RUNNER_LANGUAGES.has(language.toLowerCase());
}

export function hasAvailableRuntimeSlot(activeCount: number, maximumCount: number) {
    return activeCount < maximumCount;
}
