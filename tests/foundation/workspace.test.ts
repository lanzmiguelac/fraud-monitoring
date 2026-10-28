import {afterEach,expect,it,vi} from 'vitest';
import {api,fixture,request,snapshot} from './fixtures';
afterEach(()=>vi.unstubAllEnvs());
it.each(['', 'invalid'])('rejects missing/invalid workspace configuration %s',async value=>{
  const f=await fixture();vi.stubEnv('FOUNDATION_WORKSPACE_ID',value);await expect(f.actor.mutation(api.cases.create,request(f.team))).rejects.toThrow('WORKSPACE_UNAVAILABLE');expect((await snapshot(f.t)).cases).toHaveLength(0);
});
it('rejects disabled configured workspace',async()=>{
  const f=await fixture();await f.t.run(ctx=>ctx.db.patch(f.workspace,{state:'disabled'}));await expect(f.actor.mutation(api.cases.create,request(f.team))).rejects.toThrow('WORKSPACE_UNAVAILABLE');
});
it('foreign team with valid grants cannot issue duplicate-looking references',async()=>{
  const f=await fixture();const outcomes=await Promise.allSettled([f.actor.mutation(api.cases.create,request(f.team)),f.actor.mutation(api.cases.create,request(f.foreignTeam,'foreign-request-0001'))]);
  expect(outcomes.map(o=>o.status)).toEqual(['fulfilled','rejected']);const s=await snapshot(f.t);expect(s.cases).toHaveLength(1);expect(s.counters.every(c=>c.workspaceId===f.workspace)).toBe(true);expect(s.ledger).toHaveLength(1);expect(s.audit).toHaveLength(2);
});
it('foreign global reference collision rolls back completely',async()=>{
  const f=await fixture();const c=await f.actor.mutation(api.cases.create,request(f.team));
  await f.t.run(async ctx=>{const row=await ctx.db.get(c.caseId);if(!row)throw Error();await ctx.db.insert('cases',{workspaceId:f.foreign,teamId:f.foreignTeam,reference:row.reference.replace(/000001$/,'000002'),referenceDate:row.referenceDate,sequence:2,restricted:true,createdBy:f.user,createdAt:row.createdAt,updatedAt:row.updatedAt});});
  const before=await snapshot(f.t);await expect(f.actor.mutation(api.cases.create,request(f.team,'synthetic-request-0002'))).rejects.toThrow('INTEGRITY_ERROR');expect(await snapshot(f.t)).toEqual(before);
});
it('foreign workspace records cannot be read, linked or replayed',async()=>{
  const f=await fixture();const c=await f.actor.mutation(api.cases.create,request(f.team));await f.t.run(ctx=>ctx.db.patch(c.caseId,{workspaceId:f.foreign,teamId:f.foreignTeam}));
  const before=await snapshot(f.t);await expect(f.actor.query(api.cases.get,{caseId:c.caseId})).rejects.toThrow('RECORD_NOT_ACCESSIBLE');
  await expect(f.actor.mutation(api.monitoring.create,{caseId:c.caseId,moduleKey:'direct_complaints',idempotencyKey:'synthetic-link-0001'})).rejects.toThrow('RECORD_NOT_ACCESSIBLE');
  await expect(f.actor.mutation(api.cases.create,request(f.team))).rejects.toThrow('RECORD_NOT_ACCESSIBLE');expect(await snapshot(f.t)).toEqual(before);
});
