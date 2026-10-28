import type {MutationCtx,Id} from './types';
import {assertWorkspace} from './workspace';
import {fail,invariant} from './errors';
import {timestamp,sequence} from './validators';
export function manilaDate(now:number){timestamp(now);const date=new Date(now+8*60*60*1000).toISOString().slice(0,10).replaceAll('-','');invariant(/^\d{8}$/.test(date));return date;}
export async function allocateReference(ctx:MutationCtx,workspaceId:Id<'workspaces'>,now:number){
  await assertWorkspace(ctx,workspaceId);
  const date=manilaDate(now);
  const counters=await ctx.db.query('referenceCounters').withIndex('by_workspace_date',q=>q.eq('workspaceId',workspaceId).eq('date',date)).take(2);
  invariant(counters.length<2);const counter=counters[0];const last=counter?sequence(counter.lastIssued,true):0;
  if(last===999999)fail('REFERENCE_EXHAUSTED');const next=last+1;
  const reference=`FRC-${date}-${String(next).padStart(6,'0')}`;
  invariant(!(await ctx.db.query('referenceLedger').withIndex('by_reference',q=>q.eq('reference',reference)).first()));
  invariant(!(await ctx.db.query('cases').withIndex('by_reference',q=>q.eq('reference',reference)).first()));
  if(counter)await ctx.db.patch(counter._id,{lastIssued:next});else await ctx.db.insert('referenceCounters',{workspaceId,date,lastIssued:next});
  return {reference,date,sequence:next};
}
