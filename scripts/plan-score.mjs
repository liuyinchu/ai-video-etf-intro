import fs from 'node:fs';
const tl=JSON.parse(fs.readFileSync('src/timeline.json','utf8')),bar=240/tl.bpm;
const types={opening:'intro',wrapper:'grooveA',index:'grooveA2',creation:'grooveB',pricing:'build',taxonomy:'drop',return:'grooveA',dividend:'breakdown',coreus:'drop',global:'grooveB',tilt:'grooveA2',income:'grooveB',duration:'breakdown',durationmath:'build',stress2022:'drop',gold:'grooveA',region:'grooveB',finale:'drop'};
const cuts=tl.scenes.map(s=>Math.round(s.from/tl.fps/bar));
const sections=tl.scenes.map((s,i)=>({from:cuts[i],to:i+1<cuts.length?cuts[i+1]:Math.ceil(tl.seconds/bar),type:types[s.id]||'grooveA'}));
const cfg={fps:30,bpm:128,grid0:0,overlap:0,engage:3.75,cutBars:cuts,lastDur:tl.scenes.at(-1).duration,sections,total:tl.total};
fs.writeFileSync('src/score-timeline.json',JSON.stringify(cfg,null,2));
console.log('Score timeline',tl.seconds,'seconds');
