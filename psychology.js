(() => {
  'use strict';
  const A=window.AssessmentLogic,$=s=>document.querySelector(s),sessions=new Map();
  const supportText='这项回答值得认真对待。建议尽快与可信任的人或心理健康专业人员联系；如果你现在可能伤害自己，请立即联系当地急救或前往急诊，不要独自等待。';
  let kind=null,session=null;
  function supportItem(index,value){return value>0&&((kind==='phq9'&&index===8)||(kind==='cesdr'&&[13,14].includes(index))||(kind==='hamd'&&index===2));}
  function node(tag,text,className){const el=document.createElement(tag);if(text!=null)el.textContent=text;if(className)el.className=className;return el;}
  function focusArea(el){el.tabIndex=-1;el.focus({preventScroll:true});if(el.getBoundingClientRect().top<70||el.getBoundingClientRect().top>innerHeight*.55)el.scrollIntoView({block:'start',behavior:'instant'});}
  function source(parent){const t=A.tests[kind],links=node('div',null,'assessment-sources');t.sources.forEach(([label,url])=>{const a=node('a',label);a.href=url;a.target='_blank';a.rel='noopener noreferrer';links.append(a);});parent.append(links);if(t.license)parent.append(node('p',t.license,'assessment-license'));}
  function size(){return A.tests[kind].mode==='checklist'?10:6;}
  function intro(){
    const t=A.tests[kind],box=$('#assessment-intro');box.replaceChildren(node('h2',t.title),node('p',t.description));
    if(t.mode==='external'){source(box);const links=node('div',null,'play-actions');for(const id of kind==='mbti'?['ipip','holland']:['phq9','gad7','who5']){const a=node('a',A.tests[id].title,'button secondary');a.href='#psychology/'+id;links.append(a);}box.append(links);return;}
    const meta=node('div',null,'assessment-meta');meta.append(node('span',t.count+' 项'),node('span',t.period),node('span','本机计分 · 不上传答案'));box.append(meta,node('p','答题没有对错。可以返回修改；刷新页面会清空答案。','help-note'));
    if(['phq9','gad7','who5','cesd','cesdr','hamd'].includes(kind))box.append(node('p',t.clinician?'此页面是专业评定记录工具。受评者不应自行选择访谈观察等级；请由合格专业人员填写和解读。':'用于了解近期状态，结果不能诊断疾病。正式评估需结合专业人员的判断。','assessment-note'));
    const start=node('button',session.started?'继续答题':t.clinician?'填写评定记录':'开始答题','button primary');start.type='button';start.addEventListener('click',()=>{session.started=true;view();focusArea($('#assessment-quiz'));});box.append(start);
    const details=node('details',null,'assessment-extra');details.append(node('summary','题目来源与计分方法'),node('p',t.method));source(details);box.append(details);
  }
  function support(parent){const p=node('p',supportText,'support-note');p.setAttribute('role','status');parent.append(p);}
  function questions(){
    const t=A.tests[kind],start=session.page*size(),end=Math.min(start+size(),t.count),box=$('#assessment-questions');box.replaceChildren();
    if(t.mode==='checklist')box.append(node('p',t.instruction,'question-original'),node('p','勾选愿意做的活动；未勾选的项目不计分。每组 10 项。','help-note'));
    for(let i=start;i<end;i++){
      const q=t.questions[i],fieldset=node('fieldset',null,'question-card');fieldset.id='question-'+i;fieldset.tabIndex=-1;fieldset.append(node('legend',String(i+1).padStart(2,'0')+' · '+q.text));
      const itemChoices=q.choices||t.choices;
      const options=node('div',null,'answer-options');options.dataset.options=itemChoices?.length||1;
      if(t.mode==='checklist'){
        const label=node('label',null,'answer-option'),input=document.createElement('input');input.type='checkbox';input.checked=session.answers[i];input.name='answer-'+i;input.addEventListener('change',()=>{session.answers[i]=input.checked;updateProgress();});label.append(input,node('span','I would like to do this activity'));options.append(label);
      }else itemChoices.forEach(c=>{const label=node('label',null,'answer-option'),input=document.createElement('input');input.type='radio';input.name='answer-'+i;input.value=String(c.value);input.checked=session.answers[i]===c.value;input.addEventListener('change',()=>{session.answers[i]=c.value;$('#assessment-status').textContent='';updateProgress();const note=fieldset.querySelector('.support-note');if(supportItem(i,c.value)&&!note)support(fieldset);if(!supportItem(i,c.value)&&note)note.remove();});label.append(input,node('span',c.label));options.append(label);});
      if(t.clinician)options.classList.add('clinical-options');fieldset.append(options);if(supportItem(i,session.answers[i]))support(fieldset);box.append(fieldset);
    }
    if(kind==='phq9'&&end===t.count){
      const extra=node('fieldset',null,'question-card assessment-extra');extra.append(node('legend','功能影响（可选，不计入总分）'),node('p','如果上述问题存在，它们让你工作、处理家务或与人相处有多困难？'));
      const options=node('div',null,'answer-options');options.dataset.options=4;['没有困难','有些困难','非常困难','极其困难'].forEach((text,i)=>{const label=node('label',null,'answer-option'),input=document.createElement('input');input.type='radio';input.name='functional-impact';input.checked=session.impact===i;input.addEventListener('change',()=>session.impact=i);label.append(input,node('span',text));options.append(label);});extra.append(options);box.append(extra);
    }
    $('#assessment-prev').disabled=session.page===0;$('#assessment-next').textContent=end===t.count?'查看结果':'下一组';$('#assessment-status').textContent='';updateProgress();
  }
  function updateProgress(){const t=A.tests[kind],done=t.mode==='checklist'?session.answers.filter(Boolean).length:session.answers.filter(Number.isInteger).length;$('#assessment-progress-label').textContent=(t.mode==='checklist'?'已选择 '+done+' 项':'已答 '+done+' / '+t.count)+' · 第 '+(session.page+1)+' / '+Math.ceil(t.count/size())+' 组';$('#assessment-progress').value=t.mode==='checklist'?Math.min((session.page+1)*size()/t.count*100,100):done/t.count*100;}
  function bar(box,label,value,percent){const row=node('div'),caption=node('div',null,'result-bar-label');caption.append(node('span',label),node('span',value));const track=node('div',null,'result-bar'),fill=node('span');fill.style.setProperty('--percent',Math.max(0,Math.min(100,percent))+'%');track.append(fill);row.append(caption,track);box.append(row);}
  function result(){
    const t=A.tests[kind],score=A.score(kind,session.answers),box=$('#assessment-result');box.replaceChildren(node('h2',t.title+' · 结果'));const bars=node('div',null,'result-bars');
    if(kind==='mbti'){box.append(node('div',score.code,'assessment-result-code'),node('p','原创问卷的偏好组合。X 表示两侧相同；结果不是官方 MBTI 类型。'));score.rows.forEach(r=>bar(bars,r.left+' / '+r.right,'偏好净分 '+r.net,r.percent));box.append(bars);}
    else if(kind==='ipip'){box.append(node('p','各维度的分数反映本次自我描述。没有常模百分位或高低等级判断；智力与想象力维度不等于智商。'));score.rows.forEach(r=>bar(bars,r.name.split(' / ')[0],'分数 '+r.total,(r.total-10)/40*100));box.append(bars);}
    else if(kind==='holland'){
      box.append(node('p','每类分数由该组活动的兴趣评分相加得到。兴趣不等于能力，也不能单独决定职业。'));score.ranked.forEach(r=>bar(bars,r.key+' · '+r.name,'分数 '+r.total,(r.total-8)/32*100));box.append(bars);
      box.append(node('p','兴趣排序：'+score.groups.map(g=>g.keys.join(' / ')).join(' → ')+'。斜杠表示并列；请选择其中更符合自己的领域作为前三项。'));
    }else if(kind==='who5'){
      const summary=node('div',null,'screening-summary');summary.append(node('strong','分数 '+score.percent),node('span','原始分 '+score.total));box.append(summary,node('p','分数越高，表示过去两周的幸福感越好。百分制分数不是人群百分位。'));
      box.append(node('p',score.further?'原版建议进一步评估：原始分低于 13，或至少一项为 0–1 分。可以与心理健康专业人员讨论近期感受。':'本次回答未达到原版进一步评估提示条件；这一结果不能排除其他困扰。','assessment-note'));
    }else{
      const summary=node('div',null,'screening-summary');summary.append(node('strong','分数 '+score.total),node('span',score.severity+(kind==='phq9'||kind==='gad7'?'症状范围':'')));box.append(summary,node('p',t.clinician?'此总分属于专业访谈评定记录，需由合格专业人员结合完整访谈解释。':'这是症状筛查得分，不是诊断结论。'));
      if(score.further)box.append(node('p','达到原作者建议进一步评估的分数范围。若症状持续或影响生活，建议联系心理健康专业人员。','assessment-note'));
      if(kind==='phq9'&&Number.isInteger(session.impact))box.append(node('p','你报告的功能影响：'+['没有困难','有些困难','非常困难','极其困难'][session.impact]+'（不计入总分）。'));
      if(score.support)support(box);
    }
    box.append(node('h3','计分依据'),node('p',t.method));source(box);
    const revise=node('button','返回修改答案','button secondary');revise.type='button';revise.addEventListener('click',()=>{session.completed=false;session.page=0;view();focusArea($('#assessment-quiz'));});box.append(revise);
  }
  function view(){const external=A.tests[kind].mode==='external';$('#assessment-intro').hidden=!external&&session.started;$('#assessment-quiz').hidden=external||!session.started||session.completed;$('#assessment-result').hidden=external||!session.completed;$('#assessment-reset-row').hidden=external||!session.started;if(external)intro();else if(session.completed)result();else if(session.started)questions();else intro();}
  function route(){const [page,section]=location.hash.slice(1).split('/');if(page!=='psychology')return;kind=Object.hasOwn(A.tests,section)?section:null;$('#psychology-directory').hidden=!!kind;$('#psychology-workspace').hidden=!kind;$('#psychology-title').textContent=kind?A.tests[kind].title:'心理测试';$('#psychology-picker-label').textContent=kind?A.tests[kind].title:'选择测试';if(!kind)return;if(!sessions.has(kind))sessions.set(kind,{answers:Array(A.tests[kind].count).fill(A.tests[kind].mode==='checklist'?false:null),page:0,started:false,completed:false,impact:null});session=sessions.get(kind);view();}
  $('#assessment-form').addEventListener('submit',e=>{e.preventDefault();if(!session)return;const t=A.tests[kind],start=session.page*size(),end=Math.min(start+size(),t.count);if(t.mode!=='checklist')for(let i=start;i<end;i++)if(!Number.isInteger(session.answers[i])){$('#assessment-status').textContent='请先回答第 '+(i+1)+' 题。';focusArea($('#question-'+i));return;}if(end<t.count){session.page++;questions();focusArea($('#assessment-quiz'));}else{try{A.score(kind,session.answers);session.completed=true;view();focusArea($('#assessment-result'));}catch(err){$('#assessment-status').textContent=err.message;}}});
  $('#assessment-prev').addEventListener('click',()=>{if(session.page>0){session.page--;questions();focusArea($('#assessment-quiz'));}});$('#assessment-reset').addEventListener('click',()=>{sessions.delete(kind);route();focusArea($('#assessment-intro'));});document.addEventListener('site:pagechange',route);route();
})();
