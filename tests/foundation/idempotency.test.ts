import {afterEach,expect,it,vi} from 'vitest';
import {api,fixture,request,snapshot} from './fixtures';
afterEach(()=>{vi.useRealTimers();vi.unstubAllEnvs();});
it('returns exact receipt after midnight with zero new audit events',async()=>{
  vi.useFakeTimers();vi.setSystemTime(new Date('2026-10-28T15:59:59Z'));const f=await fixture();const args=request(f.team);const a=await f.actor.mutation(api.cases.create,args);const before=await snapshot(f.t);vi.setSystemTime(new Date('2026-10-28T16:00:00Z'));expect(await f.actor.mutation(api.cases.create,args)).toEqual(a);expect(await snapshot(f.t)).toEqual(before);
});
it.each([{requestRestricted:false},{requestRestricted:true},{initialMonitoring:{moduleKey:'direct_complaints'}}])('rejects changed payload %j',async change=>{
  const f=await fixture();const args=request(f.team);await f.actor.mutation(api.cases.create,args);const before=await snapshot(f.t);await expect(f.actor.mutation(api.cases.create,{...args,...change})).rejects.toThrow('IDEMPOTENCY_CONFLICT');expect(await snapshot(f.t)).toEqual(before);
});
it('rejects changed team and operation reuse',async()=>{
  const f=await fixture();const c=await f.actor.mutation(api.cases.create,request(f.team));await expect(f.actor.mutation(api.cases.create,request(f.otherTeam))).rejects.toThrow('IDEMPOTENCY_CONFLICT');await expect(f.actor.mutation(api.monitoring.create,{caseId:c.caseId,moduleKey:'direct_complaints',idempotencyKey:'synthetic-request-0001'})).rejects.toThrow('IDEMPOTENCY_CONFLICT');
});
it('denies replay when an older receipt references an unrestricted case',async()=>{
  const f=await fixture();const args=request(f.team);const c=await f.actor.mutation(api.cases.create,args);await f.t.run(ctx=>ctx.db.patch(c.caseId,{restricted:false}));const before=await snapshot(f.t);await expect(f.actor.mutation(api.cases.create,args)).rejects.toThrow('CLASSIFICATION_DENIED');expect(await snapshot(f.t)).toEqual(before);
});
it('rejects changed initial child restriction request with no writes',async()=>{
  const f=await fixture();const args={...request(f.team),initialMonitoring:{moduleKey:'direct_complaints',requestRestricted:false}};
  await f.actor.mutation(api.cases.create,args);const before=await snapshot(f.t);await expect(f.actor.mutation(api.cases.create,{...args,initialMonitoring:{...args.initialMonitoring,requestRestricted:true}})).rejects.toThrow('IDEMPOTENCY_CONFLICT');expect(await snapshot(f.t)).toEqual(before);
});
it('monitoring retries reject changed module or parent and revoked permissions',async()=>{
  const f=await fixture();const a=await f.actor.mutation(api.cases.create,request(f.team));const b=await f.actor.mutation(api.cases.create,request(f.team,'synthetic-request-0002'));
  const args={caseId:a.caseId,moduleKey:'direct_complaints',idempotencyKey:'synthetic-link-0001'};await f.actor.mutation(api.monitoring.create,args);const before=await snapshot(f.t);
  for(const change of [{moduleKey:'client_complaints'},{caseId:b.caseId}])await expect(f.actor.mutation(api.monitoring.create,{...args,...change})).rejects.toThrow('IDEMPOTENCY_CONFLICT');
  await f.t.run(ctx=>ctx.db.patch(f.grants[0],{state:'revoked'}));await expect(f.actor.mutation(api.monitoring.create,args)).rejects.toThrow('RECORD_NOT_ACCESSIBLE');expect(await snapshot(f.t)).toEqual(before);
});
it('same key is independent for two trusted synthetic actors',async()=>{
  const f=await fixture();await f.t.run(async ctx=>{const now=Date.now();const userId=await ctx.db.insert('users',{issuer:'https://synthetic.invalid',subject:'tester-two',state:'active',createdAt:now,updatedAt:now});await ctx.db.insert('roleAssignments',{userId,teamId:f.team,roleKey:'test-only',capabilities:['case.create','restricted.read','restricted.write'],state:'active',createdAt:now,updatedAt:now});});
  const two=f.t.withIdentity({issuer:'https://synthetic.invalid',subject:'tester-two'});const args=request(f.team);const a=await f.actor.mutation(api.cases.create,args);const b=await two.mutation(api.cases.create,args);expect(a.caseId).not.toBe(b.caseId);expect((await snapshot(f.t)).receipts).toHaveLength(2);
});
