import type {Actor,Ctx,Id} from './types';
import type {Capability} from './validators';
import {metadataKey,timestamp} from './validators';
import {fail,invariant} from './errors';
export async function authorize(ctx:Ctx,actor:Actor,workspaceId:Id<'workspaces'>,teamId:Id<'teams'>,needs:Capability[],hidden=false){
  const deny=()=>fail(hidden?'RECORD_NOT_ACCESSIBLE':'ACCESS_DENIED');
  const team=await ctx.db.get('teams',teamId);
  if(!team||team.workspaceId!==workspaceId||team.state!=='active')return deny();
  metadataKey(team.key);timestamp(team.createdAt);
  invariant((await ctx.db.query('teams').withIndex('by_workspace_key',q=>q.eq('workspaceId',workspaceId).eq('key',team.key)).take(2)).length===1);
  const grants=await ctx.db.query('roleAssignments').withIndex('by_user_team',q=>q.eq('userId',actor.userId).eq('teamId',teamId)).collect();
  const capabilities=new Set<Capability>();
  for(const grant of grants){
    metadataKey(grant.roleKey);timestamp(grant.createdAt);timestamp(grant.updatedAt);invariant(new Set(grant.capabilities).size===grant.capabilities.length);
    if(grant.state==='active')for(const c of grant.capabilities)capabilities.add(c);
  }
  if(needs.some(c=>!capabilities.has(c)))return deny();
}
