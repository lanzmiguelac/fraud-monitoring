import {expect,it} from 'vitest';
import {readFile,readdir} from 'node:fs/promises';
import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'../..');
it('exposes four guarded foundation functions, retaining only the approved compatibility exception',async()=>{
  for(const name of ['cases','monitoring']){const source=await readFile(resolve(root,'convex',name+'.ts'),'utf8');expect(source.match(/export const /g)).toHaveLength(2);expect(source.match(/returns:/g)).toHaveLength(2);expect(source.match(/await requireActor\(ctx\)/g)).toHaveLength(2);}
  const top=(await readdir(resolve(root,'convex'))).filter(n=>n.endsWith('.ts')&&!['schema.ts','cases.ts','monitoring.ts','compat.ts'].includes(n));expect(top).toEqual([]);
});
it('has no auth bypass, fixture import, audit patch/delete or direct_complaints schema entry',async()=>{
  for(const dir of ['lib','services'])for(const name of await readdir(resolve(root,'convex',dir))){const source=await readFile(resolve(root,'convex',dir,name),'utf8');expect(source).not.toMatch(/withIdentity|synthetic.invalid|from ['"].*tests|setAuth|ctx\.db\.delete|db\.patch\([^\n]*audit/);}
  const schema=await readFile(resolve(root,'convex/schema.ts'),'utf8');expect(schema).not.toMatch(/direct_complaints\s*:/);
});
