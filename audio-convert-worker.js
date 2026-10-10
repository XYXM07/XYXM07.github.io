'use strict';
importScripts('audio-convert-logic.js?v=024764eebfa2','media-core-loader.js?v=4d89475ecfc8');
let core=null,busy=false;
async function engine(){core=await MediaCore.load();return core;}
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
