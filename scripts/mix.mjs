import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
process.env.DYLD_LIBRARY_PATH=path.resolve('node_modules/@remotion/compositor-darwin-arm64');
const ff=path.resolve('node_modules/@remotion/compositor-darwin-arm64/ffmpeg');
const tl=JSON.parse(fs.readFileSync('src/timeline.json','utf8')),sr=48000,N=Math.ceil(tl.seconds*sr),pcm=Buffer.alloc(N*2);
function readWav(b){let fmt;for(let o=12;o+8<b.length;){const tag=b.toString('ascii',o,o+4),n=b.readUInt32LE(o+4);if(tag==='fmt ')fmt={format:b.readUInt16LE(o+8),channels:b.readUInt16LE(o+10),rate:b.readUInt32LE(o+12),bits:b.readUInt16LE(o+22)};if(tag==='data'){if(!fmt||fmt.bits!==16||fmt.format!==1)throw new Error('Expected PCM16');return {...fmt,data:b.subarray(o+8,o+8+n)};}o+=8+n+(n%2);}throw new Error('Missing WAV data');}
function header(bytes,channels){const b=Buffer.alloc(44);b.write('RIFF',0);b.writeUInt32LE(bytes+36,4);b.write('WAVEfmt ',8);b.writeUInt32LE(16,16);b.writeUInt16LE(1,20);b.writeUInt16LE(channels,22);b.writeUInt32LE(sr,24);b.writeUInt32LE(sr*channels*2,28);b.writeUInt16LE(channels*2,32);b.writeUInt16LE(16,34);b.write('data',36);b.writeUInt32LE(bytes,40);return b;}
for(const c of tl.clips){const w=readWav(fs.readFileSync('public/'+c.src));if(w.rate!==sr||w.channels!==1)throw new Error('Unexpected voice format');const at=Math.round(c.from/30*sr)*2;w.data.copy(pcm,at,0,Math.min(w.data.length,pcm.length-at));}
fs.writeFileSync('public/voice.wav',Buffer.concat([header(pcm.length,1),pcm]));
const score=readWav(fs.readFileSync('public/score.wav'));if(score.channels!==2)throw new Error('Expected stereo music');
const floats=new Float32Array(N*2);let peak=0,clip=0;
for(let i=0;i<N;i++){
 const t=i/sr;while(clip<tl.speech.length&&t>tl.speech[clip][1]+.65)clip++;
 let duck=0;for(let j=Math.max(0,clip-1);j<=Math.min(clip+1,tl.speech.length-1);j++){const [a,b]=tl.speech[j];duck=Math.max(duck,Math.min(1,Math.max(0,(t-a+.14)/.14),Math.max(0,(b+.5-t)/.5)));}
 const musicGain=.62-(.62-.18)*duck,fade=Math.min(1,t/.7,(tl.seconds-t)/2.5),voice=pcm.readInt16LE(i*2)/32768;
 const pos=i*score.rate/sr,j=Math.floor(pos),frac=pos-j;
 for(let c=0;c<2;c++){const at=(j*2+c)*2,nx=((j+1)*2+c)*2;const a=at+2<=score.data.length?score.data.readInt16LE(at)/32768:0,b=nx+2<=score.data.length?score.data.readInt16LE(nx)/32768:a;const value=(voice+(a+(b-a)*frac)*musicGain)*Math.max(0,fade);floats[i*2+c]=value;peak=Math.max(peak,Math.abs(value));}
}
const mix=Buffer.alloc(N*4),gain=Math.min(1,.94/peak);for(let i=0;i<floats.length;i++)mix.writeInt16LE(Math.round(floats[i]*gain*32767),i*2);
fs.writeFileSync('out/mix-before-normalization.wav',Buffer.concat([header(mix.length,2),mix]));
const first=spawnSync(ff,['-hide_banner','-i','out/mix-before-normalization.wav','-af','loudnorm=I=-16:TP=-1.5:LRA=8:print_format=json','-f','null','-'],{encoding:'utf8',maxBuffer:10e6});if(first.status!==0)throw new Error(first.stderr);
const m=JSON.parse(first.stderr.match(/\{\s*"input_i"[\s\S]*?\}/)[0]);fs.writeFileSync('out/audio-first-pass.json',JSON.stringify(m,null,2));
const norm='loudnorm=I=-16:TP=-1.5:LRA=8:measured_I='+m.input_i+':measured_TP='+m.input_tp+':measured_LRA='+m.input_lra+':measured_thresh='+m.input_thresh+':offset='+m.target_offset+':linear=true:print_format=json';
const second=spawnSync(ff,['-y','-hide_banner','-i','out/mix-before-normalization.wav','-af',norm,'-ar','48000','-ac','2','-c:a','pcm_s16le','public/master.wav'],{encoding:'utf8',maxBuffer:10e6});if(second.status!==0)throw new Error(second.stderr);
fs.writeFileSync('out/audio-master-report.json',second.stderr.match(/\{\s*"input_i"[\s\S]*?\}/)[0]);
console.log('Mixed',tl.seconds.toFixed(2),'seconds; music 10.74 dB lower during narration; 48 kHz stereo.');
