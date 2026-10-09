'use strict';
importScripts('audio-convert-logic.js?v=82c2a9e30f9d');
let core=null,loading=null,busy=false;
async function engine(){
  if(core)return core;
  if(!loading)loading=(async()=>{
    importScripts('vendor/ffmpeg/ffmpeg-core.js?v=b266ab5b9525');
    const manifestURL=new URL('vendor/ffmpeg/ffmpeg-core.manifest.json?v=8f1bdb4561fd',self.location.href);
    const response=await fetch(manifestURL);if(!response.ok)throw Error('音频转换核心下载失败，请稍后重试');
    const manifest=await response.json();
    if(!Number.isSafeInteger(manifest.bytes)||manifest.bytes<=0||manifest.bytes>64*1024*1024||!Array.isArray(manifest.parts)||!manifest.parts.length)throw Error('音频转换核心清单无效');
    const wasmBinary=new Uint8Array(manifest.bytes);let offset=0;
    for(const part of manifest.parts){
      if(!/^ffmpeg-core\.part-\d+\.wasm$/.test(part.name)||!Number.isSafeInteger(part.bytes)||part.bytes<=0||offset+part.bytes>wasmBinary.length)throw Error('音频转换核心分片无效');
      const url=new URL(part.name,manifestURL);url.searchParams.set('v',part.sha256);
      const response=await fetch(url);if(!response.ok)throw Error('音频转换核心下载失败，请稍后重试');
      const bytes=new Uint8Array(await response.arrayBuffer());
      const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),n=>n.toString(16).padStart(2,'0')).join('');
      if(bytes.length!==part.bytes||hash!==part.sha256)throw Error('音频转换核心下载不完整，请重新尝试');
      wasmBinary.set(bytes,offset);offset+=bytes.length;
    }
    if(offset!==wasmBinary.length)throw Error('音频转换核心下载不完整，请重新尝试');
    // Upstream reads this URL fragment even when wasmBinary is supplied.
    core=await createFFmpegCore({wasmBinary,mainScriptUrlOrBlob:new URL('vendor/ffmpeg/ffmpeg-core.js?v=b266ab5b9525',self.location.href).href+'#'+btoa(JSON.stringify({wasmURL:manifestURL.href}))});
    return core;
  })();
  try{return await loading;}catch(e){loading=null;core=null;throw e;}
}
self.onmessage=async ({data})=>{
  if(busy)return;
  const {id,bytes,extension,options}=data;busy=true;let input,output,c;
  try{
    const settings=AudioConvertLogic.settings(options),format=AudioConvertLogic.formats[settings.format];
    if(!(bytes instanceof Uint8Array)||!bytes.length||bytes.length>80*1024*1024)throw Error('请选择不超过 80 MB 的有效音频文件');
    self.postMessage({id,type:'loading'});c=await engine();
    input='source.'+(/^[a-z0-9]{1,8}$/i.test(extension)?extension:'bin');output='converted.'+format.ext;
    c.FS.writeFile(input,bytes);let diagnostic='',lastProgress=-1,sourceDuration=null;
    if(settings.duration==null){
      // This core reports ffprobe success through its JSON file, not Module.ret.
      c.ffprobe('-v','error','-show_entries','format=duration','-of','json','-o','duration.json',input);
      try{sourceDuration=Number(JSON.parse(new TextDecoder().decode(c.FS.readFile('duration.json'))).format?.duration);}catch{throw Error('无法读取音频，请检查文件是否损坏或格式是否受支持');}
      c.reset();if(Number.isFinite(sourceDuration)&&sourceDuration>900)throw Error('请选择 15 分钟以内的音频');
    }
    c.setLogger(({message})=>{const found=message.match(/Duration:\s*(\d+):(\d+):([\d.]+)/);if(found)sourceDuration=Number(found[1])*3600+Number(found[2])*60+Number(found[3]);if(/error|invalid|failed|not found|unsupported|unable|cannot|could not/i.test(message))diagnostic=message.slice(0,200);});
    c.setProgress(({progress,time})=>{
      const duration=settings.scope==='selection'?settings.end-settings.start:settings.duration||sourceDuration;
      const ratio=duration&&Number.isFinite(time)?time/1000000/duration:progress;
      const percent=Math.max(0,Math.min(99,Math.floor(ratio*100)));
      if(percent>lastProgress){lastProgress=percent;self.postMessage({id,type:'progress',percent});}
    });
    self.postMessage({id,type:'encoding'});c.setTimeout(10*60*1000);
    const ret=c.exec(...AudioConvertLogic.command(input,output,settings));
    if(ret!==0)throw Error(diagnostic?'转换失败：'+diagnostic:'转换失败，请检查文件是否包含可用音轨');
    const result=c.FS.readFile(output).slice();if(!result.length)throw Error('未生成有效的音频文件');
    self.postMessage({id,type:'done',bytes:result,format:settings.format},[result.buffer]);
  }catch(error){self.postMessage({id,type:'error',message:error.message||'音频转换失败'});}
  finally{if(c){for(const file of [input,output,'duration.json'])if(file)try{c.FS.unlink(file);}catch{}c.setLogger(()=>{});c.setProgress(()=>{});c.reset();}busy=false;}
};
