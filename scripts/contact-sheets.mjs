import fs from "node:fs";
import {execFileSync} from "node:child_process";
const tl=JSON.parse(fs.readFileSync("src/timeline.json","utf8"));
fs.mkdirSync("public/qa",{recursive:true});
for(const s of tl.scenes)fs.copyFileSync("out/check/"+s.id+".jpg","public/qa/"+s.id+".jpg");
execFileSync(process.execPath,["scripts/render.mjs","--contact"],{stdio:"inherit"});
