import fs from 'node:fs';
const tl=JSON.parse(fs.readFileSync('src/timeline.json','utf8')),bar=240/tl.bpm,scenes=tl.scenes;
const cuts=scenes.map(s=>Math.round(s.from/tl.fps/bar)),sections=[];
function add(from,to,type){if(to>from)sections.push({from,to,type});}
for(let i=0;i<scenes.length;i++){
 const s=scenes[i],a=cuts[i],b=i+1<scenes.length?cuts[i+1]:Math.ceil(tl.seconds/bar);
 if(s.id==='opening'){add(a,a+2,'breakdown');add(a+2,a+4,'build');add(a+4,b,'drop');}
 else if(s.id==='finale'){add(a,b-3,'breakdown');add(b-3,b-1,'drop');add(b-1,b,'tail');}
 else if(s.ticker){const type=['BND','VGSH','VGIT','TLT'].includes(s.ticker)?'grooveA':s.ticker==='SGOV'?'breakdown':['QQQ','QQQM'].includes(s.ticker)?'grooveB':'grooveA2';
 add(a,a+1,'drop');add(a+1,b-1,type);add(b-1,b,i%3===0?'build':type);}
 else{add(a,a+1,'drop');add(a+1,b,'grooveA');}
}
fs.writeFileSync('src/score-timeline.json',JSON.stringify({fps:30,bpm:tl.bpm,grid0:0,overlap:0,engage:3.87,cutBars:cuts,lastDur:scenes.at(-1).duration,total:tl.total,sections},null,2));
console.log('V2 arrangement',tl.seconds,'seconds /',tl.bpm,'BPM /',sections.length,'sections');
