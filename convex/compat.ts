import {query, mutation} from './_generated/server';
import {v} from 'convex/values';
const runIdValidator=v.literal('compat-20261028-7jnh6udr');
export const read=query({args:{runId:runIdValidator},handler:async(ctx,{runId})=>ctx.db.query('compat_smoke_records').withIndex('by_runId',q=>q.eq('runId',runId)).collect()});
export const put=mutation({args:{runId:runIdValidator,value:v.union(v.literal('created'),v.literal('updated'))},handler:async(ctx,{runId,value})=>{const existing=await ctx.db.query('compat_smoke_records').withIndex('by_runId',q=>q.eq('runId',runId)).unique();const record={runId,marker:'synthetic-only' as const,value,updatedAt:Date.now()};if(existing){await ctx.db.patch(existing._id,record);return existing._id;}return ctx.db.insert('compat_smoke_records',record);}});
