import { afterEach, expect, it, vi } from 'vitest';
import { api, capabilities, fixture, request, snapshot } from './fixtures';
afterEach(() => vi.unstubAllEnvs());
it('fails closed on all four endpoints without identity', async()=>{
  const f=await fixture();const c=await f.actor.mutation(api.cases.create,request(f.team));
  const l=await f.actor.mutation(api.monitoring.create,{caseId:c.caseId,moduleKey:'direct_complaints',idempotencyKey:'synthetic-link-0001'});
  await expect(f.t.mutation(api.cases.create,request(f.team))).rejects.toThrow('UNAUTHENTICATED');
  await expect(f.t.query(api.cases.get,{caseId:c.caseId})).rejects.toThrow('UNAUTHENTICATED');
  await expect(f.t.mutation(api.monitoring.create,{caseId:c.caseId,moduleKey:'direct_complaints',idempotencyKey:'synthetic-link-0002'})).rejects.toThrow('UNAUTHENTICATED');
  await expect(f.t.query(api.monitoring.get,{monitoringRecordId:l.monitoringRecordId})).rejects.toThrow('UNAUTHENTICATED');
});
it('denies unknown and disabled users',async()=>{
  const f=await fixture(); await expect(f.t.withIdentity({issuer:'https://unknown.invalid',subject:'x'}).mutation(api.cases.create,request(f.team))).rejects.toThrow('ACCESS_DENIED');
  await f.t.run(ctx=>ctx.db.patch(f.user,{state:'disabled'}));await expect(f.actor.mutation(api.cases.create,request(f.team))).rejects.toThrow('ACCESS_DENIED');
});
it.each(capabilities)('checks capability %s without role-name elevation',async missing=>{
  const f=await fixture(); const c=await f.actor.mutation(api.cases.create,request(f.team));
  const l=await f.actor.mutation(api.monitoring.create,{caseId:c.caseId,moduleKey:'direct_complaints',idempotencyKey:'synthetic-link-0001'});
  await f.t.run(ctx=>ctx.db.patch(f.grants[0],{roleKey:'administrator',capabilities:capabilities.filter(c=>c!==missing)}));
  if(['case.create','restricted.read','restricted.write'].includes(missing)) await expect(f.actor.mutation(api.cases.create,request(f.team,'synthetic-request-0002'))).rejects.toThrow('ACCESS_DENIED');
  if(['case.read','restricted.read'].includes(missing)) await expect(f.actor.query(api.cases.get,{caseId:c.caseId})).rejects.toThrow('RECORD_NOT_ACCESSIBLE');
  if(['monitoring.read','restricted.read'].includes(missing)) await expect(f.actor.query(api.monitoring.get,{monitoringRecordId:l.monitoringRecordId})).rejects.toThrow('RECORD_NOT_ACCESSIBLE');
  if(['monitoring.create','case.read','restricted.read','restricted.write'].includes(missing)) await expect(f.actor.mutation(api.monitoring.create,{caseId:c.caseId,moduleKey:'direct_complaints',idempotencyKey:'synthetic-link-0002'})).rejects.toThrow(/ACCESS_DENIED|RECORD_NOT_ACCESSIBLE/);
});
it('rechecks revoked grants on idempotent replay',async()=>{
  const f=await fixture();const args=request(f.team);await f.actor.mutation(api.cases.create,args);const before=await snapshot(f.t);
  await f.t.run(ctx=>ctx.db.patch(f.grants[0],{state:'revoked'}));await expect(f.actor.mutation(api.cases.create,args)).rejects.toThrow('ACCESS_DENIED');expect(await snapshot(f.t)).toEqual(before);
});
