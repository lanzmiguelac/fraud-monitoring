import type {Actor,MutationCtx,QueryCtx,Id} from '../lib/types';
import type {CaseArgs,CaseReceipt} from '../lib/validators';
import {timestamp} from '../lib/validators';
import {requireWorkspace} from '../lib/workspace';
import {authorize} from '../lib/authorization';
import {resolveClassificationFloor} from '../lib/classification';
import {findReceipt} from '../lib/idempotency';
import {allocateReference} from '../lib/references';
import {appendAudit} from '../lib/audit';
import {loadCase,loadMonitoring,visibleCase} from '../lib/relationships';
import {fail,invariant} from '../lib/errors';

export async function createCase(ctx:MutationCtx,actor:Actor,args:CaseArgs):Promise<CaseReceipt>{
  const workspaceId=await requireWorkspace(ctx);
  if(resolveClassificationFloor('case.create')!=='restricted')fail('CLASSIFICATION_DENIED');
  if(args.initialMonitoring&&resolveClassificationFloor('monitoring.create',args.initialMonitoring.moduleKey)!=='restricted')fail('CLASSIFICATION_DENIED');
  await authorize(ctx,actor,workspaceId,args.teamId,['case.create','restricted.read','restricted.write',...(args.initialMonitoring?['monitoring.create' as const]:[])]);
  const {row:old,text}=await findReceipt(ctx,actor,workspaceId,args.idempotencyKey,'case.create',args);
  if(old){
    invariant(old.result.kind==='case.create');const result=old.result.receipt;
    const row=await loadCase(ctx,result.caseId,workspaceId);
    invariant(row.teamId===args.teamId&&row.reference===result.reference&&row.createdBy===actor.userId);
    if(!row.restricted)fail('CLASSIFICATION_DENIED');
    invariant(Boolean(args.initialMonitoring)===Boolean(result.initialMonitoringRecordId));
    if(result.initialMonitoringRecordId){const {row:child}=await loadMonitoring(ctx,result.initialMonitoringRecordId,workspaceId);invariant(child.caseId===row._id&&child.createdBy===actor.userId&&child.moduleKey===args.initialMonitoring?.moduleKey);if(!child.restricted)fail('CLASSIFICATION_DENIED');}
    return result;
  }
  const now=timestamp(Date.now());const issued=await allocateReference(ctx,workspaceId,now);
  const common={workspaceId,teamId:args.teamId,restricted:true,createdBy:actor.userId,createdAt:now,updatedAt:now};
  const caseId=await ctx.db.insert('cases',{...common,reference:issued.reference,referenceDate:issued.date,sequence:issued.sequence});
  const initialMonitoringRecordId=args.initialMonitoring?await ctx.db.insert('monitoringRecords',{...common,caseId,moduleKey:args.initialMonitoring.moduleKey}):null;
  const ledgerId=await ctx.db.insert('referenceLedger',{workspaceId,reference:issued.reference,date:issued.date,sequence:issued.sequence,caseId,issuedAt:now});
  const receipt={caseId,reference:issued.reference,initialMonitoringRecordId};
  const operationId=await ctx.db.insert('idempotencyRequests',{workspaceId,actorId:actor.userId,key:args.idempotencyKey,operation:'case.create',canonicalPayload:text,result:{kind:'case.create',receipt},completedAt:now});
  const audit={workspaceId,teamId:args.teamId,operationId,actorId:actor.userId,caseId,reference:issued.reference,occurredAt:now,restricted:true};
  await appendAudit(ctx,{...audit,kind:'reference.issued',ledgerId,referenceDate:issued.date,sequence:issued.sequence});
  await appendAudit(ctx,{...audit,kind:'case.created'});
  if(initialMonitoringRecordId)await appendAudit(ctx,{...audit,kind:'monitoring.created',monitoringRecordId:initialMonitoringRecordId});
  return receipt;
}
export async function getCase(ctx:QueryCtx,actor:Actor,caseId:Id<'cases'>){
  const workspaceId=await requireWorkspace(ctx);const r=await visibleCase(ctx,actor,caseId,workspaceId);
  return {caseId:r._id,workspaceId:r.workspaceId,teamId:r.teamId,reference:r.reference,referenceDate:r.referenceDate,sequence:r.sequence,restricted:r.restricted,createdBy:r.createdBy,createdAt:r.createdAt,updatedAt:r.updatedAt};
}
