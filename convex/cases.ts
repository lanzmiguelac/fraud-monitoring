import {v} from 'convex/values';
import {query,mutation} from './lib/functions';
import {caseArgs,caseReceipt,caseEnvelope,validateReceipt} from './lib/validators';
import {requireActor} from './lib/identity';
import {createCase,getCase} from './services/cases';
export const create=mutation({args:caseArgs,returns:caseReceipt,handler:async(ctx,args)=>{const result=await createCase(ctx,await requireActor(ctx),args);validateReceipt(ctx,result,'case.create');return result;}});
export const get=query({args:{caseId:v.id('cases')},returns:caseEnvelope,handler:async(ctx,args)=>getCase(ctx,await requireActor(ctx),args.caseId)});
