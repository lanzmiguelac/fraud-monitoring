import type {Actor,Ctx,Id} from './types';
import {key,timestamp} from './validators';
import {fail,invariant} from './errors';
// Property order is fixed; absent and false remain different. No hash collisions.
export function canonical(value:unknown):string{
  if(value===undefined)return 'absent';
  if(value===null||typeof value!=='object')return JSON.stringify(value);
  if(Array.isArray(value))return '['+value.map(canonical).join(',')+']';
  return '{'+Object.keys(value).sort().map(k=>JSON.stringify(k)+':'+canonical((value as Record<string,unknown>)[k])).join(',')+'}';
}
export async function findReceipt(ctx:Ctx,actor:Actor,workspaceId:Id<'workspaces'>,idempotencyKey:string,operation:'case.create'|'monitoring.create',payload:unknown){
  key(idempotencyKey);const text=canonical(payload);
  const rows=await ctx.db.query('idempotencyRequests').withIndex('by_scope',q=>q.eq('workspaceId',workspaceId).eq('actorId',actor.userId).eq('key',idempotencyKey)).take(2);
  invariant(rows.length<2);const row=rows[0];
  if(row){if(row.operation!==operation||row.canonicalPayload!==text)fail('IDEMPOTENCY_CONFLICT');timestamp(row.completedAt);invariant(row.result.kind===operation);}
  return {row,text};
}
