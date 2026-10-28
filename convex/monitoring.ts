import {v} from 'convex/values';
import {query,mutation} from './lib/functions';
import {monitoringArgs,monitoringReceipt,monitoringEnvelope,validateReceipt} from './lib/validators';
import {requireActor} from './lib/identity';
import {createMonitoring,getMonitoring} from './services/monitoring';
export const create=mutation({args:monitoringArgs,returns:monitoringReceipt,handler:async(ctx,args)=>{const result=await createMonitoring(ctx,await requireActor(ctx),args);validateReceipt(ctx,result,'monitoring.create');return result;}});
export const get=query({args:{monitoringRecordId:v.id('monitoringRecords')},returns:monitoringEnvelope,handler:async(ctx,args)=>getMonitoring(ctx,await requireActor(ctx),args.monitoringRecordId)});
