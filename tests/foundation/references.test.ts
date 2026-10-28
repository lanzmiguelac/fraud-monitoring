import { afterEach, expect, it, vi } from 'vitest';
import { manilaDate } from '../../convex/lib/references';
import { api, fixture, request, snapshot } from './fixtures';

afterEach(() => { vi.useRealTimers(); vi.unstubAllEnvs(); });
it.each([
  ['2026-10-28T15:59:59.999Z', '20261028'], ['2026-10-28T16:00:00.000Z', '20261029'],
  ['2026-12-31T16:00:00.000Z', '20270101'], ['2028-02-28T16:00:00.000Z', '20280229'],
  ['2028-02-29T16:00:00.000Z', '20280301'],
])('uses Manila date at %s', (input, expected) => expect(manilaDate(Date.parse(input))).toBe(expected));
it('shares one daily sequence across teams and resets the next day', async () => {
  vi.useFakeTimers(); vi.setSystemTime(new Date('2026-10-28T15:59:59Z'));
  const f = await fixture();
  const a = await f.actor.mutation(api.cases.create, request(f.team));
  const b = await f.actor.mutation(api.cases.create, request(f.otherTeam, 'synthetic-request-0002'));
  expect(a.reference).toBe('FRC-20261028-000001'); expect(b.reference).toBe('FRC-20261028-000002');
  vi.setSystemTime(new Date('2026-10-28T16:00:00Z'));
  const c = await f.actor.mutation(api.cases.create, request(f.team, 'synthetic-request-0003'));
  expect(c.reference).toBe('FRC-20261029-000001');
});
it('hard-stops overflow without consuming state', async () => {
  const f = await fixture();
  await f.t.run(ctx => ctx.db.insert('referenceCounters', { workspaceId: f.workspace, date: manilaDate(Date.now()), lastIssued: 999998 }));
  expect((await f.actor.mutation(api.cases.create, request(f.team))).reference).toMatch(/-999999$/);
  const before = await snapshot(f.t);
  await expect(f.actor.mutation(api.cases.create, request(f.team, 'synthetic-request-0002'))).rejects.toThrow('REFERENCE_EXHAUSTED');
  expect(await snapshot(f.t)).toEqual(before);
});
it('fails closed on a duplicate counter', async () => {
  const f = await fixture();
  await f.t.run(async ctx => { for (let i=0;i<2;i++) await ctx.db.insert('referenceCounters', {workspaceId:f.workspace,date:manilaDate(Date.now()),lastIssued:0}); });
  await expect(f.actor.mutation(api.cases.create, request(f.team))).rejects.toThrow('INTEGRITY_ERROR');
});
it('mock near-overflow contention issues only the final six-digit reference',async()=>{
  const f=await fixture();await f.t.run(ctx=>ctx.db.insert('referenceCounters',{workspaceId:f.workspace,date:manilaDate(Date.now()),lastIssued:999998}));
  const outcomes=await Promise.allSettled(Array.from({length:10},(_,i)=>f.actor.mutation(api.cases.create,request(f.team,'near-overflow-'+String(i).padStart(10,'0')))));
  expect(outcomes.filter(o=>o.status==='fulfilled')).toHaveLength(1);const s=await snapshot(f.t);expect(s.cases).toHaveLength(1);expect(s.cases[0].reference).toMatch(/-999999$/);expect(s.audit).toHaveLength(2);
});
