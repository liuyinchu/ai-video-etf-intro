import fs from 'node:fs';
function wav(file){const b=fs.readFileSync(file);let rate,channels;for(let o=12;o<b.length;){const t=b.toString('ascii',o,o+4),n=b.readUInt32LE(o+4);if(t==='fmt '){channels=b.readUInt16LE(o+10);rate=b.readUInt32LE(o+12);}if(t==='data')return {rate,channels,data:b.subarray(o+8,o+8+n)};o+=8+n+(n%2);}throw Error(file);}
function measure(root,gain){const tl=JSON.parse(fs.readFileSync(root+'/src/timeline.json','utf8')),voice=wav(root+'/public/voice.wav'),music=wav(root+'/public/score.wav');let v=0,m=0,n=0;
for(const [a,b] of tl.speech){for(let i=Math.ceil(a*voice.rate);i<Math.floor(b*voice.rate);i++){const val=voice.data.readInt16LE(i*2)/32768;v+=val*val;const p=i*music.rate/voice.rate,k=Math.floor(p),q=p-k;let e=0;for(let c=0;c<2;c++){const x=music.data.readInt16LE((k*2+c)*2)/32768,y=music.data.readInt16LE(((k+1)*2+c)*2)/32768,z=(x+(y-x)*q)*gain;e+=z*z;}m+=e/2;n++;}}
return {speechSeconds:n/voice.rate,voiceRmsDB:10*Math.log10(v/n),musicRmsDB:10*Math.log10(m/n),musicRelativeToVoiceDB:10*Math.log10(m/v)};}
const v1=measure('..',.18),v2=measure('.',.115),report={v1,v2,musicReductionRelativeToVoiceDB:v1.musicRelativeToVoiceDB-v2.musicRelativeToVoiceDB,method:'PCM energy during narration intervals before common master normalization; music gain at full duck.'};
fs.writeFileSync('out/audio-comparison.json',JSON.stringify(report,null,2));console.log(report);
