# Approved Phase 1 UI prototype baseline

The approved Fraud Monitoring Workspace interface is preserved in `app/page.tsx`, `app/globals.css`, and `app/layout.tsx`. The original implementation commit is `51f309f03ebbc01e1a195a17d5b4573a27da1926`.

## Scope

- Dashboard, module navigation, case tables, search, filtering, sorting, pagination, and selection.
- Case detail and create/edit drawers, browser-native form validation, light/dark themes, and responsive styling.
- Illustrative reports and audit views; sample CSV export.
- All case data is fictional. The interface explicitly displays “Illustrative sample data only” and “No live bank records”.
- Edits exist in React state and reset on reload. No Convex integration, production authentication, or production data connections were implemented.

## Runtime and existing scaffolding

The project uses TypeScript, React, Tailwind CSS, and Next.js App Router conventions, built and served by the Sites Vinext compatibility runtime. It is not a verified deployment using the standard Next.js runtime.

Existing starter components, authentication helpers, database schemas, examples, and hosting configuration are retained. Their presence does not mean Phase 2 functionality is implemented or connected to the prototype.

## Verification

Run from the repository root with existing dependencies installed:

```sh
node node_modules/typescript/bin/tsc --noEmit
npm run build
```

There is no dedicated automated test script. Prior browser checks verified sample creation, editing, an empty search result, navigation, and both themes. Mobile device testing and a full accessibility audit remain outstanding.

## GitHub connection

No GitHub remote was configured when this baseline was prepared. Preserve the existing Git history.

For an empty GitHub repository (create it without a README, license, or .gitignore), after commit/push approval and authentication:

```sh
git remote add origin https://github.com/OWNER/REPOSITORY.git
git remote -v
git ls-remote origin
git push -u origin main
git rev-parse HEAD
git ls-remote origin refs/heads/main
```

Replace OWNER/REPOSITORY with the actual repository. Compare the final local and remote hashes to verify the push. If the remote already contains commits, fetch and inspect its history before choosing a branch or integration approach; do not force-push or overwrite history.
