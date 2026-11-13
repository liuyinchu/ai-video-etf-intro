import React from 'react';
import {AbsoluteFill,Composition,Still,Audio,Img,Sequence,staticFile,useCurrentFrame} from 'remotion';
import timeline from './timeline.json';
import {C,FONT,MONO,p,clamp,T,Defs} from './ui';
import {Visual} from './Visuals';
import {FundScene,Atlas,Scene} from './FundScene';
import charts from './charts.json';
const TL=timeline as typeof timeline & {scenes:Scene[]};
const Background:React.FC=()=>{const f=useCurrentFrame();return <AbsoluteFill style={{background:'#060B15',overflow:'hidden'}}><div style={{position:'absolute',inset:0,background:'radial-gradient(ellipse at 77% 12%,#16354D80,transparent 58%),radial-gradient(ellipse at 5% 80%,#10302E40,transparent 50%)'}}/><svg width={1920} height={1080} style={{position:'absolute',inset:0}}>{Array.from({length:42},(_,i)=><circle key={i} cx={(i*631.13+f*.05)%1920} cy={(i*317.79)%1080} r={i%5===0?1.5:.7} fill={C.cyan} opacity={.08+.08*Math.sin(f*.012+i)}/>) }<g opacity=".03">{Array.from({length:11},(_,i)=><path key={i} d={'M960 500L'+(i*340-700)+' 1080'} stroke={C.blue}/>)}{[600,680,780,910].map(y=><line key={y} x1={0} x2={1920} y1={y} y2={y} stroke={C.blue}/>)}</g></svg></AbsoluteFill>;};
const SceneView:React.FC<{scene:Scene}>=({scene})=>{
 const f=useCurrentFrame(),enter=p(f,0,18),exit=1-clamp((f-scene.duration+12)/12);
 return <AbsoluteFill style={{opacity:Math.min(enter,exit),fontFamily:FONT,color:C.white}}>
 {scene.ticker?<FundScene scene={scene} f={f}/>:<>
 <div style={{position:'absolute',left:110,top:48,color:C.cyan,fontSize:22,fontFamily:MONO,letterSpacing:2}}>{scene.chapter}</div>
 <div style={{position:'absolute',right:110,top:50,color:C.muted,fontSize:20,letterSpacing:4}}>ETF ATLAS / V2</div>
 <div style={{position:'absolute',left:108,top:125,fontSize:70,fontWeight:600,letterSpacing:-1}}>{scene.title}</div>
 <div style={{position:'absolute',left:112,top:232,fontSize:27,color:C.muted}}>{scene.subtitle}</div>
 <div style={{position:'absolute',left:120,top:315}}>{scene.visual==='atlas'?<Atlas f={f}/>:<Visual id={scene.visual} f={f}/>}</div>
 <div style={{position:'absolute',left:110,top:289,height:2,width:600*p(f,0,60),background:'linear-gradient(90deg,'+C.cyan+',transparent)'}}/>
 </>}
 </AbsoluteFill>;
};
const stamp=(sec:number)=>String(Math.floor(sec/60)).padStart(2,'0')+':'+String(Math.floor(sec)%60).padStart(2,'0');
export const Main:React.FC<{audio:boolean}>=({audio})=>{
 const f=useCurrentFrame(),sub=timeline.subs.find(s=>f>=s.from&&f<s.to),cut=timeline.scenes.find(s=>s.from>0&&Math.abs(f-s.from)<17);
 return <AbsoluteFill style={{background:C.bg,fontFamily:FONT}}><Background/>
 {timeline.scenes.map(s=><Sequence key={s.id} from={s.from} durationInFrames={s.duration}><SceneView scene={s}/></Sequence>)}
 {cut&&<div style={{position:'absolute',left:(f-cut.from+17)/34*2200-150,top:0,bottom:0,width:150,background:'linear-gradient(90deg,transparent,#65F4D21D,transparent)',transform:'skew(-14deg)'}}/>}
 {sub&&<div style={{position:'absolute',left:110,right:110,top:950,textAlign:'center',fontSize:33,lineHeight:1.42,fontWeight:500,color:C.white,textShadow:'0 2px 6px #000'}}><span style={{display:'inline-block',padding:'10px 24px',background:'#030812E0',border:'1px solid #29425255',borderRadius:8}}>{sub.text}</span></div>}
 <div style={{position:'absolute',left:110,bottom:24,color:'#869AAD',fontSize:16}}>Yahoo Finance · 复权近似 · 2026-10-30 · 未计个人税费、汇兑与通胀</div>
 <div style={{position:'absolute',left:965,bottom:24,color:C.muted,fontSize:16,fontFamily:MONO}}>V2 {stamp(f/30)} / {stamp(TL.seconds)}</div>
 <div style={{position:'absolute',right:110,bottom:23,color:'#AFBFCD',fontSize:18}}>本视频仅科普，不构成任何投资建议。</div>
 <div style={{position:'absolute',left:110,right:110,bottom:8,height:1,background:C.line}}><div style={{width:clamp(f/(TL.total-1))*100+'%',height:2,background:'linear-gradient(90deg,'+C.cyan+','+C.blue+')'}}/>{timeline.scenes.map(s=><div key={s.id} style={{position:'absolute',left:s.from/TL.total*100+'%',top:-2,width:1,height:5,background:C.dim}}/>)}</div>
 {audio&&<Audio src={staticFile('master.wav')}/>}
 </AbsoluteFill>;
};
const Contact:React.FC<{batch:number}>=({batch})=><AbsoluteFill style={{background:C.bg,display:'grid',gridTemplateColumns:'1fr 1fr',gridAutoRows:540}}>{timeline.scenes.slice(batch*6,batch*6+6).map(s=><Img key={s.id} src={staticFile('qa/'+s.id+'.jpg')} style={{width:960,height:540}}/>)}</AbsoluteFill>;
const Cover:React.FC=()=>{
 const d=charts.funds.VTI as any,pts=d.total as number[][],lo=0,hi=850;
 const path=pts.map(([x,y],i)=>(i?'L':'M')+(920+x*800)+' '+(640-(y-lo)/(hi-lo)*340)).join(' ');
 const dd=(d.drawdown as number[][]).map(([x,y],i)=>(i?'L':'M')+(920+x*800)+' '+(710-y/60*120)).join(' ');
 return <AbsoluteFill style={{background:'#060B15',fontFamily:FONT}}><svg width={1920} height={1080}><Defs/><T x={120} y={135} size={34} fill={C.cyan}>ETF 图鉴 / V2 增补版</T><T x={100} y={475} size={270} fill="url(#mint)" weight={650}>15</T><T x={125} y={600} size={74}>只代表 ETF</T><T x={125} y={735} size={63}>长期收益与回撤</T><T x={125} y={835} size={28} fill={C.muted}>逐只解读 · 真实历史 · 看清持有体验</T><rect x={860} y={230} width={950} height={650} rx={24} fill="#0D1A2B" stroke={C.blue} strokeOpacity=".3"/><T x={915} y={300} size={34} fill={C.cyan}>收益，不止看终点</T><T x={1750} y={300} size={25} fill={C.muted} anchor="end">VTI 图表示例</T>{[400,500,600].map(y=><line key={y} x1={920} x2={1720} y1={y} y2={y} stroke={C.line}/>)}<path d={path} fill="none" stroke={C.cyan} strokeWidth={5}/><line x1={920} x2={1720} y1={710} y2={710} stroke={C.line}/><path d={dd} fill="none" stroke={C.red} strokeWidth={3}/><T x={920} y={855} size={24} fill={C.muted}>2006</T><T x={1720} y={855} size={24} anchor="end" fill={C.muted}>2026</T><T x={120} y={990} size={23} fill={C.muted}>仅科普，不构成任何投资建议。历史表现不预示未来收益。</T></svg></AbsoluteFill>;
};
export const Root:React.FC=()=> <><Composition id="ETF-V2" component={Main} fps={30} width={1920} height={1080} durationInFrames={timeline.total} defaultProps={{audio:true}}/><Still id="Cover" component={Cover} width={1920} height={1080}/><Still id="Contact" component={Contact} width={1920} height={1620} defaultProps={{batch:0}}/></>;
