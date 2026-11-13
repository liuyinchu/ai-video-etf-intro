import React from 'react';
import {C,T} from './ui';
const continents=[[-165,66,-130,72,-110,55,-65,50,-85,12,-116,30],[-80,12,-35,-8,-55,-55,-77,-20],[-15,35,10,37,42,14,35,-35,10,-35,-15,8],[-10,36,35,70,80,70,140,60,150,35,100,0,62,8,40,36],[112,-11,154,-15,145,-42,114,-33]];
function inside(x:number,y:number,poly:number[]){let yes=false;for(let i=0,j=poly.length-2;i<poly.length;j=i,i+=2){const xi=poly[i],yi=poly[i+1],xj=poly[j],yj=poly[j+1];if((yi>y)!==(yj>y)&&x<(xj-xi)*(y-yi)/(yj-yi)+xi)yes=!yes;}return yes;}
const land:Array<[number,number]>=[];for(let a=-175;a<180;a+=5)for(let b=-55;b<75;b+=5)if(continents.some(v=>inside(a,b,v)))land.push([a,b]);
export const World:React.FC<{f:number;x?:number;y?:number;r?:number}>=({f,x=480,y=280,r=235})=>{
 const turn=f*.075-15;
 const project=(lon:number,lat:number)=>{const a=(lon+turn)*Math.PI/180,b=lat*Math.PI/180;return {x:r*Math.cos(b)*Math.sin(a),y:-r*Math.sin(b),z:Math.cos(b)*Math.cos(a)};};
 const line=(pts:Array<[number,number]>)=>pts.map(([a,b],i)=>{const q=project(a,b);return (i?'L':'M')+q.x.toFixed(2)+' '+q.y.toFixed(2);}).join(' ');
 return <g transform={'translate('+x+' '+y+')'}><circle r={r+18} fill="none" stroke={C.blue} strokeOpacity=".18"/><circle r={r} fill="url(#orb)" stroke={C.blue} strokeOpacity=".6"/>{[-60,-30,0,30,60].map(lat=><path key={lat} d={line(Array.from({length:73},(_,i)=>[i*5-180,lat]))} fill="none" stroke={C.blue} opacity=".18"/>)}{Array.from({length:12},(_,i)=>i*15).map(lon=><ellipse key={lon} rx={Math.max(1,Math.abs(Math.cos((lon+turn)*Math.PI/180)*r))} ry={r} fill="none" stroke={C.blue} opacity=".13"/>)}{land.map(([lon,lat],i)=>{const q=project(lon,lat);return q.z>0?<circle key={i} cx={q.x} cy={q.y} r={2.7} fill={C.cyan} opacity={.35+q.z*.65}/>:null;})}<ellipse rx={r*1.3} ry={r*.33} transform="rotate(-24)" fill="none" stroke={C.gold} opacity=".6"/><circle cx={Math.cos(f*.015)*r*1.3} cy={Math.sin(f*.015)*r*.33} r={6} fill={C.gold}/><T x={0} y={r+55} anchor="middle" size={20} fill={C.dim}>地域覆盖示意</T></g>;
};
