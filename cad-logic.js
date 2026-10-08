(function(root,factory){const value=factory();if(typeof module==='object'&&module.exports)module.exports=value;else root.CadLogic=value;})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const num=x=>{x=Number(x);if(!Number.isFinite(x)||Math.abs(x)>1e7)throw Error('坐标须为有限数字，绝对值不超过 1000 万');return x;};
  function validate(objects){
    if(!Array.isArray(objects)||objects.length>2000)throw Error('图形最多包含 2000 个对象');
    return objects.map(o=>{const style={color:/^#[0-9a-f]{6}$/i.test(o.color)?o.color:'#202a2e',width:Math.max(.1,Math.min(10,Number(o.width)||1)),...(typeof o.cadId==='string'&&/^\d{1,7}$/.test(o.cadId)?{cadId:o.cadId}:{})};
      if(['line','polyline'].includes(o.type)){if(!Array.isArray(o.points)||o.points.length<2||o.points.length>10000)throw Error('线条至少需要两个点');if(o.type==='line'&&o.points.length!==2)throw Error('线段必须有且只有两个端点');return {...style,type:o.type,closed:!!o.closed,points:o.points.map(p=>({x:num(p.x),y:num(p.y)}))};}
      if(['circle','arc'].includes(o.type)){const r=num(o.r);if(r<=0)throw Error('半径须大于零');return {...style,type:o.type,cx:num(o.cx),cy:num(o.cy),r,...(o.type==='arc'?{start:num(o.start),end:num(o.end)}:{})};}
      throw Error('无法识别的图形类型');});
  }
  function dxfWrite(objects,unit=4){
    objects=validate(objects);const lines=[];const pair=(c,v)=>lines.push(String(c),String(v));
    pair(0,'SECTION');pair(2,'HEADER');pair(9,'$INSUNITS');pair(70,unit);pair(0,'ENDSEC');pair(0,'SECTION');pair(2,'ENTITIES');
    for(const o of objects){
      if(o.type==='circle'||o.type==='arc'){pair(0,o.type.toUpperCase());pair(8,'0');pair(10,o.cx);pair(20,o.cy);pair(30,0);pair(40,o.r);if(o.type==='arc'){pair(50,o.start);pair(51,o.end);}}
      else if(o.type==='line'){pair(0,'LINE');pair(8,'0');pair(10,o.points[0].x);pair(20,o.points[0].y);pair(30,0);pair(11,o.points[1].x);pair(21,o.points[1].y);pair(31,0);}
      else {pair(0,'POLYLINE');pair(8,'0');pair(66,1);pair(70,o.closed?1:0);for(const p of o.points){pair(0,'VERTEX');pair(8,'0');pair(10,p.x);pair(20,p.y);pair(30,0);}pair(0,'SEQEND');}
    }
    pair(0,'ENDSEC');pair(0,'EOF');return lines.join('\r\n')+'\r\n';
  }
  function dxfRead(text){
    if(text.length>10000000)throw Error('DXF 文件过大');if(text.startsWith('AutoCAD Binary DXF'))throw Error('DXF 导入仅支持 ASCII 文本；DWG 请直接选择 .dwg 文件');
    const lines=text.replace(/^\uFEFF/,'').split(/\r?\n/),pairs=[];for(let i=0;i+1<lines.length;i+=2){if(!/^\s*\d+\s*$/.test(lines[i]))throw Error('DXF 分组代码无效');pairs.push([Number(lines[i]),lines[i+1].trim()]);}
    let inEntities=false,unit=4,ignored=0,poly=null;const objects=[];
    for(let i=0;i<pairs.length;i++){
      const [code,value]=pairs[i];if(code===9&&value==='$INSUNITS'&&pairs[i+1]?.[0]===70)unit=Number(pairs[i+1][1]);
      if(code===2&&value==='ENTITIES'){inEntities=true;continue;}if(!inEntities)continue;if(code===0&&value==='ENDSEC'){inEntities=false;continue;}if(code!==0)continue;
      let j=i+1;while(j<pairs.length&&pairs[j][0]!==0)j++;const fields=pairs.slice(i+1,j),get=(c,d=0)=>num(fields.find(p=>p[0]===c)?.[1]??d);
      if(['LINE','CIRCLE','ARC','LWPOLYLINE','POLYLINE','VERTEX'].includes(value)){
        if([30,31,38,39,210,220].some(c=>get(c)!==0)||get(230,1)!==1||value==='POLYLINE'&&(get(70)&(8|16|64)))throw Error('此 DXF 包含三维坐标、厚度或倾斜平面，请先转换为 XY 平面的二维图形');
      }
      if(value==='LINE')objects.push({type:'line',points:[{x:get(10),y:get(20)},{x:get(11),y:get(21)}]});
      else if(value==='CIRCLE'||value==='ARC')objects.push({type:value.toLowerCase(),cx:get(10),cy:get(20),r:get(40),...(value==='ARC'?{start:get(50),end:get(51)}:{})});
      else if(value==='LWPOLYLINE'){const points=[];for(let k=0;k<fields.length;k++)if(fields[k][0]===10){const p={x:num(fields[k][1]),y:0};let l=k+1;while(l<fields.length&&fields[l][0]!==10){if(fields[l][0]===20)p.y=num(fields[l][1]);if(fields[l][0]===42&&num(fields[l][1])!==0)throw Error('此 DXF 含多段线弧度，请先将弧段分解为独立 ARC 再导入');l++;}points.push(p);}objects.push({type:'polyline',points,closed:!!(get(70)&1)});}
      else if(value==='POLYLINE'){if(poly)throw Error('DXF 多段线未闭合');poly={type:'polyline',points:[],closed:!!(get(70)&1)};}
      else if(value==='VERTEX'&&poly){if(get(42)!==0)throw Error('此 DXF 含多段线弧度，请先分解弧段');poly.points.push({x:get(10),y:get(20)});}
      else if(value==='SEQEND'&&poly){objects.push(poly);poly=null;}
      else ignored++;
      i=j-1;
    }
    if(!objects.length)throw Error('未找到可编辑的二维线段、圆、圆弧或多段线');return {objects:validate(objects),unit,ignored};
  }
  function bounds(objects){let x1=Infinity,y1=Infinity,x2=-Infinity,y2=-Infinity;for(const o of objects){const ps=o.points||[{x:o.cx-o.r,y:o.cy-o.r},{x:o.cx+o.r,y:o.cy+o.r}];for(const p of ps){x1=Math.min(x1,p.x);x2=Math.max(x2,p.x);y1=Math.min(y1,p.y);y2=Math.max(y2,p.y);}}return objects.length?{x1,y1,x2,y2}:{x1:-100,y1:-100,x2:100,y2:100};}
  return {validate,dxfRead,dxfWrite,bounds};
});
