(function(root){
  'use strict';
  const formats={
    wav:{title:'WAV · 无损 PCM',ext:'wav',mime:'audio/wav',codec:'pcm_s16le',lossless:true},
    mp3:{title:'MP3',ext:'mp3',mime:'audio/mpeg',codec:'libmp3lame'},
    flac:{title:'FLAC · 无损压缩',ext:'flac',mime:'audio/flac',codec:'flac',lossless:true},
    ogg:{title:'OGG · Vorbis',ext:'ogg',mime:'audio/ogg',codec:'libvorbis'},
    m4a:{title:'M4A · AAC',ext:'m4a',mime:'audio/mp4',codec:'aac'},
    aac:{title:'AAC · ADTS',ext:'aac',mime:'audio/aac',codec:'aac'},
    opus:{title:'Opus · OGG',ext:'opus',mime:'audio/ogg; codecs=opus',codec:'libopus',opus:true},
    webm:{title:'WebM · Opus',ext:'webm',mime:'audio/webm',codec:'libopus',opus:true}
  };
  function settings({format='mp3',bitrate=192,sampleRate='auto',channels='auto',scope='all',start=0,end=null,duration=null}={}){
    if(!Object.hasOwn(formats,format))throw Error('请选择有效的输出格式');
    if(![64,96,128,192,256,320].includes(Number(bitrate)))throw Error('码率不在支持范围内');
    if(sampleRate!=='auto'&&![8000,16000,22050,24000,32000,44100,48000,96000].includes(Number(sampleRate)))throw Error('采样率不在支持范围内');
    if(channels!=='auto'&&![1,2].includes(Number(channels)))throw Error('请选择单声道、立体声或保留原声道');
    if(!['all','selection'].includes(scope))throw Error('请选择转换范围');
    if(duration!=null&&(!Number.isFinite(duration)||duration<=0||duration>900))throw Error('请选择 15 分钟以内的音频');
    if(scope==='selection'&&(!Number.isFinite(start)||!Number.isFinite(end)||start<0||end<=start||duration==null||end>duration+.01))throw Error('请先选择有效的音频片段');
    if(formats[format].opus&&sampleRate!=='auto'&&![8000,16000,24000,48000].includes(Number(sampleRate)))throw Error('Opus 支持 8000、16000、24000 或 48000 Hz；也可保留自动设置');
    if(formats[format].opus&&Number(channels)!==1&&sampleRate!=='auto'&&Number(sampleRate)!==48000)throw Error('立体声 Opus 请使用自动或 48000 Hz；较低采样率可选择单声道');
    if(format==='mp3'&&Number(sampleRate)>48000)throw Error('MP3 采样率最高为 48000 Hz');
    return {format,bitrate:Number(bitrate),sampleRate:sampleRate==='auto'?'auto':Number(sampleRate),channels:channels==='auto'?'auto':Number(channels),scope,start,end,duration};
  }
  function command(input,output,options){
    const o=settings(options),f=formats[o.format],args=['-hide_banner','-y','-i',input];
    if(o.scope==='selection')args.push('-ss',String(o.start),'-t',String(o.end-o.start));
    const stereoOpus=f.opus&&o.channels!==1;
    args.push('-map','0:a:0','-vn','-map_metadata','-1','-c:a',stereoOpus?'opus':f.codec);
    if(stereoOpus)args.push('-strict','-2');
    if(!f.lossless)args.push('-b:a',o.bitrate+'k');
    if(o.sampleRate!=='auto')args.push('-ar',String(o.sampleRate));else if(f.opus)args.push('-ar','48000');
    if(o.channels!=='auto')args.push('-ac',String(o.channels));else if(f.opus)args.push('-ac','2');
    if(o.format==='m4a')args.push('-movflags','+faststart');
    if(o.format==='flac')args.push('-compression_level','5');
    args.push('-threads','1',output);return args;
  }
  const api={formats,settings,command};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.AudioConvertLogic=api;
})(typeof self!=='undefined'?self:globalThis);
