(function(root){
  'use strict';
  const formats={mp4:{title:'MP4 · H.264 / AAC',ext:'mp4',mime:'video/mp4',codec:'libx264',audio:'aac'},mov:{title:'MOV · H.264 / AAC',ext:'mov',mime:'video/quicktime',codec:'libx264',audio:'aac'},mkv:{title:'MKV · H.264 / AAC',ext:'mkv',mime:'video/x-matroska',codec:'libx264',audio:'aac'},webm:{title:'WebM · VP8 / Opus',ext:'webm',mime:'video/webm',codec:'libvpx',audio:'opus'},avi:{title:'AVI · MPEG-4 / MP3',ext:'avi',mime:'video/x-msvideo',codec:'mpeg4',audio:'libmp3lame'},ogv:{title:'OGV · Theora / Vorbis',ext:'ogv',mime:'video/ogg',codec:'libtheora',audio:'libvorbis'},mpg:{title:'MPEG · MPEG-2 / MP2',ext:'mpg',mime:'video/mpeg',codec:'mpeg2video',audio:'mp2'},gif:{title:'GIF · 动画 / 无音轨',ext:'gif',mime:'image/gif',codec:'gif'}};
  function settings({kind='video',format='mp4',height=720,fps='auto',quality=23,range=false,start=0,end=null,bitrate=192}={}){
    const A=typeof module!=='undefined'&&module.exports?require('./audio-convert-logic.js'):root.AudioConvertLogic;
    if(!['video','audio'].includes(kind)||!Object.hasOwn(kind==='video'?formats:A.formats,format))throw Error('请选择有效的输出格式');
    if(!['auto',360,480,720,1080].includes(height==='auto'?'auto':Number(height)))throw Error('请选择支持的输出高度');if(!['auto',12,24,25,30,60].includes(fps==='auto'?'auto':Number(fps)))throw Error('请选择支持的帧率');if(!Number.isInteger(Number(quality))||quality<18||quality>35)throw Error('画质参数须为 18–35');if(![64,96,128,192,256,320].includes(Number(bitrate)))throw Error('请选择支持的音频码率');
    start=Number(start);end=end==null||end===''?null:Number(end);if(range&&(!Number.isFinite(start)||!Number.isFinite(end)||start<0||end<=start))throw Error('请选择有效的起止时间');
    return {kind,format,height:height==='auto'?'auto':Number(height),fps:fps==='auto'?'auto':Number(fps),quality:Number(quality),range:Boolean(range),start,end,bitrate:Number(bitrate)};
  }
  function command(input,output,options){const o=settings(options),A=typeof module!=='undefined'&&module.exports?require('./audio-convert-logic.js'):root.AudioConvertLogic;
    if(o.kind==='audio'){const args=A.command(input,output,{format:o.format,bitrate:o.bitrate,scope:'all',duration:null});if(o.range)args.splice(args.indexOf('-map'),0,'-ss',String(o.start),'-t',String(o.end-o.start));return args;}
    const f=formats[o.format],args=['-hide_banner','-y','-threads','1','-i',input];if(o.range)args.push('-ss',String(o.start),'-t',String(o.end-o.start));args.push('-map','0:v:0');if(f.audio)args.push('-map','0:a:0?');args.push('-map_metadata','-1');const filters=[];
    if(o.format==='mpg')filters.push('fps=25');else if(o.fps!=='auto')filters.push('fps='+o.fps);
    const height=o.height==='auto'?null:o.height;if(height)filters.push("scale='max(2,trunc(iw*min(1,"+height+"/ih)/2)*2)':'max(2,trunc(ih*min(1,"+height+"/ih)/2)*2)'");else if(o.format!=='gif')filters.push('scale=trunc(iw/2)*2:trunc(ih/2)*2');
    if(filters.length)args.push('-vf',filters.join(','));args.push('-c:v',f.codec);
    if(f.codec==='libx264')args.push('-preset','ultrafast','-crf',String(o.quality),'-pix_fmt','yuv420p');
    if(f.codec==='libvpx')args.push('-deadline','good','-cpu-used','4','-crf',String(o.quality),'-b:v','1500k','-pix_fmt','yuv420p');
    if(f.codec==='mpeg4'||f.codec==='mpeg2video')args.push('-q:v',String(Math.max(2,Math.round((o.quality-16)/3))),'-pix_fmt','yuv420p');
    if(f.codec==='libtheora')args.push('-q:v',String(Math.max(2,Math.round(10-(o.quality-18)/3))),'-pix_fmt','yuv420p');
    if(f.audio){args.push('-c:a',f.audio,'-b:a',o.bitrate+'k','-ac','2');if(f.audio==='mp2')args.push('-ar','44100');if(f.audio==='opus')args.push('-strict','-2','-ar','48000');}else args.push('-an');
    if(['mp4','mov'].includes(o.format))args.push('-movflags','+faststart');args.push('-filter_threads','1','-threads','1',output);return args;
  }
  const api={formats,settings,command};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.VideoLogic=api;
})(typeof self!=='undefined'?self:globalThis);
