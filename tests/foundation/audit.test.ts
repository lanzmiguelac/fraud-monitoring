import {afterEach,expect,it,vi} from 'vitest';
import {api,fixture,request,snapshot} from './fixtures';
afterEach(()=>vi.unstubAllEnvs());
it.each([false,true])('creates exact audit union and atomic issuance with initial envelope=%s',async initial=>{
  const f=await fixture();const args={...request(f.team),...(initial?{initialMonitoring:{moduleKey:'direct_complaints'}}:{})};const c=await f.actor.mutation(api.cases.create,args);const s=await snapshot(f.t);
  expect(s.audit).toHaveLength(initial?3:2);expect(s.ledger).toHaveLength(1);expect(s.receipts).toHaveLength(1);
  const issue=s.audit.find(e=>e.kind==='reference.issued')!;expect(issue.reference).toBe(c.reference);expect(issue.ledgerId).toBe(s.ledger[0]._id);expect(issue.operationId).toBe(s.receipts[0]._id);expect(issue.actorId).toBe(f.user);expect(issue.sequence).toBe(1);expect(issue.occurredAt).toBe(s.ledger[0].issuedAt);expect(s.audit.every(e=>e.reference===c.reference&&e.restricted&&e.occurredAt===issue.occurredAt)).toBe(true);
  await f.actor.mutation(api.cases.create,args);expect((await snapshot(f.t)).audit).toEqual(s.audit);
});
it('later link emits exactly one monitoring event and no new issuance',async()=>{
  const f=await fixture();const c=await f.actor.mutation(api.cases.create,request(f.team));const before=await snapshot(f.t);const args={caseId:c.caseId,moduleKey:'direct_complaints',idempotencyKey:'synthetic-link-0001'};await f.actor.mutation(api.monitoring.create,args);const after=await snapshot(f.t);expect(after.audit).toHaveLength(3);expect(after.audit.filter(e=>e.kind==='reference.issued')).toHaveLength(1);expect(after.counters).toEqual(before.counters);expect(after.ledger).toEqual(before.ledger);await f.actor.mutation(api.monitoring.create,args);expect((await snapshot(f.t)).audit).toEqual(after.audit);
});
