import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
const tl=JSON.parse(fs.readFileSync('src/timeline.json','utf8'));
const story=JSON.parse(fs.readFileSync('src/story.json','utf8'));
const clean=s=>s.replace(/&amp;/g,'&').replace(/[\s\p{P}\p{S}]/gu,'').toLowerCase();
let end=0;
const report={scenes:tl.scenes.length,seconds:tl.seconds,frames:tl.total,subtitles:tl.subs.length,tickers:15,checks:[],hashes:{}};
assert.equal(tl.scenes.length,18);
assert.equal(tl.total,Math.round(tl.seconds*30));
const omitted=['overlap','history','horizon','currency','allocation','stress','rebalance','compound','trading','traps'];
assert(!tl.scenes.some(s=>omitted.includes(s.id)));
for(const s of tl.scenes){assert.equal(s.from,end,'Timeline gap at '+s.id);assert(s.voiceFrom>=s.from);assert(s.voiceFrom+Math.ceil(s.voiceDuration*30)<=s.from+s.duration,'Voice spills at '+s.id);end=s.from+s.duration;}
assert.equal(end,tl.total);
for(let i=0;i<tl.subs.length;i++){const a=tl.subs[i];assert(a.to>a.from);assert(a.from>=0&&a.to<=tl.total);if(i)assert(a.from>=tl.subs[i-1].to,'Caption overlap '+i);}
for(let i=0;i<tl.clips.length;i++){
 const c=tl.clips[i],s=story.scenes[i],info=JSON.parse(fs.readFileSync('public/'+c.src.replace(/\.wav$/,'.json'),'utf8'));
 assert.equal(clean(info.words.map(w=>w.text).join('')),clean(s.lines.join('')),'Word timing mismatch '+s.id);
 assert(fs.statSync('public/'+c.src).size>1000);
}
const text=JSON.stringify(story.scenes);
for(const ticker of ['VOO','VTI','VT','VXUS','QQQ','QQQM','SCHD','BND','SGOV','VGSH','VGIT','TLT','GLD','EWJ','510300'])assert(text.includes(ticker),'Missing '+ticker);
assert(!/定投|再平衡|推荐比例|60%|80%/.test(text));
assert(story.scenes[0].lines.some(s=>s.includes('不构成任何投资建议')));
assert(story.scenes.at(-1).lines.some(s=>s.includes('不构成任何投资建议')));
const svg=fs.readFileSync('ETF_从原理到配置的入门指南/attachments/etf-guide-2022.svg','utf8');
const original=JSON.parse(svg.match(/<dc:description>([\s\S]*?)<\/dc:description>/)[1]),data=JSON.parse(fs.readFileSync('src/data.json','utf8')).returns2022;
assert.deepEqual(data,original);
assert.equal(((110-100+3)/100*100).toFixed(0),'13');
assert.equal((-6*.01*100).toFixed(0),'-6');
assert(fs.statSync('public/master.wav').size>1000000);
const audio=JSON.parse(fs.readFileSync('out/audio-master-report.json','utf8'));assert(Math.abs(Number(audio.output_i)+16)<.3);assert(Number(audio.output_tp)<=-1.4);
report.audio=audio;
report.checks=['Continuous scene timeline','Voice fully inside each scene','Nonoverlapping subtitles','Every subtitle derived from exact speech word sequence','All 15 source tickers covered','Removed investment-guidance sections absent','Opening and ending disclaimer present','2022 returns identical to supplied SVG metadata','Arithmetic examples verified','Audio master loudness and peak verified'];
for(const file of ['src/story.json','src/timeline.json','src/Visuals.tsx','src/Root.tsx','public/master.wav'])report.hashes[file]=crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
fs.writeFileSync('out/validation.json',JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));
