import fs from 'node:fs';
const root='ETF_从原理到配置的入门指南/attachments/';
const output={};
for(const ticker of ['voo','vti','vt','vxus','qqq','qqqm','schd','bnd','sgov','vgsh','vgit','tlt','gld','ewj','510300']){
 const svg=fs.readFileSync(root+'etf-guide-'+ticker+'.svg','utf8');
 const meta=JSON.parse(svg.match(/<dc:description>([\s\S]*?)<\/dc:description>/)[1].replaceAll('&amp;','&'));
 const paths=[...svg.matchAll(/<path\s+d="([^"]+)"([^>]+)>/g)].filter(m=>m[2].includes('stroke: #2354b0')).sort((a,b)=>b[1].length-a[1].length);
 const p=paths[0],coords=[...p[1].matchAll(/[ML]\s*([-\d.]+)\s+([-\d.]+)/g)].map(m=>[+m[1],+m[2]]);
 const clip=p[2].match(/url\(#([^)]*)\)/)[1];const rect=svg.match(new RegExp('<clipPath id="'+clip+'">\\s*<rect x="([^"]+)" y="([^"]+)" width="([^"]+)" height="([^"]+)"'));
 const y0=coords[0][1],y1=coords.at(-1)[1],final=100*(1+meta.stats.total_return_pct/100);
 const series=coords.map(([x,y])=>[(x-Number(rect[1]))/Number(rect[3]),100+(y-y0)/(y1-y0)*(final-100)]);
 output[ticker.toUpperCase()]={...meta,series};
}
const bars=fs.readFileSync(root+'etf-guide-2022.svg','utf8').match(/<dc:description>([\s\S]*?)<\/dc:description>/)[1];
fs.writeFileSync('src/data.json',JSON.stringify({funds:output,returns2022:JSON.parse(bars)},null,1));
console.log('Preserved original SVG data for',Object.keys(output).length,'funds.');
