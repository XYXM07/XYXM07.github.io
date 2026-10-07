(() => {
  'use strict';
  const $ = s => document.querySelector(s), reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let map, tiles, marker, active = false, request, serial = 0, locating = false, locateSerial = 0;
  const cache = new Map();
  const cities = {beijing:[39.9042,116.4074,'北京'],shanghai:[31.2304,121.4737,'上海'],hangzhou:[30.2741,120.1551,'杭州'],tokyo:[35.6762,139.6503,'东京'],london:[51.5074,-.1278,'伦敦']};
  function message(s) { $('#map-status').textContent = s; }
  function valid(lat,lng) { return Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat)<=85 && Math.abs(lng)<=180; }
  function point(lat,lng,label='选中位置',zoom=12) {
    if(!valid(lat,lng)||!map) return;
    map.setView([lat,lng],zoom,{animate:!reduced.matches});
    if(marker) marker.remove();
    const text=document.createElement('span');text.textContent=`${label} · ${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    marker=L.circleMarker([lat,lng],{radius:8,color:'#254a58',weight:2,fillColor:'#eaf0df',fillOpacity:1}).addTo(map).bindPopup(text).openPopup();
    $('#map-lat').value=lat.toFixed(6);$('#map-lng').value=lng.toFixed(6);message(`已选中 ${label}，可复制坐标。`);
  }
  function init() {
    if(map) { map.invalidateSize({pan:false}); if(!map.hasLayer(tiles))tiles.addTo(map); return; }
    if(!window.L) { message('地图库未能加载，请刷新页面后重试。');return; }
    map=L.map('map-canvas',{scrollWheelZoom:false,zoomControl:false,zoomAnimation:!reduced.matches,fadeAnimation:!reduced.matches}).setView([39.9042,116.4074],11);
    L.control.zoom({zoomInTitle:'放大',zoomOutTitle:'缩小'}).addTo(map);
    tiles=L.tileLayer(window.SITE_CONFIG?.mapTiles || 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,minZoom:2,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors'}).addTo(map);
    let failures=0;
    tiles.on('loading',()=>{failures=0;});
    tiles.on('tileerror',()=>{if(++failures>=2)message('部分地图图块加载失败，请检查网络后切换城市重试。');});
    tiles.on('load',()=>{if(!failures)message('地图已加载。拖动平移、双击放大，点击地图选点。');});
    map.on('click',e=>point(e.latlng.lat,((e.latlng.lng+180)%360+360)%360-180,'选中位置',map.getZoom()));
    L.control.scale({imperial:false}).addTo(map);
    point(39.9042,116.4074,'北京',11);
  }
  function cityResults(items) {
    $('#map-results').replaceChildren();
    items.forEach(item=>{const b=document.createElement('button');b.type='button';b.textContent=[item.name,item.admin1,item.country].filter(Boolean).join(' · ');b.addEventListener('click',()=>point(Number(item.latitude),Number(item.longitude),item.name));$('#map-results').append(b);});
  }
  $('#map-search').addEventListener('submit',async e=>{
    e.preventDefault();const name=$('#map-city').value.trim();if(name.length<2){message('请输入至少两个字符的城市名称。');return;}
    request?.abort();const run=++serial;request=new AbortController();const controller=request;
    message('正在搜索城市……');$('#map-results').replaceChildren();
    const timeout=setTimeout(()=>controller.abort(),15000);
    try{
      let items=cache.get(name.toLowerCase());
      if(!items){const url=new URL('https://geocoding-api.open-meteo.com/v1/search');url.search=new URLSearchParams({name,count:6,language:'zh',format:'json'});const res=await fetch(url,{signal:controller.signal});if(!res.ok)throw new Error();const data=await res.json();items=(data.results||[]).filter(v=>valid(Number(v.latitude),Number(v.longitude)));cache.set(name.toLowerCase(),items);if(cache.size>20)cache.delete(cache.keys().next().value);}
      if(run!==serial||!active)return;cityResults(items);message(items.length?'请选择要查看的城市。':'没有找到该城市，可以输入英文名称或直接跳转坐标。');
    }catch{if(run===serial&&active)message('城市搜索暂时不可用，请检查网络后重试，或使用城市快捷入口。');}
    finally{clearTimeout(timeout);if(run===serial)request=null;}
  });
  document.querySelectorAll('[data-map-city]').forEach(b=>b.addEventListener('click',()=>{const [lat,lng,name]=cities[b.dataset.mapCity];point(lat,lng,name);$('#map-results').replaceChildren();}));
  $('#map-coordinates').addEventListener('submit',e=>{e.preventDefault();const lat=Number($('#map-lat').value),lng=Number($('#map-lng').value);if(!$('#map-lat').value.trim()||!$('#map-lng').value.trim()||!valid(lat,lng)){message('请输入有效纬度（-85 至 85）与经度（-180 至 180）。');return;}point(lat,lng,'指定坐标');});
  $('#map-copy').addEventListener('click',async()=>{const value=`${$('#map-lat').value}, ${$('#map-lng').value}`;try{await navigator.clipboard.writeText(value);message('经纬度已复制。');}catch{message(`请手动复制：${value}`);}});
  $('#map-locate').addEventListener('click',()=>{
    if(locating)return;if(!navigator.geolocation){message('当前浏览器不支持定位。');return;}
    locating=true;const run=++locateSerial;$('#map-locate').disabled=true;message('请在浏览器中允许定位……');
    navigator.geolocation.getCurrentPosition(p=>{if(run!==locateSerial)return;locating=false;$('#map-locate').disabled=false;if(active){point(p.coords.latitude,p.coords.longitude,'我的位置',14);message(`已定位，估计误差 ${Math.round(p.coords.accuracy)} 米。`);}},err=>{if(run!==locateSerial)return;locating=false;$('#map-locate').disabled=false;if(active)message(err.code===1?'定位权限未获允许，可以搜索城市或输入坐标。':'未能取得位置，请稍后重试。');},{enableHighAccuracy:false,timeout:12000,maximumAge:60000});
  });
  function route() {
    active=location.hash==='#tools/map'&&!document.hidden;
    if(active)requestAnimationFrame(()=>{if(active)init();});
    else{serial++;request?.abort();request=null;locateSerial++;locating=false;$('#map-locate').disabled=false;if(map&&tiles&&map.hasLayer(tiles))map.removeLayer(tiles);}
  }
  document.addEventListener('site:pagechange',route);document.addEventListener('visibilitychange',route);route();
})();
