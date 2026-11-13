import fs from 'node:fs';
import path from 'node:path';
import {bundle} from '@remotion/bundler';
import {renderStill,renderMedia,selectComposition,openBrowser} from '@remotion/renderer';
const TL=JSON.parse(fs.readFileSync('src/timeline.json','utf8'));
const browserExecutable=process.env.REMOTION_BROWSER_EXECUTABLE||'/Users/yangshuyun/Library/Caches/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-mac-arm64/chrome-headless-shell';
const serveUrl=await bundle({entryPoint:path.resolve('src/index.ts'),publicDir:path.resolve('public'),onProgress:p=>{if(p===100)console.log('Bundle ready');}});
const browser=await openBrowser('chrome',{browserExecutable});
try{
 const composition=await selectComposition({serveUrl,id:'ETF',puppeteerInstance:browser,inputProps:{audio:!process.argv.includes('--silent')}});
 if(process.argv.includes('--cover')){const cover=await selectComposition({serveUrl,id:'Cover',puppeteerInstance:browser});await renderStill({composition:cover,serveUrl,output:'out/ETF_封面.png',imageFormat:'png',puppeteerInstance:browser});console.log('Cover ready');
 }else if(process.argv.includes('--contact')){

 for(let batch=0;batch<Math.ceil(TL.scenes.length/8);batch++){const comp=await selectComposition({serveUrl,id:'Contact',inputProps:{batch},puppeteerInstance:browser});await renderStill({composition:comp,serveUrl,inputProps:{batch},output:'out/check/contact-'+batch+'.jpg',imageFormat:'jpeg',jpegQuality:90,puppeteerInstance:browser});console.log('Contact',batch);}
 }else if(process.argv.includes('--stills')){
  fs.mkdirSync('out/check',{recursive:true});
  for(const s of TL.scenes){const frame=s.from+Math.min(s.duration-25,Math.round(s.duration*.56));await renderStill({composition,serveUrl,frame,output:'out/check/'+s.id+'.jpg',imageFormat:'jpeg',jpegQuality:92,scale:0.75,puppeteerInstance:browser,inputProps:{audio:false}});console.log('Still',s.id,frame);}
  const cover=await selectComposition({serveUrl,id:'Cover',puppeteerInstance:browser});
  await renderStill({composition:cover,serveUrl,output:'out/ETF_封面.png',imageFormat:'png',puppeteerInstance:browser});console.log('Cover ready');
 }else{
  const quick=process.argv.includes('--preview');
  let last=-1;
  await renderMedia({composition,serveUrl,codec:'h264',outputLocation:quick?'out/ETF_预览.mp4':'out/ETF_原理类型收益与风险_1080p.mp4',puppeteerInstance:browser,inputProps:{audio:!process.argv.includes('--silent')},crf:quick?24:18,scale:quick?0.5:1,concurrency:3,imageFormat:'jpeg',jpegQuality:95,x264Preset:'fast',pixelFormat:'yuv420p',audioBitrate:'320k',...(quick?{frameRange:[0,Math.min(1350,TL.total-1)]}:{}),onProgress:({progress,renderedFrames,encodedFrames})=>{const n=Math.floor(progress*100);if(n!==last&&n%2===0){last=n;console.log(new Date().toISOString(),n+'%',renderedFrames,'rendered',encodedFrames,'encoded');}}});
  console.log('Render complete');
 }
}finally{await browser.close({silent:true});}
