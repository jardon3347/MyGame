/* stocks.js — 股票列表 + 详情 */

Pages.stocks = {
  _currentTab: 'holdings',
  render(app) {
    const s = State.data;
    let totalValue = 0;
    let totalCost = 0;
    s.stocks.forEach(st => {
      const price = s.stockPrices[st.code] || 0;
      totalValue += st.shares * price;
      totalCost += st.shares * st.avgCost;
    });
    const totalPnl = totalValue - totalCost;

    app.innerHTML = `
      <div class="page">
        ${UI.navbar('股票')}
        <div class="topbar">
          <div class="topbar-stats">
            <div class="stat-item">
              <div class="label">持仓市值</div>
              <div class="value">${State.formatMoney(totalValue)}</div>
            </div>
            <div class="stat-item">
              <div class="label">总盈亏</div>
              <div class="value ${totalPnl >= 0 ? 'up' : 'down'}">${totalPnl >= 0 ? '+' : ''}${State.formatMoney(totalPnl)}</div>
            </div>
            <div class="stat-item">
              <div class="label">收益率</div>
              <div class="value ${totalPnl >= 0 ? 'up' : 'down'}">${totalCost > 0 ? State.formatPct(totalPnl/totalCost) : '\u2014'}</div>
            </div>
          </div>
        </div>

        <div class="tab-container" style="margin-bottom:12px;">
          <div class="tab-bar">
            <div class="tab${this._currentTab === 'holdings' ? ' active' : ''}" data-stockstab="holdings" onclick="Pages.stocks.switchTab('holdings')">&#x2705 \u6211\u7684\u6301\u4ed3 (${s.stocks.length})</div>
            <div class="tab${this._currentTab === 'market' ? ' active' : ''}" data-stockstab="market" onclick="Pages.stocks.switchTab('market')">&#x1F4C8 \u80A1\u7968\u5E02\u573A (${DATA.stocks.length})</div>
          </div>
        </div>
        <div id="stocks-tab-content">
          ${this._currentTab === 'market' ? this._renderMarketTab() : this._renderHoldingsTab()}
        </div>

        <div class="section-title">\u73B0\u91D1</div>
        <div class="list-item">
          <div class="list-row">
            <span class="list-label">\u53EF\u7528\u73B0\u91D1</span>
            <span class="list-value">${State.formatMoney(s.cash)}</span>
          </div>
        </div>

        <div class="section-title">\u89C4\u5219</div>
        <div class="list-item">
          <p class="text-sm text-muted" style="line-height:1.6;">
            \u00b7 T+1 \u5236\u5EA6\uFF1A\u4ECA\u5929\u4E70\u5165\u660E\u5929\u624D\u80FD\u5356\u51FA<br>
            \u00b7 \u624B\u7EED\u8D39 0.1% \u00b7 \u5370\u82B1\u7A0E 0.05%\uFF08\u5356\u51FA\u65F6\uFF09<br>
            \u00b7 \u70B9\u51FB\u4EFB\u610F\u80A1\u7968\u53EF\u67E5\u770B K \u7EBF\u4E0E\u8BE6\u60C5
          </p>
        </div>

        ${UI.bottombar()}
      </div>
    `;
  },

  /* 渲染列表部分（供金融页嵌入），不含 NavBar 和底部栏 */
  renderList() {
    const s = State.data;
    return `
      <div class="tab-container" style="margin-bottom:12px;">
        <div class="tab-bar">
          <div class="tab${this._currentTab === 'holdings' ? ' active' : ''}" data-stockstab="holdings" onclick="Pages.stocks.switchTab('holdings')">✅ 我的持仓 (${s.stocks.length})</div>
          <div class="tab${this._currentTab === 'market' ? ' active' : ''}" data-stockstab="market" onclick="Pages.stocks.switchTab('market')">📈 股票市场 (${DATA.stocks.length})</div>
        </div>
      </div>
      <div id="stocks-tab-content">
        ${this._currentTab === 'market' ? this._renderMarketTab() : this._renderHoldingsTab()}
      </div>
      <div class="section-title">现金</div>
      <div class="list-item">
        <div class="list-row">
          <span class="list-label">可用现金</span>
          <span class="list-value">${State.formatMoney(s.cash)}</span>
        </div>
      </div>
    `;
  },

  switchTab(tab) {
    this._currentTab = tab;
    document.querySelectorAll('[data-stockstab]').forEach(t => {
      t.classList.toggle('active', t.getAttribute('data-stockstab') === tab);
    });
    const container = document.getElementById('stocks-tab-content');
    if (tab === 'holdings') {
      container.innerHTML = this._renderHoldingsTab();
    } else {
      container.innerHTML = this._renderMarketTab();
    }
  },

  _renderHoldingsTab() {
    const s = State.data;
    if (s.stocks.length === 0) {
      return '<div class="empty">\u6682\u65E0\u6301\u4ED3\uFF0C\u70B9\u51FB\u300C\u80A1\u7968\u5E02\u573A\u300D\u53EF\u67E5\u770B\u884C\u60C5</div>';
    }
    return '<div class="section-title">\u6211\u7684\u6301\u4ED3 (' + s.stocks.length + ')</div>' +
      s.stocks.map(st => this.holdingRow(st)).join('');
  },

  _renderMarketTab() {
    return '<div class="section-title">\u5168\u90E8\u80A1\u7968 (' + DATA.stocks.length + ')</div>' +
      DATA.stocks.map(st => this.stockRow(st)).join('');
  },

  holdingRow(st) {
    const price = State.data.stockPrices[st.code] || 0;
    const stock = DATA.stocks.find(s => s.code === st.code);
    const value = st.shares * price;
    const cost = st.shares * st.avgCost;
    const pnl = value - cost;
    const pnlPct = cost > 0 ? pnl / cost : 0;
    const hands = Math.floor(st.shares / 100);
    return `
      <div class="list-item" onclick="Router.go('stockDetail',{code:'${st.code}'})" style="cursor:pointer;">
        <div class="list-row">
          <div>
            <div class="font-medium">${stock.name}</div>
            <div class="text-sm text-muted">${st.shares.toLocaleString('zh-CN')} \u80A1\uFF08${hands} \u624B\uFF09@ \u00A5${st.avgCost.toFixed(2)}</div>
          </div>
          <div style="text-align:right;">
            <div class="font-medium">${State.formatMoney(value)}</div>
            <div class="text-sm ${pnl >= 0 ? 'text-up' : 'text-down'}">${pnl >= 0 ? '+' : ''}${State.formatMoney(pnl)} (${State.formatPct(pnlPct)})</div>
          </div>
        </div>
      </div>
    `;
  },

  stockRow(st) {
    const price = State.data.stockPrices[st.code] || 0;
    const holding = State.data.stocks.find(s => s.code === st.code);
    const shares = holding ? holding.shares : 0;
    const hist = (State.data.stockHistory && State.data.stockHistory[st.code]) || [];
    const prevClose = hist.length >= 2 ? hist[hist.length-2].close : st.basePrice;
    const change = price - prevClose;
    const changePct = prevClose > 0 ? change / prevClose : 0;
    return `
      <div class="list-item" onclick="Router.go('stockDetail',{code:'${st.code}'})" style="cursor:pointer;">
        <div class="list-row">
          <div>
            <div class="font-medium">${st.name}</div>
            <div class="text-sm text-muted">${st.code} \u00b7 ${DATA.sectorNames[st.sector] || st.sector}${shares ? ' \u00b7 \u6301\u4ED3 '+shares.toLocaleString('zh-CN') : ''}</div>
          </div>
          <div style="text-align:right;">
            <div class="font-medium">\u00A5${price.toFixed(2)}</div>
            <div class="text-sm ${change >= 0 ? 'text-up' : 'text-down'}">${change >= 0 ? '+' : ''}${change.toFixed(2)} (${State.formatPct(changePct)})</div>
          </div>
        </div>
      </div>
    `;
  }
};

