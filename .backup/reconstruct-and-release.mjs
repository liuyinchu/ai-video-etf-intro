import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {Readable} from 'node:stream';
import {pipeline} from 'node:stream/promises';

const repo=process.env.GITHUB_REPOSITORY;
assert.equal(repo,'liuyinchu/ai-video-etf-intro');
const token=process.env.GITHUB_TOKEN;
assert(token,'GITHUB_TOKEN is required');
const meta=JSON.parse(fs.readFileSync('.backup/snapshot.json','utf8'));
const expected=JSON.parse(fs.readFileSync('.backup/file-manifest.json','utf8'));
const work=path.resolve('.snapshot-output');
fs.mkdirSync(work,{recursive:true});
const archive=path.join(work,meta.archiveName);
const sha=async file=>{const h=crypto.createHash('sha256');for await(const b of fs.createReadStream(file))h.update(b);return h.digest('hex');};
const portable=entries=>entries.map(e=>({path:e.path,type:e.type,...(e.type==='symlink'?{target:e.target}:{mode:e.mode}),...(e.type==='file'?{size:e.size,sha256:e.sha256}:{})}));
const hashEntries=entries=>crypto.createHash('sha256').update(JSON.stringify(portable(entries))).digest('hex');

const out=fs.createWriteStream(archive);
for(const part of meta.parts){
 assert(part.path.startsWith('.snapshot/part-'));
 assert.equal(fs.statSync(part.path).size,part.bytes);
 assert.equal(await sha(part.path),part.sha256,'Part hash '+part.path);
 for await(const buf of fs.createReadStream(part.path))if(!out.write(buf))await new Promise(resolve=>out.once('drain',resolve));
}
await new Promise((resolve,reject)=>{out.on('error',reject);out.end(resolve);});
assert.equal(fs.statSync(archive).size,meta.archiveBytes);
assert.equal(await sha(archive),meta.archiveSha256,'Assembled archive hash');
console.log('Archive reconstructed and SHA-256 verified:',meta.archiveBytes,'bytes');

const restore=path.join(work,'restore');
fs.mkdirSync(restore,{recursive:true});
execFileSync('tar',['-xzpf',archive,'--no-same-owner','-C',restore],{stdio:['ignore','ignore','pipe'],maxBuffer:64e6});
const restoredRoot=path.join(restore,meta.projectDirectory);
const scan=JSON.parse(execFileSync(process.execPath,['.backup/inventory.mjs',restoredRoot],{encoding:'utf8',maxBuffer:64e6}));
const names=new Set(expected.entries.map(e=>e.path));
const actual=new Map(scan.entries.map(e=>[e.path,e]));
const extras=scan.entries.filter(e=>!names.has(e.path));
assert(extras.every(e=>path.basename(e.path).startsWith('._')),'Unexpected extracted files');
for(const e of expected.entries){
 const a=actual.get(e.path);assert(a,'Missing '+e.path);assert.equal(a.type,e.type,e.path);
 if(e.type==='file'){assert.equal(a.size,e.size,e.path);assert.equal(a.sha256,e.sha256,e.path);assert.equal(a.mode,e.mode,e.path);}
 if(e.type==='symlink')assert.equal(a.target,e.target,e.path);
 if(e.type==='directory')assert.equal(a.mode,e.mode,e.path);
}
const matched=expected.entries.map(e=>actual.get(e.path));
assert.equal(hashEntries(matched),expected.portableTreeSha256,'Restored portable tree hash');
const restoredHead=execFileSync('git',['--git-dir='+path.join(restoredRoot,'.git'),'rev-parse','HEAD'],{encoding:'utf8'}).trim();
assert.equal(restoredHead,meta.sourceCommit);
execFileSync('git',['--git-dir='+path.join(restoredRoot,'.git'),'fsck','--full'],{stdio:['ignore','ignore','pipe'],maxBuffer:16e6});
console.log('Restored and verified all original files, executable modes, symbolic links and Git history.');

