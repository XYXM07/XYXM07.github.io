(() => {
  'use strict';
  const $=s=>document.querySelector(s),L=ChartLogic;
  let current='',serial=0,usingExample=true,colorKey='',canvasColor='#17333d',inkColor='#e5eee6',exporting=false;
  const banks={series:[],category:[]};
  function preset(name){for(const key of Object.keys(banks))banks[key]=Array.from({length:18},(_,i)=>L.palettes[name][i%6]);}
  preset('ocean');
  const pie=()=>['pie','donut'].includes($('#chart-type').value);
  const bank=()=>banks[pie()?'category':'series'];
  function settings(data){return {type:$('#chart-type').value,title:$('#chart-name').value.slice(0,80),palette:$('#chart-palette').value,colors:bank().slice(0,pie()?Math.min(data.labels.length,18):data.series.length),background:canvasColor,foreground:$('#chart-auto-ink').checked?undefined:inkColor,legend:$('#chart-legend').checked};}
  function fail(text){$('#chart-status').textContent=text;$('#chart-svg').disabled=$('#chart-png').disabled=true;}
  function setSelect(id,value){const select=$('#'+id);if(select.value!==value){select.value=value;select.dispatchEvent(new Event('change',{bubbles:true}));}}
  function bindColor(picker,hex,commit){
    picker.addEventListener('input',()=>{hex.value=picker.value;hex.removeAttribute('aria-invalid');commit(picker.value);render();});
    hex.addEventListener('input',()=>{try{const value=L.color(hex.value);hex.removeAttribute('aria-invalid');picker.value=value;commit(value);render();}catch(e){hex.setAttribute('aria-invalid','true');fail(e.message);}});
  }
  function syncFixedColors(){
    const automatic=$('#chart-auto-ink').checked;if(automatic)inkColor=L.contrastInk(canvasColor);
    for(const [prefix,value] of [['canvas',canvasColor],['ink',inkColor]]){
      const picker=$('#chart-'+prefix+'-color'),hex=$('#chart-'+prefix+'-hex');picker.value=value;
      if(document.activeElement!==hex&&!hex.hasAttribute('aria-invalid'))hex.value=value;
      if(prefix==='ink'){picker.disabled=hex.disabled=automatic;if(automatic){hex.removeAttribute('aria-invalid');hex.value=value;}}
    }
  }
  function syncSeriesColors(data){
    const labels=(pie()?data.labels:data.series).slice(0,18),key=JSON.stringify([pie(),labels]);$('#chart-colors-label').textContent=pie()?'类别颜色':'系列颜色';
    if(key!==colorKey){
      colorKey=key;const fields=labels.map((label,i)=>{
        const field=document.createElement('label');field.className='chart-color-field';const title=document.createElement('span');title.textContent=label;
        const picker=document.createElement('input');picker.type='color';picker.setAttribute('aria-label','选择 '+label+' 的颜色');picker.dataset.chartColor=String(i);
        const hex=document.createElement('input');hex.className='chart-hex';hex.maxLength=7;hex.spellcheck=false;hex.setAttribute('aria-label',label+' 颜色十六进制');hex.dataset.chartHex=String(i);
        bindColor(picker,hex,value=>{bank()[i]=value;setSelect('chart-palette','custom');});field.append(title,picker,hex);return field;
      });$('#chart-series-colors').replaceChildren(...fields);
    }
    for(const picker of $('#chart-series-colors').querySelectorAll('[data-chart-color]')){const index=Number(picker.dataset.chartColor),hex=picker.nextElementSibling;picker.value=bank()[index];if(document.activeElement!==hex&&!hex.hasAttribute('aria-invalid'))hex.value=bank()[index];}
  }
  function render(){
    syncFixedColors();try{const data=L.parse($('#chart-data').value);syncSeriesColors(data);current=L.svg(data,settings(data));$('#chart-stage').innerHTML=current;$('#chart-status').textContent=data.labels.length+' 个类别 · '+data.series.length+' 个系列'+(pie()?' · 显示第一系列':'');$('#chart-svg').disabled=false;$('#chart-png').disabled=exporting;if($('#tool-chart input[aria-invalid="true"]'))fail('颜色请使用 #RRGGBB 格式');}catch(e){current='';$('#chart-stage').replaceChildren();fail(e.message);}
  }
  function example(){usingExample=true;$('#chart-data').value=L.example($('#chart-type').value);}
  function download(blob,ext){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=($('#chart-name').value.trim()||'我的图表').replace(/[\\/:*?"<>|]/g,'_')+'.'+ext;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
  $('#chart-type').addEventListener('input',()=>{if(usingExample){serial++;example();}render();});
  $('#chart-data').addEventListener('input',()=>{serial++;usingExample=false;render();});
  for(const id of ['chart-name','chart-legend','chart-auto-ink'])$('#'+id).addEventListener('input',render);
  $('#chart-palette').addEventListener('input',()=>{const value=$('#chart-palette').value;if(value!=='custom'){preset(value);$('#chart-series-colors').querySelectorAll('[aria-invalid]').forEach(el=>el.removeAttribute('aria-invalid'));}render();});
  $('#chart-background').addEventListener('input',()=>{const value=$('#chart-background').value;if(value!=='custom'){canvasColor=value==='white'?'#ffffff':'#17333d';$('#chart-canvas-hex').removeAttribute('aria-invalid');}render();});
  bindColor($('#chart-canvas-color'),$('#chart-canvas-hex'),value=>{canvasColor=value;setSelect('chart-background','custom');});
  bindColor($('#chart-ink-color'),$('#chart-ink-hex'),value=>{inkColor=value;});
  $('#chart-demo').onclick=()=>{serial++;example();render();};
  $('#chart-file').onchange=async()=>{const id=++serial,file=$('#chart-file').files[0];if(!file)return;try{if(file.size>200000)throw Error('CSV 文件请控制在 200 KB 以内');const value=await file.text();if(id!==serial)return;usingExample=false;$('#chart-data').value=value.replace(/^\uFEFF/,'');render();}catch(e){$('#chart-status').textContent=e.message;}};
  $('#chart-svg').onclick=()=>{if(current&&!$('#chart-svg').disabled)download(new Blob([current],{type:'image/svg+xml;charset=utf-8'}),'svg');};
  $('#chart-png').onclick=async()=>{if(!current||exporting||$('#chart-png').disabled)return;const source=current;exporting=true;$('#chart-png').disabled=true;const url=URL.createObjectURL(new Blob([source],{type:'image/svg+xml;charset=utf-8'}));try{const img=new Image();await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=()=>reject(Error('图表图片无法生成'));img.src=url;});const c=document.createElement('canvas');c.width=2000;c.height=1280;c.getContext('2d').drawImage(img,0,0,c.width,c.height);const blob=await new Promise(resolve=>c.toBlob(resolve,'image/png'));if(!blob)throw Error('PNG 导出失败');download(blob,'png');}catch(e){$('#chart-status').textContent=e.message;}finally{URL.revokeObjectURL(url);exporting=false;$('#chart-png').disabled=!current||!!$('#tool-chart input[aria-invalid="true"]');}};
  example();render();
})();
