(function(root){
  'use strict';
  const A=typeof module!=='undefined'&&module.exports?require('./assessment-logic.js'):root.AssessmentLogic;
  const originalScore=A.score,choices=labels=>labels.map((label,value)=>({label,value})),q=text=>({text});
  delete A.tests.scl90;
  for(const t of Object.values(A.tests))if(t.choices)t.choices=t.choices.map(c=>({...c,label:c.label.split(' / ')[0]}));
  A.tests.phq9.description='请回顾过去两周，选择每种问题困扰你的频率。中文依据原作者英文题目翻译，供自我了解；正式施测请使用经验证的中文版本。';
  A.tests.ipip.description='请描述平时真实的自己，而非理想中的自己。采用 IPIP 50 项题目的中文翻译和原计分键；本站译文未作信效度验证。';
  const mbtiDimensions=[
    {key:'EI',name:'能量来源',left:'外向',right:'内向',positive:['与朋友相处后，我通常更有精神。','在新环境里，我愿意主动认识别人。','遇到新鲜事，我倾向于马上找人分享。','讨论想法时，我常边说边整理思路。'],negative:['独自待一会儿能让我恢复精力。','参加热闹活动后，我需要安静的时间。','表达重要想法前，我习惯先自己想清楚。','相比大群人聊天，我更喜欢一对一交流。']},
    {key:'SN',name:'关注信息',left:'实感',right:'直觉',positive:['学习新内容时，具体案例最能帮我理解。','我更先关注眼前能够确认的事实。','做事时，我愿意采用已经验证的步骤。','描述经历时，我会自然提到具体细节。'],negative:['我喜欢从事情中寻找隐藏的联系。','一个想法的未来可能性很吸引我。','我经常想象事物还可以变成什么样子。','相比重复熟悉的方法，我更愿意探索新思路。']},
    {key:'TF',name:'判断方式',left:'思考',right:'情感',positive:['做重要选择时，我优先比较客观利弊。','讨论分歧时，我会先检查理由是否一致。','我认为规则应尽可能一视同仁地执行。','帮助别人解决问题时，我首先分析原因。'],negative:['做重要选择时，我很在意它对人的影响。','我会努力理解对方话语背后的感受。','即使方案合理，我也会考虑大家是否能接受。','朋友遇到困难时，我先表达理解和支持。']},
    {key:'JP',name:'生活安排',left:'判断',right:'感知',positive:['提前安排好行程会让我感到安心。','面对任务，我喜欢先列计划再行动。','有明确截止时间时，我倾向于提前完成。','做出决定后，我通常希望按原计划推进。'],negative:['保留调整计划的空间会让我更自在。','我喜欢边尝试边决定下一步。','面对新机会，我愿意临时改变安排。','在收集更多信息之前，我愿意暂缓决定。']}
  ];
  A.tests.mbti={title:'MBTI 性格倾向',mode:'likert',period:'日常的自己',description:'32 道原创中文题，探索四组偏好。本站问卷没有常模或信效度验证，不是官方 MBTI 测评。请按平时的倾向作答。',choices:choices(['很不符合','不太符合','不确定','比较符合','很符合']).map(c=>({...c,value:c.value+1})),questions:mbtiDimensions.flatMap((d,factor)=>[...d.positive.map(text=>({text,factor,sign:1})),...d.negative.map(text=>({text,factor,sign:-1}))]),sources:[['四组偏好概念介绍','https://www.themyersbriggs.com/en-US/Support/MBTI-Facts']],license:'本站原创题目，只用于自我探索。',method:'每题按 1–5 分回答，减去中立值 3 后按题目方向计入对应维度。每维度 8 题，偏好净分范围 −16 至 16；正值倾向左侧字母，负值倾向右侧，0 显示 X（两侧相同）。偏好没有优劣之分。'};
  const interestGroups=[
    {key:'R',name:'现实型',items:['检验待发货零件的质量','铺设砖块或瓷砖','在海上石油钻井平台工作','组装电子零件','在工厂操作磨床','修理损坏的水龙头','在工厂组装产品','为房屋安装地板']},
    {key:'I',name:'研究型',items:['研究人体结构','研究动物行为','开展植物或动物研究','开发新的医疗方法或操作程序','开展生物学研究','研究鲸类及其他海洋生物','在生物实验室工作','绘制海底地形图']},
    {key:'A',name:'艺术型',items:['指挥合唱团','导演一部戏剧','为杂志设计美术作品','创作一首歌曲','写书或剧本','演奏乐器','为电影或电视节目表演特技','设计戏剧布景']},
    {key:'S',name:'社会型',items:['为他人提供职业指导','在非营利机构做志愿服务','帮助有药物或酒精问题的人','教别人一套锻炼方法','帮助有家庭问题的人','照看营地中儿童的活动','教儿童阅读','帮助老年人处理日常事务']},
    {key:'E',name:'企业型',items:['向个人销售餐饮加盟业务','在百货商店销售商品','管理酒店经营','经营美容院或理发店','管理大型公司的一个部门','管理服装店','销售房屋','经营玩具店']},
    {key:'C',name:'常规型',items:['为办公室编制每月工资支票','使用手持计算机盘点物资','使用电脑程序生成客户账单','维护员工档案','计算并记录统计或其他数字数据','操作计算器','处理客户的银行业务','保存收发货记录']}
  ];
  A.tests.holland={title:'霍兰德职业兴趣',mode:'likert',period:'对活动的兴趣',description:'采用 IIP RIASEC 活动量表 A 的 48 项中文翻译。只考虑你是否愿意做这些活动，不要求已经掌握技能。译文用于兴趣探索，未经本地信效度验证。',choices:choices(['很不喜欢','不太喜欢','一般','比较喜欢','很喜欢']).map(c=>({...c,value:c.value+1})),questions:interestGroups.flatMap((d,factor)=>d.items.map(text=>({text,factor}))),sources:[['IIP 原作者题目与使用说明','https://jrounds.weebly.com/riasec-markers-scalesitems.html']],license:'来源：Armstrong、Allison、Rounds（2008），IIP RIASEC Markers；非商业使用，本站提供中文辅助译文。',method:'每项按 1–5 分评分；六类各 8 项，相加得到每类分数（8–40）。按分数排序，保留并列，不推断职业能力或适合程度。'};
  A.tests.cesd={title:'CES-D 抑郁症状筛查',mode:'likert',period:'过去一周',description:'请根据过去一周的实际感受选择出现频率。采用 CES-D 20 项中文翻译；本站译文用于自我了解，正式施测请使用经验证的语言版本。',choices:choices(['很少或没有（少于 1 天）','有时（1–2 天）','经常（3–4 天）','大部分时间（5–7 天）']),questions:['平常不会困扰我的事也让我烦恼。','我不想吃东西，胃口不好。','即使家人和朋友帮助我，我仍摆脱不了低落。','我觉得自己和别人一样好。','我难以专心做正在做的事。','我感到情绪低落。','我觉得做什么事都很费力。','我对未来抱有希望。','我觉得自己的生活是失败的。','我感到害怕。','我睡得不安稳。','我感到快乐。','我比平时说话少。','我感到孤独。','别人对我不友好。','我享受生活。','我有阵阵想哭的感觉。','我感到悲伤。','我觉得别人不喜欢我。','我提不起劲开始做事。'].map(q),sources:[['美国国家纵向调查：题目与计分','https://www.nlsinfo.org/content/cohorts/nlsy79/other-documentation/codebook-supplement/nlsy79-appendix-25-center'],['CDC 计分与筛查参考','https://www.cdc.gov/pcd/issues/2012/pdf/11_0020.pdf']],license:'CES-D 由美国 NIMH 研究人员开发；本站根据公开量表提供中文辅助译文。',method:'每项 0–3 分；第 4、8、12、16 项反向计分（3 − 回答值），20 项相加。16 分为常用进一步评估参考阈值，不能作为诊断。'};
  A.tests.cesdr={title:'CESD-R 抑郁症状筛查',mode:'likert',period:'过去一周及两周',description:'请按过去一周的频率作答；若过去两周几乎每天都有该感受，请选择最后一项。采用原作者 20 项版本的中文翻译，不与早期 22 项中文版本混用。',choices:choices(['没有或少于 1 天','1–2 天','3–4 天','5–7 天','过去两周几乎每天']),questions:['我胃口不好。','我摆脱不了低落的情绪。','我难以专心做正在做的事。','我感到情绪低落。','我睡得不安稳。','我感到悲伤。','我提不起劲开始做事。','没有什么能让我快乐。','我觉得自己是个不好的人。','我对平常的活动失去了兴趣。','我比平时睡得多很多。','我觉得自己的动作太慢。','我感到坐立不安。','我希望自己死了。','我想伤害自己。','我一直感到疲倦。','我不喜欢自己。','我没有刻意减重，却瘦了很多。','我很难入睡。','我不能把注意力集中在重要的事情上。'].map(q),sources:[['原作者 20 项原文','https://cesd-r.com/wp-content/uploads/2018/04/cesdrscale.pdf'],['原作者计分算法','https://cesd-r.com/cesdr/']],license:'CESD-R 原作者声明该量表属于公共领域；中文为本站辅助译文，未经本地信效度验证。',method:'回答值为 0、1、2、3、4。页面显示原作者的 CESD-style 分数：最后两个选项均按 3 分计，总分相加。另按原作者九组症状算法分析出现频率；该结果是筛查提示，不能诊断疾病。'};
  const hamItems=[
    ['抑郁心境（悲伤、绝望、无助、无价值感）',['没有','仅询问时表达这些感受','主动用语言表达这些感受','通过表情、姿势、声音或哭泣传达这些感受','自发言语和非言语表达几乎全是这些感受']],
    ['罪恶感',['没有','自责，认为让别人失望','反复想着过去的错误或罪过','认为当前疾病是惩罚，出现罪恶妄想','听到责备或谴责的声音，或出现威胁性的幻视']],
    ['自杀相关想法或行为',['没有','觉得生活不值得继续','希望死去，或想到自己可能死亡','有自杀想法或相关姿态、行为','有自杀企图；任何严重企图记 4 分']],
    ['入睡困难',['没有','偶尔入睡困难，超过半小时','每晚都难以入睡']],
    ['夜间睡眠困难',['没有','夜间不安或睡眠受到干扰','夜间醒来并起床（上厕所除外）']],
    ['清晨早醒',['没有','醒得早，但能再睡着','醒后起床，无法再入睡']],
    ['工作与活动',['没有困难','感到做事、工作或爱好时无能、疲倦或虚弱','对活动、爱好或工作失去兴趣，做事需要勉强推动自己','活动时间或效率下降；除日常杂务外每天活动不足 3 小时','因当前疾病停止工作；不做其他活动或不能独立完成日常杂务']],
    ['精神运动迟缓（思维、言语、注意力、动作）',['言语和思维正常','访谈中轻度迟缓','访谈中明显迟缓','访谈难以进行','完全木僵']],
    ['精神运动激越',['没有','坐立不安','玩弄手、头发等','来回走动，不能安坐','扭手、咬指甲、拔头发或咬嘴唇']],
    ['精神性焦虑',['没有','主观紧张、易烦躁','担忧小事','面容或言语呈现忧虑','未经询问即表达恐惧']],
    ['躯体性焦虑（胃肠、心血管、呼吸、泌尿或出汗等）',['没有','轻度','中度','重度','严重到妨碍日常活动']],
    ['胃肠道躯体症状',['没有','食欲差，但不用催促仍能进食；腹部沉重感','需要催促才能进食，或请求/需要胃肠道及排便用药']],
    ['一般躯体症状',['没有','四肢、背部或头部沉重，背痛、头痛、肌肉痛，精力下降或易疲劳','出现明确的上述症状']],
    ['生殖相关症状（如性欲下降、月经紊乱）',['没有','轻度','重度']],
    ['疑病',['没有','过度关注自己的身体','过度关注健康','经常抱怨、请求帮助等','疑病妄想']],
    ['体重减轻（采用患者陈述法）',['没有体重减轻','可能因当前疾病导致体重减轻','患者明确报告体重减轻']],
    ['自知力',['承认自己存在抑郁及疾病','承认有病，但归因于饮食、天气、过劳、病毒、需要休息等','完全否认自己有病']]
  ];
  A.tests.hamd={title:'HAM-D 17 项评定',mode:'likert',clinician:true,period:'过去一周 · 专业访谈',description:'供合格专业人员根据访谈与观察填写的中文评定记录，不是自填心理测试。请按每项描述选择最符合受评者的等级。中文依据公开原版翻译，正式评定请使用经验证的语言版本。',questions:hamItems.map(([text,labels])=>({text,choices:choices(labels)})),sources:[['佛罗里达大学：原量表及使用说明','https://dcf.psychiatry.ufl.edu/files/2011/05/HAMILTON-DEPRESSION.pdf']],license:'公开原版注明量表属于公共领域；本站提供中文辅助译文。',method:'17 项相加；第 1、2、3、7、8、9、10、11、15 项各 0–4 分，其余各 0–2 分。第 16 项采用患者陈述法，不与实测法重复计分。只显示完整记录的总分，结果须由专业人员解释。'};
  Object.values(A.tests).forEach(t=>t.count=t.questions?.length||0);
  function valid(t,answers){if(!Array.isArray(answers)||answers.length!==t.count||[...answers].some((v,i)=>!(t.questions[i].choices||t.choices).some(c=>c.value===v)))throw Error('请完成所有题目。');}
  A.score=function(kind,answers){
    const t=A.tests[kind];if(!t)throw Error('此量表不存在。');
    if(!['mbti','holland','cesd','cesdr','hamd'].includes(kind))return originalScore(kind,answers);
    valid(t,answers);
    if(kind==='mbti'){const rows=mbtiDimensions.map((d,i)=>{const net=t.questions.reduce((sum,q,j)=>sum+(q.factor===i?q.sign*(answers[j]-3):0),0);return {...d,net,code:net===0?'X':d.key[net>0?0:1],percent:(net+16)/32*100};});return {rows,code:rows.map(r=>r.code).join('')};}
    if(kind==='holland'){const rows=interestGroups.map((d,i)=>({key:d.key,name:d.name,total:answers.slice(i*8,i*8+8).reduce((a,b)=>a+b,0),max:40})),ranked=[...rows].sort((a,b)=>b.total-a.total),groups=[];ranked.forEach(r=>{const last=groups.at(-1);if(last&&last.total===r.total)last.keys.push(r.key);else groups.push({total:r.total,keys:[r.key]});});return {rows,ranked,groups};}
    if(kind==='cesd'){const total=answers.reduce((sum,v,i)=>sum+([3,7,11,15].includes(i)?3-v:v),0);return {total,further:total>=16,severity:total>=16?'建议进一步评估':'本次低于常用筛查参考值'};}
    if(kind==='hamd')return {total:answers.reduce((a,b)=>a+b,0),severity:'专业访谈评定记录',support:answers[2]>0};
    const clusters=[[1,3,5],[7,9],[0,17],[4,10,18],[2,19],[8,16],[6,15],[11,12],[13,14]];
    const scores=clusters.map(ids=>Math.max(...ids.map(i=>answers[i]))),core=scores[0]===4||scores[1]===4;
    const other=scores.slice(2),extraCore=scores[0]===4&&scores[1]===4?1:0;
    const count4=other.filter(v=>v===4).length+extraCore,count3=other.filter(v=>v>=3).length+(scores[0]>=3&&scores[1]>=3?1:0);
    const total=answers.reduce((a,b)=>a+Math.min(3,b),0);
    const pattern=core&&count4>=4?'核心症状持续两周，并有至少四组其他症状持续两周':core&&count3>=3?'核心症状持续两周，并有至少三组其他症状频繁出现':core&&count3>=2?'核心症状持续两周，并有至少两组其他症状频繁出现':total>=16?'达到常用进一步评估分数，未达到上述症状组合条件':'本次低于常用筛查参考值';
    return {total,severity:pattern,further:total>=16||(core&&count3>=2),support:answers[13]>0||answers[14]>0};
  };
  if(typeof module!=='undefined'&&module.exports)module.exports=A;
})(typeof window!=='undefined'?window:globalThis);
