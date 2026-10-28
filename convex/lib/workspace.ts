import type {Ctx,Id} from './types';
import {fail,invariant} from './errors';
import {metadataKey,timestamp} from './validators';
export async function requireWorkspace(ctx:Ctx):Promise<Id<'workspaces'>>{
  const raw=process.env.FOUNDATION_WORKSPACE_ID;
  const id=raw?ctx.db.normalizeId('workspaces',raw):null;
  if(!id)fail('WORKSPACE_UNAVAILABLE');
  const workspace=await ctx.db.get('workspaces',id);
  if(!workspace||workspace.state!=='active')fail('WORKSPACE_UNAVAILABLE');
  metadataKey(workspace.key);timestamp(workspace.createdAt);
  invariant((await ctx.db.query('workspaces').withIndex('by_key',q=>q.eq('key',workspace.key)).take(2)).length===1);
  return id;
}
export async function assertWorkspace(ctx:Ctx,id:Id<'workspaces'>){invariant(id===await requireWorkspace(ctx));}
