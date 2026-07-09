/* events.js — 天敌事件系统：定义、判定、应对 */

const DisasterEvents = {

  /* ===== 事件定义 ===== */
  _definitions: [
    // 农业
    { id: 'drought',    industry: 'farm',  name: '旱灾',     chance: 0.06, duration: 3,
      desc: '持续干旱导致作物减产', effect: { type: 'output', reduction: 0.6 },
      options: [
        { label: '承受减产损失', cost: 0, result: '产量 -60%，持续3天' }
      ] },
    { id: 'storm',      industry: 'farm',  name: '暴雨',     chance: 0.06, duration: 2,
      desc: '强暴雨冲刷农田', effect: { type: 'output', reduction: 0.4 },
      options: [
        { label: '承受减产损失', cost: 0, result: '产量 -40%，持续2天' }
      ] },
    { id: 'pest',       industry: 'farm',  name: '虫害',     chance: 0.05, duration: 5,
      desc: '大规模虫害侵袭农田', effect: { type: 'output', reduction: 0.3, perDay: true },
      options: [
        { label: '花钱扑灭 ¥60000',  cost: 60000,  result: '立即消灭虫害，恢复生产' },
        { label: '承受减产损失',     cost: 0,      result: '产量 -30%/天，持续5天' }
      ] },

    // 冶金
    { id: 'supply_cut', industry: 'metall', name: '原料断供', chance: 0.05, duration: 2,
      desc: '上游供应商原料断供，生产停工', effect: { type: 'shutdown' },
      options: [
        { label: '紧急采购 ¥40000', cost: 40000, result: '恢复原料供应，继续生产' },
        { label: '停工等待恢复',    cost: 0,     result: '停工2天，无产出' }
      ] },
    { id: 'breakdown',  industry: 'metall', name: '设备故障', chance: 0.04, duration: 1,
      desc: '冶炼设备突发故障', effect: { type: 'shutdown' },
      options: [
        { label: '支付 ¥30000 维修', cost: 30000, result: '支付维修费，当天可恢复' },
        { label: '停工等待',         cost: 0,     result: '停工1天 + 下次故障概率翻倍' }
      ] },

    // 工厂
    { id: 'order_fail', industry: 'factory', name: '订单违约', chance: 0.04, duration: 0,
      desc: '客户订单出现质量问题，要求赔偿', effect: { type: 'fine' },
      options: [
        { label: '支付罚款 ¥80000', cost: 80000, result: '支付 ¥50000~120000 罚款，即时了结' },
        { label: '协商分期付款',   cost: 0,     result: '罚款翻倍 ¥100000~240000' }
      ] },
    { id: 'qc_check',   industry: 'factory', name: '质检抽查', chance: 0.03, duration: 3,
      desc: '质检部门突击抽查，产品需降价销售', effect: { type: 'price', reduction: 0.3 },
      options: [
        { label: '疏通质检员 ¥25000', cost: 25000, result: '产品恢复正常销售' },
        { label: '降价销售',          cost: 0,     result: '产品价格 -30%，持续3天' }
      ] },

    // 矿业
    { id: 'flood',      industry: 'mining', name: '矿井渗水', chance: 0.04, duration: 4,
      desc: '矿井突发渗水事故，需停产维修', effect: { type: 'shutdown' },
      options: [
        { label: '支付 ¥60000 维修', cost: 60000, result: '排水维修，恢复生产' },
        { label: '承受停产损失',     cost: 0,     result: '停产4天，无产出' }
      ] },
    { id: 'depletion',  industry: 'mining', name: '矿脉贫化', chance: 0.05, duration: -1,
      desc: '当前开采的矿脉品位下降，产出减少', effect: { type: 'output', reduction: 0.25, permanent: true },
      options: [
        { label: '花 ¥150000 勘探新矿脉', cost: 150000, result: '发现新矿脉，恢复产出' },
        { label: '继续开采',               cost: 0,      result: '产出永久 -25%' }
      ] }
  ],

  /* 获取当前经济周期的天敌倍率 */
  _disasterMult() {
    const phase = State.data.economicPhase || 'stable';
    const cfg = DATA.economicCycle.phases.find(p => p.id === phase);
    return cfg ? cfg.disasterMult : 1.0;
  },

  /* 获取产业显示名称（图标+名称） */
  _getIndustryName(type, category) {
    const indData = DATA.industries[type];
    const cat = State.findIndustryCategory(type, category);
    return (indData ? indData.icon + ' ' : '') + (cat ? cat.name : category);
  },

  /* 每日判定：调度式触发天敌事件（15-30天冷却） */
  roll(dayLog) {
    if (!State.data.industries || State.data.industries.length === 0) return null;
    const phase = State.data.economicPhase || 'stable';
    const isDepression = phase === 'depression';
    const mult = this._disasterMult();
    const now = State.data.date.totalDays;

    // 初始化下次天敌事件日
    if (State.data.nextDisasterDay == null) {
      State.data.nextDisasterDay = now + 15 + Math.floor(Math.random() * 16); // 15-30天
    }

    // 还在冷却期内，不触发
    if (now < State.data.nextDisasterDay) return null;

    // 冷却结束，确定是否触发（50%概率触发，否则再等5-10天）
    if (Math.random() > 0.5) {
      State.data.nextDisasterDay = now + 5 + Math.floor(Math.random() * 6);
      return null;
    }

    const triggered = [];

    // 萧条期裁员潮（独立于普通天敌事件）
    if (isDepression && Math.random() < 0.3) {
      const resignCount = 1 + Math.floor(Math.random() * 2);
      triggered.push({ id: 'layoff_wave_' + Date.now(), type: 'layoff',
        name: '裁员潮', desc: '经济萧条导致公司裁员，' + resignCount + '名员工主动离职',
        effect: { type: 'resign', count: resignCount },
        options: [ { label: '承受损失', cost: 0, result: resignCount + '名员工离职' } ] });
    }

    // 天敌事件：随机选一个产业类型 + 一个事件定义
    const typesOwned = {};
    State.data.industries.forEach(ind => {
      if (!typesOwned[ind.type]) typesOwned[ind.type] = [];
      typesOwned[ind.type].push(ind);
    });
    // 收集所有可用事件定义
    const allDefs = [];
    Object.keys(typesOwned).forEach(type => {
      this._definitions.filter(d => d.industry === type).forEach(def => {
        allDefs.push({ def: def, instances: typesOwned[type] });
      });
    });

    if (allDefs.length > 0) {
      // 随机选一个事件定义（概率受周期影响，但不影响触发频率）
      const pick = allDefs[Math.floor(Math.random() * allDefs.length)];
      const def = pick.def;
      const target = pick.instances[Math.floor(Math.random() * pick.instances.length)];
      triggered.push({
        id: def.id + '_' + target.type + '_' + target.category + '_' + Date.now(),
        name: def.name,
        type: 'disaster',
        definition: def,
        industryType: target.type,
        industryCategory: target.category,
        industryName: this._getIndustryName(target.type, target.category),
        desc: def.desc,
        duration: def.duration,
        effect: def.effect,
        options: def.options
      });
    }

    // 设定下次触发日：15-30天后（萧条期缩短至10-20天）
    const baseMin = isDepression ? 10 : 15;
    const baseRange = isDepression ? 11 : 16;
    State.data.nextDisasterDay = now + baseMin + Math.floor(Math.random() * baseRange);

    if (triggered.length > 0 && dayLog) {
      triggered.forEach(t => {
        dayLog.details.push({ label: '⚠ ' + t.name + ' — ' + t.desc, amount: 0, type: 'warn' });
        // 写入新闻历史
        if (!State.data.news) State.data.news = [];
        State.data.news.unshift({
          id: t.id,
          title: '⚠ 突发事件：' + t.name,
          desc: t.desc + (t.industryName ? '（受影响：' + t.industryName + '）' : ''),
          type: 'disaster',
          date: Engine.dateString(),
          day: State.data.date.totalDays
        });
      });
    }
    return triggered;
  },

  /* 应用事件效果到产业数据 */
  apply(event) {
    if (!State.data.activeEvents) State.data.activeEvents = [];
    const now = State.data.date.totalDays;

    const eff = event.effect || {};
    if (eff.type === 'resign') {
      // 裁员潮：标记为活跃事件，具体离职由 employees.js 处理
      State.data.activeEvents.push({
        id: event.id,
        name: event.name,
        type: 'resign',
        resignCount: eff.count,
        startDay: now,
        duration: 1
      });
      return;
    }

    if (event.definition) {
      const def = event.definition;
      // 标记目标产业受影响
      const target = State.data.industries.find(i =>
        i.type === event.industryType && i.category === event.industryCategory);
      if (!target) return;

      // 记录活跃事件
      State.data.activeEvents.push({
        id: event.id,
        name: event.name,
        desc: event.desc,
        definitionId: def.id,
        industryType: event.industryType,
        industryCategory: event.industryCategory,
        effect: def.effect,
        startDay: now,
        duration: def.duration > 0 ? def.duration : (def.duration === -1 ? 9999 : 1),
        resolved: false
      });
    }
  },

  /* 应用事件到产出/价格（在每日结算各阶段调用） */
  getOutputMult(type, category) {
    let mult = 1.0;
    if (!State.data.activeEvents) return mult;
    State.data.activeEvents.forEach(e => {
      if (e.resolved) return;
      if (e.industryType === type && e.industryCategory === category && e.effect) {
        if (e.effect.type === 'output') {
          mult *= (1 - e.effect.reduction);
        }
        if (e.effect.type === 'shutdown') {
          mult = 0;
        }
      }
    });
    return mult;
  },

  /* 获取产品价格倍率（质检抽查导致降价） */
  getProductPriceMult(type, category) {
    if (type !== 'factory') return 1.0;
    if (!State.data.activeEvents) return 1.0;
    let mult = 1.0;
    State.data.activeEvents.forEach(e => {
      if (e.resolved) return;
      if (e.industryType === type && e.industryCategory === category && e.effect) {
        if (e.effect.type === 'price') {
          mult *= (1 - e.effect.reduction);
        }
      }
    });
    return mult;
  },

  /* 每日处理活跃事件到期 */
  processActiveEvents(dayLog) {
    if (!State.data.activeEvents) State.data.activeEvents = [];
    const now = State.data.date.totalDays;
    State.data.activeEvents = State.data.activeEvents.filter(e => {
      if (e.resolved) return false;
      if (e.duration <= 0) return false;
      const elapsed = now - e.startDay;
      if (elapsed >= e.duration) {
        if (dayLog) dayLog.details.push({ label: '✅ ' + e.name + ' 已结束', amount: 0, type: 'info' });
        return false;
      }
      return true;
    });
  },

  /* 事件应对弹窗 */
  showResponse(events) {
    if (!events || events.length === 0) return;
    const event = events[0]; // 一次最多处理一个事件
    let html = `<div style="margin-bottom:12px;">
      <div style="font-size:24px;margin-bottom:4px;">⚠️ ${event.name}</div>
      <p style="font-size:14px;color:var(--text-secondary);line-height:1.6;">${event.desc}</p>
    </div>`;

    if (event.definition) {
      html += `<div class="text-sm text-muted" style="margin-bottom:8px;">受影响：${event.industryName || event.industryCategory}</div>`;

      const def = event.definition;
      html += '<div style="margin-top:12px;">';
      if (def.duration > 0) {
        html += `<p class="text-sm" style="margin-bottom:12px;color:var(--down);">后果：${def.effect.type === 'output' ? '产出 -' + Math.round(def.effect.reduction*100) + '%' : def.effect.type === 'shutdown' ? '停产' : '罚款'}，持续 ${def.duration} 天</p>`;
      } else if (def.duration === -1) {
        html += `<p class="text-sm" style="margin-bottom:12px;color:var(--down);">后果：永久生效</p>`;
      } else {
        html += `<p class="text-sm" style="margin-bottom:12px;color:var(--down);">后果：即时生效</p>`;
      }
      html += '<div class="card-grid">';
      event.options.forEach((opt, idx) => {
        const enabled = opt.cost <= 0 || (State.data.cash >= opt.cost);
        html += `<button class="card full" style="margin-bottom:8px;${!enabled ? 'opacity:0.4;' : ''}" onclick="DisasterEvents._handleResponse('${event.id}', ${idx})" ${!enabled ? 'disabled' : ''}>
          <div class="card-title">${opt.label}</div>
          <div class="card-sub">${opt.result}</div>
        </button>`;
      });
      html += '</div>';
    } else {
      // 裁员潮等无选项事件
      html += `<button class="btn primary full" onclick="DisasterEvents._dismissEvent('${event.id}')">我知道了</button>`;
    }

    UI.modal('⚠️ 突发事件', html, [
      { label: '关闭（承受损失）', onclick: 'DisasterEvents._dismissAll()' }
    ]);
  },

  /* 关闭事件弹窗（不花钱=承受损失，事件已在 activeEvents 中生效） */
  _dismissAll() {
    this._pendingEvents = [];
    UI.closeModal();
  },

  /* 处理事件应对选择 */
  _handleResponse(eventId, optionIdx) {
    // 查找触发的事件
    const events = this._pendingEvents || [];
    const event = events.find(e => e.id === eventId);
    if (!event) { UI.closeModal(); return; }

    const chosen = event.options[optionIdx];
    if (!chosen) { UI.closeModal(); return; }

    // 扣钱
    if (chosen.cost > 0) {
      if (State.data.cash < chosen.cost) {
        UI.toast('现金不足！');
        return;
      }
      State.data.cash -= chosen.cost;
    }

    // 如果选择了花钱解决，标记事件为"已解决"（不产生效果）
    if (chosen.cost > 0 && event.definition) {
      if (State.data.activeEvents) {
        State.data.activeEvents.forEach(e => {
          if (e.definitionId === event.definition.id &&
              e.industryType === event.industryType &&
              e.industryCategory === event.industryCategory) {
            e.resolved = true;
          }
        });
      }
      UI.toast('已支付 ¥' + chosen.cost.toLocaleString('zh-CN') + '，事件已解决');
    } else {
      UI.toast('你选择了承受损失');
    }

    State.save();
    this._pendingEvents = [];
    UI.closeModal();
    Router.refresh();
  },

  /* 关闭无选项事件（裁员潮等） */
  _dismissEvent(eventId) {
    const events = this._pendingEvents || [];
    const event = events.find(e => e.id === eventId);
    if (event && event.effect && event.effect.type === 'resign') {
      // 触发离职
      if (window.Events) {
        EventSystem.fireResignations(event.effect.count || 1);
      }
    }
    this._pendingEvents = [];
    UI.closeModal();
  },

  /* 存储当前待处理事件（供弹窗使用） */
  _pendingEvents: [],

  /* 事后解决活跃事件（概览页"花钱解决"按钮调用） */
  _resolveActive(eventId) {
    const e = (State.data.activeEvents || []).find(x => x.id === eventId);
    if (!e || e.resolved) { UI.toast('事件已解决或不存在'); return; }
    const def = this._definitions.find(d => d.id === e.definitionId);
    if (!def || !def.options) { UI.toast('该事件无法花钱解决'); return; }
    const resolveOption = def.options.find(o => o.cost > 0);
    if (!resolveOption) { UI.toast('该事件无法花钱解决'); return; }
    if (State.data.cash < resolveOption.cost) {
      UI.toast('现金不足，需要 ¥' + resolveOption.cost.toLocaleString('zh-CN'));
      return;
    }
    UI.confirm('解决事件', '花费 ¥' + resolveOption.cost.toLocaleString('zh-CN') + ' 解决「' + (e.name || def.name) + '」？\n' + resolveOption.result, () => {
      State.data.cash -= resolveOption.cost;
      e.resolved = true;
      State.save();
      UI.toast('✅ 已解决「' + (e.name || def.name) + '」，花费 ¥' + resolveOption.cost.toLocaleString('zh-CN'));
      Router.refresh();
    });
  }
};

