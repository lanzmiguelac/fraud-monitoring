import { afterEach, expect, it, vi } from 'vitest';
import { resolveClassificationFloor } from '../../convex/lib/classification';
import { api, fixture, request, snapshot, capabilities } from './fixtures';
afterEach(() => vi.unstubAllEnvs());
it.each([undefined, false, true])('caller request %s cannot lower the backend floor', async flag => {
  const f = await fixture(); const args = {...request(f.team), ...(flag === undefined ? {} : {requestRestricted:flag})};
  const receipt = await f.actor.mutation(api.cases.create,args);
  expect((await f.actor.query(api.cases.get,{caseId:receipt.caseId})).restricted).toBe(true);
});
it('denies unknown classification paths', () => expect(resolveClassificationFloor('unknown')).toBe('deny'));
it.each(['restricted.read', 'restricted.write'])('requires %s even with requestRestricted false', async missing => {
  const f = await fixture(); await f.t.run(ctx=>ctx.db.patch(f.grants[0],{capabilities:capabilities.filter(c=>c!==missing)}));
  const before=await snapshot(f.t);
  await expect(f.actor.mutation(api.cases.create,{...request(f.team),requestRestricted:false})).rejects.toThrow('ACCESS_DENIED');
  expect(await snapshot(f.t)).toEqual(before);
});
it('classifies initial and later links as restricted even under a legacy unrestricted parent', async()=>{
  const f=await fixture(); const r=await f.actor.mutation(api.cases.create,{...request(f.team),initialMonitoring:{moduleKey:'direct_complaints',requestRestricted:false}});
  await f.t.run(ctx=>ctx.db.patch(r.caseId,{restricted:false}));
  const link=await f.actor.mutation(api.monitoring.create,{caseId:r.caseId,moduleKey:'client_complaints',requestRestricted:false,idempotencyKey:'synthetic-link-0001'});
  expect((await snapshot(f.t)).links.every(l=>l.restricted)).toBe(true);
  expect((await f.actor.query(api.monitoring.get,{monitoringRecordId:link.monitoringRecordId})).effectiveRestricted).toBe(true);
});
