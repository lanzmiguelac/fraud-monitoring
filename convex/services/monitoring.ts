import type {Actor,MutationCtx,QueryCtx,Id} from '../lib/types';
import type {MonitoringArgs,MonitoringReceipt} from '../lib/validators';
import {timestamp} from '../lib/validators';
import {requireWorkspace} from '../lib/workspace';
import {authorize} from '../lib/authorization';
import {resolveClassificationFloor} from '../lib/classification';
import {findReceipt} from '../lib/idempotency';
import {loadMonitoring,visibleCase} from '../lib/relationships';
import {appendAudit} from '../lib/audit';
import {fail,invariant} from '../lib/errors';
export async function createMonitoring(ctx:MutationCtx,actor:Actor,args:MonitoringArgs):Promise<MonitoringReceipt>{
  const workspaceId=await requireWorkspace(ctx);const parent=await visibleCase(ctx,actor,args.caseId,workspaceId);
  if(resolveClassificationFloor('monitoring.create',args.moduleKey)!=='restricted')fail('CLASSIFICATION_DENIED');
  await authorize(ctx,actor,workspaceId,parent.teamId,['monitoring.create','restricted.read','restricted.write']);
  const {row:old,text}=await findReceipt(ctx,actor,workspaceId,args.idempotencyKey,'monitoring.create',args);
  if(old){
    invariant(old.result.kind==='monitoring.create');const result=old.result.receipt;const {row}=await loadMonitoring(ctx,result.monitoringRecordId,workspaceId);
    invariant(row.caseId===parent._id&&result.caseId===parent._id&&row.moduleKey===args.moduleKey&&row.createdBy===actor.userId&&result.reference===parent.reference);
    if(!row.restricted)fail('CLASSIFICATION_DENIED');return result;
  }
  const now=timestamp(Date.now());
  const monitoringRecordId=await ctx.db.insert('monitoringRecords',{workspaceId,teamId:parent.teamId,caseId:parent._id,moduleKey:args.moduleKey,restricted:true,createdBy:actor.userId,createdAt:now,updatedAt:now});
  const receipt={monitoringRecordId,caseId:parent._id,reference:parent.reference};
  const operationId=await ctx.db.insert('idempotencyRequests',{workspaceId,actorId:actor.userId,key:args.idempotencyKey,operation:'monitoring.create',canonicalPayload:text,result:{kind:'monitoring.create',receipt},completedAt:now});
  await appendAudit(ctx,{workspaceId,teamId:parent.teamId,operationId,actorId:actor.userId,kind:'monitoring.created',caseId:parent._id,monitoringRecordId,reference:parent.reference,occurredAt:now,restricted:true});
  return receipt;
}
export async function getMonitoring(ctx:QueryCtx,actor:Actor,id:Id<'monitoringRecords'>){
  const workspaceId=await requireWorkspace(ctx);
  const child=await ctx.db.get('monitoringRecords',id);if(!child||child.workspaceId!==workspaceId)fail('RECORD_NOT_ACCESSIBLE');
  const parent=await ctx.db.get('cases',child.caseId);
  if(!parent||parent.workspaceId!==workspaceId||child.teamId!==parent.teamId)fail('RECORD_NOT_ACCESSIBLE');
  const r=child;
  await authorize(ctx,actor,workspaceId,parent.teamId,['case.read','monitoring.read',...((r.restricted||parent.restricted)?['restricted.read' as const]:[])],true);
  await loadMonitoring(ctx,id,workspaceId);
  return {monitoringRecordId:r._id,workspaceId:r.workspaceId,teamId:r.teamId,caseId:r.caseId,reference:parent.reference,moduleKey:r.moduleKey,restricted:r.restricted,effectiveRestricted:r.restricted||parent.restricted,createdBy:r.createdBy,createdAt:r.createdAt,updatedAt:r.updatedAt};
}
