(() => {
  'use strict';
  const L=window.FunctionLogic,$=s=>document.querySelector(s),all=s=>[...document.querySelectorAll(s)],panel=$('#tool-function');
  const palette=['#a9d5b5','#ececc7','#e6aaa1','#a8d7e4','#d8bf93','#bfcfc5'];
  const examples={
    cartesian:[['waves','三角函数与抛物线',['a*sin(b*x+c)','0.15*x^2-1']],['polynomial','多项式',['x^3-3*x','x']],['rational','反比例与渐近线',['a/x']],['gaussian','高斯曲线',['a*exp(-x^2/2)']]],
    parametric:[['circle','圆与椭圆',['a*cos(t)','b*sin(t)']],['lissajous','利萨如曲线',['3*sin(3*t+c)','3*sin(2*t)']],['heart','心形曲线',['0.2*16*sin(t)^3','0.2*(13*cos(t)-5*cos(2*t)-2*cos(3*t)-cos(4*t))']],['spiral','阿基米德螺线',['0.3*t*cos(t)','0.3*t*sin(t)']]],
    polar:[['rose','三叶玫瑰',['4*a*cos(3*t+c)']],['cardioid','心形极坐标',['2*a*(1-cos(t))']],['polar-spiral','极坐标螺线',['0.5*a*t']],['lemniscate','双叶曲线',['3*sqrt(cos(2*t))']]],
    surface:[['ripple','环形波纹',['a*sin(sqrt(x^2+y^2)+c)']],['saddle','马鞍曲面',['a*(x^2-y^2)/5']],['bell','高斯曲面',['3*a*exp(-(x^2+y^2)/5)']],['wave','双向波面',['a*sin(b*x)*cos(y+c)']],['cone','圆锥曲面',['sqrt(x^2+y^2)-3']]]
  };
  let mode='2d',functions=[],nextId=0,plot=null,config=null,debounce,tableData=null;
  const dimensionViews={'2d':{xmin:-6,xmax:6,ymin:-6,ymax:6},'3d':{xmin:-5,xmax:5,ymin:-5,ymax:5}};
  const active=()=>location.hash.split('?')[0]==='#tools/function'&&!panel.hidden&&!document.hidden;
  const format=n=>!Number.isFinite(n)?'未定义':Math.abs(n)<1e-10?'0':Number(n.toPrecision(8)).toString();
  function status(text,error=false){$('#fp-status').textContent=text;$('#fp-status').classList.toggle('error',error);}
  function element(tag,text){const e=document.createElement(tag);if(text!==undefined)e.textContent=text;return e;}
  function read(id,min=-10000,max=10000){const input=$('#'+id),n=Number(input.value);if(!input.value.trim()||!Number.isFinite(n)||n<min||n>max)throw Error('请填写有效数值（'+min+' 至 '+max+'）。');return n;}
  function bounds(from,to){const min=read(from),max=read(to);if(max-min<.00001)throw Error('范围终点须大于起点，间距至少 0.00001。');return [min,max];}
  function clearTable(){if(!tableData)return;tableData=null;$('#fp-table-head').replaceChildren();$('#fp-table-body').replaceChildren();$('#fp-table-status').textContent='表达式、参数或范围已变化，请重新生成。';}
  function changed(){clearTable();$('#fp-analysis-result').textContent='表达式或参数已变化，请重新计算。';$('#fp-analysis-result').classList.remove('error');clearTimeout(debounce);debounce=setTimeout(draw,120);}
  function scope(){return Object.fromEntries(['a','b','c'].map(k=>[k,read('fp-'+k+'-number',-10,10)]));}
  function rangeView(){const [xmin,xmax]=bounds('fp-xmin','fp-xmax'),[ymin,ymax]=bounds('fp-ymin','fp-ymax');return {xmin,xmax,ymin,ymax};}
  function compile(text,variables){return L.compile(text,{variables:[...variables,'a','b','c'],angle:$('#fp-angle').value});}
  function build(){
    const kind=$('#fp-kind').value,view=rangeView(),params=scope(),result={mode,kind,angle:$('#fp-angle').value,view,scope:params,background:$('#fp-background').value,settings:{grid:$('#fp-grid').checked,axes:$('#fp-axes').checked,derivative:mode==='2d'&&kind==='cartesian'&&$('#fp-derivative').checked},curves:[]};
    if(mode==='3d'){
      const [zmin,zmax]=bounds('fp-zmin','fp-zmax'),compiled=compile($('#fp-surface').value,['x','y']);
      result.surface={evaluate:compiled.evaluate,xmin:view.xmin,xmax:view.xmax,ymin:view.ymin,ymax:view.ymax,zmin,zmax,resolution:Number($('#fp-quality').value),wire:$('#fp-wire').checked};
      result.label='z = '+compiled.expression;
    }else if(kind==='cartesian'){
      let errors=0;
      for(const f of functions){try{f.compiled=compile(f.expression,['x']);f.error='';if(f.visible)result.curves.push({evaluate:f.compiled.evaluate,color:f.color,label:f.label});}catch(e){f.compiled=null;f.error=e.message;errors++;}const row=$('#fp-function-'+f.id);row.classList.toggle('invalid',!!f.error);row.querySelector('.fp-expression-error').textContent=f.error;}
      result.errors=errors;
      if($('#fp-shade').checked){const [from,to]=bounds('fp-from','fp-to'),selected=functions[Number($('#fp-analysis-function').value)],index=result.curves.findIndex(c=>c.label===selected?.label);if(index>=0)result.integral={from,to,index};}
    }else{
      const [min,max]=bounds('fp-t-min','fp-t-max');
      if(kind==='parametric'){const x=compile($('#fp-param-x').value,['t']),y=compile($('#fp-param-y').value,['t']);result.parametric={x:x.evaluate,y:y.evaluate,min,max,color:palette[0]};result.label='x(t) = '+x.expression+'；y(t) = '+y.expression;}
      else{const r=compile($('#fp-polar-r').value,['t']);result.polar={r:r.evaluate,min,max,color:palette[0]};result.label='r(t) = '+r.expression;}
    }
    return result;
  }
  function ensurePlot(){if(plot)return plot;plot=window.FunctionPlot.create($('#fp-canvas'),{
    onViewChange(view){if(view.mode==='3d')return;for(const key of ['xmin','xmax','ymin','ymax'])if(Number.isFinite(view[key]))$('#fp-'+key).value=String(Number(view[key].toPrecision(10)));if(config)config.view={...view};clearTable();},
    onInspect(point){if(!point){$('#fp-readout').textContent=mode==='3d'?'拖动旋转曲面，观察空间中的函数形状。':'移动鼠标或触摸画布查看坐标。';return;}$('#fp-readout').textContent='x = '+format(point.x)+' · y = '+format(point.y)+(point.values?.length?'　'+point.values.map(v=>v.label+' = '+format(v.value)).join('　'):'');}
  });return plot;}
  function legend(){const root=$('#fp-legend');root.replaceChildren();const items=config.mode==='2d'&&config.kind==='cartesian'?config.curves.map(c=>({label:c.label+' = '+functions.find(f=>f.label===c.label).expression,color:c.color})):[{label:config.label,color:palette[0]}];for(const item of items){const span=element('span'),mark=element('i');mark.style.background=item.color;span.append(mark,document.createTextNode(item.label));root.append(span);}if(config.settings.derivative)root.append(element('span','虚线：导函数'));}
  function draw(){clearTimeout(debounce);if(!active())return;try{config=build();const stats=ensurePlot().render(config);legend();const n=config.curves.length;let text=mode==='3d'?'三维曲面已更新。':config.kind==='cartesian'?(n+' 条可见函数'+(config.errors?'，'+config.errors+' 条表达式待修正。':'，图像已更新。')):'曲线已更新。';if(!config.errors&&stats.validPoints===0)text=mode==='2d'&&config.kind==='cartesian'&&!n?'请勾选至少一个函数。':'当前范围内没有可绘制的点，请检查定义域与显示范围。';status(text,!!config.errors);$('#fp-plot-label').textContent=mode==='3d'?'三维空间 · z = f(x, y)':'二维坐标系';}catch(e){status(e.message+' 图像保留上次有效设置。',true);}}
  function analysisOptions(){const select=$('#fp-analysis-function'),old=select.value;select.replaceChildren(...functions.map((f,i)=>{const o=element('option',f.label);o.value=String(i);return o;}));if(functions[Number(old)])select.value=old;}
  function rows(){const container=$('#fp-functions');container.replaceChildren();functions.forEach((f,index)=>{f.label='f'+(index+1);const row=element('div');row.id='fp-function-'+f.id;row.className='fp-expression';const header=element('div');header.className='fp-expression-line';const visible=element('input');visible.type='checkbox';visible.checked=f.visible;visible.setAttribute('aria-label','显示 '+f.label);visible.onchange=()=>{f.visible=visible.checked;changed();};const color=element('input');color.type='color';color.value=f.color;color.setAttribute('aria-label',f.label+' 曲线颜色');color.oninput=()=>{f.color=color.value;changed();};const label=element('label',f.label+'(x)');label.htmlFor='fp-formula-'+f.id;const remove=element('button','×');remove.type='button';remove.setAttribute('aria-label','删除 '+f.label);remove.disabled=functions.length===1;remove.onclick=()=>{functions=functions.filter(n=>n.id!==f.id);rows();changed();};header.append(visible,color,label,remove);const input=element('input');input.id='fp-formula-'+f.id;input.type='text';input.value=f.expression;input.spellcheck=false;input.autocomplete='off';input.setAttribute('autocapitalize','off');input.setAttribute('aria-describedby','fp-error-'+f.id);input.oninput=()=>{f.expression=input.value;changed();};input.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();draw();}};const error=element('p');error.id='fp-error-'+f.id;error.className='fp-expression-error';row.append(header,input,error);container.append(row);});$('#fp-add').disabled=functions.length>=6;analysisOptions();}
  function setFunctions(list){functions=list.map((expression,i)=>({id:++nextId,expression,color:palette[i%palette.length],visible:true,label:'f'+(i+1)}));rows();}
  function group(){return mode==='3d'?'surface':$('#fp-kind').value;}
  function refreshExamples(){const select=$('#fp-example');select.replaceChildren(...examples[group()].map(([value,title])=>{const option=element('option',title);option.value=value;return option;}));}
  function setView(values){for(const [key,value]of Object.entries(values))$('#fp-'+key).value=String(value);}
  function resetParams(){for(const k of ['a','b','c'])$('#fp-'+k).value=$('#fp-'+k+'-number').value=k==='c'?'0':'1';}
  function loadExample(){const item=examples[group()].find(e=>e[0]===$('#fp-example').value)||examples[group()][0];resetParams();if(mode==='3d'){$('#fp-surface').value=item[2][0];setView({xmin:-5,xmax:5,ymin:-5,ymax:5,zmin:-3,zmax:3});}
    else if(group()==='cartesian'){setFunctions(item[2]);setView({xmin:-6,xmax:6,ymin:-6,ymax:6});}
    else{const angle=$('#fp-angle').value==='deg'?360:2*Math.PI;setView({xmin:-6,xmax:6,ymin:-6,ymax:6});$('#fp-t-min').value='0';$('#fp-t-max').value=String(item[0].includes('spiral')?angle*2:angle);if(group()==='parametric'){$('#fp-param-x').value=item[2][0];$('#fp-param-y').value=item[2][1];}else $('#fp-polar-r').value=item[2][0];}
    clearTable();draw();
  }
  function updateMode(){const cart=mode==='2d'&&group()==='cartesian';all('[data-fp-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.fpMode===mode)));for(const [id,visible]of [['fp-kind-wrap',mode==='2d'],['fp-functions',cart],['fp-add',cart],['fp-parametric',mode==='2d'&&group()==='parametric'],['fp-polar',mode==='2d'&&group()==='polar'],['fp-t-range',mode==='2d'&&!cart],['fp-surface-fields',mode==='3d'],['fp-derivative-wrap',cart],['fp-wire-wrap',mode==='3d'],['fp-zrange',mode==='3d'],['fp-quality-wrap',mode==='3d'],['fp-analysis',cart]])$('#'+id).hidden=!visible;$('#fp-expression-tag').textContent=mode==='3d'?'z = f(x, y)':cart?'y = f(x)':group()==='polar'?'r = f(t)':'x(t), y(t)';$('#fp-domain-label').textContent=mode==='3d'?'自变量 X 范围':'横轴 X 范围';$('#fp-yrange-label').textContent=mode==='3d'?'自变量 Y 范围':'纵轴 Y 范围';$('#fp-interaction').textContent=mode==='3d'?'拖动旋转 · 滚轮或双指缩放 · 方向键旋转 · 加减键缩放':'拖动平移 · 滚轮或双指缩放 · 方向键移动 · 加减键缩放';$('#fp-readout').textContent=mode==='3d'?'拖动旋转曲面，观察空间中的函数形状。':'移动鼠标或触摸画布查看坐标。';}
  all('[data-fp-mode]').forEach(b=>b.onclick=()=>{if(mode===b.dataset.fpMode)return;dimensionViews[mode]=Object.fromEntries(['xmin','xmax','ymin','ymax'].map(key=>[key,$('#fp-'+key).value]));mode=b.dataset.fpMode;setView(dimensionViews[mode]);updateMode();refreshExamples();clearTable();draw();});
  $('#fp-kind').onchange=()=>{updateMode();refreshExamples();loadExample();};$('#fp-example').onchange=loadExample;$('#fp-load-example').onclick=loadExample;
  $('#fp-add').onclick=()=>{if(functions.length>=6)return;functions.push({id:++nextId,expression:'x',color:palette[functions.length],visible:true});rows();changed();};
  for(const k of ['a','b','c']){const slider=$('#fp-'+k),number=$('#fp-'+k+'-number');slider.oninput=()=>{number.value=slider.value;changed();};number.oninput=()=>{if(number.value.trim()&&Number.isFinite(Number(number.value)))slider.value=number.value;changed();};}
  for(const id of ['fp-param-x','fp-param-y','fp-polar-r','fp-surface','fp-t-min','fp-t-max','fp-angle','fp-grid','fp-axes','fp-derivative','fp-wire','fp-quality','fp-background','fp-shade'])$('#'+id).addEventListener(['fp-grid','fp-axes','fp-derivative','fp-wire','fp-shade'].includes(id)?'change':'input',changed);
  for(const id of ['fp-xmin','fp-xmax','fp-ymin','fp-ymax','fp-zmin','fp-zmax'])$('#'+id).addEventListener('change',changed);
  $('#fp-analysis-function').onchange=()=>{if($('#fp-shade').checked)draw();};$('#fp-from').onchange=$('#fp-to').onchange=()=>{if($('#fp-shade').checked)changed();};
  $('#fp-draw').onclick=draw;$('#fp-apply-view').onclick=()=>{clearTable();draw();};$('#fp-reset-view').onclick=()=>{setView(mode==='3d'?{xmin:-5,xmax:5,ymin:-5,ymax:5,zmin:-3,zmax:3}:{xmin:-6,xmax:6,ymin:-6,ymax:6});draw();plot?.reset();clearTable();};
  function analyze(kind){const out=$('#fp-analysis-result');try{if(mode!=='2d'||group()!=='cartesian')throw Error('数值分析适用于普通函数。');const f=functions[Number($('#fp-analysis-function').value)];if(!f)throw Error('请选择函数。');const compiled=compile(f.expression,['x']),params=scope();let text;
    if(kind==='value'){const x=read('fp-point'),y=compiled.evaluate({...params,x}),d=L.derivative(compiled,x,params);text=f.label+'('+format(x)+') = '+format(y)+'\n'+f.label+'′('+format(x)+') ≈ '+format(d);}
    else{const from=read('fp-from'),to=read('fp-to');if(from===to&&kind==='roots')throw Error('请设置非零长度的区间。');if(kind==='integral'){const value=L.integral(compiled,from,to,params);text='∫ '+f.label+'(x) dx ≈ '+format(value)+'\n区间 ['+format(from)+', '+format(to)+']';}else{const found=L.roots(compiled,Math.min(from,to),Math.max(from,to),params);text=found.length?'区间零点 x ≈ '+found.map(format).join('，'):'当前区间未检测到零点。';}}
    out.textContent=text;out.classList.remove('error');if($('#fp-shade').checked)draw();
  }catch(e){out.textContent=e.message;out.classList.add('error');}}
  $('#fp-evaluate').onclick=()=>analyze('value');$('#fp-integrate').onclick=()=>analyze('integral');$('#fp-roots').onclick=()=>analyze('roots');
  function dataRows(){const cfg=build(),n=read('fp-table-count',2,201);if(!Number.isInteger(n))throw Error('采样数量须为整数。');const rows=[];let heads;
    if(mode==='3d'){heads=['x','y','z'];const side=Math.min(31,Math.max(2,Math.round(Math.sqrt(n)))),s=cfg.surface;for(let j=0;j<side;j++)for(let i=0;i<side;i++){const x=s.xmin+(s.xmax-s.xmin)*i/(side-1),y=s.ymin+(s.ymax-s.ymin)*j/(side-1);rows.push([x,y,s.evaluate({...cfg.scope,x,y})]);}}
    else if(cfg.kind==='cartesian'){if(cfg.errors)throw Error('请先修正函数表达式。');if(!cfg.curves.length)throw Error('请显示至少一个函数。');heads=['x',...cfg.curves.map(c=>c.label)];for(let i=0;i<n;i++){const x=cfg.view.xmin+(cfg.view.xmax-cfg.view.xmin)*i/(n-1);rows.push([x,...cfg.curves.map(c=>c.evaluate({...cfg.scope,x}))]);}}
    else{heads=['t','x','y'];const p=cfg.parametric||cfg.polar;for(let i=0;i<n;i++){const t=p.min+(p.max-p.min)*i/(n-1);if(cfg.kind==='parametric')rows.push([t,p.x({...cfg.scope,t}),p.y({...cfg.scope,t})]);else{const r=p.r({...cfg.scope,t}),angle=cfg.angle==='deg'?t*Math.PI/180:t;rows.push([t,r*Math.cos(angle),r*Math.sin(angle)]);}}}
    return {heads,rows};
  }
  function makeTable(){try{tableData=dataRows();const header=element('tr');for(const h of tableData.heads)header.append(element('th',h));$('#fp-table-head').replaceChildren(header);$('#fp-table-body').replaceChildren(...tableData.rows.slice(0,100).map(row=>{const tr=element('tr');for(const v of row)tr.append(element('td',format(v)));return tr;}));$('#fp-table-status').textContent='已生成 '+tableData.rows.length+' 行，页面显示前 '+Math.min(100,tableData.rows.length)+' 行；CSV 导出全部数据。';return tableData;}catch(e){$('#fp-table-status').textContent=e.message;tableData=null;$('#fp-table-head').replaceChildren();$('#fp-table-body').replaceChildren();return null;}}
  function download(name,data,type){const link=element('a'),url=URL.createObjectURL(new Blob([data],{type}));link.href=url;link.download=name;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
  $('#fp-table-build').onclick=makeTable;$('#fp-csv').onclick=()=>{const data=makeTable();if(data)download('函数数据.csv','\uFEFF'+[data.heads,...data.rows.map(row=>row.map(n=>Number.isFinite(n)?String(n):''))].map(row=>row.join(',')).join('\r\n'),'text/csv;charset=utf-8');};
  $('#fp-png').onclick=()=>{try{draw();if($('#fp-status').classList.contains('error'))throw Error('请先修正设置，再导出图像。');const href=ensurePlot().exportPNG(),link=element('a');link.download=mode==='3d'?'三维函数.png':'二维函数.png';link.href=href;link.click();status('图像已导出。');}catch(e){status(e.message,true);}};
  const fieldIds=['fp-kind','fp-angle','fp-param-x','fp-param-y','fp-polar-r','fp-t-min','fp-t-max','fp-surface','fp-xmin','fp-xmax','fp-ymin','fp-ymax','fp-zmin','fp-zmax','fp-background','fp-quality','fp-a-number','fp-b-number','fp-c-number'];
  const checks=['fp-grid','fp-axes','fp-derivative','fp-wire'];
  function validateExpressions(fields,list){const test=(text,variables)=>L.compile(text,{variables:[...variables,'a','b','c'],angle:fields['fp-angle']});for(const f of list)test(f.expression,['x']);for(const id of ['fp-param-x','fp-param-y','fp-polar-r'])test(fields[id],['t']);test(fields['fp-surface'],['x','y']);}
  $('#fp-save').onclick=()=>{try{const cfg=build();if(cfg.errors)throw Error('请先修正函数表达式，再导出配置。');const project={version:1,mode,functions:functions.map(f=>({expression:f.expression,color:f.color,visible:f.visible})),fields:Object.fromEntries(fieldIds.map(id=>[id,$('#'+id).value])),checks:Object.fromEntries(checks.map(id=>[id,$('#'+id).checked]))};validateExpressions(project.fields,project.functions);download('函数绘图配置.json',JSON.stringify(project,null,2),'application/json');status('绘图配置已导出。');}catch(e){status(e.message,true);}};
  async function openProject(file){try{if(!file)return;if(file.size>100000)throw Error('配置文件过大，请选择 100 KB 以内的 JSON 文件。');const p=JSON.parse(await file.text());if(!p||p.version!==1||!['2d','3d'].includes(p.mode)||!Array.isArray(p.functions)||!p.functions.length||p.functions.length>6||!p.fields||!p.checks)throw Error('无法识别此绘图配置。');for(const f of p.functions)if(typeof f.expression!=='string'||f.expression.length>1000||!/^#[a-f\d]{6}$/i.test(f.color)||typeof f.visible!=='boolean')throw Error('函数配置不完整。');for(const id of fieldIds)if(typeof p.fields[id]!=='string'||p.fields[id].length>1000)throw Error('绘图设置不完整。');for(const id of checks)if(typeof p.checks[id]!=='boolean')throw Error('显示设置不完整。');
      if(!['cartesian','parametric','polar'].includes(p.fields['fp-kind'])||!['rad','deg'].includes(p.fields['fp-angle'])||!['32','48','72'].includes(p.fields['fp-quality'])||!/^#[a-f\d]{6}$/i.test(p.fields['fp-background']))throw Error('绘图设置包含无效选项。');
      for(const id of fieldIds.filter(id=>!['fp-kind','fp-angle','fp-param-x','fp-param-y','fp-polar-r','fp-surface','fp-background','fp-quality'].includes(id))){const n=Number(p.fields[id]);if(!p.fields[id].trim()||!Number.isFinite(n)||Math.abs(n)>10000)throw Error('配置中的数值无效。');}
      for(const [lo,hi]of [['fp-xmin','fp-xmax'],['fp-ymin','fp-ymax'],['fp-zmin','fp-zmax'],['fp-t-min','fp-t-max']])if(Number(p.fields[hi])-Number(p.fields[lo])<.00001)throw Error('配置中的范围无效。');for(const k of ['a','b','c'])if(Math.abs(Number(p.fields['fp-'+k+'-number']))>10)throw Error('参数范围为 -10 至 10。');
      validateExpressions(p.fields,p.functions);
      mode=p.mode;functions=p.functions.map((f,i)=>({...f,id:++nextId,label:'f'+(i+1)}));for(const id of fieldIds)$('#'+id).value=p.fields[id];for(const id of checks)$('#'+id).checked=p.checks[id];for(const k of ['a','b','c'])$('#fp-'+k).value=$('#fp-'+k+'-number').value;rows();updateMode();refreshExamples();clearTable();draw();status('绘图配置已导入。');
    }catch(e){status('导入失败：'+e.message,true);}finally{$('#fp-open').value='';}}
  $('#fp-open').onchange=e=>openProject(e.target.files[0]);
  function route(){clearTimeout(debounce);if(active()){draw();plot?.resize();}}
  document.addEventListener('site:pagechange',route);document.addEventListener('visibilitychange',route);window.addEventListener('pagehide',()=>clearTimeout(debounce));
  setFunctions(examples.cartesian[0][2]);updateMode();refreshExamples();route();
})();
