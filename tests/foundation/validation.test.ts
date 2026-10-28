import {afterEach,expect,it,vi} from 'vitest';
import {api,fixture,request,snapshot} from './fixtures';
import {timestamp,sequence} from '../../convex/lib/validators';
afterEach(()=>vi.unstubAllEnvs());
it.each([{restricted:false},{workspaceId:'forged'},{actorId:'forged'},{classificationFloor:false},{reference:'FRC-20261028-000001'},{role:'admin'}])('rejects unexpected authority fields %j',async fields=>{
  const f=await fixture();await expect(f.actor.mutation(api.cases.create,{...request(f.team),...fields})).rejects.toThrow();expect((await snapshot(f.t)).cases).toHaveLength(0);
});
it.each(['short','spaces are invalid','x'.repeat(129)])('rejects invalid idempotency key %s',async key=>{
  const f=await fixture();await expect(f.actor.mutation(api.cases.create,request(f.team,key))).rejects.toThrow('INVALID_ARGUMENT');expect((await snapshot(f.t)).audit).toHaveLength(0);
});
it.each([NaN,Infinity,-1,1.5,Number.MAX_SAFE_INTEGER+1])('rejects unsafe timestamp %s',value=>expect(()=>timestamp(value)).toThrow('INTEGRITY_ERROR'));
it.each([0,1000000,1.5,NaN])('rejects unsafe issued sequence %s',value=>expect(()=>sequence(value)).toThrow('INTEGRITY_ERROR'));
it('schema rejects unpaired identity and malformed audit union',async()=>{
  const f=await fixture();await expect(f.t.run(ctx=>ctx.db.insert('users',{issuer:'https://synthetic.invalid',state:'active',createdAt:0,updatedAt:0} as never))).rejects.toThrow();
  await expect(f.t.run(ctx=>ctx.db.insert('auditEvents',{kind:'reference.issued',reference:'FRC-20261028-000001'} as never))).rejects.toThrow();
});
