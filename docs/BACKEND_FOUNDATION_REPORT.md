# Bounded backend foundation — completion report

Date: 2026-10-28. Implemented locally and synchronized ONLY to existing Development (Cloud) clean-heron-346, team lanz-miguel-acosta-71da0 / project fraud-monitoring / dev/lanz-miguel-acosta. No production deployment or Git commit/push/merge. The approved UI remains disconnected and unchanged.

## Commands and actual results

Node 24.22.1, pnpm 11.25.0, Convex 1.48.0, convex-test 0.0.66, Vitest 5.0.5, TypeScript 5.9.3, Next.js 16.3.4. Commands used a temporary process PATH containing the existing portable Node directory.

| Command/check | Result |
|---|---|
| pnpm install | PASS after exact package-age exceptions for the two pinned Convex packages |
| convex deployment select lanz-miguel-acosta-71da0:fraud-monitoring:dev/lanz-miguel-acosta | Verified existing clean-heron-346 Development target; saved ignored local public URL/target configuration |
| convex function-spec --deployment clean-heron-346 | Before: exactly compat:read/put; after: those unchanged plus four validated foundation functions |
| Supported Convex MCP status/tables, metadata-only tool set | Verified deployment URL/schema/functions without customer record reads |
| convex codegen --typecheck enable | PASS; generated five binding files through supported tooling, with explicitly authorized development staging/upload |
| pnpm test:foundation | PASS: 79 tests, 10 suites, isolated MOCK backend only |
| pnpm typecheck:convex | PASS |
| pnpm build | PASS, compilation/TypeScript/static prerendering of / and /_not-found |
| pnpm typecheck | PASS |
| convex dev --once --typecheck enable | PASS, development functions ready; exact target printed in CLI output |
| Read-only compat:read for the known synthetic run | One original record retained, same ID, value updated; no compatibility writes performed |
| convex env get FOUNDATION_WORKSPACE_ID --deployment clean-heron-346 | Variable not found; no remote configuration changed |
| git diff --check | PASS |
| Protected-tree git diff --exit-code and SHA-256 comparisons | PASS; see evidence below |

The earlier generic CLI run attempt could not invoke the internal schema metadata function and made no data changes. The supported Convex MCP tables tool was then used successfully. Codegen stages schema/function bundles and prepared empty table metadata; final dev --once applied the declared schema/function set. No other person's function/schema additions were found during preflight.

## Development changes

Created ten empty foundation tables and their declared indexes:

- auditEvents: by_case(caseId); by_operation(operationId)
- cases: by_reference(reference); by_team(teamId)
- idempotencyRequests: by_scope(workspaceId, actorId, key)
- monitoringRecords: by_case(caseId); by_team_module(teamId, moduleKey)
- referenceCounters: by_workspace_date(workspaceId, date)
- referenceLedger: by_case(caseId); by_reference(reference)
- roleAssignments: by_team(teamId); by_user_team(userId, teamId)
- teams: by_workspace_key(workspaceId, key)
- users: by_identity(issuer, subject)
- workspaces: by_key(key)

Added only cases:create, cases:get, monitoring:create and monitoring:get. They have exact argument/return validators and require trusted backend identity, an active bound user, explicit team grants and the configured single workspace. No IdP/auth.config, default user, provider integration, remote role/user/workspace provisioning or bypass was added. Local simulated identities exist only in isolated automated tests.

Retained compat:read and compat:put with identical function metadata and byte-identical source copied from the accepted compatibility artifact. Retained compat_smoke_records validator/by_runId and original synthetic data. These unauthenticated compatibility functions remain an explicitly authorized development exception, not secure foundation endpoints. No existing functions/indexes/data were removed. direct_complaints remains undefined, with unchanged empty inferred metadata, and was not queried, validated or migrated.

## Tests and limits

Mock coverage: anonymous/unknown/disabled identities; capability/role/restriction checks; inactive/missing/foreign workspace; global reference collisions; Manila midnight/month/year/leap-day dates; overflow; actor-scoped retries/changed payloads/revocations; parent relationships and uniform access errors; exact issuance/case/link audit counts; rollback at each audit insertion and malformed case/link return; source-surface/fixture isolation. Mock contention includes 100 distinct creates (100 references, 200 events), 100 identical retries (one case, two events), mixed-payload conflicts, concurrent link retries and near-overflow competition.

