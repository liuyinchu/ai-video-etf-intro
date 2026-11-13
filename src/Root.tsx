import React from 'react';
import {AbsoluteFill,Composition,Still,Audio,Img,Sequence,staticFile,useCurrentFrame} from 'remotion';
import TL from './timeline.json';
import {C,FONT,MONO,p,clamp,AssetBasket,Defs,T} from './ui';
import {Visual} from './Visuals';
type SceneData=typeof TL.scenes[number];
const NoiseField:React.FC=()=>{const f=useCurrentFrame();return <AbsoluteFill style={{background:C.bg,overflow:'hidden'}}><div style={{position:'absolute',inset:0,background:'radial-gradient(ellipse at 72% 45%,#10274199,transparent 55%),radial-gradient(ellipse at 8% 10%,#102A2B70,transparent 40%)'}}/><svg width={1920} height={1080} style={{position:'absolute'}}>{Array.from({length:72},(_,i)=>{const x=(i*657.23+Math.sin(i*9)*38+f*(i%3+1)*.09)%1920,y=(i*317.3+Math.sin(i)*100)%1080;return <circle key={i} cx={x} cy={y} r={i%7===0?1.8:.85} fill={i%3===0?C.cyan:C.blue} opacity={.1+.12*(1+Math.sin(f*.018+i))}/>;})}<g opacity=".095">{Array.from({length:18},(_,i)=><path key={i} d={'M960 500 L'+((i-8)*350+960)+' 1080'} stroke={C.blue}/>)}{Array.from({length:9},(_,i)=>{const y=575+Math.pow((i+(f/180)%1)/9,2)*480;return <line key={i} x1={0} y1={y} x2={1920} y2={y} stroke={C.blue}/>;})}</g><ellipse cx={1570} cy={400} rx={560} ry={330} transform={'rotate('+(-32+Math.sin(f*.002)*8)+' 1570 400)'} fill="none" stroke={C.blue} opacity=".065"/><ellipse cx={1570} cy={400} rx={570} ry={340} transform="rotate(-32 1570 400)" fill="none" stroke={C.cyan} opacity=".04"/></svg><div style={{position:'absolute',inset:0,background:'linear-gradient(0deg,#03060D 0%,transparent 17%,transparent 90%,#05091466)'}}/></AbsoluteFill>;};
const Scene:React.FC<{scene:SceneData}>=({scene})=>{
 const f=useCurrentFrame(),intro=p(f,0,18),exit=1-clamp((f-scene.duration+10)/10);
 return <AbsoluteFill style={{opacity:Math.min(intro,exit),fontFamily:FONT,color:C.white}}>
 <div style={{position:'absolute',left:112,top:52,fontFamily:MONO,fontSize:22,letterSpacing:3,color:C.cyan}}>{scene.chapter}</div>
 <div style={{position:'absolute',right:112,top:54,fontSize:18,letterSpacing:5,color:C.muted}}>ETF / FIELD GUIDE</div>
 <div style={{position:'absolute',left:110,top:124,fontSize:74,fontWeight:600,letterSpacing:-1,transform:'translateY('+((1-intro)*20)+'px)'}}>{scene.title}</div>
 <div style={{position:'absolute',left:114,top:235,fontSize:28,color:C.muted,letterSpacing:1}}>{scene.subtitle}</div>
 <div style={{position:'absolute',left:120,top:325,transform:'scale('+(1+.004*Math.sin(f*.006))+')',transformOrigin:'50% 50%'}}><Visual id={scene.visual} f={f}/></div>
 <div style={{position:'absolute',left:111,top:292,height:2,width:200+480*p(f,0,65),background:'linear-gradient(90deg,'+C.cyan+',transparent)'}}/>
 </AbsoluteFill>;
};
export const Main:React.FC<{audio:boolean}>=({audio})=>{
 const f=useCurrentFrame(),sub=TL.subs.find(s=>f>=s.from&&f<s.to),scene=TL.scenes.find(s=>f>=s.from&&f<s.from+s.duration);
 const cut=TL.scenes.find(s=>s.from>0&&Math.abs(f-s.from)<16);
 const sec=Math.floor(f/30),stamp=String(Math.floor(sec/60)).padStart(2,'0')+':'+String(sec%60).padStart(2,'0');
 return <AbsoluteFill style={{backgroundColor:C.bg,fontFamily:FONT}}><NoiseField/>
 {TL.scenes.map(s=><Sequence key={s.id} from={s.from} durationInFrames={s.duration}><Scene scene={s}/></Sequence>)}
 {cut&&<div style={{position:"absolute",left:((f-cut.from+16)/32)*2200-180,top:0,bottom:0,width:160,background:"linear-gradient(90deg,transparent,#65F4D21F,transparent)",transform:"skew(-18deg)",opacity:Math.sin((f-cut.from+16)/32*Math.PI)}}/>}
 {sub&&<div style={{position:'absolute',left:135,right:135,top:934,textAlign:'center',color:C.white,fontSize:35,lineHeight:1.45,fontWeight:500,textShadow:'0 2px 7px #000'}}><span style={{display:'inline-block',padding:'9px 25px',borderRadius:10,background:'#030812D9',border:'1px solid #23354866'}}>{sub.text}</span></div>}
 <div style={{position:'absolute',left:110,right:110,bottom:29,height:1,background:C.line}}><div style={{width:clamp(f/(TL.total-1))*100+'%',height:2,background:'linear-gradient(90deg,'+C.cyan+','+C.blue+')'}}/>{TL.scenes.map(s=><div key={s.id} style={{position:'absolute',left:s.from/TL.total*100+'%',height:5,width:1,background:C.dim,top:-2}}/>)}</div>
 <div style={{position:'absolute',left:112,bottom:44,fontFamily:MONO,fontSize:16,color:C.dim,letterSpacing:2}}>{stamp} / {String(Math.floor(TL.seconds/60)).padStart(2,'0')}:{String(Math.round(TL.seconds)%60).padStart(2,'0')}</div>
 <div style={{position:'absolute',right:110,bottom:43,fontSize:18,color:'#9AACBF'}}>本视频仅科普，不构成任何投资建议。</div>
 {audio&&<Audio src={staticFile('master.wav')}/>}
 </AbsoluteFill>;
};
export const Cover:React.FC=()=> <AbsoluteFill style={{background:C.bg,fontFamily:FONT,color:C.white}}><div style={{position:'absolute',inset:0,background:'radial-gradient(ellipse at 73% 48%,#164266,transparent 64%)'}}/><svg width={1920} height={1080} style={{position:"relative",zIndex:1}}><Defs/><AssetBasket x={1370} y={515} f={150} scale={1.75}/><T x={120} y={170} size={32} fill={C.cyan}>从原理到风险 · 一次讲清</T><T x={106} y={545} size={310} fill="url(#mint)" weight={650}>ETF</T><T x={123} y={690} size={79} weight={600}>把市场装进</T><T x={123} y={800} size={79} weight={600}>一份基金</T><T x={125} y={950} size={25} fill={C.muted}>机制 / 收益 / 风险 / 15 只代表产品</T><T x={1800} y={1020} anchor="end" size={21} fill={C.muted}>仅科普，不构成投资建议</T></svg></AbsoluteFill>;
const Contact:React.FC<{batch:number}>=({batch})=><AbsoluteFill style={{background:C.bg,display:"grid",gridTemplateColumns:"1fr 1fr",gridAutoRows:540}}>{TL.scenes.slice(batch*8,batch*8+8).map(s=><Img key={s.id} src={staticFile("qa/"+s.id+".jpg")} style={{width:960,height:540}}/>)}</AbsoluteFill>;
export const Root:React.FC=()=> <><Composition id="ETF" component={Main} fps={30} width={1920} height={1080} durationInFrames={TL.total} defaultProps={{audio:true}}/><Still id="Contact" component={Contact} width={1920} height={2160} defaultProps={{batch:0}}/><Still id="Cover" component={Cover} width={1920} height={1080}/></>;
