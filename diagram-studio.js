(() => {
  'use strict';const $=s=>document.querySelector(s),svg=$('#diagram-canvas'),ns='http://www.w3.org/2000/svg',L=window.StudioLogic,W=180,H=92;
  const stores={flow:{graph:{version:1,mode:'flow',nodes:[{id:1,x:380,y:30,text:'开始',shape:'round',color:'#b6dedc',textColor:'#000000'},{id:2,x:380,y:170,text:'处理任务',shape:'rect',color:'#cbdcb0',textColor:'#000000'},{id:3,x:380,y:310,text:'是否完成？',shape:'diamond',color:'#dfc594',textColor:'#000000'},{id:4,x:380,y:470,text:'结束',shape:'round',color:'#b6dedc',textColor:'#000000'}],edges:[{from:1,to:2},{from:2,to:3},{from:3,to:4}]},history:[]},mind:{graph:{version:1,mode:'mind',nodes:[{id:1,x:70,y:220,text:'中心主题',shape:'round',color:'#b6dedc',textColor:'#000000'},{id:2,x:350,y:70,text:'想法与目标',shape:'round',color:'#cbdcb0',textColor:'#000000'},{id:3,x:350,y:220,text:'行动计划',shape:'round',color:'#dfc594',textColor:'#000000'},{id:4,x:350,y:370,text:'灵感收集',shape:'round',color:'#b5d8e3',textColor:'#000000'}],edges:[{from:1,to:2},{from:1,to:3},{from:1,to:4}]},history:[]}};
  let mode='flow',selection=null,connecting=false,linkStart=null,drag=null;
  const store=()=>stores[mode],graph=()=>store().graph,status=text=>$('#diagram-status').textContent=text;
  function element(tag,attrs={},text){const e=document.createElementNS(ns,tag);Object.entries(attrs).forEach(([k,v])=>e.setAttribute(k,String(v)));if(text!=null)e.textContent=text;return e;}
  function snapshot(){store().history.push(JSON.stringify(graph()));if(store().history.length>60)store().history.shift();$('#diagram-undo').disabled=false;}
  function dimensions(){return {width:Math.max(1000,...graph().nodes.map(n=>n.x+W+40)),height:Math.max(640,...graph().nodes.map(n=>n.y+H+40))};}
  function build(exporting=false){
    const {width,height}=dimensions(),result=element('svg',{xmlns:ns,viewBox:'0 0 '+width+' '+height,width,height});
    const defs=element('defs'),arrow=element('marker',{id:'diagram-arrow',viewBox:'0 0 10 10',refX:9,refY:5,markerWidth:7,markerHeight:7,orient:'auto-start-reverse'});arrow.append(element('path',{d:'M 0 0 L 10 5 L 0 10 z',fill:'#9fbfc4'}));defs.append(arrow);result.append(defs,element('rect',{x:0,y:0,width,height,fill:'#102c39'}));
    if(!exporting){const pattern=element('pattern',{id:'diagram-grid',width:30,height:30,patternUnits:'userSpaceOnUse'});pattern.append(element('circle',{cx:1,cy:1,r:1,fill:'#c7e5de25'}));defs.append(pattern);result.append(element('rect',{width,height,fill:'url(#diagram-grid)'}));}
    for(const edge of graph().edges){
      const from=graph().nodes.find(n=>n.id===edge.from),to=graph().nodes.find(n=>n.id===edge.to);if(!from||!to)continue;
      const dx=to.x-from.x,dy=to.y-from.y,horizontal=Math.abs(dx)>Math.abs(dy)||mode==='mind';
      const x1=from.x+W/2+(horizontal?Math.sign(dx)*W/2:0),y1=from.y+H/2+(horizontal?0:Math.sign(dy)*H/2),x2=to.x+W/2-(horizontal?Math.sign(dx)*W/2:0),y2=to.y+H/2-(horizontal?0:Math.sign(dy)*H/2);
      const d=mode==='mind'?'M '+x1+' '+y1+' C '+((x1+x2)/2)+' '+y1+' '+((x1+x2)/2)+' '+y2+' '+x2+' '+y2:horizontal?'M '+x1+' '+y1+' L '+((x1+x2)/2)+' '+y1+' L '+((x1+x2)/2)+' '+y2+' L '+x2+' '+y2:'M '+x1+' '+y1+' L '+x1+' '+((y1+y2)/2)+' L '+x2+' '+((y1+y2)/2)+' L '+x2+' '+y2;
      const selected=!exporting&&selection?.edge===edge.from+'-'+edge.to,g=element('g',{class:'diagram-edge'+(selected?' selected':''),'data-edge':edge.from+'-'+edge.to});g.append(element('path',{class:'edge-line',d,fill:'none',stroke:selected?'#efcd8f':'#9fbfc4','stroke-width':selected?4:2,'marker-end':mode==='flow'?'url(#diagram-arrow)':''}));if(!exporting)g.append(element('path',{class:'edge-hit',d,fill:'none',stroke:'transparent','stroke-width':18}));result.append(g);
    }
    for(const n of graph().nodes){
      const selected=!exporting&&selection?.id===n.id,g=element('g',{class:'diagram-node',transform:'translate('+n.x+' '+n.y+')','data-node':n.id,tabindex:exporting?-1:0,role:'button','aria-label':n.text+'，节点 '+n.id});g.append(element('title',{},n.text));
      const attrs={fill:n.color,stroke:!exporting&&linkStart===n.id?'#f6dc8b':selected?'#f7f2d5':'#ffffff55','stroke-width':selected?3:1.4};g.append(n.shape==='diamond'?element('path',{...attrs,d:'M '+W/2+' 0 L '+W+' '+H/2+' L '+W/2+' '+H+' L 0 '+H/2+' z'}):element('rect',{...attrs,width:W,height:H,rx:n.shape==='round'?24:8}));
      const letters=Array.from(n.text),lines=[];for(let i=0;i<letters.length;i+=12)lines.push(letters.slice(i,i+12).join(''));if(!lines.length)lines.push('未命名');const text=element('text',{x:W/2,y:H/2-(lines.length-1)*8+5,'text-anchor':'middle',fill:n.textColor||'#000000',stroke:'none','font-size':14,'font-family':'sans-serif','pointer-events':'none'});lines.forEach((line,i)=>text.append(element('tspan',{x:W/2,dy:i?16:0},line)));g.append(text);result.append(g);
    }return result;
  }
  function inspector(){const n=graph().nodes.find(n=>n.id===selection?.id);for(const id of ['diagram-text','diagram-shape','diagram-color','diagram-text-color','diagram-apply'])document.getElementById(id).disabled=!n;$('#diagram-text').value=n?.text||'';$('#diagram-shape').value=n?.shape||'rect';$('#diagram-color').value=n?.color||'#b6dedc';$('#diagram-text-color').value=n?.textColor||'#000000';$('#diagram-undo').disabled=!store().history.length;document.querySelectorAll('[data-diagram-mode]').forEach(b=>{b.setAttribute('aria-selected',b.dataset.diagramMode===mode);b.tabIndex=b.dataset.diagramMode===mode?0:-1;});$('#diagram-add').textContent=mode==='mind'?'添加子节点':'添加节点';}
  function render(update=true){const picture=build();svg.setAttribute('viewBox',picture.getAttribute('viewBox'));svg.setAttribute('width',picture.getAttribute('width'));svg.setAttribute('height',picture.getAttribute('height'));svg.replaceChildren(...picture.children);if(update)inspector();}
  function selectNode(id){selection={id};inspector();render(false);}
  function connectNode(id){
    if(linkStart==null){linkStart=id;status('已选择起点，请选择终点');render(false);return;}
    if(linkStart===id){linkStart=null;status('起点与终点不能相同');render(false);return;}
    try{const candidate=structuredClone(graph());candidate.edges.push({from:linkStart,to:id});L.validateDiagram(candidate);snapshot();store().graph=candidate;status('已连接节点');}catch(err){status(err.message);}linkStart=null;render();
  }
  function point(e){return new DOMPoint(e.clientX,e.clientY).matrixTransform(svg.getScreenCTM().inverse());}
  svg.addEventListener('pointerdown',e=>{
    if(e.button!==0)return;const target=e.target.closest('[data-node]'),edge=e.target.closest('[data-edge]');
    if(target){const id=Number(target.dataset.node);if(connecting){connectNode(id);return;}selectNode(id);const n=graph().nodes.find(n=>n.id===id),p=point(e);drag={id,dx:p.x-n.x,dy:p.y-n.y,saved:false};svg.setPointerCapture(e.pointerId);}
    else{selection=edge?{edge:edge.dataset.edge}:null;render();}
  });
  svg.addEventListener('pointermove',e=>{if(!drag)return;const n=graph().nodes.find(n=>n.id===drag.id),p=point(e);if(!drag.saved){snapshot();drag.saved=true;}n.x=Math.round(Math.max(0,Math.min(2200,p.x-drag.dx)));n.y=Math.round(Math.max(0,Math.min(30000,p.y-drag.dy)));render(false);});
  svg.addEventListener('pointerup',()=>{if(drag?.saved)status('节点位置已更新');drag=null;});svg.addEventListener('pointercancel',()=>drag=null);
  svg.addEventListener('keydown',e=>{const id=Number(e.target.closest('[data-node]')?.dataset.node);if(!id)return;if(e.key==='Enter'||e.key===' '){e.preventDefault();connecting?connectNode(id):selectNode(id);}else if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){e.preventDefault();snapshot();const n=graph().nodes.find(n=>n.id===id),step=e.shiftKey?20:5;n.x=Math.max(0,Math.min(2200,n.x+({ArrowLeft:-step,ArrowRight:step}[e.key]||0)));n.y=Math.max(0,Math.min(30000,n.y+({ArrowUp:-step,ArrowDown:step}[e.key]||0)));selection={id};render();svg.querySelector('[data-node="'+id+'"]').focus();}else if(e.key==='Delete'){selection={id};$('#diagram-delete').click();}});
  $('#diagram-add').onclick=()=>{
    if(graph().nodes.length>=150){status('最多 150 个节点');return;}snapshot();const parent=graph().nodes.find(n=>n.id===selection?.id)||graph().nodes[0],id=Math.max(0,...graph().nodes.map(n=>n.id))+1;const n={id,x:Math.min(2200,mode==='mind'&&parent?parent.x+250:80+(id%4)*210),y:Math.min(30000,mode==='mind'&&parent?parent.y+120:40+Math.floor(id/4)*130),text:mode==='mind'?(parent?'新分支':'中心主题'):'新节点',shape:mode==='mind'?'round':'rect',color:'#b6dedc',textColor:'#000000'};graph().nodes.push(n);if(mode==='mind'&&parent)graph().edges.push({from:parent.id,to:id});selection={id};render();status('已添加节点，右侧可编辑文字');
  };
  $('#diagram-connect').onclick=()=>{connecting=!connecting;linkStart=null;$('#diagram-connect').setAttribute('aria-pressed',connecting);status(connecting?'连线模式：依次选择起点和终点':'已退出连线模式');render(false);};
  $('#diagram-apply').onclick=()=>{const n=graph().nodes.find(n=>n.id===selection?.id);if(!n)return;snapshot();n.text=$('#diagram-text').value.trim().slice(0,60)||'未命名';n.shape=$('#diagram-shape').value;n.color=$('#diagram-color').value;n.textColor=$('#diagram-text-color').value;render();status('节点属性已更新');};
  $('#diagram-delete').onclick=()=>{
    if(!selection)return;snapshot();if(selection.edge)graph().edges=graph().edges.filter(e=>e.from+'-'+e.to!==selection.edge);else{const remove=new Set([selection.id]);if(mode==='mind'){let changed=true;while(changed){changed=false;graph().edges.forEach(e=>{if(remove.has(e.from)&&!remove.has(e.to)){remove.add(e.to);changed=true;}});}}graph().nodes=graph().nodes.filter(n=>!remove.has(n.id));graph().edges=graph().edges.filter(e=>!remove.has(e.from)&&!remove.has(e.to));}selection=null;linkStart=null;render();status('已删除，可撤销恢复');
  };
  $('#diagram-undo').onclick=()=>{if(!store().history.length)return;store().graph=JSON.parse(store().history.pop());selection=null;linkStart=null;render();status('已撤销上一步');};
  $('#diagram-clear').onclick=()=>{snapshot();graph().nodes=[];graph().edges=[];selection=null;linkStart=null;render();status('空白画布，可以添加节点；撤销可恢复');};
  $('#diagram-layout').onclick=()=>{
    snapshot();if(mode==='flow'){graph().nodes.forEach((n,i)=>{n.x=40+(i%4)*230;n.y=30+Math.floor(i/4)*145;});}else{const children=id=>graph().edges.filter(e=>e.from===id).map(e=>e.to),roots=graph().nodes.filter(n=>!graph().edges.some(e=>e.to===n.id));let row=0;function place(id,depth){const n=graph().nodes.find(n=>n.id===id),kids=children(id);n.x=40+Math.min(8,depth)*260;if(!kids.length)n.y=30+(row++)*130;else{kids.forEach(k=>place(k,depth+1));n.y=kids.map(k=>graph().nodes.find(n=>n.id===k).y).reduce((a,b)=>a+b,0)/kids.length;}}roots.forEach(n=>place(n.id,0));}render();status('已自动布局，可继续拖动调整');
  };
  for(const b of document.querySelectorAll('[data-diagram-mode]')){b.onclick=()=>{mode=b.dataset.diagramMode;selection=null;connecting=false;linkStart=null;$('#diagram-connect').setAttribute('aria-pressed','false');render();status('已切换为'+(mode==='flow'?'流程图':'思维导图')+'，两个画布分别保留');};b.onkeydown=e=>{if(['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();document.querySelector('[data-diagram-mode="'+(mode==='flow'?'mind':'flow')+'"]').click();document.querySelector('[data-diagram-mode="'+mode+'"]').focus();}};}
  function download(blob,name){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);}
  const title=()=>mode==='flow'?'流程图':'思维导图';
  $('#diagram-save').onclick=()=>{download(new Blob([JSON.stringify(graph(),null,2)],{type:'application/json'}),title()+'-项目.json');status('项目已保存，可通过打开项目恢复编辑');};
  $('#diagram-file').onchange=async e=>{const file=e.target.files[0];if(!file)return;try{if(file.size>2*1024*1024)throw Error('项目文件不能超过 2 MB');const incoming=L.validateDiagram(JSON.parse(await file.text()));mode=incoming.mode;snapshot();store().graph=incoming;selection=null;linkStart=null;connecting=false;$('#diagram-connect').setAttribute('aria-pressed','false');render();status('项目已导入');}catch(err){status(err.message||'无法读取项目');}e.target.value='';};
  const svgText=()=>new XMLSerializer().serializeToString(build(true));
  $('#diagram-svg').onclick=()=>{download(new Blob([svgText()],{type:'image/svg+xml'}),title()+'.svg');status('SVG 已导出');};
  $('#diagram-png').onclick=async()=>{const b=$('#diagram-png');b.disabled=true;let url;try{const {width,height}=dimensions();if(width*height>18000000)throw Error('画布过大，请导出 SVG');url=URL.createObjectURL(new Blob([svgText()],{type:'image/svg+xml'}));const img=new Image();await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=()=>reject(Error('图像渲染失败'));img.src=url;});const c=document.createElement('canvas');c.width=width;c.height=height;c.getContext('2d').drawImage(img,0,0);const blob=await new Promise(resolve=>c.toBlob(resolve,'image/png'));if(!blob)throw Error('PNG 导出失败');download(blob,title()+'.png');status('PNG 已导出');}catch(err){status(err.message);}finally{if(url)URL.revokeObjectURL(url);b.disabled=false;}};
  render();
})();
