import { v, type Infer } from 'convex/values';
import { fail, invariant } from './errors';

export const moduleKey = v.union(v.literal('direct_complaints'),v.literal('client_complaints'),v.literal('str_endorsements'),v.literal('suspensions_lifting'),v.literal('debit_advice'),v.literal('afasa_dtr'),v.literal('edd_endorsements'),v.literal('preservation_orders_warrants'));
export const capability = v.union(v.literal('case.read'),v.literal('case.create'),v.literal('monitoring.read'),v.literal('monitoring.create'),v.literal('restricted.read'),v.literal('restricted.write'));
export type Capability = Infer<typeof capability>;
export const activeState = v.union(v.literal('active'),v.literal('disabled'));
export const initialMonitoring = v.object({moduleKey,requestRestricted:v.optional(v.boolean())});
export const caseArgs = {teamId:v.id('teams'),requestRestricted:v.optional(v.boolean()),idempotencyKey:v.string(),initialMonitoring:v.optional(initialMonitoring)};
export const monitoringArgs = {caseId:v.id('cases'),moduleKey,requestRestricted:v.optional(v.boolean()),idempotencyKey:v.string()};
export type CaseArgs = Infer<ReturnType<typeof caseArgsValidator>>;
function caseArgsValidator(){return v.object(caseArgs);}
export type MonitoringArgs = Infer<ReturnType<typeof monitoringArgsValidator>>;
function monitoringArgsValidator(){return v.object(monitoringArgs);}
export const caseReceipt = v.object({caseId:v.id('cases'),reference:v.string(),initialMonitoringRecordId:v.union(v.id('monitoringRecords'),v.null())});
export const monitoringReceipt = v.object({monitoringRecordId:v.id('monitoringRecords'),caseId:v.id('cases'),reference:v.string()});
export type CaseReceipt = Infer<typeof caseReceipt>;
export type MonitoringReceipt = Infer<typeof monitoringReceipt>;
export const caseFields={workspaceId:v.id('workspaces'),teamId:v.id('teams'),reference:v.string(),referenceDate:v.string(),sequence:v.number(),restricted:v.boolean(),createdBy:v.id('users'),createdAt:v.number(),updatedAt:v.number()};
export const monitoringFields={workspaceId:v.id('workspaces'),teamId:v.id('teams'),caseId:v.id('cases'),moduleKey,restricted:v.boolean(),createdBy:v.id('users'),createdAt:v.number(),updatedAt:v.number()};
export const caseEnvelope=v.object({caseId:v.id('cases'),...caseFields});
export const monitoringEnvelope=v.object({monitoringRecordId:v.id('monitoringRecords'),...monitoringFields,reference:v.string(),effectiveRestricted:v.boolean()});
export const operation = v.union(v.literal('case.create'),v.literal('monitoring.create'));
export const result = v.union(v.object({kind:v.literal('case.create'),receipt:caseReceipt}),v.object({kind:v.literal('monitoring.create'),receipt:monitoringReceipt}));
const auditCommon={workspaceId:v.id('workspaces'),teamId:v.id('teams'),operationId:v.id('idempotencyRequests'),actorId:v.id('users'),caseId:v.id('cases'),reference:v.string(),occurredAt:v.number(),restricted:v.boolean()};
export const auditEvent=v.union(
  v.object({...auditCommon,kind:v.literal('reference.issued'),ledgerId:v.id('referenceLedger'),referenceDate:v.string(),sequence:v.number()}),
  v.object({...auditCommon,kind:v.literal('case.created')}),
  v.object({...auditCommon,kind:v.literal('monitoring.created'),monitoringRecordId:v.id('monitoringRecords')})
);
export type AuditEvent=Infer<typeof auditEvent>;
export function timestamp(n:number){invariant(Number.isSafeInteger(n)&&n>=0);return n;}
export function sequence(n:number,allowZero=false){invariant(Number.isSafeInteger(n)&&n>=(allowZero?0:1)&&n<=999999);return n;}
export function key(value:string){if(!/^[A-Za-z0-9_-]{16,128}$/.test(value))fail('INVALID_ARGUMENT');}
export function metadataKey(value:string){invariant(/^[A-Za-z0-9_-]{1,64}$/.test(value));}
export function identityString(value:string){invariant(value.length>=1&&value.length<=2048);}
export function referenceParts(reference:string,date:string,n:number){sequence(n);invariant(/^\d{8}$/.test(date)&&reference===`FRC-${date}-${String(n).padStart(6,'0')}`);}
// Run before the mutation handler returns, so failure remains transactional even
// in test runners that perform their registered return validation after commit.
export function validateReceipt(ctx:import('./types').Ctx,value:unknown,kind:'case.create'|'monitoring.create'){
  invariant(value!==null&&typeof value==='object'&&!Array.isArray(value));
  const r=value as Record<string,unknown>;
  const keys=kind==='case.create'?['caseId','reference','initialMonitoringRecordId']:['caseId','reference','monitoringRecordId'];
  invariant(Object.keys(r).length===keys.length&&keys.every(k=>Object.hasOwn(r,k)));
  invariant(typeof r.caseId==='string'&&ctx.db.normalizeId('cases',r.caseId));
  invariant(typeof r.reference==='string'&&/^FRC-\d{8}-\d{6}$/.test(r.reference)&&!r.reference.endsWith('-000000'));
  const child=kind==='case.create'?r.initialMonitoringRecordId:r.monitoringRecordId;
  invariant((kind==='case.create'&&child===null)||(typeof child==='string'&&ctx.db.normalizeId('monitoringRecords',child)));
}
