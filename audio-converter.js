(() => {
  'use strict';const $=s=>document.querySelector(s),L=window.AudioConvertLogic;
  const progress=$('#audio-convert-progress'),status=$('#audio-convert-status'),result=$('#audio-convert-result'),player=$('#audio-convert-player');
  const controls=['format','scope','bitrate','rate','channels'].map(id=>$('#audio-convert-'+id));let worker=null,busy=false,job=0,outputURL=null,watchdog=0;
  const source=()=>window.AudioStudio.getSource();
  function clearResult(){player.pause();player.removeAttribute('src');player.load();if(outputURL)URL.revokeObjectURL(outputURL);outputURL=null;result.hidden=true;$('#audio-convert-download').removeAttribute('href');}
  function update(){
    const s=source(),format=L.formats[$('#audio-convert-format').value];
    controls.forEach(c=>c.disabled=busy);$('#audio-convert-bitrate').disabled=busy||format.lossless;
    const selection=$('#audio-convert-scope').querySelector('[value=selection]');selection.disabled=!s.duration;
    if(!s.duration)$('#audio-convert-scope').value='all';
    for(const o of $('#audio-convert-rate').options)o.disabled=format.opus&&o.value!=='auto'&&![8000,16000,24000,48000].includes(Number(o.value))||$('#audio-convert-format').value==='mp3'&&Number(o.value)>48000;
    if($('#audio-convert-rate').selectedOptions[0].disabled)$('#audio-convert-rate').value='auto';
    $('#audio-convert-run').disabled=busy||!s.file||s.loading;$('#audio-convert-cancel').hidden=!busy;
    $('#audio-convert-note').textContent=format.lossless?'无损输出不会额外引入有损压缩；无法恢复原文件已丢失的音质。':format.opus?'Opus 自动使用 48000 Hz、立体声；也可手动选择支持的采样率与声道。':'码率越高通常文件越大；转换为有损格式会重新压缩音频。';
  }
  function stopWorker(){if(worker)worker.terminate();worker=null;clearTimeout(watchdog);watchdog=0;}
  function cancel(message='已取消转换，可以重新选择格式。'){job++;stopWorker();busy=false;progress.hidden=true;progress.value=0;update();status.textContent=message;}
  function fail(message){stopWorker();busy=false;progress.hidden=true;update();status.textContent=message;}
  controls.forEach(c=>c.addEventListener('change',()=>{clearResult();update();}));
  document.addEventListener('audio:source',()=>{if(busy)cancel('音频文件已更换。');clearResult();update();const s=source();status.textContent=s.loading?'正在读取音频…':s.file?'已准备好。选择输出格式，转换整段音频或波形选区。':'先在上方打开音频。首次转换会加载约 31 MB 的转换组件。';});
  $('#audio-convert-cancel').onclick=()=>cancel();
  $('#audio-convert-run').onclick=async()=>{
    if(busy)return;const s=source();if(!s.file||s.loading)return;let options;
    try{if(s.file.size>80*1024*1024)throw Error('文件不能超过 80 MB');options=L.settings({format:$('#audio-convert-format').value,bitrate:Number($('#audio-convert-bitrate').value),sampleRate:$('#audio-convert-rate').value,channels:$('#audio-convert-channels').value,scope:$('#audio-convert-scope').value,start:s.range.start,end:s.range.end,duration:s.duration});}catch(error){status.textContent=error.message;return;}
    const id=++job;clearResult();busy=true;update();progress.hidden=false;progress.removeAttribute('value');status.textContent='正在准备转换…';
    try{
      if(!window.Worker||!window.WebAssembly)throw Error('当前浏览器不支持音频转换，请使用新版浏览器');
      const bytes=new Uint8Array(await s.file.arrayBuffer());if(id!==job)return;
      if(!worker)worker=new Worker('audio-convert-worker.js?v=1d0c3994f124');
      worker.onmessage=({data})=>{
        if(data.id!==job)return;
        if(data.type==='loading'){status.textContent='正在加载本地转换组件，首次需要下载约 31 MB…';}
        else if(data.type==='encoding'){progress.value=0;status.textContent='正在转换 '+L.formats[options.format].title+'…';clearTimeout(watchdog);watchdog=setTimeout(()=>{if(busy&&id===job)cancel('转换超时，请缩短音频后重试。');},10*60*1000+10000);}
        else if(data.type==='progress'){progress.value=Math.max(Number(progress.value)||0,data.percent);status.textContent='正在转换… '+progress.value+'%';}
        else if(data.type==='error')fail(data.message);
        else if(data.type==='done'){
          clearTimeout(watchdog);watchdog=0;busy=false;progress.value=100;const f=L.formats[options.format],blob=new Blob([data.bytes],{type:f.mime});outputURL=URL.createObjectURL(blob);
          player.src=outputURL;const link=$('#audio-convert-download');link.href=outputURL;link.download=s.name+(options.scope==='selection'?'-裁剪':'-转换')+'.'+f.ext;
          $('#audio-convert-info').textContent=f.title+' · '+(blob.size/1024).toFixed(1)+' KB · '+(options.scope==='selection'?options.start.toFixed(2)+'–'+options.end.toFixed(2)+' 秒选区':'整段音频');result.hidden=false;update();status.textContent='转换完成，可以试听或下载。';
        }
      };
      worker.onerror=e=>{e.preventDefault();if(id===job)fail('转换组件无法运行，请刷新重试或更换浏览器。');};
      watchdog=setTimeout(()=>{if(busy&&id===job)cancel('组件加载超时，请检查网络后重试。');},120000);
      worker.postMessage({id,bytes,extension:s.file.name.split('.').at(-1).toLowerCase(),options},[bytes.buffer]);
    }catch(error){if(id===job)fail(error.message||'无法启动转换');}
  };
  function leave(){player.pause();if(busy)cancel('已离开音频工具，转换已取消。');else stopWorker();}
  document.addEventListener('hub:selection',e=>{if(e.detail.kind==='tool'&&e.detail.name!=='audio')leave();});document.addEventListener('site:pagechange',e=>{if(e.detail.page!=='tools')leave();});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)player.pause();});window.addEventListener('pagehide',()=>{cancel();clearResult();});update();
})();
