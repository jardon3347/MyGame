/* deposit.js — 银行页面（存款、贷款、信用评级、滑块操作） */

Pages.deposit = {
  render(app) {
    const s = State.data;
    const rate = s.interestRate || DATA.bank.baseRate;
    const baseRate = DATA.bank.baseRate;
    const bank = DATA.bank;
    const credit = bank.creditRatings[s.creditRating] || bank.creditRatings[bank.defaultCredit || 'B'];
    const nextRating = (() => {
      const keys = ['A','B','C','D'];
      const idx = keys.indexOf(s.creditRating || bank.defaultCredit);
      if (idx > 0) return bank.creditRatings[keys[idx - 1]];
      return null;
    })();
    const daysToUpgrade = nextRating ? Math.max(0, bank.creditUpgradeDays - (s.creditDaysWithoutLoan || 0)) : 0;
    
    const rateDiff = rate - baseRate;
    const rateTrend = rateDiff > 0.002 ? '↑' : (rateDiff < -0.002 ? '↓' : '→');
    const rateTrendClass = rateDiff > 0.002 ? 'up' : (rateDiff < -0.002 ? 'down' : '');
    const dailyInterest = s.deposit * rate / 365;
    const loanRateMultiplier = credit ? credit.rateMultiplier : bank.loanRateMultiplier;
    const loanRate = rate * loanRateMultiplier;
    const dailyLoanInterest = (s.loan || 0) * loanRate / 365;
    const totalAssets = State.totalAssets();
    const maxLoan = Math.floor(totalAssets * credit.assetRatio);

    // 活跃的利率相关效果
    const rateEffects = (s.activeEffects || []).filter(eff => eff.effects.interestRate != null);

    app.innerHTML = `
      <div class="page">
        ${UI.navbar('银行', false)}
        <div class="topbar">
          <div class="topbar-stats">
            <div class="stat-item">
              <div class="label">存款余额</div>
              <div class="value">${State.formatMoney(s.deposit)}</div>
            </div>
            <div class="stat-item">
              <div class="label">年化利率 ${rateTrend}</div>
              <div class="value ${rateTrendClass}">${(rate*100).toFixed(2)}%</div>
            </div>
            <div class="stat-item">
              <div class="label">日利息</div>
              <div class="value up">${State.formatMoney(dailyInterest)}</div>
            </div>
          </div>
        </div>

        ${rateEffects.length > 0 ? `
        <div class="list-item" style="margin-top:8px; border-left:3px solid var(--warning);">
          <div style="font-size:12px; color:var(--warning); margin-bottom:4px;">⚡ 利率影响因素</div>
          ${rateEffects.map(eff => `
            <div class="flex between" style="font-size:12px;">
              <span>${eff.title}</span>
              <span>剩 ${eff.remainingDays} 天</span>
            </div>
          `).join('')}
        </div>
        ` : ''}

        <div class="section-title">信用评级</div>
        <div class="list-item" style="border-left:3px solid var(--info);">
          <div class="list-row">
            <div>
              <div class="font-medium">${credit.name} 评级</div>
              <div class="text-sm text-muted">
                最高可贷总资产 × ${(credit.assetRatio*100).toFixed(0)}%（${State.formatMoney(maxLoan)}）<br>
                贷款利率 = 存款利率 × ${credit.rateMultiplier.toFixed(1)}
              </div>
            </div>
            <div style="text-align:right;">
              <div style="font-size:22px;font-weight:700;color:${s.creditRating === 'A' ? 'var(--up)' : (s.creditRating === 'D' ? 'var(--down)' : 'var(--warning)')};">${credit.name}</div>
              <div class="text-sm text-muted">评级</div>
            </div>
          </div>
          ${nextRating ? `
          <div class="text-sm text-muted" style="margin-top:6px; padding:4px 8px; background:var(--bg-soft); border-radius:4px;">
            ${s.loan > 0 ? '还款后连续 90 天无贷款 → ' + nextRating.name : '保持无贷款 ' + daysToUpgrade + ' 天 → ' + nextRating.name}
          </div>
          ` : '<div class="text-sm" style="margin-top:6px; color:var(--up);">已达最高评级 AAA</div>'}
        </div>

        <div class="section-title">存款操作</div>
        <div class="card-grid">
          <button class="card" onclick="Deposit.showDeposit()">
            <div class="card-title">存入</div>
            <div class="card-sub">从现金转入存款</div>
          </button>
          <button class="card" onclick="Deposit.showWithdraw()">
            <div class="card-title">取出</div>
            <div class="card-sub">从存款转回现金</div>
          </button>
        </div>

        <div class="section-title">贷款</div>
        ${(s.loan || 0) > 0 ? `
          <div class="list-item">
            <div class="list-row">
              <span class="list-label">当前贷款</span>
              <span class="list-value down">${State.formatMoney(s.loan)}</span>
            </div>
            <div class="list-row">
              <span class="list-label">贷款利率（年化）</span>
              <span class="list-value down">${(loanRate*100).toFixed(2)}%</span>
            </div>
            <div class="list-row">
              <span class="list-label">日利息</span>
              <span class="list-value down">-${State.formatMoney(dailyLoanInterest)}</span>
            </div>
            <div class="mt-8">
              <button class="btn primary sm full" onclick="Deposit.showRepay()">还款</button>
            </div>
          </div>
        ` : `<div class="list-item"><p class="text-sm text-muted">暂无贷款</p></div>`}
        <div class="mt-8">
          <button class="btn sm full" onclick="Deposit.showLoan()" ${(s.loan || 0) > 0 ? 'disabled style="opacity:0.4;"' : ''}>
            ${(s.loan || 0) > 0 ? '已有贷款，请先还款' : `申请贷款（最高 ${State.formatMoney(maxLoan)}）`}
          </button>
        </div>

        <div class="section-title">现金</div>
        <div class="list-item">
          <div class="list-row">
            <span class="list-label">可用现金</span>
            <span class="list-value">${State.formatMoney(s.cash)}</span>
          </div>
          <div class="list-row">
            <span class="list-label">总资产</span>
            <span class="list-value">${State.formatMoney(totalAssets)}</span>
          </div>
        </div>

        <div class="section-title">说明</div>
        <div class="list-item">
          <p class="text-sm text-muted" style="line-height:1.6;">
            · 利率随市场波动，受新闻事件影响（基准 ${(baseRate*100).toFixed(1)}%）<br>
            · 贷款利率 = 存款利率 × 信用评级倍率（当前 ×${loanRateMultiplier.toFixed(1)}，年化 ${(loanRate*100).toFixed(2)}%）<br>
            · 最高贷款 = 总资产 × ${(credit.assetRatio*100).toFixed(0)}%（当前可贷 ${State.formatMoney(maxLoan)}）<br>
            · 连续 90 天无贷款 → 信用升级<br>
            · 连续 30 天有贷款 → 信用降级
          </p>
        </div>

        ${UI.bottombar()}
      </div>
    `;
  }
};

