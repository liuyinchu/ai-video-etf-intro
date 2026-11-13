import React from 'react';
import raw from './charts.json';
import {C,T,FONT,MONO,p,clamp} from './ui';
export type Scene={id:string;ticker?:string;name?:string;issuer?:string;benchmark?:string;income?:string;distribution?:string;keyNote?:string;scope?:string[];index?:number;duration:number;beats?:{name:string;frame:number}[];title:string;subtitle:string;chapter:string;visual:string;from:number};
type Point=[number,number];
type Fund={total:Point[];price:Point[];drawdown:Point[];stats:{start:string;end:string;currency:string;total_return_pct:number;price_return_pct:number;cagr_pct:number;max_drawdown_pct:number;drawdown_peak:string;drawdown_trough:string;recovered:string|null}};
const funds=raw.funds as unknown as Record<string,Fund>;
const WSTART=Date.parse(raw.windowStart),WEND=Date.parse(raw.windowEnd);
const X=165,W=1070,Y=326,H=290,DY=715,DH=115;
const pxDate=(date:string)=>(Date.parse(date)-WSTART)/(WEND-WSTART);
const nice=(n:number)=>{const k=Math.pow(10,Math.floor(Math.log10(n))),v=n/k;return (v<=1?1:v<=2?2:v<=2.5?2.5:v<=5?5:10)*k;};
const number=(x:number,d=1)=>Math.abs(x).toLocaleString('en-US',{maximumFractionDigits:d,minimumFractionDigits:d});
const pct=(x:number,d=1)=>(x>0?'+':x<0?'−':'')+number(x,d)+'%';
const sample=(points:Point[],x:number)=>{let lo=0,hi=points.length-1;while(hi-lo>1){const m=(hi+lo)>>1;if(points[m][0]<x)lo=m;else hi=m;}const [a,b]=[points[lo],points[hi]],q=clamp((x-a[0])/(b[0]-a[0]||1));return a[1]+(b[1]-a[1])*q;};
const color=(ticker:string)=>['QQQ','QQQM'].includes(ticker)?C.purple:ticker==='GLD'?C.gold:['BND','VGSH','VGIT','TLT'].includes(ticker)?C.blue:ticker==='510300'?'#FFBD7C':C.cyan;
const models=Object.fromEntries(Object.entries(funds).map(([ticker,fund])=>{
 const start=fund.total[0][0],end=fund.total.at(-1)![0],x=(a:number)=>X+(a-start)/(end-start)*W;
 const values=[...fund.total,...fund.price].map(p=>p[1]),lo=Math.min(...values),hi=Math.max(...values);
 const step=nice(Math.max(20,hi-lo)/4),min=Math.floor(Math.max(0,lo-step*.35)/step)*step,max=Math.ceil((hi+step*.15)/step)*step;
 const y=(v:number)=>Y+H-(v-min)/(max-min)*H;
 const ticks=[];for(let v=min;v<=max+1e-9;v+=step)ticks.push(v);
 const dd=Math.abs(fund.stats.max_drawdown_pct),ddStep=dd<.1?.01:dd<1?.1:dd<10?1:10,ddMax=Math.ceil(dd/(dd<.1?.02:ddStep))*(dd<.1?.02:ddStep);
 const yd=(v:number)=>DY+(-v/ddMax)*DH;
 const line=(pts:Point[],map:(n:number)=>number)=>pts.map(([a,b],i)=>(i?'L':'M')+x(a).toFixed(2)+' '+map(b).toFixed(2)).join(' ');
 const ddPath=line(fund.drawdown,yd),area='M'+X+' '+DY+' '+ddPath.replace(/^M/,'L')+' L'+(X+W)+' '+DY+' Z';
 const years=(Date.parse(fund.stats.end)-Date.parse(fund.stats.start))/86400000/365.25,interval=years<10?2:5;
 const yearTicks=[{x:X,label:fund.stats.start.slice(0,7).replace('-','.')}];
 for(let yr=Math.ceil(Number(fund.stats.start.slice(0,4))/interval)*interval;yr<=2026;yr+=interval){const pos=x(pxDate(yr+'-01-01')),q=(pos-X)/W;if(q>.13&&q<.87)yearTicks.push({x:pos,label:String(yr)});}
 yearTicks.push({x:X+W,label:'2026.10'});
 return [ticker,{fund,start,end,x,y,yd,min,max,step,ticks,ddMax,ddPath,area,totalPath:line(fund.total,y),pricePath:line(fund.price,y),yearTicks,years}];
}));
export const FundScene:React.FC<{scene:Scene;f:number}>=({scene,f})=>{
 const ticker=scene.ticker!,m=models[ticker],d=m.fund.stats,c=color(ticker);
 const beat=(name:string,fallback:number)=>scene.beats?.find(b=>b.name===name)?.frame??fallback;
 const growth=beat('growth',350),risk=beat('risk',730),drawStart=95,drawEnd=Math.max(drawStart+130,growth+30);
 const progress=clamp((f-drawStart)/(drawEnd-drawStart)),cursorX=m.start+(m.end-m.start)*progress,xx=m.x(cursorX),value=sample(m.fund.total,cursorX);
 const activeRisk=p(f,risk-15,28),activeGrowth=p(f,growth-20,28),peakX=m.x(pxDate(d.drawdown_peak)),troughX=m.x(pxDate(d.drawdown_trough)),recoverX=d.recovered?m.x(pxDate(d.recovered)):X+W;
 const date=new Date(WSTART+cursorX*(WEND-WSTART)).toISOString().slice(0,7).replace('-','.');
 const precision=ticker==='SGOV'?2:1;
 const incomeLines:string[]=[];let line='',width=0;for(const char of scene.income||''){const w=/[A-Za-z0-9 +/]/.test(char)?.55:1;if(width+w>17){incomeLines.push(line);line='';width=0;}line+=char;width+=w;}if(line)incomeLines.push(line);
 return <svg width={1920} height={1080} style={{position:'absolute',inset:0,fontFamily:FONT}}>
 <defs><linearGradient id={'area-'+ticker} x1="0" x2="0" y1="0" y2="1"><stop stopColor={C.red} stopOpacity=".10"/><stop offset="1" stopColor={C.red} stopOpacity=".46"/></linearGradient><clipPath id={'main-'+ticker}><rect x={X-3} y={Y-40} width={W*progress+6} height={H+48}/></clipPath><clipPath id={'dd-'+ticker}><rect x={X} y={DY-5} width={W*progress+1} height={DH+15}/></clipPath></defs>
 <T x={110} y={65} size={22} mono fill={c}>{scene.chapter}</T><T x={1810} y={65} size={20} anchor="end" fill={C.muted}>{scene.issuer} / ETF ATLAS V2</T>
 <T x={105} y={204} size={ticker.length>4?100:ticker.length===4?125:145} fill={c} weight={650}>{ticker}</T>
 <T x={ticker.length>=4?650:ticker.length===2?420:520} y={154} size={49} weight={600}>{scene.name}</T><T x={ticker.length>=4?650:ticker.length===2?420:520} y={211} size={27} fill={C.muted}>{scene.benchmark}</T>
 <line x1={110} y1={244} x2={1810} y2={244} stroke={C.line}/>
 <line x1={165} y1={282} x2={208} y2={282} stroke={c} strokeWidth={4}/><T x={220} y={290} size={23} fill={c}>总回报近似 · 分配再投资</T>
 <line x1={600} y1={282} x2={643} y2={282} stroke="#A2B0BF" strokeDasharray="8 5" strokeWidth={2.5}/><T x={655} y={290} size={23} fill="#A2B0BF">仅价格变化</T>
 <T x={1235} y={290} size={21} fill={C.muted} anchor="end">{d.currency+' · '+(progress===1?'100 → '+number(100+d.total_return_pct,1):date+' / '+Math.round(value))}</T>
 <rect x={X-15} y={Y-8} width={W+30} height={H+20} rx={8} fill="#0A1424" fillOpacity=".35"/>
 {m.ticks.map(v=><g key={v}><line x1={X} y1={m.y(v)} x2={X+W} y2={m.y(v)} stroke={C.line} strokeOpacity=".8"/><T x={X-22} y={m.y(v)+7} size={21} mono fill={C.muted} anchor="end">{v.toLocaleString('en-US')}</T></g>)}
 {m.yearTicks.map((t,i)=><g key={t.label}><line x1={t.x} x2={t.x} y1={Y} y2={Y+H} stroke={C.line} strokeOpacity=".45"/><T x={t.x} y={Y+H+40} size={22} mono anchor={i===0?'start':i===m.yearTicks.length-1?'end':'middle'} fill={C.muted}>{t.label}</T></g>)}
 <line x1={X} y1={m.y(100)} x2={X+W} y2={m.y(100)} stroke={C.white} strokeOpacity=".22" strokeDasharray="4 7"/>
 <rect x={Math.max(X,peakX)} y={Y} width={Math.max(0,troughX-peakX)} height={H} fill={C.red} fillOpacity={.055*activeRisk}/>
 <g clipPath={'url(#main-'+ticker+')'}><path d={m.pricePath} fill="none" stroke="#A4B1C2" strokeWidth={2} strokeDasharray="7 5" opacity=".7"/><path d={m.totalPath} fill="none" stroke={c} strokeWidth={3.2} strokeLinejoin="round"/></g>
 {progress>0&&<g><line x1={xx} y1={Y} x2={xx} y2={Y+H} stroke={c} strokeOpacity={progress<1?.28:0}/><circle cx={xx} cy={m.y(value)} r={6} fill={c}/><circle cx={xx} cy={m.y(value)} r={13+Math.sin(f*.13)*3} fill="none" stroke={c} strokeOpacity=".25"/></g>}
 <T x={X} y={695} size={23} fill={C.red}>从此前高点回撤</T><T x={X+W} y={695} size={20} fill={C.muted} anchor="end">{ticker==='SGOV'?'局部放大 · 纵轴单位 %':'回撤纵轴按本基金范围缩放'}</T>
 <rect x={X-15} y={DY-6} width={W+30} height={DH+13} rx={8} fill="#25151E" fillOpacity=".25"/>
 {[0,-m.ddMax/2,-m.ddMax].map(v=><g key={v}><line x1={X} x2={X+W} y1={m.yd(v)} y2={m.yd(v)} stroke={C.line}/><T x={X-22} y={m.yd(v)+7} size={20} mono fill={C.muted} anchor="end">{v===0?'0%':pct(v,ticker==='SGOV'?2:m.ddMax<10?1:0)}</T></g>)}
 <g clipPath={'url(#dd-'+ticker+')'}><path d={m.area} fill={'url(#area-'+ticker+')'}/><path d={m.ddPath} fill="none" stroke={C.red} strokeWidth={1.8}/></g>
 <g opacity={activeRisk}><line x1={troughX} x2={troughX} y1={DY-1} y2={DY+DH} stroke={C.red} strokeDasharray="4 5" opacity=".5"/><circle cx={troughX} cy={m.yd(d.max_drawdown_pct)} r={5} fill={C.red}/><rect x={Math.min(X+W-260,Math.max(X,troughX-130))} y={DY+10} width={260} height={32} rx={5} fill="#4A2330"/><T x={Math.min(X+W-130,Math.max(X+130,troughX))} y={DY+33} size={20} anchor="middle" fill="#FFC0C6">{d.drawdown_trough+' / '+pct(d.max_drawdown_pct,precision)}</T></g>
 <rect x={1312} y={276} width={498} height={568} rx={15} fill="#0C1727" stroke={c} strokeOpacity=".28"/>
 <T x={1342} y={314} size={20} fill={C.muted}>持有什么</T>
 {(scene.scope||[]).map((s,i)=><T key={s} x={1342} y={353+i*36} size={27}>{s}</T>)}
 {incomeLines.map((line,i)=><T key={i} x={1342} y={423+i*30} size={24} fill={c}>{line}</T>)}<T x={1342} y={478} size={21} fill={C.muted}>{scene.distribution}</T>
 <line x1={1342} x2={1780} y1={490} y2={490} stroke={C.line}/>
 <g opacity={.5+.5*activeGrowth}><T x={1342} y={525} size={21} fill={C.muted}>样本累计总回报</T><T x={1340} y={592} size={64} fill={c} mono weight={600}>{pct(d.total_return_pct)}</T><T x={1342} y={635} size={26} fill={C.white}>{'区间年化 '+number(d.cagr_pct,1)+'%'}</T><T x={1780} y={635} size={20} fill={C.dim} anchor="end">{m.years.toFixed(1)+' 年'}</T></g>
 <rect x={1333} y={660} width={456} height={163} rx={10} fill={C.red} fillOpacity={.04+.06*activeRisk} stroke={C.red} strokeOpacity={.15+.35*activeRisk}/>
 <g opacity={.5+.5*activeRisk}><T x={1355} y={692} size={21} fill={C.muted}>样本最大回撤</T><T x={1352} y={754} size={61} fill={C.red} mono>{pct(d.max_drawdown_pct,precision)}</T><T x={1355} y={797} size={20} fill={C.muted}>{d.drawdown_peak.slice(0,7)+' → '+d.drawdown_trough.slice(0,7)}</T></g>
 <T x={110} y={887} size={27} fill={activeRisk>.5?C.white:C.muted}>{scene.keyNote}</T>
 <T x={1810} y={887} size={22} anchor="end" fill={activeRisk>.5?(d.recovered?C.cyan:C.red):C.dim}>{d.recovered?'前高恢复：'+d.recovered:'截至图末，尚未回到前高'}</T>
 <T x={110} y={924} size={19} fill={C.muted}>{'样本 '+d.start+' — '+d.end+' · '+d.currency+' · 各图纵轴独立；基金历史长度不同，不宜直接排名'}</T>
 </svg>;
};
export const Atlas:React.FC<{f:number}>=({f})=>{
 const labels=[['VOO','美国大型股'],['VTI','美国全市场'],['VT','全球股票'],['VXUS','美国以外'],['QQQ','纳斯达克 100'],['QQQM','同指数较短历史'],['SCHD','股息与质量'],['BND','综合债券'],['SGOV','超短期国库券'],['VGSH','短期国债'],['VGIT','中期国债'],['TLT','长期国债'],['GLD','实物黄金'],['EWJ','日本股票'],['510300','沪深 300']];
 return <svg width={1680} height={560}>{labels.map(([a,b],i)=>{const x=8+(i%5)*337,y=10+Math.floor(i/5)*170;return <g key={a} opacity={p(f,i*5)} transform={'translate('+x+' '+(y+(1-p(f,i*5))*15)+')'}><rect width={314} height={144} rx={12} fill="#0D1B2D" stroke={color(a)} strokeOpacity=".35"/><T x={25} y={62} size={44} fill={color(a)} weight={600}>{a}</T><T x={25} y={109} size={25} fill={C.muted}>{b}</T></g>;})}<T x={840} y={552} anchor="middle" size={23} fill={C.muted}>彩线：总回报近似　 灰线：仅价格　 红色：回撤　 起点 = 100</T></svg>;
};
