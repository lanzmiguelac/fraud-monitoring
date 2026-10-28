import {afterEach,expect,it,vi} from 'vitest';
import {api,fixture,request,snapshot} from './fixtures';
afterEach(()=>vi.unstubAllEnvs());
it('hides foreign/cross-team and nonexistent records with the same error',async()=>{
  const f=await fixture();const c=await f.actor.mutation(api.cases.create,request(f.team));
  await f.t.run(ctx=>ctx.db.patch(f.grants[0],{state:'revoked'}));await expect(f.actor.query(api.cases.get,{caseId:c.caseId})).rejects.toThrow('RECORD_NOT_ACCESSIBLE');
  await f.t.run(ctx=>ctx.db.delete(c.caseId));await expect(f.actor.query(api.cases.get,{caseId:c.caseId})).rejects.toThrow('RECORD_NOT_ACCESSIBLE');
});
it('rejects a corrupt child-parent team relationship and parent restriction leaks',async()=>{
  const f=await fixture();const c=await f.actor.mutation(api.cases.create,{...request(f.team),initialMonitoring:{moduleKey:'direct_complaints'}});
  await f.t.run(ctx=>ctx.db.patch(c.initialMonitoringRecordId!,{teamId:f.otherTeam}));await expect(f.actor.query(api.monitoring.get,{monitoringRecordId:c.initialMonitoringRecordId})).rejects.toThrow('RECORD_NOT_ACCESSIBLE');
});
it('rolls back initial link when monitoring permission is missing',async()=>{
  const f=await fixture();await f.t.run(ctx=>ctx.db.patch(f.grants[0],{capabilities:['case.create','restricted.read','restricted.write']}));const before=await snapshot(f.t);
  await expect(f.actor.mutation(api.cases.create,{...request(f.team),initialMonitoring:{moduleKey:'direct_complaints'}})).rejects.toThrow('ACCESS_DENIED');expect(await snapshot(f.t)).toEqual(before);
});
it('does not inspect corrupt inaccessible case details before authorization',async()=>{
  const f=await fixture();const c=await f.actor.mutation(api.cases.create,request(f.team));await f.t.run(async ctx=>{await ctx.db.patch(f.grants[0],{state:'revoked'});await ctx.db.patch(c.caseId,{reference:'corrupt'});});
  await expect(f.actor.query(api.cases.get,{caseId:c.caseId})).rejects.toThrow('RECORD_NOT_ACCESSIBLE');
});
it('requires monitoring.read before inspecting parent integrity',async()=>{
  const f=await fixture();const c=await f.actor.mutation(api.cases.create,{...request(f.team),initialMonitoring:{moduleKey:'direct_complaints'}});
  await f.t.run(async ctx=>{await ctx.db.patch(f.grants[0],{capabilities:['case.read','restricted.read']});await ctx.db.patch(c.caseId,{reference:'corrupt'});});
  await expect(f.actor.query(api.monitoring.get,{monitoringRecordId:c.initialMonitoringRecordId})).rejects.toThrow('RECORD_NOT_ACCESSIBLE');
});
