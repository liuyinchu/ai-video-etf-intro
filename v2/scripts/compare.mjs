import path from 'node:path';
import {bundle} from '@remotion/bundler';
import {openBrowser,selectComposition,renderStill} from '@remotion/renderer';
const serveUrl=await bundle({entryPoint:path.resolve('src/Compare.tsx'),publicDir:path.resolve('public/compare')});
const browser=await openBrowser('chrome',{browserExecutable:'/Users/yangshuyun/Library/Caches/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-mac-arm64/chrome-headless-shell'});
try{const composition=await selectComposition({serveUrl,id:'Compare',puppeteerInstance:browser});await renderStill({composition,serveUrl,output:'out/V1_V2_画面对比.png',imageFormat:'png',puppeteerInstance:browser});}finally{await browser.close({silent:true});}
