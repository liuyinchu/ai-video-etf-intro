import fs from 'node:fs';
import path from 'node:path';
import {bundle} from '@remotion/bundler';
import {openBrowser,selectComposition,renderStill,renderMedia} from '@remotion/renderer';
const tl=JSON.parse(fs.readFileSync('src/timeline.json','utf8')),opts=process.argv.slice(2);
const serveUrl=await bundle({entryPoint:path.resolve('src/index.ts'),publicDir:path.resolve('public')});
const browser=await openBrowser('chrome',{browserExecutable:'/Users/yangshuyun/Library/Caches/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-mac-arm64/chrome-headless-shell'});
try{
 const composition=await selectComposition({serveUrl,id:'ETF-V2',inputProps:{audio:!opts.includes('--silent')},puppeteerInstance:browser});
 if(opts.includes('--stills')){
  fs.mkdirSync('out/check',{recursive:true});fs.mkdirSync('public/qa',{recursive:true});
  const filter=opts.find(x=>x.startsWith('--only='))?.split('=')[1]?.split(',');
  for(const s of tl.scenes){if(filter&&!filter.includes(s.id))continue;
   const risk=s.beats?.find(b=>b.name==='risk')?.frame??Math.round(s.duration*.58);
   const frame=s.from+Math.min(s.duration-40,risk+75);
   await renderStill({composition,serveUrl,frame,output:'out/check/'+s.id+'.jpg',imageFormat:'jpeg',jpegQuality:94,scale:.75,puppeteerInstance:browser});
   fs.copyFileSync('out/check/'+s.id+'.jpg','public/qa/'+s.id+'.jpg');
   if(s.ticker){const mid=s.from+(s.beats.find(b=>b.name==='growth')?.frame??220);await renderStill({composition,serveUrl,frame:mid,output:'out/check/'+s.id+'-growth.jpg',imageFormat:'jpeg',jpegQuality:91,scale:.5,puppeteerInstance:browser});}
   console.log('Still',s.id,frame);
  }
  const cover=await selectComposition({serveUrl,id:'Cover',puppeteerInstance:browser});
  await renderStill({composition:cover,serveUrl,output:'out/ETF_V2_封面.png',imageFormat:'png',puppeteerInstance:browser});
 }else if(opts.includes('--contact')){
  for(let batch=0;batch<Math.ceil(tl.scenes.length/6);batch++){const comp=await selectComposition({serveUrl,id:'Contact',inputProps:{batch},puppeteerInstance:browser});await renderStill({composition:comp,serveUrl,inputProps:{batch},output:'out/check/contact-'+batch+'.jpg',imageFormat:'jpeg',jpegQuality:92,puppeteerInstance:browser});console.log('Contact',batch);}
 }else{
  const preview=opts.includes('--preview'),selected=tl.scenes.find(s=>s.id==='fund-voo');let last=-1;
  await renderMedia({composition,serveUrl,codec:'h264',outputLocation:preview?'out/ETF_V2_样片.mp4':'out/ETF_V2_逐只解读_1080p.mp4',puppeteerInstance:browser,crf:preview?22:18,scale:preview?.5:1,concurrency:3,imageFormat:'jpeg',jpegQuality:95,x264Preset:'fast',pixelFormat:'yuv420p',audioBitrate:'320k',...(preview?{frameRange:[selected.from,selected.from+selected.duration-1]}:{}),onProgress:({progress,renderedFrames,encodedFrames})=>{const n=Math.floor(progress*100);if(n!==last&&n%2===0){last=n;console.log(new Date().toISOString(),n+'%',renderedFrames,'rendered',encodedFrames,'encoded');}}});console.log('Render complete');
 }
}finally{await browser.close({silent:true});}
