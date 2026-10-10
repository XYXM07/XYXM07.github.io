(function(r,f){if(typeof module==='object'&&module.exports)module.exports=f();else r.GardenLogic=f();})(typeof globalThis!=='undefined'?globalThis:this,()=>{
  const icons=['leaf','flower','moon','star','drop','sun','gem','cloud','shell','sprout','fish','bell'];
  const levels=[{name:'初见草地',hint:'明牌练习'},{name:'四塔庭院',hint:'四塔叠牌 · 辅助牌 · 双盲牌堆'},{name:'深层四塔',hint:'交错深塔 · 双盲牌堆'},{name:'双三角阶梯',hint:'双三角主区 · 明牌辅助'},{name:'十字回廊',hint:'交错十字 · 四臂平消'},{name:'长阶与双塔',hint:'T 形主区 · 两座三角塔'},{name:'菱形双岛',hint:'双菱形阶梯 · 同步揭牌'},{name:'环形花园',hint:'环形主区 · 留意内圈'},{name:'斜阶长廊',hint:'三段斜阶 · 深浅交错'},{name:'花瓣高塔',hint:'四瓣花塔 · 中心主区'}];
  function free(s,t){return !t.removed&&!s.tiles.some(o=>!o.removed&&(t.pile?o.pile===t.pile&&o.z>t.z:!o.pile&&o.z>t.z&&Math.abs(o.x-t.x)<.98&&Math.abs(o.y-t.y)<.98));}
  function fresh(level=1,random=Math.random){level=Math.max(1,Math.min(levels.length,Math.floor(Number(level)||1)));const tiles=[];
    const add=(x,y,z,region='main',pile=null)=>{if(region==='main'&&tiles.some(t=>t.region==='main'&&t.z===z&&Math.abs(t.x-x)<.95&&Math.abs(t.y-y)<.95))return;tiles.push({id:tiles.length,x,y,z,region,pile,kind:0,removed:false});};
    if(level===1){
      for(let y=0;y<3;y++)for(let x=0;x<4;x++)add(2.5+x,2+y,0);
      for(let x=0;x<6;x++)add(1.5+x,6,0,'reserve');
    }else if(level<=3){
      // Four interleaved stair towers, light reserve rows, and independent blind piles.
      const layers=level===2?4:6;
      for(const [ox,oy]of [[1.4,1.1],[4.6,1.1],[1.4,4.3],[4.6,4.3]])for(let z=0;z<layers;z++){
        const size=z%2?2:3,shift=z%2?.5:0;
        for(let y=0;y<size;y++)for(let x=0;x<size;x++)add(ox+x+shift,oy+y+shift,z);
      }
      const count=level===2?8:6;
      for(const y of [0,8.1])for(let x=0;x<count;x++)add((9-count)/2+x,y,0,'reserve');
      for(const [pile,x]of [['left',0],['right',8]])for(let z=0;z<(level===2?12:18);z++)add(x,3.7,z,'blind',pile);
    }else{
      const layers=level===10?9:6+Math.floor((level-4)/2);
      const triangle=(ox,oy,z,flip=false)=>{const size=3-z%3,shift=(3-size)*.5;for(let y=0;y<size;y++)for(let x=0;x<size-y;x++)add(ox+x+shift,oy+(flip?size-1-y:y)+shift,z);};
      for(let z=0;z<layers;z++){
        const shift=z%2*.35;
        if(level===4){triangle(1.5,1.5,z);triangle(4.6,4.5,z,true);}
        if(level===5){for(let y=0;y<6;y++)for(let x=0;x<6;x++)if(x===2||x===3||y===2||y===3)add(1.4+x+shift,1.3+y+shift,z);}
        if(level===6){for(let y=0;y<5;y++)for(let x=0;x<5;x++)if(y<2||x===2)add(1.8+x+shift,1.3+y+shift,z);triangle(1.4,4.7,z,true);triangle(4.7,4.7,z,true);}
        if(level===7){for(const cx of [2.4,5.6])for(let y=-2;y<=2;y++)for(let x=-1;x<=1;x++)if(Math.abs(x)+Math.abs(y)<=2-z%2)add(cx+x+shift,4+y+shift,z);}
        if(level===8){const size=z%2?5:6;for(let y=0;y<size;y++)for(let x=0;x<size;x++)if(x===0||y===0||x===size-1||y===size-1)add(1.4+x+z%2*.5,1.3+y+z%2*.5,z);}
        if(level===9){for(const [x,y]of [[1.4,1.4],[3.4,3.4],[5.4,5.4]])for(let dy=0;dy<2;dy++)for(let dx=0;dx<2;dx++)add(x+dx+shift,y+dy+shift,z);}
        if(level===10){for(const [x,y]of [[1.4,1.4],[5.1,1.4],[1.4,5.1],[5.1,5.1],[3.25,3.25]])for(let dy=0;dy<2;dy++)for(let dx=0;dx<2;dx++)add(x+dx+shift,y+dy+shift,z);}
      }
      for(const y of [0,8.1])for(let x=0;x<6;x++)add(1.5+x,y,0,'reserve');
      for(const [pile,x]of [['left',0],['right',8]])for(let z=0;z<12+level;z++)add(x,3.7,z,'blind',pile);
      // Reserve extras keep the complete deck divisible into triples.
      let extra=0;while(tiles.length%3)add(extra++?8:0,7.1,0,'reserve');
    }
    const s={level,tiles,tray:[],shelf:[],moves:0,cleared:0,status:'playing',undos:3,shuffles:2,removes:1,history:[],solution:[]};
    // Assign triples along a legal topological removal order, so every initial board has a solution.
    for(let i=0;i<tiles.length;i++){const choices=tiles.filter(t=>free(s,t)),t=choices[Math.floor(random()*choices.length)];if(i%3===0)s.nextKind=Math.floor(random()*Math.min(icons.length,level*4));t.kind=s.nextKind;t.removed=true;s.solution.push(t.id);}
    tiles.forEach(t=>t.removed=false);delete s.nextKind;return s;
  }
  function snapshot(s){return {removed:s.tiles.map(t=>t.removed),tray:s.tray.slice(),shelf:s.shelf.slice(),moves:s.moves,cleared:s.cleared,status:s.status};}
  function pick(s,id,fromShelf=false){if(s.status!=='playing')return false;const t=s.tiles[id];if(!t||(fromShelf?!s.shelf.includes(id):!free(s,t)))return false;
    s.history.push(snapshot(s));if(s.history.length>3)s.history.shift();if(fromShelf)s.shelf.splice(s.shelf.indexOf(id),1);else t.removed=true;
    let last=-1;for(let i=s.tray.length-1;i>=0;i--)if(s.tiles[s.tray[i]].kind===t.kind){last=i;break;}s.tray.splice(last<0?s.tray.length:last+1,0,id);s.moves++;
    const match=s.tray.filter(i=>s.tiles[i].kind===t.kind);if(match.length===3){s.tray=s.tray.filter(i=>!match.includes(i));s.cleared+=3;}
    if(s.tray.length>=7)s.status='lost';else if(s.tiles.every(t=>t.removed)&&!s.tray.length&&!s.shelf.length)s.status='won';return true;
  }
  function undo(s){if(!s.undos||!s.history.length||s.status==='won')return false;const old=s.history.pop();s.tiles.forEach((t,i)=>t.removed=old.removed[i]);Object.assign(s,{tray:old.tray,shelf:old.shelf,moves:old.moves,cleared:old.cleared,status:old.status});s.undos--;return true;}
  function remove(s){if(!s.removes||!s.tray.length||s.shelf.length||s.status==='won')return false;s.shelf=s.tray.splice(0,3);s.removes--;s.status='playing';s.history=[];return true;}
  function shuffle(s,random=Math.random){if(!s.shuffles||s.status!=='playing')return false;const left=s.tiles.filter(t=>!t.removed),kinds=left.map(t=>t.kind);for(let i=kinds.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[kinds[i],kinds[j]]=[kinds[j],kinds[i]];}left.forEach((t,i)=>t.kind=kinds[i]);s.shuffles--;s.history=[];return true;}
  return {icons,levels,free,fresh,pick,undo,remove,shuffle};
});
