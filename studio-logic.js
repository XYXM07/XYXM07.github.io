(function(root){
  'use strict';
  function wav(channels,sampleRate,start=0,end=channels[0]?.length){
    if(!channels.length||channels.length>8||channels.some(c=>c.length!==channels[0].length)||!Number.isInteger(sampleRate)||sampleRate<8000||sampleRate>192000)throw Error('无效的音频数据');
    start=Math.max(0,Math.floor(start));end=Math.min(channels[0].length,Math.floor(end));if(end<=start)throw Error('选区结束必须晚于开始');
    const length=end-start,bytes=length*channels.length*2;if(bytes>200*1024*1024)throw Error('选区过大，请缩短后导出');
    const output=new ArrayBuffer(44+bytes),view=new DataView(output);const text=(offset,str)=>{for(let i=0;i<str.length;i++)view.setUint8(offset+i,str.charCodeAt(i));};
    text(0,'RIFF');view.setUint32(4,36+bytes,true);text(8,'WAVE');text(12,'fmt ');view.setUint32(16,16,true);view.setUint16(20,1,true);view.setUint16(22,channels.length,true);view.setUint32(24,sampleRate,true);view.setUint32(28,sampleRate*channels.length*2,true);view.setUint16(32,channels.length*2,true);view.setUint16(34,16,true);text(36,'data');view.setUint32(40,bytes,true);
    let offset=44;for(let i=start;i<end;i++)for(const channel of channels){const v=Math.max(-1,Math.min(1,Number.isFinite(channel[i])?channel[i]:0));view.setInt16(offset,v<0?Math.round(v*32768):Math.round(v*32767),true);offset+=2;}return output;
  }
  function fillPixels(pixels,size,index,color){if(index<0||index>=pixels.length)return pixels;const target=pixels[index];if(target===color)return pixels;const stack=[index],seen=new Set();while(stack.length){const i=stack.pop();if(seen.has(i)||pixels[i]!==target)continue;seen.add(i);pixels[i]=color;if(i%size)stack.push(i-1);if(i%size<size-1)stack.push(i+1);if(i>=size)stack.push(i-size);if(i<pixels.length-size)stack.push(i+size);}return pixels;}
  function validateDiagram(input){
    if(input?.version!==1||!['flow','mind'].includes(input.mode)||!Array.isArray(input.nodes)||!Array.isArray(input.edges)||input.nodes.length>150||input.edges.length>300)throw Error('项目格式不正确或节点过多');
    const nodes=input.nodes.map(n=>{if(!Number.isInteger(n.id)||!Number.isFinite(n.x)||!Number.isFinite(n.y)||typeof n.text!=='string'||n.text.length>60||!['rect','round','diamond'].includes(n.shape)||!/^#[0-9a-f]{6}$/i.test(n.color)||(n.textColor!==undefined&&!/^#[0-9a-f]{6}$/i.test(n.textColor)))throw Error('节点数据无效');return {id:n.id,x:Math.max(0,Math.min(2200,n.x)),y:Math.max(0,Math.min(30000,n.y)),text:n.text,shape:n.shape,color:n.color,textColor:n.textColor||'#000000'};});
    const ids=new Set(nodes.map(n=>n.id));if(ids.size!==nodes.length)throw Error('节点编号重复');
    const seen=new Set(),edges=input.edges.map(e=>{const key=e.from+'-'+e.to;if(!ids.has(e.from)||!ids.has(e.to)||e.from===e.to||seen.has(key))throw Error('连线数据无效');seen.add(key);return {from:e.from,to:e.to};});
    if(input.mode==='mind'){
      const parents=new Map();edges.forEach(e=>{if(parents.has(e.to))throw Error('思维导图中的节点不能有多个父节点');parents.set(e.to,e.from);});
      for(const id of ids){const visited=new Set();let at=id;while(parents.has(at)){if(visited.has(at))throw Error('思维导图不能包含循环');visited.add(at);at=parents.get(at);}}
    }return {version:1,mode:input.mode,nodes,edges};
  }
  const lunarFormatter=new Intl.DateTimeFormat('zh-CN-u-ca-chinese',{year:'numeric',month:'long',day:'numeric',timeZone:'Asia/Shanghai'});
  const solarFestivals={'1-1':'元旦','2-14':'情人节','3-8':'妇女节','5-1':'劳动节','5-4':'青年节','6-1':'儿童节','9-10':'教师节','10-1':'国庆节','12-25':'圣诞节'};
  const lunarFestivals={'正月-1':'春节','正月-15':'元宵节','五月-5':'端午节','七月-7':'七夕','八月-15':'中秋节','九月-9':'重阳节','腊月-8':'腊八节'};
  function lunar(y,m,d){const date=new Date(Date.UTC(y,m,d,4)),parts=lunarFormatter.formatToParts(date),get=type=>parts.find(p=>p.type===type)?.value||'';return {text:lunarFormatter.format(date),month:get('month'),day:Number(get('day')),yearName:get('yearName'),year:get('relatedYear')};}
  function dayInfo(y,m,d){const date=new Date(Date.UTC(y,m,d,4));if(y<1900||y>2100||date.getUTCFullYear()!==y||date.getUTCMonth()!==m||date.getUTCDate()!==d)throw Error('日期超出支持范围');const l=lunar(y,m,d),festivals=[];if(solarFestivals[(m+1)+'-'+d])festivals.push(solarFestivals[(m+1)+'-'+d]);if(lunarFestivals[l.month+'-'+l.day])festivals.push(lunarFestivals[l.month+'-'+l.day]);const tomorrow=new Date(date.getTime()+86400000),next=lunar(tomorrow.getUTCFullYear(),tomorrow.getUTCMonth(),tomorrow.getUTCDate());if(next.month==='正月'&&next.day===1)festivals.push('除夕');return {year:y,month:m,day:d,weekday:(date.getUTCDay()+6)%7,lunar:l,festivals};}
  const api={wav,fillPixels,validateDiagram,dayInfo};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.StudioLogic=api;
})(typeof window!=='undefined'?window:globalThis);
