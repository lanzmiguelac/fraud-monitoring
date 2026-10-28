import type {MutationCtx} from './types';
import type {AuditEvent} from './validators';
import {referenceParts,timestamp} from './validators';
import {assertWorkspace} from './workspace';
import {invariant} from './errors';
export async function appendAudit(ctx:MutationCtx,event:AuditEvent){
  await assertWorkspace(ctx,event.workspaceId);timestamp(event.occurredAt);
  const receipt=await ctx.db.get(event.operationId);const row=await ctx.db.get(event.caseId);
  invariant(receipt&&row&&receipt.workspaceId===event.workspaceId&&receipt.actorId===event.actorId&&receipt.completedAt===event.occurredAt&&row.teamId===event.teamId&&row.workspaceId===event.workspaceId&&row.reference===event.reference);
  if(event.kind==='reference.issued'){
    const ledger=await ctx.db.get(event.ledgerId);referenceParts(event.reference,event.referenceDate,event.sequence);
    invariant(ledger&&ledger.caseId===event.caseId&&ledger.reference===event.reference&&ledger.date===event.referenceDate&&ledger.sequence===event.sequence&&ledger.issuedAt===event.occurredAt&&ledger.workspaceId===event.workspaceId&&row.restricted===event.restricted);
  }else if(event.kind==='monitoring.created'){
    const child=await ctx.db.get(event.monitoringRecordId);invariant(child&&child.caseId===row._id&&child.teamId===event.teamId&&child.workspaceId===event.workspaceId&&(child.restricted||row.restricted)===event.restricted);
  }else invariant(row.restricted===event.restricted);
  const events=await ctx.db.query('auditEvents').withIndex('by_operation',q=>q.eq('operationId',event.operationId)).collect();
  invariant(!events.some(e=>e.kind===event.kind));
  return ctx.db.insert('auditEvents',event);
}
