import * as codec from './vendor/nasjidwg/dist/index.js';

const LIMIT=50000, MAX_SOURCE=80*1024*1024;
const clone=value=>structuredClone(value);
function encode(value){return JSON.stringify(value,(_,v)=>{if(!(v instanceof Uint8Array))return v;let text='';for(let i=0;i<v.length;i+=8192)text+=String.fromCharCode(...v.subarray(i,i+8192));return {__xyxmBytes:btoa(text)};});}
function decode(text){if(typeof text!=='string'||text.length>MAX_SOURCE)throw Error('工程中的原图数据无效或过大');return JSON.parse(text,(_,v)=>{if(v&&typeof v==='object'&&Object.keys(v).length===1&&typeof v.__xyxmBytes==='string'){const text=atob(v.__xyxmBytes);return Uint8Array.from(text,c=>c.charCodeAt(0));}return v;});}
function checkDrawing(drawing){if(!drawing||!drawing.header||!Array.isArray(drawing.entities)||drawing.entities.length>LIMIT||!Array.isArray(drawing.layers)||!drawing.blocks)throw Error('图纸结构无效，或模型空间超过 5 万个实体');}
function colorOf(e,d){const layer=d.layers.find(l=>l.name===e.layer),rgb=codec.colorToRgb(e.color,codec.colorToRgb(layer?.color??{kind:'aci',index:7},0x202a2e));return '#'+(rgb===0xffffff?0x202a2e:rgb).toString(16).padStart(6,'0');}
function visible(e,d){const layer=d.layers.find(l=>l.name===e.layer);return !e.invisible&&layer?.on!==false&&!layer?.frozen;}
function plain2d(e){const z=p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y)&&Math.abs(p.x)<=1e7&&Math.abs(p.y)<=1e7&&Math.abs(p.z??0)<1e-9;const n=e.extrusion;
  if(n&&(Math.abs(n.x)>1e-9||Math.abs(n.y)>1e-9||Math.abs(n.z-1)>1e-9))return false;
  if(e.type==='line')return z(e.start)&&z(e.end);
  if(e.type==='circle'||e.type==='arc')return z(e.center)&&Number.isFinite(e.radius)&&e.radius>0&&e.radius<=1e7&&(e.type!=='arc'||Number.isFinite(e.startAngle)&&Number.isFinite(e.endAngle)&&Math.abs(e.endAngle-e.startAngle)>1e-12);
  return e.type==='polyline'&&!e.fit&&!e.frame?.length&&!e.constantWidth&&!e.elevation&&e.vertices.length>=2&&e.vertices.length<=10000&&e.vertices.every(p=>z(p)&&!p.bulge&&!p.startWidth&&!p.endWidth);
}
function editable(d){const objects=[],indexes=new Set();for(let i=0;i<d.entities.length;i++){const e=d.entities[i],layer=d.layers.find(l=>l.name===e.layer);if(objects.length>=2000||!visible(e,d)||layer?.locked||!plain2d(e))continue;const o={type:e.type,color:colorOf(e,d),width:Math.max(.1,Math.min(10,e.lineweight||1)),cadId:String(i)};
    if(e.type==='line')o.points=[{x:e.start.x,y:e.start.y},{x:e.end.x,y:e.end.y}];else if(e.type==='polyline'){o.points=e.vertices.map(p=>({x:p.x,y:p.y}));o.closed=!!e.closed;}else{Object.assign(o,{cx:e.center.x,cy:e.center.y,r:e.radius});if(e.type==='arc')Object.assign(o,{start:e.startAngle*180/Math.PI,end:e.endAngle*180/Math.PI});}objects.push(o);indexes.add(i);
  }return {objects,indexes};}
