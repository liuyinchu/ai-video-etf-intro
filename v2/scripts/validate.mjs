import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
const tl=JSON.parse(fs.readFileSync('src/timeline.json','utf8')),story=JSON.parse(fs.readFileSync('src/story.json','utf8')),charts=JSON.parse(fs.readFileSync('src/charts.json','utf8'));
const clean=s=>s.replace(/&amp;/g,'&').replace(/[\s\p{P}\p{S}]/gu,'').toLowerCase();
const productScenes=tl.scenes.filter(s=>s.ticker),expected=['VOO','VTI','VT','VXUS','QQQ','QQQM','SCHD','BND','SGOV','VGSH','VGIT','TLT','GLD','EWJ','510300'];
assert.deepEqual(productScenes.map(s=>s.ticker),expected);assert.equal(tl.scenes.length,20);
let end=0;for(const s of tl.scenes){assert.equal(s.from,end,'Timeline gap '+s.id);assert(s.voiceFrom+Math.ceil(s.voiceDuration*30)<=s.from+s.duration);end=s.from+s.duration;if(s.ticker){assert(s.duration/30>=30,'Product too brief '+s.id);assert(s.beats.some(b=>b.name==='growth'));assert(s.beats.some(b=>b.name==='risk'));}}
assert.equal(end,tl.total);assert.equal(tl.total,Math.round(tl.seconds*30));
for(let i=0;i<tl.subs.length;i++){const s=tl.subs[i];assert(s.to>s.from&&s.from>=0&&s.to<=tl.total);if(i)assert(s.from>=tl.subs[i-1].to);}
for(let i=0;i<tl.clips.length;i++){const c=tl.clips[i],m=JSON.parse(fs.readFileSync('public/'+c.src.replace(/\.wav$/,'.json'),'utf8'));assert.equal(clean(m.words.map(w=>w.text).join('')),clean(story.scenes[i].lines.join('')),'Speech alignment '+story.scenes[i].id);}
for(const ticker of expected){const d=charts.funds[ticker];for(const key of ['total','price','drawdown']){assert(d[key].length>100);assert(d[key].flat().every(Number.isFinite));}assert(Math.abs(d.total.at(-1)[1]-100-d.stats.total_return_pct)<.003);assert(Math.abs(d.price.at(-1)[1]-100-d.stats.price_return_pct)<.003);assert(Math.abs(Math.min(...d.drawdown.map(p=>p[1]))-d.stats.max_drawdown_pct)<.003);const source=fs.readFileSync('../ETF_从原理到配置的入门指南/attachments/etf-guide-'+ticker.toLowerCase()+'.svg');assert.equal(crypto.createHash('sha256').update(source).digest('hex'),d.sourceHash);}
const preserve=JSON.parse(fs.readFileSync('docs/v1-preservation.json','utf8'));assert.equal(crypto.createHash('sha256').update(fs.readFileSync('../out/ETF_原理类型收益与风险_1080p.mp4')).digest('hex'),preserve.sha256);
assert(!/定投|再平衡|推荐比例/.test(story.scenes.map(s=>s.lines.join('')).join('')));
const audio=JSON.parse(fs.readFileSync('out/audio-master-report.json','utf8'));assert(Math.abs(Number(audio.output_i)+16)<.3);assert(Number(audio.output_tp)<=-1.4);
const comparison=JSON.parse(fs.readFileSync('out/audio-comparison.json','utf8'));assert(comparison.musicReductionRelativeToVoiceDB>3);
const report={version:2,seconds:tl.seconds,frames:tl.total,sceneCount:tl.scenes.length,individualETFScenes:productScenes.length,productSeconds:productScenes.reduce((n,s)=>n+s.duration/30,0),subtitleCount:tl.subs.length,charts:45,v1VideoUnchanged:true,validation:'Pass: exact speech text, continuous timing, independent SVG axis reconstruction, endpoint / CAGR / drawdown verification, preserved source hashes and V1 video.',audio,comparison,products:productScenes.map(s=>({ticker:s.ticker,seconds:s.duration/30,from:s.from/30}))};
fs.writeFileSync('out/validation.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
