(() => {
  'use strict';
  const cache=new Map();let index=null,pending=null;
  const provinces={'01':'安徽','02':'浙江','03':'江西','04':'江苏','05':'吉林','06':'青海','07':'福建','08':'黑龙江','09':'河南','10':'河北','11':'湖南','12':'湖北','13':'新疆','14':'西藏','15':'甘肃','16':'广西','18':'贵州','19':'辽宁','20':'内蒙古','21':'宁夏','22':'北京','23':'上海','24':'山西','25':'山东','26':'陕西','28':'天津','29':'云南','30':'广东','31':'海南','32':'四川','33':'重庆'};
  function normalize(name){return name.trim().toLowerCase().replace(/[\s·.'’_-]/g,'').replace(/(?:市|县|縣|区|區)$/,'');}
  function abort(signal){if(signal?.aborted)throw new DOMException('搜索已取消','AbortError');}
  async function localIndex(){if(index)return index;if(!pending)pending=fetch('vendor/geo/cities-zh.json?v=bb0da0024fec').then(r=>{if(!r.ok)throw Error('城市索引无法加载');return r.json();}).then(rows=>index=rows).catch(e=>{pending=null;throw e;});return pending;}
  function local(rows,query){const needle=normalize(query.replace(/^.*(?:省|自治区)/,''));const hits=[];
    for(const row of rows){const alias=row[8].find(a=>normalize(a)===needle)||row[8].find(a=>normalize(a).startsWith(needle));if(!alias)continue;
      const exact=normalize(alias)===needle;let country;try{country=new Intl.DisplayNames(['zh-CN'],{type:'region'}).of(row[4]);}catch{country=row[4];}
      hits.push({id:row[0],name:alias,latitude:row[2],longitude:row[3],country_code:row[4],country,admin1:row[4]==='CN'?provinces[row[5]]||'':row[6],population:row[7],exact});
    }
    return hits.sort((a,b)=>Number(b.exact)-Number(a.exact)||Number(b.country_code==='CN')-Number(a.country_code==='CN')||b.population-a.population).slice(0,8);
  }
  async function search(query,{signal}={}){query=query.trim();if(query.length<2||query.length>60)throw Error('请输入 2–60 个字符的城市名称');abort(signal);const key=normalize(query);if(cache.has(key))return cache.get(key);
    let items=[];if(/[\u4e00-\u9fff]/.test(query)){try{items=local(await localIndex(),query);}catch(e){abort(signal);}abort(signal);}
    if(!items.length){const url=new URL('https://geocoding-api.open-meteo.com/v1/search');url.search=new URLSearchParams({name:query.replace(/市$/,''),count:8,language:'zh',format:'json'}).toString();const res=await fetch(url,{signal});if(!res.ok)throw Error('城市搜索服务暂时不可用');const data=await res.json();items=(data.results||[]).filter(c=>Number.isFinite(c.latitude)&&Number.isFinite(c.longitude)&&Math.abs(c.latitude)<=85&&Math.abs(c.longitude)<=180);}
    abort(signal);cache.set(key,items);if(cache.size>50)cache.delete(cache.keys().next().value);return items;
  }
  window.CitySearch={search,normalize,local};
})();
