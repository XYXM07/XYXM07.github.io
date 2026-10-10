(function(root){
  'use strict';
  const types={bar:'柱状图',horizontal:'条形图',line:'折线图',area:'面积图',stacked:'堆叠柱状图',pie:'饼图',donut:'环形图',scatter:'散点图',radar:'雷达图'};
  const palettes={ocean:['#8cc9c0','#e6c38b','#96b8df','#d8a39b','#b9c98e','#d2c8ba'],sunset:['#e7a589','#edcb93','#a9cfbd','#97bed4','#cfaaa3','#d2d69a'],forest:['#8fc5aa','#cad69d','#d7bd88','#8db6b5','#c5b4a0','#a6c9ca']};
  const color=value=>{if(typeof value!=='string'||!/^#[0-9a-f]{6}$/i.test(value))throw Error('颜色请使用 #RRGGBB 格式');return value.toLowerCase();};
  function contrastInk(background){const luminance=value=>{const rgb=color(value).slice(1).match(/../g).map(v=>{const n=parseInt(v,16)/255;return n<=.04045?n/12.92:Math.pow((n+.055)/1.055,2.4);});return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722;},bg=luminance(background),ratio=value=>(Math.max(bg,value)+.05)/(Math.min(bg,value)+.05);return ratio(luminance('#192e35'))>=ratio(luminance('#e5eee6'))?'#192e35':'#e5eee6';}
  function blend(a,b,amount){const aa=color(a).slice(1).match(/../g).map(v=>parseInt(v,16)),bb=color(b).slice(1).match(/../g).map(v=>parseInt(v,16));return '#'+aa.map((v,i)=>Math.round(v*(1-amount)+bb[i]*amount).toString(16).padStart(2,'0')).join('');}
  function example(type='bar'){if(!types[type])throw Error('请选择有效图表类型');return (type==='scatter'?'X':'类别')+',系列 A,系列 B\n1,120,35\n2,180,65\n3,155,48\n4,260,92\n5,320,125';}
  function csv(text){if(text.length>200000)throw Error('数据请控制在 20 万字符以内');const rows=[];let row=[],cell='',quote=false;for(let i=0;i<text.length;i++){const c=text[i];if(c==='"'){if(quote&&text[i+1]==='"'){cell+='"';i++;}else if(quote||!cell)quote=!quote;else throw Error('CSV 引号位置不正确');}else if(c===','&&!quote){row.push(cell.trim());cell='';}else if((c==='\n'||c==='\r')&&!quote){if(c==='\r'&&text[i+1]==='\n')i++;row.push(cell.trim());if(row.some(Boolean))rows.push(row);row=[];cell='';}else cell+=c;}if(quote)throw Error('CSV 引号未闭合');row.push(cell.trim());if(row.some(Boolean))rows.push(row);return rows;}
  function parse(text){const rows=csv(text);if(rows.length<2)throw Error('需要一行表头和至少一行数据');const header=rows.shift();if(header.length<2||header.length>7)throw Error('第一列为类别，其后支持 1–6 个数据系列');if(rows.length>50)throw Error('最多支持 50 行数据');if(header.some(s=>!s||s.length>80))throw Error('表头不能为空或超过 80 字');const values=rows.map((row,i)=>{if(row.length!==header.length||!row[0]||row[0].length>80)throw Error('第 '+(i+2)+' 行列数或类别名称不正确');return row.slice(1).map(v=>{if(!v.trim()||!Number.isFinite(Number(v))||Math.abs(Number(v))>1e12)throw Error('第 '+(i+2)+' 行含有无效数值');return Number(v);});});return {label:header[0],series:header.slice(1),labels:rows.map(r=>r[0]),values};}
  const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
  const num=n=>Math.round(n*100)/100,short=s=>s.length>12?s.slice(0,11)+'…':s;
  function svg(data,{type='bar',title='我的图表',palette='ocean',dark=true,legend=true,colors:customColors,background,foreground}={}){
    if(!types[type]||(!Array.isArray(palettes[palette])&&palette!=='custom'))throw Error('请选择有效图表类型和配色');
    const selected=customColors??palettes[palette];if(!Array.isArray(selected)||!selected.length||selected.length>18)throw Error('请设置 1–18 个配色');
    const colors=selected.map(color),bg=background===undefined?(dark?'#17333d':'#ffffff'):color(background),ink=foreground===undefined?contrastInk(bg):color(foreground),muted=blend(bg,ink,.7),grid=blend(bg,ink,.2),parts=[];
    const text=(x,y,s,size=14,anchor='middle',fill=muted)=>parts.push(`<text x="${num(x)}" y="${num(y)}" font-size="${size}" font-weight="400" stroke="none" text-anchor="${anchor}" fill="${fill}">${escape(s)}</text>`);
    const line=(x1,y1,x2,y2,stroke=grid)=>parts.push(`<path d="M${num(x1)} ${num(y1)}L${num(x2)} ${num(y2)}" fill="none" stroke="${stroke}"/>`);
    parts.push(`<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="640" viewBox="0 0 1000 640" role="img" aria-labelledby="chart-title" style="font-family:system-ui,'Microsoft YaHei',sans-serif;font-weight:400;stroke:none;stroke-width:1;fill:none"><title id="chart-title">${escape(title||types[type])}</title><rect width="1000" height="640" rx="20" fill="${bg}" stroke="none"/>`);text(500,48,title||types[type],26,'middle',ink);
    const left=90,right=930,top=105,bottom=510,w=right-left,h=bottom-top,n=data.labels.length,m=data.series.length,all=data.values.flat();
    let min=Math.min(0,...all),max=Math.max(0,...all);if(type==='stacked'){min=Math.min(0,...data.values.map(v=>v.filter(x=>x<0).reduce((s,x)=>s+x,0)));max=Math.max(0,...data.values.map(v=>v.filter(x=>x>0).reduce((s,x)=>s+x,0)));}if(max===min)max=min+1;
    const y=v=>bottom-(v-min)/(max-min)*h,x=i=>left+(i+.5)*w/n;
    const rect=(xx,yy,ww,hh,color)=>parts.push(`<rect x="${num(xx)}" y="${num(yy)}" width="${num(Math.max(0,ww))}" height="${num(Math.max(0,hh))}" fill="${color}" rx="2"/>`);
    if(type==='pie'||type==='donut'){
      if(data.values.some(row=>row[0]<0))throw Error('饼图和环形图不能包含负数');const sum=data.values.reduce((s,row)=>s+row[0],0);if(!sum)throw Error('饼图和环形图需要至少一个正数');let a=-Math.PI/2;
      data.values.forEach((row,i)=>{const share=row[0]/sum;if(!share)return;const b=a+share*2*Math.PI,r=178,cx=360,cy=310;if(share===1)parts.push(`<circle cx="${cx}" cy="${cy}" r="${r}" fill="${colors[i%colors.length]}"/>`);else parts.push(`<path d="M${cx} ${cy}L${num(cx+r*Math.cos(a))} ${num(cy+r*Math.sin(a))}A${r} ${r} 0 ${share>.5?1:0} 1 ${num(cx+r*Math.cos(b))} ${num(cy+r*Math.sin(b))}Z" fill="${colors[i%colors.length]}" stroke="${bg}" stroke-width="2"/>`);a=b;});
      if(type==='donut'){parts.push(`<circle cx="360" cy="310" r="110" fill="${bg}"/>`);text(360,307,'总计',16);text(360,341,num(sum),29,'middle',ink);}text(735,103,data.series[0],18,'middle',ink);
      if(n>18)throw Error('饼图和环形图最多支持 18 个类别');data.labels.forEach((s,i)=>{rect(595,126+i*23,12,12,colors[i%colors.length]);text(618,137+i*23,short(s)+' · '+num(data.values[i][0])+' · '+num(data.values[i][0]/sum*100)+'%',14,'start');});
    }else if(type==='radar'){
      if(n<3||n>12||min<0)throw Error('雷达图需要 3–12 个非负数据类别');const cx=500,cy=315,r=170,point=(i,ratio)=>[cx+Math.sin(i*2*Math.PI/n)*r*ratio,cy-Math.cos(i*2*Math.PI/n)*r*ratio];
      for(let q=1;q<=4;q++){const pts=data.labels.map((_,i)=>point(i,q/4).map(num).join(',')).join(' ');parts.push(`<polygon points="${pts}" stroke="${grid}" fill="none"/>`);}data.labels.forEach((s,i)=>{const p=point(i,1),t=point(i,1.18);line(cx,cy,...p);text(...t,short(s),14);});
      data.series.forEach((_,j)=>{const pts=data.labels.map((s,i)=>point(i,data.values[i][j]/max).map(num).join(',')).join(' ');parts.push(`<polygon points="${pts}" fill="${colors[j]}" fill-opacity=".16" stroke="${colors[j]}" stroke-width="2.5"/>`);});text(85,105,'轴上限 '+num(max),13,'start');
    }else if(type==='horizontal'){
      const xx=v=>left+(v-min)/(max-min)*w;for(let q=0;q<=5;q++){const value=min+(max-min)*q/5;line(xx(value),top,xx(value),bottom);text(xx(value),bottom+25,num(value),12);}data.labels.forEach((s,i)=>{const yy=top+(i+.5)*h/n;text(left-8,yy+4,short(s),12,'end');data.series.forEach((_,j)=>{const value=data.values[i][j],height=h/n*.72/m;rect(Math.min(xx(0),xx(value)),yy-h/n*.36+j*height,Math.abs(xx(value)-xx(0)),height*.86,colors[j]);});});
    }else{
      for(let q=0;q<=5;q++){const value=min+(max-min)*q/5;line(left,y(value),right,y(value));text(left-12,y(value)+4,num(value),12,'end');}line(left,y(0),right,y(0),muted);
      if(type==='scatter'){
        const xs=data.labels.map(Number);if(xs.some((v,i)=>!data.labels[i].trim()||!Number.isFinite(v)||Math.abs(v)>1e12))throw Error('散点图的第一列必须为有效数字 X 坐标');let lo=Math.min(...xs),hi=Math.max(...xs);if(lo===hi){const padding=Math.max(1,Math.abs(lo)*.05);lo-=padding;hi+=padding;}const xx=v=>left+(v-lo)/(hi-lo)*w;
        for(let q=0;q<=5;q++){const v=lo+(hi-lo)*q/5;line(xx(v),top,xx(v),bottom);text(xx(v),bottom+25,num(v),12);}data.series.forEach((_,j)=>data.values.forEach((row,i)=>parts.push(`<circle cx="${num(xx(xs[i]))}" cy="${num(y(row[j]))}" r="5" fill="${colors[j]}" fill-opacity=".85"/>`)));
      }else{
        data.labels.forEach((s,i)=>{if(n<=16||i%Math.ceil(n/16)===0)text(x(i),bottom+26,short(s),12);});
        if(type==='bar')data.values.forEach((row,i)=>row.forEach((v,j)=>{const bw=w/n*.72/m;rect(x(i)-w/n*.36+j*bw,Math.min(y(v),y(0)),bw*.9,Math.abs(y(v)-y(0)),colors[j]);}));
        else if(type==='stacked')data.values.forEach((row,i)=>{let positive=0,negative=0;row.forEach((v,j)=>{const start=v>=0?positive:negative;if(v>=0)positive+=v;else negative+=v;rect(x(i)-w/n*.32,Math.min(y(start),y(start+v)),w/n*.64,Math.abs(y(start+v)-y(start)),colors[j]);});});
        else data.series.forEach((_,j)=>{const path=data.values.map((row,i)=>(i?'L':'M')+num(x(i))+' '+num(y(row[j]))).join('');if(type==='area')parts.push(`<path d="${path}L${num(x(n-1))} ${num(y(0))}L${num(x(0))} ${num(y(0))}Z" fill="${colors[j]}" fill-opacity=".18"/>`);parts.push(`<path d="${path}" fill="none" stroke="${colors[j]}" stroke-width="3"/>`);data.values.forEach((row,i)=>parts.push(`<circle cx="${num(x(i))}" cy="${num(y(row[j]))}" r="3.5" fill="${colors[j]}"/>`));});
      }
      text(510,558,data.label,14);text(88,87,'数值',13);
    }
    if(legend&&!['pie','donut'].includes(type)){let xx=65;data.series.forEach((name,j)=>{rect(xx,591,12,12,colors[j]);text(xx+20,602,short(name),13,'start');xx+=150;});}parts.push('</svg>');return parts.join('');
  }
  const api={types,palettes,parse,svg,color,contrastInk,example};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.ChartLogic=api;
})(typeof window!=='undefined'?window:globalThis);