const base='https://api.github.com/repos/'+repo;
const headers={Authorization:'Bearer '+token,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28','User-Agent':'etf-complete-backup'};
async function api(method,url,body){
 const r=await fetch(url,{method,headers:{...headers,...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined});
 if(r.status===204)return null;
 const data=await r.json();
 if(!r.ok)throw new Error('GitHub API '+method+' '+r.status+': '+(data.message||'unknown'));
 return data;
}
let release;
{
 const r=await fetch(base+'/releases/tags/'+encodeURIComponent(meta.releaseTag),{headers});
 if(r.status===404)release=await api('POST',base+'/releases',{tag_name:meta.releaseTag,target_commitish:meta.sourceCommit,name:'ETF P1/P2 完整工程备份 · '+meta.snapshotId,draft:true,body:'完整工程快照，正在验证。Snapshot: '+meta.snapshotId});
 else {if(!r.ok)throw new Error('Release lookup '+r.status);release=await r.json();assert(release.body.includes(meta.snapshotId),'Unexpected existing release');}
}
async function download(asset,destination){
 assert(asset.url.startsWith(base+'/releases/assets/'));
 let r=await fetch(asset.url,{headers:{...headers,Accept:'application/octet-stream'},redirect:'manual'});
 if(r.status>=300&&r.status<400){const u=new URL(r.headers.get('location'));assert(u.hostname.endsWith('githubusercontent.com')||u.hostname.endsWith('github.com'));r=await fetch(u,{redirect:'follow'});}
 if(!r.ok)throw new Error('Asset download '+r.status);
 await pipeline(Readable.fromWeb(r.body),fs.createWriteStream(destination));
}
async function publishAsset(file,name,type='application/octet-stream'){
 const bytes=fs.statSync(file).size,expectedHash=await sha(file);
 let items=await api('GET',base+'/releases/'+release.id+'/assets?per_page=100');
 let asset=items.find(a=>a.name===name);
 if(asset&&(asset.size!==bytes||asset.state!=='uploaded')){await api('DELETE',asset.url);asset=null;}
 if(!asset){
  const r=await fetch('https://uploads.github.com/repos/'+repo+'/releases/'+release.id+'/assets?name='+encodeURIComponent(name),{method:'POST',headers:{...headers,'Content-Type':type,'Content-Length':String(bytes)},body:fs.createReadStream(file),duplex:'half',redirect:'error',signal:AbortSignal.timeout(20*60*1000)});
  const data=await r.json();if(!r.ok)throw new Error('Upload '+name+' '+r.status+': '+(data.message||'failed'));asset=data;
 }
 assert.equal(asset.size,bytes);
 if(asset.digest)assert.equal(asset.digest,'sha256:'+expectedHash);
 const downloaded=path.join(work,'roundtrip-'+name);
 await download(asset,downloaded);
 assert.equal(fs.statSync(downloaded).size,bytes);
 assert.equal(await sha(downloaded),expectedHash,'Release round-trip '+name);
 fs.unlinkSync(downloaded);
 console.log('Release asset uploaded and downloaded with matching SHA-256:',name);
 return {name,bytes,sha256:expectedHash,id:asset.id,url:asset.browser_download_url,serverDigest:asset.digest||null,roundTripVerified:true};
}
const uploadFiles=[
 {file:archive,name:meta.archiveName,type:'application/gzip'},
 {file:'.backup/file-manifest.json',name:'file-manifest.json',type:'application/json'},
 {file:'.backup/source-history.bundle',name:'source-history.bundle',type:'application/octet-stream'}
];
const sums=[];
for(const f of uploadFiles)sums.push((await sha(f.file))+'  '+f.name);
fs.writeFileSync(path.join(work,'SHA256SUMS'),sums.join('\n')+'\n');
uploadFiles.push({file:path.join(work,'SHA256SUMS'),name:'SHA256SUMS',type:'text/plain'});
const assets=[];
for(const f of uploadFiles)assets.push(await publishAsset(f.file,f.name,f.type));
const report={
 schema:1,snapshotId:meta.snapshotId,sourceCommit:restoredHead,createdAt:new Date().toISOString(),
 workflowRunId:process.env.GITHUB_RUN_ID,workflowCommit:process.env.GITHUB_SHA,
 archive:{name:meta.archiveName,bytes:meta.archiveBytes,sha256:meta.archiveSha256},
 sourceFileCounts:expected.counts,totalFileBytes:expected.totalFileBytes,
 restoredAllOriginalEntries:true,portableTreeSha256:expected.portableTreeSha256,
 extraMacMetadataFiles:extras.length,gitFsckPassed:true,releaseRoundTrips:assets,
 releaseUrl:release.html_url,validationStatus:'PASS'
};
const reportFile=path.join(work,'verification-report.json');
fs.writeFileSync(reportFile,JSON.stringify(report,null,2)+'\n');
await publishAsset(reportFile,'verification-report.json','application/json');
const body=[
 '# ETF P1/P2 完整工程备份','',
 'Snapshot: '+meta.snapshotId,
 '原始源码提交：'+meta.sourceCommit,
 '完整工程包括源码、Git 历史、依赖、原始素材、P1/P2 成片、音频、字幕、封面、发布文案和所有忽略文件。',
 '',
 '**恢复请下载 '+meta.archiveName+'。GitHub 自动生成的 Source code 压缩包只包含已跟踪源码，不是完整工程。**',
 '',
 '## 校验结果',
 '- 所有分块、完整压缩包 SHA-256 校验通过。',
 '- 解包后校验全部 '+expected.counts.files+' 个文件、'+expected.counts.symlinks+' 个符号链接及目录结构。',
 '- Git fsck 和原始 HEAD 校验通过。',
 '- Release 附件重新下载后，大小与 SHA-256 全部匹配。',
 '',
 '压缩包 SHA-256：'+meta.archiveSha256,
 '原始文件总字节数：'+expected.totalFileBytes,
 '详细证明：verification-report.json；逐文件清单：file-manifest.json。',
 '',
 '本视频仅科普，不构成任何投资建议。'
].join('\n');
release=await api('PATCH',base+'/releases/'+release.id,{draft:false,body});
console.log(JSON.stringify({status:'PASS',releaseUrl:release.html_url,archiveSha256:meta.archiveSha256,files:expected.counts.files,assets:assets.map(a=>a.name)},null,2));
if(process.env.GITHUB_STEP_SUMMARY)fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,body+'\n\nRelease: '+release.html_url+'\n');
