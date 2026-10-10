'use strict';
self.MediaCore=(()=>{let core=null,loading=null;
async function load(){
  if(core)return core;
  if(!loading)loading=(async()=>{
    importScripts('vendor/ffmpeg/ffmpeg-core.js?v=b266ab5b9525');
    const manifestURL=new URL('vendor/ffmpeg/ffmpeg-core.manifest.json?v=8f1bdb4561fd',self.location.href);
    const response=await fetch(manifestURL);if(!response.ok)throw Error('媒体转换核心下载失败，请稍后重试');
    const manifest=await response.json();
    if(!Number.isSafeInteger(manifest.bytes)||manifest.bytes<=0||manifest.bytes>64*1024*1024||!Array.isArray(manifest.parts)||!manifest.parts.length)throw Error('媒体转换核心清单无效');
    const wasmBinary=new Uint8Array(manifest.bytes);let offset=0;
    for(const part of manifest.parts){
      if(!/^ffmpeg-core\.part-\d+\.wasm$/.test(part.name)||!Number.isSafeInteger(part.bytes)||part.bytes<=0||offset+part.bytes>wasmBinary.length)throw Error('媒体转换核心分片无效');
      const url=new URL(part.name,manifestURL);url.searchParams.set('v',part.sha256);
      const response=await fetch(url);if(!response.ok)throw Error('媒体转换核心下载失败，请稍后重试');
      const bytes=new Uint8Array(await response.arrayBuffer());
      const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),n=>n.toString(16).padStart(2,'0')).join('');
      if(bytes.length!==part.bytes||hash!==part.sha256)throw Error('媒体转换核心下载不完整，请重新尝试');
      wasmBinary.set(bytes,offset);offset+=bytes.length;
    }
    if(offset!==wasmBinary.length)throw Error('媒体转换核心下载不完整，请重新尝试');
    // Upstream reads this URL fragment even when wasmBinary is supplied.
    core=await createFFmpegCore({wasmBinary,mainScriptUrlOrBlob:new URL('vendor/ffmpeg/ffmpeg-core.js?v=b266ab5b9525',self.location.href).href+'#'+btoa(JSON.stringify({wasmURL:manifestURL.href}))});
    return core;
  })();
  try{return await loading;}catch(e){loading=null;core=null;throw e;}
}
return {load};})();
