// Nero chpl layout as documented by FFmpeg libavformat/movenc.c, mov_write_chpl_tag.
// Keep sample offsets intact by replacing the original moov with equally sized free space,
// then append the augmented moov. FFmpeg performs the final fast-start remux.
import fs from 'node:fs';
import assert from 'node:assert/strict';
function atoms(b,start=0,end=b.length){const out=[];for(let o=start;o<end;){assert(o+8<=end);let size=b.readUInt32BE(o),header=8;if(size===1){size=Number(b.readBigUInt64BE(o+8));header=16;}if(size===0)size=end-o;assert(size>=header&&o+size<=end);out.push({offset:o,size,header,type:b.toString('ascii',o+4,o+8),bytes:b.subarray(o,o+size)});o+=size;}return out;}
function atom(type,payload){const h=Buffer.alloc(8);h.writeUInt32BE(payload.length+8);h.write(type,4,'ascii');return Buffer.concat([h,payload]);}
export function addChapters(input,output,scenes){
 const b=fs.readFileSync(input),top=atoms(b),moov=top.find(a=>a.type==='moov');assert(moov);assert(scenes.length<256);
 const header=Buffer.alloc(9);header[0]=1;header[8]=scenes.length;
 const entries=scenes.map(s=>{const name=Buffer.from(s.title,'utf8');assert(name.length<256);const h=Buffer.alloc(9);h.writeBigUInt64BE(BigInt(Math.round(s.from/30*1e7)),0);h[8]=name.length;return Buffer.concat([h,name]);});
 const chpl=atom('chpl',Buffer.concat([header,...entries]));
 const children=atoms(moov.bytes,moov.header),udta=children.find(a=>a.type==='udta');
 const newUdta=atom('udta',Buffer.concat([...(udta?atoms(udta.bytes,udta.header).filter(a=>a.type!=='chpl').map(a=>a.bytes):[]),chpl]));
 const newMoov=atom('moov',Buffer.concat([...children.filter(a=>a.type!=='udta').map(a=>a.bytes),newUdta]));
 b.write('free',moov.offset+4,'ascii');fs.writeFileSync(output,Buffer.concat([b,newMoov]));
}