const Stocks = {
  showBuy(code) {
    const stock = DATA.stocks.find(s => s.code === code);
    const price = State.data.stockPrices[code] || 0;
    const maxShares = Math.floor(State.data.cash / (price * 1.001));
    if (maxShares <= 0) { UI.toast('\u73B0\u91D1\u4E0D\u8DB3\uFF0C\u81F3\u5C11\u9700\u8981 \u00A5' + Math.round(price*1.001)); return; }

    UI.numberPicker({
      title: '\u4E70\u5165 ' + stock.name,
      unit: price * 1.001,
      unitName: '\u80A1',
      unitLabel: `\u00A5${price.toFixed(2)}/\u80A1 \u00b7 \u542B\u624B\u7EED\u8D39 \u00b7 1\u624B=100\u80A1`,
      max: maxShares,
      quickAdds: maxShares >= 1000 ? [100, 500, 1000, 5000] : [10, 50, 100, 500],
      onConfirm: (shares) => {
        if (shares <= 0) { UI.toast('\u8BF7\u9009\u62E9\u6570\u91CF'); return; }
        const cost = shares * price;
        const fee = cost * 0.001;
        const total = cost + fee;
        State.data.cash -= total;
        const existing = State.data.stocks.find(s => s.code === code);
        if (existing) {
          const totalShares = existing.shares + shares;
          existing.avgCost = (existing.shares * existing.avgCost + cost) / totalShares;
          existing.shares = totalShares;
        } else {
          State.data.stocks.push({ code, shares, avgCost: price, buyDay: State.data.date.totalDays });
        }
        State.save();
        const hands = Math.floor(shares / 100);
        UI.toast(`\u4E70\u5165 ${shares.toLocaleString('zh-CN')} \u80A1\uFF08${hands} \u624B\uFF09`);
        Router.refresh();
      }
    });
  },

  showSell(code) {
    const stock = DATA.stocks.find(s => s.code === code);
    const holding = State.data.stocks.find(s => s.code === code);
    if (!holding) { UI.toast('\u65E0\u6301\u4ED3'); return; }
    if (State.data.date.totalDays <= (holding.buyDay||0)) {
      UI.toast('T+1 \u9650\u5236\uFF1A\u4ECA\u65E5\u4E70\u5165\u660E\u65E5\u65B9\u53EF\u5356\u51FA');
      return;
    }
    const maxShares = holding.shares;
    const price = State.data.stockPrices[code] || 0;
    const unitNet = price * (1 - 0.001 - 0.0005);

    UI.numberPicker({
      title: '\u5356\u51FA ' + stock.name,
      unit: unitNet,
      unitName: '\u80A1',
      unitLabel: `\u00A5${price.toFixed(2)}/\u80A1 \u00b7 \u6263\u624B\u7EED\u8D39+\u5370\u82B1\u7A0E \u00b7 \u6301\u6709 ${maxShares.toLocaleString('zh-CN')} \u80A1`,
      max: maxShares,
      quickAdds: maxShares >= 1000 ? [100, 500, 1000, 5000] : [10, 50, 100, 500],
      onConfirm: (shares) => {
        if (shares <= 0) { UI.toast('\u8BF7\u9009\u62E9\u6570\u91CF'); return; }
        if (shares > holding.shares) { UI.toast('\u6301\u4ED3\u4E0D\u8DB3'); return; }
        const revenue = shares * price;
        const fee = revenue * 0.001;
        const tax = revenue * 0.0005;
        const net = revenue - fee - tax;
        State.data.cash += net;
        holding.shares -= shares;
        if (holding.shares <= 0) {
          State.data.stocks = State.data.stocks.filter(s => s.code !== code);
        }
        State.save();
        UI.toast(`\u5356\u51FA ${shares.toLocaleString('zh-CN')} \u80A1\uFF0C\u5230\u8D26 ${State.formatMoney(net)}`);
        Router.refresh();
      }
    });
  }
};

window.Stocks = Stocks;