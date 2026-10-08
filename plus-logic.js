(function(root,factory){const value=factory();if(typeof module==='object'&&module.exports)module.exports=value;else root.PlusLogic=value;})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  function radix(text,from,to,precision=20){
    from=Number(from);to=Number(to);if(!Number.isInteger(from)||!Number.isInteger(to)||from<2||from>36||to<2||to>36)throw Error('进制范围为 2–36');
    text=text.trim().toUpperCase();if(!text||text.length>4096)throw Error('请输入 4096 字符以内的数字');let sign='';if(/^[+-]/.test(text)){sign=text[0]==='-'?'-':'';text=text.slice(1);}
    const prefix={2:'0B',8:'0O',16:'0X'}[from];if(prefix&&text.startsWith(prefix))text=text.slice(2);
    if(!/^[0-9A-Z]+(?:\.[0-9A-Z]+)?$/.test(text))throw Error('请输入有效数字；小数点使用 .');
    const digits='0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ',parts=text.split('.');let numerator=0n,denominator=1n;
    for(const c of parts.join('')){const d=digits.indexOf(c);if(d>=from)throw Error(c+' 不是 '+from+' 进制的有效数字');numerator=numerator*BigInt(from)+BigInt(d);}
    if(parts[1])denominator=BigInt(from)**BigInt(parts[1].length);
    let out=(numerator/denominator).toString(to).toUpperCase(),remainder=numerator%denominator,fraction='';
    for(let i=0;i<precision&&remainder;i++){remainder*=BigInt(to);fraction+=digits[Number(remainder/denominator)];remainder%=denominator;}
    return {value:(numerator?sign:'')+out+(fraction?'.'+fraction:''),approximate:remainder!==0n};
  }
  const alphabet='ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const codes='.- -... -.-. -.. . ..-. --. .... .. .--- -.- .-.. -- -. --- .--. --.- .-. ... - ..- ...- .-- -..- -.-- --.. ----- .---- ..--- ...-- ....- ..... -.... --... ---.. ----.'.split(' ');
  const morseTable=Object.fromEntries([...alphabet].map((c,i)=>[c,codes[i]]));
  Object.assign(morseTable,{'.':'.-.-.-',',':'--..--','?':'..--..',"'":'.----.','!':'-.-.--','/':'-..-.','(':'-.--.',')':'-.--.-','&':'.-...',':':'---...',';':'-.-.-.','=':'-...-','+':'.-.-.','-':'-....-','_':'..--.-','"':'.-..-.','@':'.--.-.','$':'...-..-'});
  const reverse=Object.fromEntries(Object.entries(morseTable).map(([k,v])=>[v,k]));
  function morse(text,decode=false){
    if(!text.trim()||text.length>100000)throw Error('请输入 10 万字符以内的内容');
    if(decode)return text.trim().split(/\r?\n/).map(line=>line.trim().replace(/[·•]/g,'.').replace(/[–—]/g,'-').split(/\s*\/\s*/).map(word=>word.split(/\s+/).filter(Boolean).map(code=>{if(!reverse[code])throw Error('无法识别的摩斯符号：'+code);return reverse[code];}).join('')).join(' ')).join('\n');
    return text.toUpperCase().split(/\r?\n/).map(line=>line.trim().split(/\s+/).map(word=>[...word].map(c=>{if(!morseTable[c])throw Error('国际摩斯不支持“'+c+'”，中文请先转为拼音');return morseTable[c];}).join(' ')).join(' / ')).join('\n');
  }
  function csvParse(text,separator=','){
    const rows=[];let row=[],value='',quoted=false,afterQuote=false;
    for(let i=0;i<text.length;i++){const c=text[i];if(quoted){if(c==='"'){if(text[i+1]==='"'){value+='"';i++;}else{quoted=false;afterQuote=true;}}else value+=c;}else if(c==='"'){if(value||afterQuote)throw Error('引号必须出现在字段开头');quoted=true;}else if(c===separator){row.push(value);value='';afterQuote=false;}else if(c==='\n'||c==='\r'){if(c==='\r'&&text[i+1]==='\n')i++;row.push(value);rows.push(row);row=[];value='';afterQuote=false;}else{if(afterQuote&&c!==' '&&c!=='\t')throw Error('闭合引号后存在多余字符');if(!afterQuote)value+=c;}}
    if(quoted)throw Error('CSV 引号未闭合');if(value||row.length||afterQuote){row.push(value);rows.push(row);}return rows;
  }
  function csvWrite(data,separator=','){
    if(!Array.isArray(data))throw Error('表格导出需要 JSON 数组');let rows;
    if(data.every(Array.isArray))rows=data;
    else if(data.every(x=>x&&typeof x==='object'&&!Array.isArray(x))){const keys=[...new Set(data.flatMap(Object.keys))];rows=[keys,...data.map(x=>keys.map(k=>x[k]??''))];}
    else rows=data.map(x=>[x]);
    return rows.map(row=>row.map(value=>{let s=typeof value==='object'&&value!==null?JSON.stringify(value):String(value??'');return /["\r\n]/.test(s)||s.includes(separator)?'"'+s.replace(/"/g,'""')+'"':s;}).join(separator)).join('\r\n');
  }
  function pageRange(text,count){
    if(!text.trim())return Array.from({length:count},(_,i)=>i);if(text.length>10000)throw Error('页码选择过长');const result=[];
    for(const token of text.split(/[,，]/)){const m=token.trim().match(/^(\d+)(?:\s*-\s*(\d+))?$/);if(!m)throw Error('页码示例：1-3,5,8-6');const a=Number(m[1]),b=Number(m[2]||m[1]);if(a<1||b<1||a>count||b>count)throw Error('页码超出范围：1–'+count);const step=a<=b?1:-1;for(let n=a;;n+=step){result.push(n-1);if(result.length>2000)throw Error('最多输出 2000 页');if(n===b)break;}}
    return result;
  }
  function soundLevel(samples){let sum=0;for(const x of samples)sum+=x*x;const rms=Math.sqrt(sum/Math.max(1,samples.length));return rms?Math.max(-100,20*Math.log10(rms)):-100;}
  function calibration(dbfs,reference){if(!Number.isFinite(dbfs)||!Number.isFinite(reference)||reference<20||reference>140)throw Error('参考值须为 20–140 dB');return reference-dbfs;}
  function bmp(image){const {width,height,data}=image;if(!Number.isInteger(width)||!Number.isInteger(height)||width<1||height<1||width*height>40000000||data.length!==width*height*4)throw Error('位图尺寸无效');const stride=Math.ceil(width*3/4)*4,bytes=new Uint8Array(54+stride*height),view=new DataView(bytes.buffer);view.setUint16(0,0x4d42,true);view.setUint32(2,bytes.length,true);view.setUint32(10,54,true);view.setUint32(14,40,true);view.setInt32(18,width,true);view.setInt32(22,height,true);view.setUint16(26,1,true);view.setUint16(28,24,true);view.setUint32(34,stride*height,true);view.setInt32(38,2835,true);view.setInt32(42,2835,true);for(let y=0;y<height;y++)for(let x=0;x<width;x++){const source=(y*width+x)*4,target=54+(height-1-y)*stride+x*3,alpha=data[source+3]/255;for(let c=0;c<3;c++)bytes[target+c]=Math.round(data[source+2-c]*alpha+255*(1-alpha));}return bytes;}
  return {radix,morse,csvParse,csvWrite,pageRange,soundLevel,calibration,bmp};
});