function background(d,indexes){const entities=d.entities.filter((e,i)=>!indexes.has(i)&&visible(e,d));if(!entities.length)return null;const view={...d,entities},bounds=codec.contentBounds(view);let svg=codec.writeSvg(view,{width:1600});if(svg.length>8*1024*1024)throw Error('只读图形预览过大，请拆分图纸后导入');svg=svg.replace(/\b(stroke|fill)="#ffffff"/gi,'$1="#202a2e"');const match=svg.match(/viewBox="([^"]+)"/);if(!match)throw Error('图纸预览坐标无效');const [x,y,w,h]=match[1].split(/\s+/).map(Number);if(![x,y,w,h].every(Number.isFinite)||w<=0||h<=0)throw Error('图纸预览范围无效');const ratio=1600/Math.max(w,h);svg=svg.replace(/width="[^"]+" height="[^"]+"/,'width="'+Math.max(1,w*ratio)+'" height="'+Math.max(1,h*ratio)+'"');return {svg,x,y,w,h,bounds:bounds?{x1:bounds.min.x,y1:bounds.min.y,x2:bounds.max.x,y2:bounds.max.y}:null};}
export function inspectDrawing(d){checkDrawing(d);const data=editable(d),source=encode(d);if(source.length>MAX_SOURCE)throw Error('解析后的图纸过大，请拆分文件');return {...data,indexes:undefined,source,background:background(d,data.indexes),version:d.header.version??'未知',unit:d.header.insUnits??0,total:d.entities.length,retained:d.entities.length-data.objects.length,warnings:(d.warnings??[]).slice(0,100)};}
export function openDwg(bytes){if(bytes.byteLength>20*1024*1024||bytes.byteLength<6)throw Error('DWG 文件须在 20 MB 以内且内容完整');return inspectDrawing(codec.readDwg(new Uint8Array(bytes),{checkCrc:true,retainRecords:true}));}
export function openProject(source){return inspectDrawing(decode(source));}
function newEntity(o){const e={type:o.type,layer:'0',color:{kind:'rgb',rgb:parseInt(o.color.slice(1),16)},lineweight:o.width};if(o.type==='line'){e.start={...o.points[0],z:0};e.end={...o.points[1],z:0};}else if(o.type==='polyline'){e.vertices=o.points.map(p=>({...p}));e.closed=!!o.closed;}else{e.center={x:o.cx,y:o.cy,z:0};e.radius=o.r;if(o.type==='arc'){e.startAngle=o.start*Math.PI/180;e.endAngle=o.end*Math.PI/180;}}return e;}
function unchanged(a,b){if(a.type!==b.type||a.color!==b.color||a.width!==b.width||!!a.closed!==!!b.closed)return false;if(a.points)return b.points?.length===a.points.length&&a.points.every((p,i)=>p.x===b.points[i].x&&p.y===b.points[i].y);return ['cx','cy','r','start','end'].every(k=>a[k]===b[k]);}
export function buildDrawing(source,objects,unit){const d=source?decode(source):codec.emptyDrawing();checkDrawing(d);const original=editable(d),old=new Map(original.objects.map(o=>[o.cadId,o])),items=new Map(),fresh=[];
  for(const o of objects){if(o.cadId!==undefined){if(!old.has(o.cadId)||items.has(o.cadId))throw Error('对象与原图关联无效，请重新导入工程');items.set(o.cadId,o);}else fresh.push(newEntity(o));}
  d.entities=d.entities.flatMap((e,i)=>{const id=String(i);if(!old.has(id))return [e];const changed=items.get(id);if(!changed)return [];const initial=old.get(id);if(unchanged(changed,initial))return [e];const result={...e};delete result.record;
    if(changed.type!==e.type)throw Error('原图对象类型发生变化，请重新导入');
    if(changed.type==='line'){result.start={...e.start,...changed.points[0]};result.end={...e.end,...changed.points[1]};}else if(changed.type==='polyline'){result.vertices=changed.points.map((p,k)=>({...e.vertices[k],...p}));result.closed=!!changed.closed;}else{result.center={...e.center,x:changed.cx,y:changed.cy};result.radius=changed.r;if(changed.type==='arc'){result.startAngle=changed.start*Math.PI/180;result.endAngle=changed.end*Math.PI/180;}}
    if(changed.color!==initial.color)result.color={kind:'rgb',rgb:parseInt(changed.color.slice(1),16)};if(changed.width!==initial.width)result.lineweight=changed.width;return [result];
  }).concat(fresh);d.header={...d.header,insUnits:unit};const bounds=codec.drawingBounds(d);if(bounds){d.header.extMin={...bounds.min,z:bounds.min.z??0};d.header.extMax={...bounds.max,z:bounds.max.z??0};}return d;}
export function saveDrawing({source,objects,unit,format,version='2000'}){const drawing=buildDrawing(source,objects,unit);
  if(format==='json')return {text:JSON.stringify({version:2,unit,objects,nativeSource:source||null},null,2)};
  if(format==='svg')return {text:codec.writeSvg(drawing,{width:1600}),retained:!!source};
  if(format==='dxf')return {text:codec.writeDxf(drawing,{preserveHandles:true}),retained:!!source};
  if(version!=='2000')throw Error('当前使用已验证的 DWG 2000 保存格式');const result=codec.writeDwg2000(drawing,{preserveHandles:true,verbatimRecords:true});
  // The codec identifies only AutoCAD's named, standard visual styles here.
  // Those defaults are rebuilt on open; user-defined styles and every other
  // omitted/downgraded object still prevent exporting the file.
  const standard=/^\d+ VISUALSTYLE records \(the reference's standard set, in another generation's spelling; recreated on open\)$/;
  const omitted=result.skipped.filter(s=>!standard.test(s)),notes=result.skipped.filter(s=>standard.test(s)).map(s=>'保存为旧版格式时，'+s.match(/^\d+/)[0]+' 个标准三维视觉样式将由 CAD 软件重新创建；图形实体不受影响。');
  if(omitted.length||result.downgraded.length)throw Error('该版本无法完整保存图纸，已停止导出。'+[...omitted,...result.downgraded].slice(0,5).join('；'));
  const checked=codec.readDwg(result.data,{checkCrc:true});if(checked.entities.length!==drawing.entities.length)throw Error('保存校验未通过，模型空间实体数量不一致');return {bytes:result.data,version:'R'+version,count:checked.entities.length,warnings:[...notes,...(checked.warnings??[])].slice(0,30)};
}
