# Reliability Audit Notes

The staged source was reviewed for terminal, runner, browser storage, cache, cleanup, fallback, and deployment reliability risks.

## Verified Findings

| Finding | Risk | Required Direction |
|---|---|---|
| Expired runtime operation records have no restart-safe reaper. | A backend crash can leave labeled containers or temporary directories until manual intervention. | Add an exact-resource reaper that validates the registry record, removes only recorded owned resources, and records completion or failure. |
| The configured runner maximum is not yet reflected by a concurrent queue. | A configuration value above one would still process runners serially. | Use a bounded worker pool that honors the configured runner concurrency and queue limit. |
| Browser storage needs actual quota-based warning state rather than a fixed fallback quota. | A fixed quota can be misleading and does not reflect Safari, Chromium, Firefox, private browsing, or available disk. | Treat unavailable estimates as unknown, request persistence, use actual usage and remaining values, handle `QuotaExceededError`, and make export/cleanup available. |
| Installer cache must remain outside user workspaces. | A user-controlled job can otherwise poison a cache reused by later installs. | Keep the cache installer-owned, network-restricted, script-disabled, and prune only the cache directory. |

## Sources

1. MDN, Storage quotas and eviction criteria: https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria
2. MDN, Origin private file system: https://developer.mozilla.org/en-US/docs/Web/API/File_System_API/Origin_private_file_system
3. Docker, `container prune` label and time filters: https://docs.docker.com/reference/cli/docker/container/prune/
4. pnpm, Continuous Integration cache trust warning: https://pnpm.io/continuous-integration
