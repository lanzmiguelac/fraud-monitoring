import type {Actor,Ctx,Id} from './types';
import type {Capability} from './validators';
import {referenceParts,timestamp,sequence} from './validators';
import {authorize} from './authorization';
import {fail,invariant} from './errors';

export async function loadCase(ctx:Ctx,id:Id<'cases'>,workspaceId:Id<'workspaces'>){
  const row=await ctx.db.get('cases',id);if(!row||row.workspaceId!==workspaceId)fail('RECORD_NOT_ACCESSIBLE');
  timestamp(row.createdAt);timestamp(row.updatedAt);referenceParts(row.reference,row.referenceDate,row.sequence);
  const ledgers=await ctx.db.query('referenceLedger').withIndex('by_case',q=>q.eq('caseId',id)).take(2);
  invariant(ledgers.length===1);const ledger=ledgers[0];
  invariant(ledger.workspaceId===workspaceId&&ledger.reference===row.reference&&ledger.date===row.referenceDate&&ledger.sequence===row.sequence);
  timestamp(ledger.issuedAt);sequence(ledger.sequence);invariant(await ctx.db.get('users',row.createdBy));
  return row;
}
export async function visibleCase(ctx:Ctx,actor:Actor,id:Id<'cases'>,workspaceId:Id<'workspaces'>,needs:Capability[]=['case.read']){
  const row=await ctx.db.get('cases',id);if(!row||row.workspaceId!==workspaceId)fail('RECORD_NOT_ACCESSIBLE');
  await authorize(ctx,actor,workspaceId,row.teamId,[...needs,...(row.restricted?['restricted.read' as const]:[])],true);
  return loadCase(ctx,id,workspaceId);
}
export async function loadMonitoring(ctx:Ctx,id:Id<'monitoringRecords'>,workspaceId:Id<'workspaces'>){
  const row=await ctx.db.get('monitoringRecords',id);if(!row||row.workspaceId!==workspaceId)fail('RECORD_NOT_ACCESSIBLE');
  const parent=await loadCase(ctx,row.caseId,workspaceId);
  if(row.teamId!==parent.teamId)fail('RECORD_NOT_ACCESSIBLE');
  timestamp(row.createdAt);timestamp(row.updatedAt);invariant(await ctx.db.get('users',row.createdBy));
  return {row,parent};
}