const Deposit = {
  showDeposit() {
    const max = State.data.cash;
    if (max <= 0) { UI.toast('现金不足'); return; }
    UI.capacitySlider({
      title: '存入存款',
      max: max,
      current: 0,
      unitLabel: '存入金额',
      showTotal: false,
      onConfirm: (val) => {
        if (val <= 0) { UI.toast('金额需大于 0'); return; }
        if (val > State.data.cash) { UI.toast('现金不足'); return; }
        State.data.cash -= val;
        State.data.deposit += val;
        State.save();
        UI.toast('存入成功');
        Router.refresh();
      }
    });
    // 实时更新标签
    const id = window._csState ? window._csState.id : null;
    if (id) UI._customLabelUpdater(id, (val) => `存入 ¥${val.toLocaleString('zh-CN')}`);
  },

  showWithdraw() {
    const max = State.data.deposit;
    if (max <= 0) { UI.toast('存款为 0'); return; }
    UI.capacitySlider({
      title: '取出存款',
      max: max,
      current: 0,
      unitLabel: '取出金额',
      showTotal: false,
      onConfirm: (val) => {
        if (val <= 0) { UI.toast('金额需大于 0'); return; }
        if (val > State.data.deposit) { UI.toast('存款不足'); return; }
        State.data.deposit -= val;
        State.data.cash += val;
        State.save();
        UI.toast('取出成功');
        Router.refresh();
      }
    });
    const id = window._csState ? window._csState.id : null;
    if (id) UI._customLabelUpdater(id, (val) => `取出 ¥${val.toLocaleString('zh-CN')}`);
  },

  showLoan() {
    if ((State.data.loan || 0) > 0) { UI.toast('请先还清贷款'); return; }
    const credit = DATA.bank.creditRatings[State.data.creditRating] || DATA.bank.creditRatings[DATA.bank.defaultCredit || 'B'];
    const totalAssets = State.totalAssets();
    const maxLoan = Math.floor(totalAssets * credit.assetRatio);
    if (maxLoan <= 0) { UI.toast('资产不足，无法贷款'); return; }
    UI.capacitySlider({
      title: '申请贷款',
      max: maxLoan,
      current: 0,
      unitLabel: `最高可贷 ${State.formatMoney(maxLoan)}（总资产 × ${(credit.assetRatio*100).toFixed(0)}%）`,
      showTotal: false,
      onConfirm: (val) => {
        if (val <= 0) { UI.toast('金额需大于 0'); return; }
        if (val > maxLoan) { UI.toast('贷款额度不足'); return; }
        State.data.loan = (State.data.loan || 0) + val;
        State.data.cash += val;
        State.save();
        UI.toast('贷款成功');
        Router.refresh();
      }
    });
    const id = window._csState ? window._csState.id : null;
    if (id) UI._customLabelUpdater(id, (val) => `贷款 ¥${val.toLocaleString('zh-CN')}`);
  },

  showRepay() {
    const loan = State.data.loan || 0;
    if (loan <= 0) { UI.toast('无贷款'); return; }
    const maxRepay = Math.min(State.data.cash, loan);
    if (maxRepay <= 0) { UI.toast('现金不足，无法还款'); return; }
    UI.capacitySlider({
      title: '还款',
      max: maxRepay,
      current: 0,
      unitLabel: `当前贷款 ${State.formatMoney(loan)} · 最多还 ${State.formatMoney(maxRepay)}`,
      showTotal: false,
      onConfirm: (val) => {
        if (val <= 0) { UI.toast('金额需大于 0'); return; }
        if (val > maxRepay) { UI.toast('现金不足'); return; }
        State.data.loan = loan - val;
        State.data.cash -= val;
        if (State.data.loan <= 0) State.data.loan = 0;
        State.save();
        UI.toast('还款成功');
        Router.refresh();
      }
    });
    const id = window._csState ? window._csState.id : null;
    if (id) UI._customLabelUpdater(id, (val) => `还款 ¥${val.toLocaleString('zh-CN')}`);
  }
};

window.Deposit = Deposit;
