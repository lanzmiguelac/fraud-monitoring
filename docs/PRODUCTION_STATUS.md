# Current backend status — 2026-10-28

The approved prototype UI remains unchanged and disconnected from the foundation. Its records and interactions are still illustrative and session-local. This application is not production-ready. Historical baseline/migration documents remain intact.

The bounded Convex foundation is synchronized only to existing Development (Cloud) deployment clean-heron-346 in team lanz-miguel-acosta-71da0 / project fraud-monitoring. Four foundation functions require backend-verified identity, an active bound user, explicit team capabilities and a valid single FOUNDATION_WORKSPACE_ID. No provider, user/grant provisioning, workspace configuration, bypass or default identity was added. The remote workspace variable remains unset; foundation tables are empty.

All new envelope creation is restricted by a backend floor, regardless of caller requestRestricted=false. Permanent references use one configured workspace's Manila daily sequence, global collision checks, atomic counter/case/ledger/receipt/issuance-audit writes and no application deletion/reuse path.

Compatibility functions compat:read and compat:put remain public and unauthenticated by explicit preservation instruction. Their fixed synthetic run ID is not authentication. Their schema, by_runId index and synthetic data are retained. direct_complaints remains undefined in the foundation schema and was not queried or modified.

Verification: 79 isolated convex-test mock tests passed, with two 100-request mock contention cases and review regression tests. Backend/application typechecks, Next production build and diff checks are recorded in BACKEND_FOUNDATION_REPORT.md. These are not real-backend concurrency/OCC stress results.

Release blockers: approved identity provider and user/team/role provisioning governance; deliberate server workspace configuration; business classification and role policy; audit retention/restore/high-water-mark policy; separately approved real-backend contention testing; dashboard/workflow integration; separately approved compatibility-function isolation/retirement. No production deployment or Git commit/push/merge was performed.
