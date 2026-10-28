import {afterEach,expect,it,vi} from 'vitest';
import {api,fixture,request,snapshot} from './fixtures';
import * as audit from '../../convex/lib/audit';
import * as casesService from '../../convex/services/cases';
import * as monitoringService from '../../convex/services/monitoring';
afterEach(()=>{vi.restoreAllMocks();vi.unstubAllEnvs();});
it('mock contention: 100 creates share sequence with exactly 200 events',async()=>{
  const f=await fixture();const rows=await Promise.all(Array.from({length:100},(_,i)=>f.actor.mutation(api.cases.create,request(i%2?f.team:f.otherTeam,'synthetic-'+String(i).padStart(16,'0')))));expect(new Set(rows.map(r=>r.reference)).size).toBe(100);const s=await snapshot(f.t);expect(s.cases).toHaveLength(100);expect(s.ledger).toHaveLength(100);expect(s.receipts).toHaveLength(100);expect(s.audit).toHaveLength(200);
});
it('mock contention: 100 retries create one case and two events',async()=>{
  const f=await fixture();const rows=await Promise.all(Array.from({length:100},()=>f.actor.mutation(api.cases.create,request(f.team))));expect(new Set(rows.map(r=>r.caseId)).size).toBe(1);const s=await snapshot(f.t);expect(s.cases).toHaveLength(1);expect(s.receipts).toHaveLength(1);expect(s.audit).toHaveLength(2);
});
it.each(['reference.issued','case.created','monitoring.created'])('rolls back every table if %s audit insertion fails',async kind=>{
  const f=await fixture();const before=await snapshot(f.t);const original=audit.appendAudit;
  vi.spyOn(audit,'appendAudit').mockImplementation(async(ctx,event)=>{if(event.kind===kind)throw Error('synthetic audit failure');return original(ctx,event);});
  await expect(f.actor.mutation(api.cases.create,{...request(f.team),initialMonitoring:{moduleKey:'direct_complaints'}})).rejects.toThrow('synthetic audit failure');
  expect(await snapshot(f.t)).toEqual(before);
});
it('return validation failure rolls back case, counter, ledger, receipt and audits',async()=>{
  const f=await fixture();const before=await snapshot(f.t);const original=casesService.createCase;
  vi.spyOn(casesService,'createCase').mockImplementation(async(...args)=>({...await original(...args),reference:42} as never));
  await expect(f.actor.mutation(api.cases.create,request(f.team))).rejects.toThrow();expect(await snapshot(f.t)).toEqual(before);
});
it('mock mixed-payload retries have one winner and no duplicate audit',async()=>{
  const f=await fixture();const results=await Promise.allSettled(Array.from({length:30},(_,i)=>f.actor.mutation(api.cases.create,{...request(f.team),requestRestricted:i%2===0})));
  expect(results.filter(r=>r.status==='rejected')).toHaveLength(15);expect((await snapshot(f.t)).audit).toHaveLength(2);
});
it('mock concurrent monitoring retries create one link and one extra event',async()=>{
  const f=await fixture();const c=await f.actor.mutation(api.cases.create,request(f.team));const args={caseId:c.caseId,moduleKey:'direct_complaints',idempotencyKey:'synthetic-link-0001'};
  await Promise.all(Array.from({length:30},()=>f.actor.mutation(api.monitoring.create,args)));const s=await snapshot(f.t);expect(s.links).toHaveLength(1);expect(s.audit).toHaveLength(3);expect(s.ledger).toHaveLength(1);
});
it.each(['audit','return'])('standalone monitoring %s failure rolls back its link, receipt and event',async point=>{
  const f=await fixture();const c=await f.actor.mutation(api.cases.create,request(f.team));const before=await snapshot(f.t);
  if(point==='audit')vi.spyOn(audit,'appendAudit').mockImplementation(async()=>{throw Error('synthetic failure');});
  else {const original=monitoringService.createMonitoring;vi.spyOn(monitoringService,'createMonitoring').mockImplementation(async(...args)=>({...await original(...args),reference:42} as never));}
  await expect(f.actor.mutation(api.monitoring.create,{caseId:c.caseId,moduleKey:'direct_complaints',idempotencyKey:'synthetic-link-0001'})).rejects.toThrow();expect(await snapshot(f.t)).toEqual(before);
});
