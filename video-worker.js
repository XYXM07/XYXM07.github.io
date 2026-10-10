'use strict';
importScripts('audio-convert-logic.js?v=024764eebfa2','video-logic.js?v=b80bc247a4c1','media-core-loader.js?v=4d89475ecfc8');
let busy=false,core=null;
self.onmessage=async({data})=>{if(busy)return;busy=true;const {id,bytes,extension,options}=data;let input,output,c;
  try{
    const o=VideoLogic.settings(options),f=o.kind==='video'?VideoLogic.formats[o.format]:AudioConvertLogic.formats[o.format];
    if(!(bytes instanceof Uint8Array)||!bytes.length||bytes.length>120*1024*1024)throw Error('请选择不超过 120 MB 的视频文件');self.postMessage({id,type:'loading'});c=core=await MediaCore.load();input='video-source.'+(/^[a-z0-9]{1,8}$/i.test(extension)?extension:'bin');output='video-output.'+f.ext;c.FS.writeFile(input,bytes);
    c.ffprobe('-v','error','-show_entries','stream=codec_type,codec_name,width,height:format=duration','-of','json','-o','video-meta.json',input);let meta;try{meta=JSON.parse(new TextDecoder().decode(c.FS.readFile('video-meta.json')));}catch{throw Error('无法读取视频容器，请检查文件是否损坏');}c.reset();
    const duration=Number(meta.format?.duration),video=meta.streams?.find(s=>s.codec_type==='video'),audio=meta.streams?.find(s=>s.codec_type==='audio');if(o.kind==='video'&&!video)throw Error('文件中没有可转换的视频轨道');if(o.kind==='audio'&&!audio)throw Error('该视频没有音轨，无法提取音频');if(Number.isFinite(duration)&&duration>600)throw Error('请选择 10 分钟以内的视频');if(video&&video.width*video.height>33000000)throw Error('请选择 3300 万像素以内的视频画面');if(o.range&&Number.isFinite(duration)&&o.end>duration+.01)throw Error('片段结束时间超出视频时长');if(o.format==='gif'&&((o.range?o.end-o.start:duration)>60||!Number.isFinite(duration)))throw Error('GIF 请截取 60 秒以内的片段');
    self.postMessage({id,type:'metadata',duration:duration||null,width:video?.width,height:video?.height});let diagnostic='',last=-1;c.setLogger(({message})=>{if(/error|invalid|failed|not found|unsupported|unable|cannot|could not/i.test(message))diagnostic=message.slice(0,180);});
    c.setProgress(({progress,time})=>{const length=o.range?o.end-o.start:duration,ratio=length&&Number.isFinite(time)?time/1000000/length:progress,percent=Math.max(0,Math.min(99,Math.floor((ratio||0)*100)));if(percent>last){last=percent;self.postMessage({id,type:'progress',percent});}});
    self.postMessage({id,type:'encoding'});c.setTimeout(15*60*1000);const code=c.exec(...VideoLogic.command(input,output,o));if(code!==0)throw Error(diagnostic?'转换失败：'+diagnostic:'视频转换失败，可以尝试降低分辨率或截取较短片段');const result=c.FS.readFile(output).slice();if(!result.length)throw Error('没有生成有效文件');self.postMessage({id,type:'done',bytes:result,mime:f.mime,ext:f.ext},[result.buffer]);
  }catch(e){self.postMessage({id,type:'error',message:e.message||'视频转换失败'});}
  finally{if(c){for(const name of [input,output,'video-meta.json'])if(name)try{c.FS.unlink(name);}catch{}c.setLogger(()=>{});c.setProgress(()=>{});c.reset();}busy=false;}
};