These are convex-test MOCK results, not real-backend OCC/concurrency/capacity certification. No remote synthetic identities, stress drivers, writes to foundation tables or configuration changes were needed. The separate real-backend contention gate remains blocked pending approval.

Independent read-only review identified a monitoring authorization-order issue and missing replay/rollback/overflow regressions. Added tests reproduced the issue; the fix and all added regressions pass. The mock commits before its outer return-validator check, so foundation handlers explicitly validate receipts before returning; fault-injection tests prove transaction rollback in the mock without adding runtime failure flags.

## Exact files created/modified this implementation

- package.json
- pnpm-lock.yaml
- pnpm-workspace.yaml
- tsconfig.json
- convex.json
- vitest.foundation.config.ts
- convex/cases.ts
- convex/compat.ts
- convex/lib/audit.ts
- convex/lib/authorization.ts
- convex/lib/classification.ts
- convex/lib/compatSchema.ts
- convex/lib/errors.ts
- convex/lib/functions.ts
- convex/lib/idempotency.ts
- convex/lib/identity.ts
- convex/lib/references.ts
- convex/lib/relationships.ts
- convex/lib/types.ts
- convex/lib/validators.ts
- convex/lib/workspace.ts
- convex/monitoring.ts
- convex/schema.ts
- convex/services/cases.ts
- convex/services/monitoring.ts
- convex/tsconfig.json
- convex/_generated/api.d.ts
- convex/_generated/api.js
- convex/_generated/dataModel.d.ts
- convex/_generated/server.d.ts
- convex/_generated/server.js
- tests/foundation/audit.test.ts
- tests/foundation/authorization.test.ts
- tests/foundation/classification.test.ts
- tests/foundation/fixtures.ts
- tests/foundation/idempotency.test.ts
- tests/foundation/references.test.ts
- tests/foundation/relationships.test.ts
- tests/foundation/setup.ts
- tests/foundation/surface.test.ts
- tests/foundation/transactions.test.ts
- tests/foundation/validation.test.ts
- tests/foundation/workspace.test.ts
- docs/PRODUCTION_STATUS.md
- docs/BACKEND_CONTRACTS.md
- docs/BACKEND_FOUNDATION_REPORT.md
- docs/foundation-evidence/verification.json

The existing untracked docs/superpowers/plans/2026-10-28-backend-foundation.md is preserved byte-for-byte; it was not created or rewritten during implementation. Ignored local changes: .env.local (development target/public URLs only), node_modules/cache/build artifacts and local test logs. No credentials were copied into authored files. package-lock.json is unchanged; pnpm-lock.yaml is authoritative for this work.

## Prototype/history preservation

HEAD remains 87049e0918a5ed1e56d6b7140bdf75a5fdb0c049 on migration/vercel-nextjs. git diff --exit-code confirms no changes under app/, components/, hooks/, db/, worker/, scripts/ or historical README/baseline/migration docs. No provider, query or mutation was wired to the dashboard. No working demo interactions were removed.

- app/page.tsx: SHA-256 0f51499ffe1d998e7349de6625bb57f296134029749126ee931138538841d04d (unchanged)
- app/layout.tsx: SHA-256 c27b51bd2917dc8d94b9a645c0af97d809d3fe0e095515f8cf25f606cbfb627f (unchanged)
- app/globals.css: SHA-256 f6f606a33167f4d34c3bc47c07b32af58ffe8c7e04176df17c8733c22e677fc4 (unchanged)
- package-lock.json: SHA-256 9b714f218d5828bf846385ebf401223fa5cb368f0c3c95f40136d05e0dd0b3b4 (unchanged)
- docs/superpowers/plans/2026-10-28-backend-foundation.md: SHA-256 1cca282e8b8725ed55901b536693783487e9be151311b5390a076f9421a715a6 (unchanged)

## Remaining blockers / stop

No provider and no FOUNDATION_WORKSPACE_ID are configured; application functions fail closed and cannot serve real users. Classification remains restricted-only pending approved business policy. Provisioning authority, role governance, final field/workflow rules, audit retention/privileged-restore high-water-mark policy, real-backend contention tests, and dashboard integration require separate scope. Compatibility retirement/isolation remains unapproved and was not performed. No claim of production readiness. Stop for user review before further remote actions.
