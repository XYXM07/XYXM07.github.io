(function(root){
  'use strict';
  const choices=(labels,values)=>labels.map((label,i)=>({label,value:values?values[i]:i}));
  const frequency=choices(['根本没有 / Not at all','有几天 / Several days','超过一半天数 / More than half the days','几乎每天 / Nearly every day']);
  const question=(text,original)=>({text,original});
  const phq=[
    ['做事时提不起劲或没有兴趣','Little interest or pleasure in doing things'],
    ['感到心情低落、沮丧或绝望','Feeling down, depressed, or hopeless'],
    ['入睡困难、睡不安稳或睡得过多','Trouble falling or staying asleep, or sleeping too much'],
    ['感到疲倦或没有精力','Feeling tired or having little energy'],
    ['食欲不振或吃得过多','Poor appetite or overeating'],
    ['觉得自己很糟糕，觉得自己是个失败者，或让自己或家人失望','Feeling bad about yourself—or that you are a failure or have let yourself or your family down'],
    ['难以集中注意力，例如读报纸或看电视','Trouble concentrating on things, such as reading the newspaper or watching television'],
    ['行动或说话缓慢到别人能察觉；或者相反，烦躁、坐立不安，活动比平时多很多','Moving or speaking so slowly that other people could have noticed? Or the opposite—being so fidgety or restless that you have been moving around a lot more than usual'],
    ['想到死了会更好，或想以某种方式伤害自己','Thoughts that you would be better off dead or of hurting yourself in some way']
  ].map(x=>question(...x));
  const gad=['感觉紧张、焦虑或不安','无法停止或控制担忧','对各种事情担心太多','难以放松','坐立不安，以至于很难安静地坐下来','变得容易生气或急躁','感觉害怕，好像有可怕的事情要发生一样'].map(x=>question(x));
  const who=['我感觉快乐、心情舒畅','我感觉宁静和放松','我感觉充满活力、精力充沛','我睡醒时感到清新、得到了足够休息','我每天生活充满了有趣的事情'].map(x=>question(x));
  const ipipItems=[
    ['Am the life of the party.','我是聚会中活跃气氛的人。',1],['Feel little concern for others.','我很少关心他人。',-1],['Am always prepared.','我总是做好准备。',1],['Get stressed out easily.','我容易感到压力。',-1],['Have a rich vocabulary.','我拥有丰富的词汇。',1],
    ["Don't talk a lot.",'我话不多。',-1],['Am interested in people.','我对他人感兴趣。',1],['Leave my belongings around.','我会随处放置自己的物品。',-1],['Am relaxed most of the time.','我大多数时候都很放松。',1],['Have difficulty understanding abstract ideas.','我难以理解抽象概念。',-1],
    ['Feel comfortable around people.','我与人相处时感到自在。',1],['Insult people.','我会侮辱他人。',-1],['Pay attention to details.','我关注细节。',1],['Worry about things.','我常为事情担忧。',-1],['Have a vivid imagination.','我有生动的想象力。',1],
    ['Keep in the background.','我习惯待在不显眼的位置。',-1],["Sympathize with others' feelings.",'我能体谅他人的感受。',1],['Make a mess of things.','我会把事情弄得一团糟。',-1],['Seldom feel blue.','我很少感到忧郁。',1],['Am not interested in abstract ideas.','我对抽象概念不感兴趣。',-1],
    ['Start conversations.','我会主动发起交谈。',1],["Am not interested in other people's problems.",'我对别人的问题不感兴趣。',-1],['Get chores done right away.','我会立即完成杂务。',1],['Am easily disturbed.','我容易受到干扰。',-1],['Have excellent ideas.','我有出色的想法。',1],
    ['Have little to say.','我没有多少话要说。',-1],['Have a soft heart.','我心肠柔软。',1],['Often forget to put things back in their proper place.','我常忘记把东西放回原位。',-1],['Get upset easily.','我容易心烦。',-1],['Do not have a good imagination.','我不太擅长想象。',-1],
    ['Talk to a lot of different people at parties.','我在聚会中会和许多不同的人交谈。',1],['Am not really interested in others.','我并不太关心别人。',-1],['Like order.','我喜欢井然有序。',1],['Change my mood a lot.','我的情绪经常变化。',-1],['Am quick to understand things.','我能很快理解事物。',1],
    ["Don't like to draw attention to myself.",'我不喜欢引人注目。',-1],['Take time out for others.','我会为他人腾出时间。',1],['Shirk my duties.','我会逃避自己的职责。',-1],['Have frequent mood swings.','我的情绪起伏频繁。',-1],['Use difficult words.','我会使用难懂的词语。',1],
    ["Don't mind being the center of attention.",'我不介意成为关注的中心。',1],["Feel others' emotions.",'我能感受他人的情绪。',1],['Follow a schedule.','我按照计划行事。',1],['Get irritated easily.','我容易烦躁。',-1],['Spend time reflecting on things.','我会花时间思考事物。',1],
    ['Am quiet around strangers.','我在陌生人面前很安静。',-1],['Make people feel at ease.','我能让人感到自在。',1],['Am exacting in my work.','我对工作要求严格。',1],['Often feel blue.','我常感到忧郁。',-1],['Am full of ideas.','我有许多想法。',1]
  ].map(([original,text,sign],i)=>({original,text,sign,factor:i%5}));
  const factors=['外向性 / Extraversion','宜人性 / Agreeableness','尽责性 / Conscientiousness','情绪稳定性 / Emotional Stability','智力与想象力 / Intellect/Imagination'];
  const interests=[
    {key:'R',name:'现实型 / Realistic',items:['Build kitchen cabinets','Lay brick or tile','Repair household appliances','Raise fish in a fish hatchery','Assemble electronic parts','Drive a truck to deliver packages to offices and homes','Test the quality of parts before shipment','Repair and install locks','Set up and operate machines to make products','Put out forest fires']},
    {key:'I',name:'研究型 / Investigative',items:['Develop a new medicine','Study ways to reduce water pollution','Conduct chemical experiments','Study the movement of planets','Examine blood samples using a microscope','Investigate the cause of a fire','Develop a way to better predict the weather','Work in a biology lab','Invent a replacement for sugar','Do laboratory tests to identify diseases']},
    {key:'A',name:'艺术型 / Artistic',items:['Write books or plays','Play a musical instrument','Compose or arrange music','Draw pictures','Create special effects for movies','Paint sets for plays','Write scripts for movies or television shows','Perform jazz or tap dance','Sing in a band','Edit movies']},
    {key:'S',name:'社会型 / Social',items:['Teach an individual an exercise routine','Help people with personal or emotional problems','Give career guidance to people','Perform rehabilitation therapy','Do volunteer work at a non-profit organization','Teach children how to play sports','Teach sign language to people who are deaf or hard of hearing','Help conduct a group therapy session','Take care of children at a day-care center','Teach a high-school class']},
    {key:'E',name:'企业型 / Enterprising',items:['Buy and sell stocks and bonds','Manage a retail store','Operate a beauty salon or barber shop','Manage a department within a large company','Start your own business','Negotiate business contracts','Represent a client in a lawsuit','Market a new line of clothing','Sell merchandise at a department store','Manage a clothing store']},
    {key:'C',name:'常规型 / Conventional',items:['Develop a spreadsheet using computer software','Proofread records or forms','Install software across computers on a large network','Operate a calculator','Keep shipping and receiving records','Calculate the wages of employees','Inventory supplies using a hand-held computer','Record rent payments','Keep inventory records','Stamp, sort, and distribute mail for an organization']}
  ];
  const tests={
    phq9:{title:'PHQ-9 抑郁症状筛查',mode:'likert',period:'过去两周',description:'过去两周，以下问题困扰你的频率如何？原作者英文题目附中文辅助译文；辅助译文未经本地信效度验证，正式施测请使用经验证的语言版本。',choices:frequency,questions:phq,license:'PHQ-9 原作者允许复制、翻译、展示和发行，无需许可。',sources:[['原作者量表与计分手册','https://www.uab.edu/medicine/pcp-sci/images/SCIMS/PHQ-9_Instruction_Manual.pdf']],method:'每题 0–3 分，相加得 0–27 分。0–4：极少；5–9：轻度；10–14：中度；15–19：中重度；20–27：重度。功能影响题不计入总分。'},
    gad7:{title:'GAD-7 焦虑症状筛查',mode:'likert',period:'过去两周',description:'在过去2周里，您被以下问题困扰的频率如何？使用原作者发布的中国中文版。',choices:choices(['根本没有','有几天','超过一半天数','几乎每天']),questions:gad,license:'原作者允许复制、翻译、展示和发行，无需许可。',sources:[['原作者中文版 PDF','https://www.phqscreeners.com/images/sites/g/files/g10060481/f/201412/GAD7_Chinese%20for%20China.pdf'],['原作者计分手册','https://www.uab.edu/medicine/pcp-sci/images/SCIMS/PHQ-9_Instruction_Manual.pdf']],method:'每题 0–3 分，相加得 0–21 分。0–4：极少；5–9：轻度；10–14：中度；15–21：重度。'},
    who5:{title:'WHO-5 幸福感指数',mode:'likert',period:'过去两周',description:'请按过去两周的感受，选择最接近的频率。题目与选项采用 WHO 发布的中文版。',choices:choices(['所有时间','大部分时间','超过一半的时间','少于一半的时间','有时候','从未有过'],[5,4,3,2,1,0]),questions:who,license:'来源：世界卫生组织，WHO-5；CC BY-NC-SA 3.0 IGO，非商业使用，注明来源并按相同许可共享。',sources:[['WHO 量表及语言版本','https://www.who.int/publications/m/item/WHO-UCN-MSD-MHE-2024.01'],['WHO 中文版原文','https://cdn.who.int/media/docs/default-source/mental-health/five-well-being-index-(who-5)/who5_chinese_pr.pdf?sfvrsn=a6a33639_5'],['使用许可','https://creativecommons.org/licenses/by-nc-sa/3.0/igo/']],method:'每题 0–5 分，相加得 0–25 分；原始分 × 4 得到 0–100 分，越高表示幸福感越好。原始分低于 13 或任一题为 0–1 分时，原版建议进一步评估。'},
    ipip:{title:'IPIP 大五人格',mode:'likert',period:'平时的自己',description:'请描述你现在真实的样子，而非理想中的自己。使用 IPIP 50 项原题和原计分键，英文原文附中文辅助译文；辅助译文未经信效度验证。',choices:choices(['非常不符合 / Very Inaccurate','较不符合 / Moderately Inaccurate','中立 / Neither Accurate Nor Inaccurate','较符合 / Moderately Accurate','非常符合 / Very Accurate'],[1,2,3,4,5]),questions:ipipItems,license:'IPIP 题目与量表属于公共领域，可复制、翻译和使用。中文为本站辅助译文。',sources:[['IPIP 50 项原题','https://ipip.ori.org/New_IPIP-50-item-scale.htm'],['官方计分规则','https://ipip.ori.org/newScoringInstructions.htm'],['公共领域说明','https://ipip.ori.org/']],method:'每题 1–5 分；正向题使用原分，反向题使用 6 − 原分。每维度 10 题，相加得 10–50 分。情绪稳定性越高表示越稳定。结果没有换算为常模百分位，也不代表智商。'},
    holland:{title:'霍兰德职业兴趣',mode:'checklist',period:'想做的工作活动',description:'O*NET Interest Profiler Short Form，60 项官方英文原题。勾选你愿意参与的活动，未勾选表示不选择。为保留原量表，题目不作翻译或改写。',instruction:'Read the 60 work activities below. Place a check in the box by the activities you would like to do. Do not think about how much education/training is needed or how much money you will make! Count the number of checks for each shaded section and write that total in the box to the right of each section. These are your scores for each interest area.',questions:interests.flatMap((d,factor)=>d.items.map(text=>({text,factor}))),license:'O*NET® Interest Profiler — U.S. Department of Labor, Employment and Training Administration / National Center for O*NET Development. 原文按 CC BY-ND 4.0 使用；O*NET® 为美国劳工部商标。',sources:[['官方 60 项纸笔量表','https://www.onetcenter.org/dl_tools/ipsf/Interest_Profiler.pdf'],['O*NET 兴趣测评','https://www.onetcenter.org/IP.html'],['量表使用许可','https://www.onetcenter.org/license_tools.html']],method:'每个兴趣领域包含 10 项活动；该领域勾选数即得分，范围 0–10。找出得分最高的三个领域。并列时由你选择更符合兴趣的领域，不自动决定职业。'},
    mbti:{title:'MBTI 官方测评',mode:'external',description:'MBTI 是由发行方提供的正式测评。本站不使用自编题目代替 MBTI，也不将其他人格量表的结果换算成 MBTI 类型。可前往发行方入口了解并进行官方测评。',sources:[['MBTI 官方测评入口','https://www.mbtionline.com/'],['发行方版权与许可说明','https://www.themyersbriggs.com/en-US/Support/Copyright-and-Permissions']]},
    scl90:{title:'SCL-90-R 官方量表',mode:'external',description:'SCL-90-R 是版权受保护的症状自评量表。正式题目、计分和常模请使用发行方授权版本，并结合专业评估解读。本站提供发行方入口；可在本页选择 PHQ-9、GAD-7 或 WHO-5 了解近期状态。',sources:[['SCL-90-R 发行方页面','https://www.pearsonassessments.com/en-us/Store/Professional-Assessments/Personality-%26-Biopsychosocial/Symptom-Checklist-90-Revised/p/100000645']]}
  };
  Object.values(tests).forEach(t=>t.count=t.questions?.length||0);
  function band(value,bounds,labels){return labels[bounds.filter(n=>value>=n).length];}
  function score(kind,answers){
    const t=tests[kind];if(!t||t.mode==='external')throw Error('此量表使用官方入口。');
    if(!Array.isArray(answers)||answers.length!==t.count)throw Error('答案数量不完整。');
    if(t.mode==='checklist'){
      if([...answers].some(x=>typeof x!=='boolean'))throw Error('活动选择无效。');
      const rows=interests.map((d,i)=>({key:d.key,name:d.name,total:answers.slice(i*10,i*10+10).filter(Boolean).length,max:10}));
      const ranked=[...rows].sort((a,b)=>b.total-a.total),groups=[];ranked.forEach(r=>{const last=groups.at(-1);if(last&&last.total===r.total)last.keys.push(r.key);else groups.push({total:r.total,keys:[r.key]});});return {rows,ranked,groups};
    }
    if([...answers].some(x=>!t.choices.some(c=>c.value===x)))throw Error('请完成所有题目。');
    if(kind==='ipip')return {rows:factors.map((name,i)=>({name,total:ipipItems.reduce((sum,q,j)=>sum+(q.factor===i?(q.sign===1?answers[j]:6-answers[j]):0),0),max:50}))};
    const total=answers.reduce((a,b)=>a+b,0);
    if(kind==='who5')return {total,max:25,percent:total*4,further:total<13||answers.some(x=>x<=1)};
    const severity=band(total,kind==='phq9'?[5,10,15,20]:[5,10,15],kind==='phq9'?['极少','轻度','中度','中重度','重度']:['极少','轻度','中度','重度']);
    return {total,max:kind==='phq9'?27:21,severity,further:total>=10,support:kind==='phq9'&&answers[8]>0};
  }
  const api={tests,score};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.AssessmentLogic=api;
})(typeof window!=='undefined'?window:globalThis);
