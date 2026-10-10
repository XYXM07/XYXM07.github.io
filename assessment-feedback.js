(function(root){
  'use strict';
  function evaluate(kind,score,answers,test){
    const common=['留意这些感受是否持续，以及它们对睡眠、工作、学习和人际关系的影响。','可以记录一周的状态；如果困扰持续或影响生活，寻求心理健康专业人员的帮助。'];
    const out={title:'本次回答的解读',summary:'这份结果描述本次作答，不能替代完整评估。',details:[],actions:common};
    if(kind==='mbti'){
      out.title='偏好组合 '+score.code;out.summary='这是本站原创问卷的偏好描述。每个维度都是连续的；X 表示两侧相同，环境与经历也会影响回答。';
      const explanations=[['更倾向通过交流与外部活动获得能量。','更倾向通过独处与内部思考恢复能量。'],['更重视具体事实、经验与可观察的信息。','更重视可能性、关联与整体方向。'],['做决定时更倾向分析原则、逻辑与一致性。','做决定时更倾向考虑价值、感受与对人的影响。'],['更喜欢有计划、明确安排与及时收束。','更喜欢保留选择，随新信息灵活调整。']];
      out.details=score.rows.map((r,i)=>({title:r.left+' / '+r.right,text:r.net===0?'本次两侧偏好相近，可能随情境变化。':explanations[i][r.net>0?0:1]}));out.actions=['选一个最近的真实情境，看看这些描述是否符合你的行为。','把偏好用于沟通和自我理解，不用它限制职业、能力或关系。'];return out;
    }
    if(kind==='ipip'){
      const names=['外向性','宜人性','尽责性','情绪稳定性','开放性'],ends=[['安静、保留与独处','社交、活跃与表达'],['审慎、直率与保持距离','合作、体谅与信任'],['灵活、随性与即兴','有序、可靠与坚持'],['更容易注意到压力与情绪波动','更平静、较少被压力扰动'],['熟悉、具体与实用的经验','想象、探索与多样的体验']];
      out.summary='以下是正反向计分后的项目平均分与维度含义。没有本地常模，因此不报告人群百分位，也不判断你比别人高或低。';
      out.details=score.rows.map((r,i)=>({title:names[i]+' · 项目平均分 '+(r.total/10).toFixed(1),text:'本次回答'+(r.total===30?'处在量尺中点附近。':r.total>30?'偏向“符合”一侧。':'偏向“不符合”一侧。')+'此维度从“'+ends[i][0]+'”到“'+ends[i][1]+'”反映不同倾向，两侧都有适用情境。'}));out.actions=['结合实际行为，观察哪些习惯给你帮助、哪些需要调整。','没有“最好”的人格分数；避免用单次结果给自己或别人贴标签。'];return out;
    }
    if(kind==='holland'){
      const domains={R:'动手制作、设备操作、户外与实物工作',I:'分析问题、探索原理、研究与实验',A:'设计、创作、表演与表达',S:'教学、辅导、照护与帮助他人',E:'组织项目、沟通说服、经营与领导',C:'数据整理、记录核对、流程与秩序'};
      const top=score.groups[0];out.title='本次最感兴趣：'+top.keys.join(' / ');out.summary='按六类活动的兴趣评分比较你自己的偏好；并列维度同样保留。兴趣不等于已经具备的能力，也不是职业适合度。';out.details=score.ranked.slice(0,3).map(r=>({title:r.key+' · '+r.name,text:'分数 '+r.total+'；可以探索 '+domains[r.key]+'。'}));out.actions=['选择一个感兴趣方向，先用短课程、志愿活动或小项目实际体验。','结合能力、价值观、学习机会和工作环境，再逐步缩小方向。'];return out;
    }
    if(kind==='pss'){
      const ranked=test.questions.map((q,i)=>({q,value:q.reverse?4-answers[i]:answers[i]})).sort((a,b)=>b.value-a.value);out.title='感知压力得分 '+score.total;out.summary='这个分数描述过去一个月的压力体验，越高表示感受到的不可控与负担越多。PSS 没有官方高、中、低分界，不据此判断疾病。';out.details=ranked.filter(r=>r.value>=3).slice(0,3).map(r=>({title:'值得留意的回答',text:r.q.text+'（按压力方向计分，'+r.value+' 分）'}));out.actions=['区分可控制与暂时不可控制的事情，先完成一个小而具体的步骤。','给休息、规律作息和支持性交流留出时间；可与专业人员讨论持续的压力。'];return out;
    }
    if(kind==='who5'){out.title=score.further?'建议进一步了解近期状态':'本次未触发进一步评估条件';out.summary=score.further?'原始分低于 13，或至少一项为 0–1 分，触发原版进一步评估建议。可以进一步讨论情绪、精力与生活状态。':'本次回答没有触发原版进一步评估条件，仍可关注幸福感的变化。没有触发提示也不代表排除其他困扰。';}
    else if(kind==='sds'||kind==='sas'){
      const threshold=kind==='sds'?53:50;out.title=score.further?'达到进一步评估参考分数':'本次低于进一步评估参考分数';out.summary='标准分 '+score.total+'，原始分 '+score.raw+'；采用'+threshold+' 分的参考分界。'+(score.further?'建议结合持续时间与生活影响进一步评估。':'这次未达到该参考分界，但分数不能排除具体困扰。')+'辅助译文未经本站信效度验证，不由单次分数诊断疾病。';
      if(kind==='sas'&&score.total>=50)out.details.push({title:'症状程度参考',text:(score.total<60?'50–59 分：轻度':score.total<70?'60–69 分：中度':'70 分及以上：较重')+'焦虑症状范围。描述症状评分，不等同于焦虑障碍诊断。'});
    }else if(kind==='phq9'||kind==='gad7'){out.title=score.severity+'症状范围';out.summary='本次总分 '+score.total+'，属于该量表的“'+score.severity+'”症状范围。'+(score.further?'达到进一步评估参考值，建议结合持续时间、功能影响与专业访谈了解情况。':'当前总分较低，也应关注具体困扰及它们对生活的影响。');}
    else if(kind==='cesd'||kind==='cesdr'){out.title=score.further?'建议进一步评估':'本次低于常用筛查参考条件';out.summary=kind==='cesdr'?score.severity+'。这是原计分算法对症状组合的提示，不能单独确诊。':'总分 '+score.total+'；16 分为常用进一步评估参考值。请结合近期实际生活影响解读，不由该分数单独确诊。';}
    else if(kind==='hamd'){out.title='专业评定记录解读';out.summary='HAM-D 需要由合格专业人员结合访谈与观察评定。总分 '+score.total+' 不是自行诊断依据；不同版本与场景的解释范围也不同。';out.details=test.questions.map((q,i)=>({q,value:answers[i]})).filter(r=>r.value>0).sort((a,b)=>b.value-a.value).slice(0,3).map(r=>({title:'本次较高分项目',text:r.q.text+' · '+r.value+' 分；需结合该项目访谈与观察记录解释。'}));out.actions=['由评定人员核对每项锚点与访谈记录，避免只看总分。','需要复测时尽量使用相同版本和评定条件。'];}
    if(score.support)out.actions.unshift('相关回答值得认真对待：与可信任的人或专业人员谈谈；如果你现在可能伤害自己，请立即联系当地急救或前往急诊。');
    return out;
  }
  const api={evaluate};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.AssessmentFeedback=api;
})(typeof window!=='undefined'?window:globalThis);
