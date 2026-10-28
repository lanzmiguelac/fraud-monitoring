import { anyApi } from 'convex/server';
import { vi } from 'vitest';
import { makeTest } from './setup';

export const api = anyApi;
export const capabilities = ['case.read', 'case.create', 'monitoring.read', 'monitoring.create', 'restricted.read', 'restricted.write'] as const;
export async function fixture() {
  const t = makeTest();
  const ids = await t.run(async ctx => {
    const now = Date.now();
    const workspace = await ctx.db.insert('workspaces', { key: 'synthetic', state: 'active', createdAt: now });
    const foreign = await ctx.db.insert('workspaces', { key: 'foreign', state: 'active', createdAt: now });
    const team = await ctx.db.insert('teams', { workspaceId: workspace, key: 'one', state: 'active', createdAt: now });
    const otherTeam = await ctx.db.insert('teams', { workspaceId: workspace, key: 'two', state: 'active', createdAt: now });
    const foreignTeam = await ctx.db.insert('teams', { workspaceId: foreign, key: 'foreign', state: 'active', createdAt: now });
    const user = await ctx.db.insert('users', { issuer: 'https://synthetic.invalid', subject: 'tester', state: 'active', createdAt: now, updatedAt: now });
    const grants = [];
    for (const teamId of [team, otherTeam, foreignTeam]) grants.push(await ctx.db.insert('roleAssignments', { userId: user, teamId, roleKey: 'test-only', capabilities: [...capabilities], state: 'active', createdAt: now, updatedAt: now }));
    return { workspace, foreign, team, otherTeam, foreignTeam, user, grants };
  });
  vi.stubEnv('FOUNDATION_WORKSPACE_ID', ids.workspace);
  return { t, actor: t.withIdentity({ issuer: 'https://synthetic.invalid', subject: 'tester' }), ...ids };
}
export const request = (teamId: unknown, key = 'synthetic-request-0001') => ({ teamId, idempotencyKey: key });
export async function snapshot(t: ReturnType<typeof makeTest>) {
  return t.run(async ctx => ({
    cases: await ctx.db.query('cases').collect(), links: await ctx.db.query('monitoringRecords').collect(),
    counters: await ctx.db.query('referenceCounters').collect(), ledger: await ctx.db.query('referenceLedger').collect(),
    receipts: await ctx.db.query('idempotencyRequests').collect(), audit: await ctx.db.query('auditEvents').collect(),
  }));
}
