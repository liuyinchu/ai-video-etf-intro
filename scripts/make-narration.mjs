import path from 'node:path';
process.env.DYLD_LIBRARY_PATH=path.resolve('node_modules/@remotion/compositor-darwin-arm64');
import fs from 'node:fs';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {synthesize} from './edge-speech.mjs';
const cfg=JSON.parse(fs.readFileSync('src/story.json','utf8'));
const ff='node_modules/@remotion/compositor-darwin-arm64/ffmpeg';
const probe='node_modules/@remotion/compositor-darwin-arm64/ffprobe';
const FPS=cfg.fps,BAR=240/cfg.bpm;
const say=s=>s.replace(/\b(ETF|VOO|VTI|VT|VXUS|QQQM|QQQ|SCHD|BND|SGOV|VGSH|VGIT|TLT|GLD|EWJ)\b/g,m=>m.split('').join(' '));
const clean=s=>s.replace(/&amp;/g,'&').replace(/[\s\p{P}\p{S}]/gu,'').toLowerCase();
const split=s=>{
 const atoms=s.match(/[^，。；：？！,;.?!]+[，。；：？！,;.?!]?/g)||[s],out=[];
 let buf='';for(const a of atoms){if((buf+a).length>27&&buf){out.push(buf);buf='';}buf+=a;}
 if(buf)out.push(buf);return out;
};
let t=0;const scenes=[],subs=[],speech=[],clips=[];
for(const sc of cfg.scenes){
 const text=sc.lines.map(say).join(''),hash=crypto.createHash('sha1').update(cfg.voice+'|+5|-2|'+text).digest('hex').slice(0,10);
 const base='public/narration/'+sc.id+'-'+hash,mp3=base+'.mp3',meta=base+'.json',wav=base+'.wav';
 let data;
 if(fs.existsSync(mp3)&&fs.existsSync(meta))data=JSON.parse(fs.readFileSync(meta,'utf8'));
 else {for(let attempt=1;attempt<=3;attempt++){try{data=await synthesize(text,mp3,cfg.voice);fs.writeFileSync(meta,JSON.stringify(data,null,2));break;}catch(e){if(attempt===3)throw e;console.log('retry',sc.id,attempt);await new Promise(r=>setTimeout(r,1000*attempt));}}}
 const last=data.words.at(-1);if(!last)throw new Error('No speech timing: '+sc.id);
 const fileDuration=Number(execFileSync(probe,['-v','error','-show_entries','format=duration','-of','default=noprint_wrappers=1:nokey=1',mp3],{encoding:'utf8'}));
 const dur=Math.min(fileDuration,last.t+last.d+0.22);
 if(!fs.existsSync(wav))execFileSync(ff,['-v','error','-y','-i',mp3,'-t',dur.toFixed(4),'-af','loudnorm=I=-18:TP=-2:LRA=7','-ar','48000','-ac','1','-c:a','pcm_s16le',wav]);
 const lead=sc.id==='opening'?1.4:0.7,seconds=Math.ceil((lead+dur+0.65)/BAR)*BAR;
 const from=Math.round(t*FPS),frames=Math.round((t+seconds)*FPS)-from,voiceFrom=Math.round((t+lead)*FPS);
 const chunks=sc.lines.flatMap(split);let charPos=0;const positions=data.words.map(w=>{const p=charPos;charPos+=clean(w.text).length;return {...w,pos:p};});
 let offset=0;const local=chunks.map(chunk=>{const start=offset;offset+=clean(say(chunk)).length;const w=positions.find(w=>w.pos>=start)||positions.at(-1);return {text:chunk,start:w.t};});
 for(let i=0;i<local.length;i++){let a=t+lead+local[i].start,b=t+lead+(local[i+1]?.start??dur);if(b-a<0.08)continue;subs.push({from:Math.round(a*FPS),to:Math.round(b*FPS),text:local[i].text});}
 clips.push({src:base.replace('public/','')+'.wav',from:voiceFrom,duration:Math.ceil(dur*FPS),seconds:dur});speech.push([voiceFrom/FPS,voiceFrom/FPS+dur]);
 scenes.push({...sc,from,duration:frames,voiceFrom,voiceDuration:dur,bars:Math.round(seconds/BAR)});
 console.log(sc.id,seconds.toFixed(2)+'s',data.words.length+' words',chunks.length+' captions');t+=seconds;
}
const endHold=3.75;scenes.at(-1).duration+=Math.round(endHold*FPS);t+=endHold;
const total=Math.round(t*FPS);const tl={fps:FPS,bpm:cfg.bpm,total,seconds:total/FPS,voice:cfg.voice,scenes,clips,subs,speech};
fs.writeFileSync('src/timeline.json',JSON.stringify(tl,null,2));
const stamp=frame=>{const ms=Math.round(frame/FPS*1000),sec=Math.floor(ms/1000);return [Math.floor(sec/3600),Math.floor(sec/60)%60,sec%60].map(x=>String(x).padStart(2,'0')).join(':')+','+String(ms%1000).padStart(3,'0');};
fs.writeFileSync('out/ETF_科普字幕.srt',subs.map((s,i)=>(i+1)+'\n'+stamp(s.from)+' --> '+stamp(s.to)+'\n'+s.text+'\n').join('\n'));
fs.writeFileSync('docs/旁白与分镜.md','# ETF：把市场装进一份基金\n\n声音：Edge '+cfg.voice+'，语速 +5%，音高 −2 Hz。\n\n'+scenes.map(s=>'## '+s.chapter+' · '+s.title+'\n\n开始 '+(s.from/FPS).toFixed(2)+' 秒，时长 '+(s.duration/FPS).toFixed(2)+' 秒。\n\n'+s.lines.join('\n\n')).join('\n\n'));
console.log('TOTAL',total/FPS,'seconds; captions',subs.length);
