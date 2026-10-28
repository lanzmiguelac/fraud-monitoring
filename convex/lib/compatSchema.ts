import {defineTable} from 'convex/server';
import {v} from 'convex/values';
// Preserve the existing development compatibility validator/index exactly.
export const compatTable=defineTable({runId:v.string(),marker:v.literal('synthetic-only'),value:v.union(v.literal('created'),v.literal('updated')),updatedAt:v.number()}).index('by_runId',['runId']);
