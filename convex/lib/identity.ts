import type {Actor,Ctx} from './types';
import {fail,invariant} from './errors';
import {identityString,timestamp} from './validators';
export async function requireActor(ctx:Ctx):Promise<Actor>{
  const identity=await ctx.auth.getUserIdentity();
  if(!identity)fail('UNAUTHENTICATED');
  identityString(identity.issuer);identityString(identity.subject);
  const rows=await ctx.db.query('users').withIndex('by_identity',q=>q.eq('issuer',identity.issuer).eq('subject',identity.subject)).take(2);
  invariant(rows.length<2);
  const user=rows[0];if(!user||user.state!=='active')fail('ACCESS_DENIED');
  timestamp(user.createdAt);timestamp(user.updatedAt);
  if(user.displayName!==undefined)invariant(user.displayName.length>=1&&user.displayName.length<=100);
  return {userId:user._id};
}
