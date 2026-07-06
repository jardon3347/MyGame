/* bank.js - 银行页（存款、贷款、利率） */

Pages.deposit = {
  render(app) {
    const s = State.data;
    const rate = s.interestRate || DATA.bank.baseRate;
    const baseRate = DATA.bank.baseRate;
    const rateDiff = rate - baseRate;
    const rateTrend = rateDiff > 0.002 ? '↑' : (rateDiff < -0.002 ? '↓' : '→');
    const rateTrendClass = rateDiff > 0.002 ? 'up' : (rateDiff < -0.002 ? 'down' : '');
    const dailyInterest = s.deposit * rate / 365;
    const loanRate = rate * DATA.bank.loanRateMultiplier;
    const dailyLoanInterest = (s.loan || 0) * loanRate / 365;
    const maxLoan = Math.floor(s.cash * DATA.bank.maxLoanRatio);

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
        </div>

        <div class="section-title">说明</div>
        <div class="list-item">
          <p class="text-sm text-muted" style="line-height:1.6;">
            · 利率随市场波动，受新闻事件影响（基准 ${(baseRate*100).toFixed(1)}%，当前 ${(rate*100).toFixed(2)}%）<br>
            · 贷款利率 = 存款利率 × ${DATA.bank.loanRateMultiplier}（当前年化 ${(loanRate*100).toFixed(2)}%）<br>
            · 最高贷款额 = 现金 × ${(DATA.bank.maxLoanRatio*100).toFixed(0)}%（当前可贷 ${State.formatMoney(maxLoan)}）<br>
            · 贷款利息每日自动扣除<br>
            · 利率每天有微小波动，关注新闻把握存取时机
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
    UI.prompt('存入存款', `存入金额（最多 ${State.formatMoney(max)}）`, '请输入金额', '', (val) => {
      if (val <= 0) { UI.toast('金额需大于 0'); return; }
      if (val > State.data.cash) { UI.toast('现金不足'); return; }
      State.data.cash -= val;
      State.data.deposit += val;
      State.save();
      UI.toast('存入成功');
      Router.refresh();
    });
  },

  showWithdraw() {
    const max = State.data.deposit;
    if (max <= 0) { UI.toast('存款为 0'); return; }
    UI.prompt('取出存款', `取出金额（最多 ${State.formatMoney(max)}）`, '请输入金额', '', (val) => {
      if (val <= 0) { UI.toast('金额需大于 0'); return; }
      if (val > State.data.deposit) { UI.toast('存款不足'); return; }
      State.data.deposit -= val;
      State.data.cash += val;
      State.save();
      UI.toast('取出成功');
      Router.refresh();
    });
  },

  showLoan() {
    if ((State.data.loan || 0) > 0) { UI.toast('请先还清贷款'); return; }
    const maxLoan = Math.floor(State.data.cash * DATA.bank.maxLoanRatio);
    if (maxLoan <= 0) { UI.toast('现金不足，无法贷款'); return; }
    UI.prompt('申请贷款', `贷款金额（最多 ${State.formatMoney(maxLoan)}）<br>利率 ${(State.data.interestRate * DATA.bank.loanRateMultiplier * 100).toFixed(1)}%/年`, '请输入金额', '', (val) => {
      if (val <= 0) { UI.toast('金额需大于 0'); return; }
      if (val > maxLoan) { UI.toast('贷款额度不足'); return; }
      State.data.loan = (State.data.loan || 0) + val;
      State.data.cash += val;
      State.save();
      UI.toast('贷款成功');
      Router.refresh();
    });
  },

  showRepay() {
    const loan = State.data.loan || 0;
    if (loan <= 0) { UI.toast('无贷款'); return; }
    const maxRepay = Math.min(State.data.cash, loan);
    if (maxRepay <= 0) { UI.toast('现金不足，无法还款'); return; }
    UI.prompt('还款', `当前贷款 ${State.formatMoney(loan)}<br>还款金额（最多 ${State.formatMoney(maxRepay)}）`, '请输入金额', '', (val) => {
      if (val <= 0) { UI.toast('金额需大于 0'); return; }
      if (val > maxRepay) { UI.toast('现金不足'); return; }
      State.data.loan = loan - val;
      State.data.cash -= val;
      if (State.data.loan <= 0) State.data.loan = 0;
      State.save();
      UI.toast('还款成功');
      Router.refresh();
    });
  }
};

window.Deposit = Deposit;
