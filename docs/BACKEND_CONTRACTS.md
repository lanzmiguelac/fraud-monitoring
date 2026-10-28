# Bounded foundation contracts

## Public surface

- cases:create({teamId, requestRestricted?, idempotencyKey, initialMonitoring?:{moduleKey,requestRestricted?}}) -> {caseId,reference,initialMonitoringRecordId:null|id}.
- cases:get({caseId}) -> {caseId,workspaceId,teamId,reference,referenceDate,sequence,restricted,createdBy,createdAt,updatedAt}.
- monitoring:create({caseId,moduleKey,requestRestricted?,idempotencyKey}) -> {monitoringRecordId,caseId,reference}.
- monitoring:get({monitoringRecordId}) -> {monitoringRecordId,workspaceId,teamId,caseId,reference,moduleKey,restricted,effectiveRestricted,createdBy,createdAt,updatedAt}.

All have exact argument/return validators. Create receipts additionally undergo explicit pre-return validation inside the mutation. No browsing, arbitrary payloads, role administration, provisioning, audit writer, update/delete, reference-only or HTTP action endpoint is provided. Preserved compat:read and compat:put are the two explicitly retained legacy exceptions; they are not foundation endpoints.

## Identity, authorization and classification

Only ctx.auth.getUserIdentity supplies identity. issuer/subject must map uniquely to an active users row. No IdP configuration is supplied. Role names grant nothing: active roleAssignments supply explicit capabilities within the requested team only. No cross-team union. case.read/create, monitoring.read/create and restricted.read/write are the allowed capabilities. Monitoring get also requires case.read for its parent.

FOUNDATION_WORKSPACE_ID is server-only, must normalize to an existing active workspace and has no fallback. Unset/malformed/deleted/disabled configuration fails closed. Team, case, child, receipt, ledger and event relationships must agree with it. Other workspace memberships cannot issue or access references. No switch or metadata provisioning endpoint exists.

Backend classification currently returns restricted for recognized envelope creates and deny for unsupported operations/modules. False/omitted caller requests cannot lower that floor. All creates require restricted.read and restricted.write in addition to base operation capabilities. Effective child restriction is child OR parent. Replay rechecks current capabilities, scope and classification; older unrestricted receipts cannot bypass the current floor.

## Transactions and idempotency

Key syntax: 16–128 ASCII letters/digits/underscore/hyphen, case-sensitive, no trimming. Scope: workspace + actor + key, independent of date and operation. Canonical validated payload preserves absent vs false and includes operation-specific arguments. Reusing a key with a changed operation/payload throws IDEMPOTENCY_CONFLICT. An exact authorized replay returns original IDs/reference and makes no writes. Receipts/ledger/counters have no application cleanup/reset path in this phase.

FRC-YYYYMMDD-NNNNNN uses backend time at UTC+08:00 (Asia/Manila), one daily counter shared across teams in the configured workspace, sequences 1..999999. Overflow hard-stops. Global by_reference lookups on cases and ledger reject collisions even in foreign/corrupt metadata. Read-before-write logical uniqueness uses Convex transactional OCC; indexes alone are not UNIQUE constraints. Admin/CLI writes and restores remain outside application no-reuse guarantees.

Case creation commits case, optional initial child, counter, immutable ledger, completed receipt and all audit rows together. Monitoring creation commits its child/receipt/audit with no extra reference. Exceptions roll back mutation writes. A rolled-back candidate was never issued; committed references are not reused.

## Audit

Exact tagged union: reference.issued requires reference, ledgerId, referenceDate, sequence; case.created includes case/reference; monitoring.created additionally requires child ID. Every event also has operationId, actorId, workspaceId, teamId, caseId, occurredAt and effective restricted flag. One server timestamp is shared by a successful operation.

Counts: case only = 2 (issuance + case); case with initial child = 3; later child = 1; replay, denial, conflict, overflow or rollback = 0 new events. Append helpers use the caller mutation context; no scheduler or separate transaction. No audit patch/delete endpoint. This is application append-only behavior, not tamper-proof storage against privileged operators.

Errors: UNAUTHENTICATED, ACCESS_DENIED, RECORD_NOT_ACCESSIBLE, WORKSPACE_UNAVAILABLE, CLASSIFICATION_DENIED, INVALID_ARGUMENT, IDEMPOTENCY_CONFLICT, REFERENCE_EXHAUSTED, INTEGRITY_ERROR. Inaccessible record lookups use the generic error before inspecting hidden integrity details.

## Development synchronization discipline

Pin the exact existing development target and inspect status/schema/functions before sync. Carry forward convex/compat.ts unchanged and retain compat_smoke_records validator/by_runId; omit direct_complaints entirely. Stop if another person's deployment changes cannot be reconciled. Never run the historical sibling compatibility artifact over the foundation snapshot. No cloud data/identity provisioning or config changes are part of tests.

Convex 1.48.0 codegen uploads/stages function/schema bundles to the selected development backend to produce bindings; it is not offline. Final dev --once sync was explicitly authorized for clean-heron-346 only. Do not assume codegen is read-only. Generated files are never hand edited.

pnpm 11.25.0 and pnpm-lock.yaml are authoritative here. package-lock.json is historical and intentionally unchanged. pnpm-workspace.yaml has exact package-age exceptions for convex@1.48.0 and convex-test@0.0.66; other dependency policy remains in force.

## Test scope

Use pnpm test:foundation, pnpm typecheck:convex, pnpm typecheck and pnpm build. Identity fixtures and fault injection live only under tests/foundation, using isolated convex-test databases. The mock commits before its outer return validator, so receipts are also validated inside the real handler to make return-failure rollback explicit.

Mock concurrent calls do not certify production/cloud OCC, capacity or retry latency. The real-backend stress test is a separate approval gate. No synthetic remote identities or runtime auth bypass may be introduced to satisfy it.
