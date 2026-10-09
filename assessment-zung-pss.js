(function(root){
  'use strict';
  const A=typeof module!=='undefined'&&module.exports?require('./assessment-extra.js'):root.AssessmentLogic,previous=A.score;
  const options=(labels,start=0)=>labels.map((label,i)=>({label,value:i+start}));
  const items=(texts,reverse)=>texts.map((text,i)=>({text,reverse:reverse.includes(i+1)}));
  const frequency=options(['没有或很少时间','少部分时间','相当多的时间','大部分或全部时间'],1);
  A.tests.sds={title:'SDS 抑郁自评量表',mode:'likert',period:'过去一周',description:'20 项抑郁症状自评。请按过去一周的实际感受选择频率，正反向题统一按出现频率作答，系统自动反向计分。中文辅助译文用于自我了解，未经本站信效度验证。',choices:frequency,questions:items([
    '我觉得心情低落、郁闷。','我在早晨通常感觉最好。','我想哭，或会哭起来。','夜里我的睡眠不好。','我的食量和平常差不多。','我对性的兴趣和平时一样。','我发现自己体重在下降。','便秘让我感到困扰。','我没有做什么也会觉得疲惫。','我的心跳比平时快。','我觉得自己的头脑和平常一样清楚。','日常的事情做起来并不比平时困难。','我感到不安，很难安静下来。','我觉得将来还有希望。','我比平时更容易烦躁。','我做决定并不困难。','我觉得自己对别人有用、不可缺少。','我觉得自己的生活是充实而有意义的。','我觉得别人也许会在我死后过得更好。','我仍能享受平常喜欢的事情。'
  ],[2,5,6,11,12,14,16,17,18,20]),sources:[['中文量表与计分参考','https://zxzx.xxu.edu.cn/info/1985/1867.htm'],['反向计分题号','https://xgzx.qdu.edu.cn/info/1113/4251.htm'],['中国常模参考分界','https://www.sxcast.edu.cn/uploadfile/ueditor/file/202206/1655286132e6b165.pdf']],license:'Zung（1965），SDS。题目使用本站中文辅助译文；正式测评应使用经验证的版本并由专业人员解释。',method:'每题回答 1–4 分。第 2、5、6、11、12、14、16、17、18、20 项按 5 − 回答值计分，其余使用原分。相加得到原始分；标准分 = 原始分 × 1.25，取整数部分。页面同时显示标准分与原始分。中国常模常用 53 分作为进一步评估参考，不用于诊断。'};
  A.tests.sas={title:'SAS 焦虑自评量表',mode:'likert',period:'过去一周',description:'20 项焦虑症状自评。请按过去一周的真实情况选择频率，不要自行颠倒正向描述的答案。中文辅助译文用于自我了解，未经本站信效度验证。',choices:frequency,questions:items([
    '我比平时更容易紧张、着急。','我会无缘无故感到害怕。','我容易慌乱或惊恐。','我担心自己会失去理智。','我觉得一切还好，不会有什么不幸。','我的胳膊、腿会发抖。','头、颈部或背部的疼痛令我烦恼。','我容易虚弱、疲倦。','我觉得平静，能轻松坐着不动。','我感觉心跳很快。','一阵阵的头晕让我难受。','我曾晕倒，或感觉快要晕倒。','我的呼吸很顺畅。','我的手脚有麻木、刺痛感。','胃部不适或消化问题让我难受。','我需要频繁小便。','我的手通常温暖、干燥。','我的脸会发红、发热。','我能顺利入睡，整夜睡得安稳。','我会做噩梦。'
  ],[5,9,13,17,19]),sources:[['中文量表、反向题与标准分计分','https://xgzx.qdu.edu.cn/info/1113/4250.htm']],license:'Zung（1971），SAS。本站中文辅助译文供自我了解；正式测评应使用经验证的版本。',method:'每题回答 1–4 分；第 5、9、13、17、19 项按 5 − 回答值反向计分。20 项相加为原始分，乘以 1.25 后取整数部分为标准分。50 分为常用进一步评估参考；结果不等于焦虑障碍诊断。'};
  A.tests.pss={title:'PSS-10 感知压力量表',mode:'likert',period:'过去一个月',description:'采用 PSS 的 10 项版本，了解过去一个月面对不可预料、难以控制或负担过重事情时的感受。中文为本站辅助译文，未经信效度验证；正式研究请使用获准的语言版本。',choices:options(['从不','很少','有时','经常','总是']),questions:items([
    '意料之外的事情让你感到心烦吗？','你觉得无法掌控生活中重要的事情吗？','你觉得紧张、有压力吗？','你有信心处理自己的问题吗？','你觉得事情正按你的心意发展吗？','你觉得要做的事情多到难以应付吗？','你能控制生活中让你烦恼的事情吗？','你觉得一切尽在掌握吗？','无法控制的事情会让你生气吗？','你觉得困难累积到无法克服吗？'
  ],[4,5,7,8]),sources:[['原作者量表与使用说明','https://www.cmu.edu/dietrich/psychology/stress-immunity-disease-lab/scales/index.html'],['原作者 PSS-10 计分方法','https://www.cmu.edu/dietrich/psychology/stress-immunity-disease-lab/scales/html/pssscoring.html']],license:'Cohen、Kamarck、Mermelstein；PSS-10。中文为本站辅助译文，正式使用的许可与语言版本信息见原作者页面。',method:'每题 0–4 分；第 4、5、7、8 项按 4 − 回答值反向计分，其余直接计分。相加得到 0–40 分，分数越高表示感知压力越大。原作者没有诊断分界值，不将分数划分为低、中、高压力，不换算成常模百分位。'};
  for(const key of ['sds','sas','pss'])A.tests[key].count=A.tests[key].questions.length;
  A.score=function(kind,answers){
    if(!['sds','sas','pss'].includes(kind))return previous(kind,answers);
    const t=A.tests[kind];if(!Array.isArray(answers)||answers.length!==t.count||[...answers].some(v=>!t.choices.some(c=>c.value===v)))throw Error('请完成所有题目。');
    const raw=answers.reduce((sum,value,i)=>sum+(t.questions[i].reverse?(kind==='pss'?4:5)-value:value),0);
    if(kind==='pss')return {total:raw,max:40,severity:'感知压力得分',further:false};
    const total=Math.floor(raw*1.25);return {total,raw,max:100,severity:'标准分 · '+(kind==='sds'?'抑郁症状自评':'焦虑症状自评'),further:total>=(kind==='sds'?53:50),support:kind==='sds'&&answers[18]>1};
  };
  if(typeof module!=='undefined'&&module.exports)module.exports=A;
})(typeof window!=='undefined'?window:globalThis);
