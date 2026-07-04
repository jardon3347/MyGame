/* stocks.js — 股票列表 + 详情 */

Pages.stocks = {
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
              <div class="value ${totalPnl >= 0 ? 'up' : 'down'}">${totalCost > 0 ? State.formatPct(totalPnl/totalCost) : '—'}</div>
            </div>
          </div>
        </div>

        <div class="section-title">我的持仓（${s.stocks.length}）</div>
        ${s.stocks.length === 0 ? '<div class="empty">暂无持仓，下方行情可点击查看</div>' :
          s.stocks.map(st => this.holdingRow(st)).join('')}

        <div class="section-title">全部股票（${DATA.stocks.length}）</div>
        ${DATA.stocks.map(st => this.stockRow(st)).join('')}

        <div class="section-title">现金</div>
        <div class="list-item">
          <div class="list-row">
            <span class="list-label">可用现金</span>
            <span class="list-value">${State.formatMoney(s.cash)}</span>
          </div>
        </div>

        <div class="section-title">规则</div>
        <div class="list-item">
          <p class="text-sm text-muted" style="line-height:1.6;">
            · T+1 制度：今天买入明天才能卖出<br>
            · 手续费 0.1% · 印花税 0.05%（卖出时）<br>
            · 点击任意股票可查看 K 线与详情
          </p>
        </div>

        ${UI.bottombar()}
      </div>
    `;
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
            <div class="text-sm text-muted">${st.shares.toLocaleString('zh-CN')} 股（${hands} 手）@ ¥${st.avgCost.toFixed(2)}</div>
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
            <div class="text-sm text-muted">${st.code} · ${DATA.sectorNames[st.sector] || st.sector}${shares ? ' · 持仓 '+shares.toLocaleString('zh-CN') : ''}</div>
          </div>
          <div style="text-align:right;">
            <div class="font-medium">¥${price.toFixed(2)}</div>
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
    if (maxShares <= 0) { UI.toast('现金不足，至少需要 ¥' + Math.round(price*1.001)); return; }

    UI.numberPicker({
      title: '买入 ' + stock.name,
      unit: price * 1.001,
      unitName: '股',
      unitLabel: `¥${price.toFixed(2)}/股 · 含手续费 · 1手=100股`,
      max: maxShares,
      quickAdds: maxShares >= 1000 ? [100, 500, 1000, 5000] : [10, 50, 100, 500],
      onConfirm: (shares) => {
        if (shares <= 0) { UI.toast('请选择数量'); return; }
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
        UI.toast(`买入 ${shares.toLocaleString('zh-CN')} 股（${hands} 手）`);
        Router.refresh();
      }
    });
  },

  showSell(code) {
    const stock = DATA.stocks.find(s => s.code === code);
    const holding = State.data.stocks.find(s => s.code === code);
    if (!holding) { UI.toast('无持仓'); return; }
    if (State.data.date.totalDays <= (holding.buyDay||0)) {
      UI.toast('T+1 限制：今日买入明日方可卖出');
      return;
    }
    const maxShares = holding.shares;
    const price = State.data.stockPrices[code] || 0;
    const unitNet = price * (1 - 0.001 - 0.0005);

    UI.numberPicker({
      title: '卖出 ' + stock.name,
      unit: unitNet,
      unitName: '股',
      unitLabel: `¥${price.toFixed(2)}/股 · 扣手续费+印花税 · 持有 ${maxShares.toLocaleString('zh-CN')} 股`,
      max: maxShares,
      quickAdds: maxShares >= 1000 ? [100, 500, 1000, 5000] : [10, 50, 100, 500],
      onConfirm: (shares) => {
        if (shares <= 0) { UI.toast('请选择数量'); return; }
        if (shares > holding.shares) { UI.toast('持仓不足'); return; }
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
        UI.toast(`卖出 ${shares.toLocaleString('zh-CN')} 股，到账 ${State.formatMoney(net)}`);
        Router.refresh();
      }
    });
  }
};

window.Stocks = Stocks;
