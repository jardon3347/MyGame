/* deposit.js — 存款页 */

Pages.deposit = {
  render(app) {
    const s = State.data;
    const rate = DATA.deposit.annualRate;
    const dailyInterest = s.deposit * rate / 365;

    app.innerHTML = `
      <div class="page">
        ${UI.navbar('存款')}
        <div class="topbar">
          <div class="topbar-stats">
            <div class="stat-item">
              <div class="label">存款余额</div>
              <div class="value">${State.formatMoney(s.deposit)}</div>
            </div>
            <div class="stat-item">
              <div class="label">年化利率</div>
              <div class="value">${(rate*100).toFixed(1)}%</div>
            </div>
            <div class="stat-item">
              <div class="label">日利息</div>
              <div class="value up">${State.formatMoney(dailyInterest)}</div>
            </div>
          </div>
        </div>

        <div class="section-title">操作</div>
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
            · 存款按年化 ${(rate*100).toFixed(1)}% 计息，每日结算<br>
            · 随时存取，无手续费<br>
            · 适合存放闲置资金，安全保本
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
  }
};

window.Deposit = Deposit;
