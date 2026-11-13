// Protocol implementation based on rany2/edge-tts; licensed under LGPLv3. See docs/edge-tts-LICENSE.
import {token} from './edge-token.mjs';
import fs from 'node:fs';
import crypto from 'node:crypto';
import WebSocket from 'ws';
const TOKEN='6A5AA1D4EAFF4E9FB37E23D68491D6F4';
const uuid=()=>crypto.randomBytes(16).toString('hex');
const escape=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
export async function synthesize(text, file, voice='zh-CN-YunxiNeural') {
 const gec=token();
 return new Promise((resolve,reject)=>{
  const url='wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1?TrustedClientToken='+TOKEN+'&ConnectionId='+uuid()+'&Sec-MS-GEC='+gec+'&Sec-MS-GEC-Version=2-143.0.3650.75';
  const ws=new WebSocket(url,{headers:{Origin:'chrome-extension://jdiccldimpdaibmpdkjnbmckianbfold','User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0','Cookie':'muid='+uuid().toUpperCase()+';'},handshakeTimeout:20000});
  let chunks=[],words=[],done=false;
  const timer=setTimeout(()=>{ws.terminate();reject(new Error('Speech timeout'));},45000);
  const fail=e=>{clearTimeout(timer);if(!done){done=true;reject(e);}};
  ws.on('error',fail);
  ws.on('open',()=>{
   const stamp=new Date().toUTCString();
   ws.send('X-Timestamp:'+stamp+'\r\nContent-Type:application/json; charset=utf-8\r\nPath:speech.config\r\n\r\n'+JSON.stringify({context:{synthesis:{audio:{metadataoptions:{sentenceBoundaryEnabled:'false',wordBoundaryEnabled:'true'},outputFormat:'audio-24khz-48kbitrate-mono-mp3'}}}})+'\r\n');
   ws.send('X-RequestId:'+uuid()+'\r\nContent-Type:application/ssml+xml\r\nX-Timestamp:'+stamp+'\r\nPath:ssml\r\n\r\n<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="zh-CN"><voice name="'+voice+'"><prosody pitch="-2Hz" rate="+5%" volume="+0%">'+escape(text)+'</prosody></voice></speak>');
  });
  ws.on('message',(data,binary)=>{
   if(binary){const len=data.readUInt16BE(0);const head=data.subarray(2,2+len).toString();if(head.includes('Path:audio')&&head.includes('audio/mpeg'))chunks.push(data.subarray(2+len));return;}
   const str=data.toString(),split=str.indexOf('\r\n\r\n'),head=str.slice(0,split),body=str.slice(split+4);
   if(head.includes('Path:audio.metadata')){for(const x of JSON.parse(body).Metadata||[])if(x.Type==='WordBoundary')words.push({t:x.Data.Offset/1e7,d:x.Data.Duration/1e7,text:x.Data.text.Text});}
   if(head.includes('Path:turn.end')){clearTimeout(timer);done=true;ws.close();if(!chunks.length)return reject(new Error('Empty audio'));fs.writeFileSync(file,Buffer.concat(chunks));resolve({words,bytes:fs.statSync(file).size,voice});}
  });
  ws.on('close',()=>{if(!done)fail(new Error('Connection closed before turn.end'));});
 });
}
if(process.argv[2]==='--probe'){const r=await synthesize('一笔交易，持有一篮子资产。ETF，让复杂的市场变成一份可以交易的基金。本视频仅科普，不构成任何投资建议。','out/voice-probe.mp3');fs.writeFileSync('out/voice-probe.json',JSON.stringify(r,null,2));console.log({bytes:r.bytes,words:r.words.length});}
