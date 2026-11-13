import React from 'react';
import {AbsoluteFill,Img,Still,staticFile,registerRoot} from 'remotion';
const Comparison=()=> <AbsoluteFill style={{background:'#070C16',color:'#EDF4F8',fontFamily:'"Avenir Next","PingFang SC",sans-serif'}}>
 <div style={{position:'absolute',left:80,top:55,fontSize:46,fontWeight:600}}>V1 / 分类概览</div>
 <div style={{position:'absolute',left:1540,top:55,fontSize:46,fontWeight:600,color:'#65F4D2'}}>V2 / 逐只讲解与长期图表</div>
 <Img src={staticFile('v1.jpg')} style={{position:'absolute',left:80,top:160,width:1380,height:776.25,border:'1px solid #2A3D50'}}/>
 <Img src={staticFile('v2.jpg')} style={{position:'absolute',left:1540,top:160,width:1380,height:776.25,border:'1px solid #427B79'}}/>
 <div style={{position:'absolute',left:80,top:990,fontSize:35,color:'#A6B8C7'}}>15 只产品分组介绍 · 全片 5:58</div>
 <div style={{position:'absolute',left:1540,top:990,fontSize:35,color:'#C4E5DD'}}>15 个独立产品段落 · 每只约 39—45 秒 · 全片约 12:16</div>
 <div style={{position:'absolute',left:1540,top:1055,fontSize:31,color:'#A6B8C7'}}>总回报与价格双曲线 + 回撤图 + 年化、回撤和恢复情况</div>
 <div style={{position:'absolute',left:80,top:1130,fontSize:25,color:'#849BAC'}}>同一主题的实际视频关键帧。仅科普，不构成任何投资建议。</div>
 </AbsoluteFill>;
registerRoot(()=> <Still id="Compare" component={Comparison} width={3000} height={1200}/>);
