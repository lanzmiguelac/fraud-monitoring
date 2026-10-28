# Standard Next.js / Vercel migration

This branch migrates the frontend runtime only. The approved UI and illustrative session-only data remain unchanged. There is no database or staff authentication integration, and this is not ready for real customer data.

## Local development

Use Node.js >=22.13.0 and pnpm 11.25.0 (see package.json). From the repository root:

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Open the URL printed by Next.js. For a production-mode local check:

```sh
pnpm typecheck
pnpm build
pnpm start
```

On Windows, use the VS Code terminal with Node.js installed; `pnpm.cmd` can be used if PowerShell blocks the command shim. Standard scripts no longer require Bash, GNU timeout or Cloudflare Workers.

## Vercel project settings (do not deploy until approved)

- Import the existing GitHub repository only after this branch is reviewed and pushed with approval.
- Root directory: repository root.
- Framework preset: Next.js.
- Install: `pnpm install --frozen-lockfile`.
- Build: `pnpm build` (runs `next build`).
- Output directory: Next.js default; do not set `dist` or use a static export.
- Choose a supported Vercel Node version satisfying the package engine; verify its exact version in preview build logs.
- Pin the package manager from `packageManager`; if the Vercel build image cannot select pnpm 11.25.0, stop and resolve tooling compatibility rather than rewriting the lockfile with a different major.
- No environment variables are required for the current demo.
- No Vercel project, domain, Git integration or deployment was created as part of this migration. Importing a project or pushing to an already connected branch may automatically deploy; do so only with approval.

## Future backend / authentication boundary

Convex is not installed or connected on this branch. The prior local Convex startup timeout remains unresolved. A later phase must establish a working development backend and fail-closed authorization before persistent data or staff login is introduced.

A future `NEXT_PUBLIC_CONVEX_URL` is public client configuration, not a secret; its Preview and Production values must point to separate intended backends. Never prefix deployment/admin keys or identity-provider secrets with `NEXT_PUBLIC_`. Never expose secrets through Next config `env`, Git, browser code or documentation.

A future Convex deployment build command has side effects; do not add `convex deploy` to the normal build until backend/deployment approval. No identity provider has been selected. The retained `app/chatgpt-auth.ts` helper depends on trusted Sites dispatch headers and does not supply Vercel authentication; do not call it as a Vercel security boundary or trust visitor-provided identity headers.

## Preserved legacy hosting

Existing `vite.config.ts`, `worker/`, `scripts/`, `.openai/hosting.json`, connector scaffold, and D1/Drizzle files are retained for review/rollback. They are not active Next.js routes or authoritative databases. No cloud bindings are migrated or copied.

The original hosting commands remain explicitly named `dev:sites`, `build:sites`, and `start:sites`. `tsconfig.sites.json` preserves the original compiler configuration; `tsconfig.json` excludes the legacy Cloudflare-only files from the standard Next.js compilation. Using legacy hosting again requires its normal environment and a separate verification; these retained commands are not claimed to have been retested by this migration.

The existing published Site remains unchanged. This branch is for an external Vercel target and must not be published through the Sites Worker deployment pipeline. Rollback means returning to the preserved baseline branch/commit through normal reviewed Git operations, not rewriting shared history.

## Verification observed in this migration

Environment: managed Linux, Node 24.22.1, TypeScript 5.9.3, existing Next.js 16.3.4 and existing lockfile/dependencies.

- Standard `next build`: passed, including compilation, TypeScript and static prerendering of `/` and `/_not-found`.
- `tsc --noEmit`: passed.
- Production `next start` on loopback: HTTP 200 for `/`, expected illustrative dashboard/reference content; unknown route returned HTTP 404. Smoke-test process stopped afterward.
- `git diff --check`: passed.
- Approved `app/page.tsx`, `app/globals.css`, `app/layout.tsx`: unchanged.
- Browser interaction/theme/responsive verification on the new runtime: blocked. The managed preview launcher adds `--host ... --strictPort` (Vite flags); Next rejects `--host`. The launcher was not bypassed or compensated for in application code.
- Windows execution, actual Vercel preview builds, staff authentication and database behavior: not tested.

Before deployment approval, run the migrated application in VS Code and verify create/edit, search/filter/sort/pagination/selection, drawer keyboard behavior, light/dark modes, sidebar and mobile/tablet layout. The original UI was tested in earlier phases under Vinext; those results are not a substitute for these migration browser checks.
