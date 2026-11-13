import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const root=path.resolve(process.argv[2]||'.');
const entries=[];
function walk(rel){
 const abs=path.join(root,rel),s=fs.lstatSync(abs);
 const e={path:rel||'.',type:s.isDirectory()?'directory':s.isSymbolicLink()?'symlink':s.isFile()?'file':'other',mode:s.mode&0o7777,mtime:Math.floor(s.mtimeMs/1000)};
 if(e.type==='file')e.size=s.size;
 if(e.type==='symlink')e.target=fs.readlinkSync(abs);
 if(e.type==='other')throw new Error('Unsupported special file: '+rel);
 entries.push(e);
 if(e.type==='directory')for(const n of fs.readdirSync(abs).sort())walk(rel?rel+'/'+n:n);
}
walk('');
const files=entries.filter(e=>e.type==='file');let cursor=0;
async function worker(){while(cursor<files.length){const e=files[cursor++],h=crypto.createHash('sha256');for await(const b of fs.createReadStream(path.join(root,e.path)))h.update(b);e.sha256=h.digest('hex');}}
await Promise.all(Array.from({length:4},worker));
entries.sort((a,b)=>Buffer.compare(Buffer.from(a.path),Buffer.from(b.path)));
const canonical=entries.map(e=>({path:e.path,type:e.type,mode:e.mode,...(e.type==='file'?{size:e.size,sha256:e.sha256}:e.type==='symlink'?{target:e.target}:{})}));
const portableCanonical=canonical.map(e=>{const c={...e};if(c.type==='symlink')delete c.mode;return c;});
const portableTreeSha256=crypto.createHash('sha256').update(JSON.stringify(portableCanonical)).digest('hex');
const externalLinks=entries.filter(e=>e.type==='symlink').filter(e=>{const dest=path.resolve(root,path.dirname(e.path),e.target);return dest!==root&&!dest.startsWith(root+path.sep);}).map(e=>({path:e.path,target:e.target}));
const manifest={schema:1,project:'ai-video-1114-astra',createdAt:new Date().toISOString(),counts:{files:files.length,directories:entries.filter(e=>e.type==='directory').length,symlinks:entries.filter(e=>e.type==='symlink').length},totalFileBytes:files.reduce((n,e)=>n+e.size,0),contentTreeSha256:crypto.createHash('sha256').update(JSON.stringify(canonical)).digest('hex'),portableTreeSha256,externalLinks,entries};
process.stdout.write(JSON.stringify(manifest,null,2)+'\n');
