import {defineSchema,defineTable} from 'convex/server';
import {v} from 'convex/values';
import {activeState,capability,caseFields,monitoringFields,operation,result,auditEvent} from './lib/validators';
import {compatTable} from './lib/compatSchema';

const userCommon={state:activeState,displayName:v.optional(v.string()),createdAt:v.number(),updatedAt:v.number()};
export default defineSchema({
  workspaces:defineTable({key:v.string(),state:activeState,createdAt:v.number()}).index('by_key',['key']),
  users:defineTable(v.union(v.object({...userCommon,issuer:v.string(),subject:v.string()}),v.object(userCommon))).index('by_identity',['issuer','subject']),
  teams:defineTable({workspaceId:v.id('workspaces'),key:v.string(),state:activeState,createdAt:v.number()}).index('by_workspace_key',['workspaceId','key']),
  roleAssignments:defineTable({userId:v.id('users'),teamId:v.id('teams'),roleKey:v.string(),capabilities:v.array(capability),state:v.union(v.literal('active'),v.literal('revoked')),createdAt:v.number(),updatedAt:v.number()}).index('by_user_team',['userId','teamId']).index('by_team',['teamId']),
  cases:defineTable(caseFields).index('by_team',['teamId']).index('by_reference',['reference']),
  monitoringRecords:defineTable(monitoringFields).index('by_case',['caseId']).index('by_team_module',['teamId','moduleKey']),
  referenceCounters:defineTable({workspaceId:v.id('workspaces'),date:v.string(),lastIssued:v.number()}).index('by_workspace_date',['workspaceId','date']),
  referenceLedger:defineTable({workspaceId:v.id('workspaces'),reference:v.string(),date:v.string(),sequence:v.number(),caseId:v.id('cases'),issuedAt:v.number()}).index('by_reference',['reference']).index('by_case',['caseId']),
  idempotencyRequests:defineTable({workspaceId:v.id('workspaces'),actorId:v.id('users'),key:v.string(),operation,canonicalPayload:v.string(),result,completedAt:v.number()}).index('by_scope',['workspaceId','actorId','key']),
  auditEvents:defineTable(auditEvent).index('by_case',['caseId']).index('by_operation',['operationId']),
  compat_smoke_records:compatTable,
  // direct_complaints deliberately remains undefined and untouched.
});