/* ===== 额外事件辅助函数（在 engine.js 中调用） ===== */
const EventSystem = {
  /* 批量离职 */
  fireResignations(count) {
    const emps = State.data.employees || [];
    // 按士气从低到高排序
    const sorted = [...emps].sort((a, b) => (a.morale || 100) - (b.morale || 100));
    const toFire = sorted.slice(0, Math.min(count, sorted.length));
    if (toFire.length === 0) return;
    const names = toFire.map(e => e.name).join('、');
    toFire.forEach(e => {
      State.data.employees = State.data.employees.filter(x => x.id !== e.id);
    });
    UI.toast('😢 ' + toFire.length + ' 名员工离职：' + names);
    State.save();
  },

  /* 获取当前经济周期阶段配置 */
  getPhaseConfig() {
    const phase = State.data.economicPhase || 'stable';
    return DATA.economicCycle.phases.find(p => p.id === phase) || DATA.economicCycle.phases[1];
  },

  /* 获取产品价格倍率（受周期 + 事件叠加影响） */
  getProductPriceMult() {
    return this.getPhaseConfig().productMult || 1.0;
  },

  /* 获取原料价格倍率 */
  getMaterialPriceMult() {
    return this.getPhaseConfig().materialMult || 1.0;
  },

  /* 获取贷款利息倍率 */
  getInterestMult() {
    return this.getPhaseConfig().interestMult || 1.0;
  },

  /* 检查某产业当前是否有活跃的停产事件 */
  isShutdown(type, category) {
    if (!State.data.activeEvents) return false;
    return State.data.activeEvents.some(e =>
      !e.resolved && e.industryType === type && e.industryCategory === category && e.effect &&
      (e.effect.type === 'shutdown' || (e.effect.type === 'output' && e.effect.reduction >= 1))
    );
  },

  /* 检查某产业是否有活跃的减产事件（返回倍率） */
  getOutputReduction(type, category) {
    return DisasterEvents.getOutputMult(type, category);
  }
};

window.DisasterEvents = DisasterEvents;
window.EventSystem = EventSystem;
