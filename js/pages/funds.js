/* funds.js — 基金列表 + 详情 */

Pages.funds = {
  render(app) {
    const s = State.data;
    let totalValue = 0;
    let totalCost = 0;
    (s.fundHoldings || []).forEach(h => {
      const price = s.fundPrices[h.code] || 0;
      totalValue += h.shares * price;
      totalCost += h.shares * h.avgCost;
    });
    const totalPnl = totalValue - totalCost;

    app.innerHTML = `
      <div class="page">
        ${UI.navbar('基金')}
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

        <div class="section-title">我的持仓（${(s.fundHoldings||[]).length}）</div>
        ${(s.fundHoldings||[]).length === 0 ? '<div class="empty">暂无持仓，下方基金市场可点击查看</div>' :
          (s.fundHoldings||[]).map(h => this.holdingRow(h)).join('')}

        <div class="section-title">基金市场（${DATA.funds.length} 只）</div>
        ${DATA.funds.map(f => this.fundRow(f)).join('')}

        <div class="section-title">说明</div>
        <div class="list-item">
          <p class="text-sm text-muted" style="line-height:1.6;">
            · 基金按"份"申购/赎回，1 份 = 当前净值<br>
            · 申购费 0.15% · 赎回费 0.25%（持有 &lt;7 天）<br>
            · T+1 制度：今天申购明天确认<br>
            · 风险分散，适合长期配置
          </p>
        </div>

        ${UI.bottombar()}
      </div>
    `;
  },

  holdingRow(h) {
    const price = State.data.fundPrices[h.code] || 0;
    const f = DATA.funds.find(x => x.code === h.code);
    const value = h.shares * price;
    const cost = h.shares * h.avgCost;
    const pnl = value - cost;
    const pnlPct = cost > 0 ? pnl / cost : 0;
    return `
      <div class="list-item" onclick="Router.go('fundDetail',{code:'${h.code}'})" style="cursor:pointer;">
        <div class="list-row">
          <div>
            <div class="font-medium">${f.name}</div>
            <div class="text-sm text-muted">${h.shares.toLocaleString('zh-CN')} 份 @ ¥${h.avgCost.toFixed(4)}</div>
          </div>
          <div style="text-align:right;">
            <div class="font-medium">${State.formatMoney(value)}</div>
            <div class="text-sm ${pnl >= 0 ? 'text-up' : 'text-down'}">${pnl >= 0 ? '+' : ''}${State.formatMoney(pnl)} (${State.formatPct(pnlPct)})</div>
          </div>
        </div>
      </div>
    `;
  },

  fundRow(f) {
    const price = State.data.fundPrices[f.code] || f.basePrice;
    const hist = (State.data.fundHistory && State.data.fundHistory[f.code]) || [];
    const prev = hist.length >= 2 ? hist[hist.length-2].close : f.basePrice;
    const change = price - prev;
    const changePct = prev > 0 ? change / prev : 0;
    const holding = (State.data.fundHoldings||[]).find(h => h.code === f.code);
    return `
      <div class="list-item" onclick="Router.go('fundDetail',{code:'${f.code}'})" style="cursor:pointer;">
        <div class="list-row">
          <div>
            <div class="font-medium">${f.name}</div>
            <div class="text-sm text-muted">${f.code} · ${f.type} · 风险${f.risk}${holding ? ' · 持仓 '+holding.shares.toLocaleString('zh-CN')+' 份' : ''}</div>
          </div>
          <div style="text-align:right;">
            <div class="font-medium">¥${price.toFixed(4)}</div>
            <div class="text-sm ${change >= 0 ? 'text-up' : 'text-down'}">${change >= 0 ? '+' : ''}${State.formatPct(changePct)}</div>
          </div>
        </div>
      </div>
    `;
  }
};

Pages.fundDetail = {
  render(app, params) {
    const code = params.code;
    const f = DATA.funds.find(x => x.code === code);
    if (!f) { Router.back(); return; }
    const s = State.data;
    const price = s.fundPrices[code] || f.basePrice;
    const hist = (s.fundHistory && s.fundHistory[code]) || [];
    const prev = hist.length >= 2 ? hist[hist.length-2].close : f.basePrice;
    const change = price - prev;
    const changePct = prev > 0 ? change / prev : 0;

    let hHigh = 0, hLow = Infinity;
    hist.forEach(h => { if (h.high > hHigh) hHigh = h.high; if (h.low < hLow) hLow = h.low; });
    if (hHigh === 0) hHigh = price;
    if (hLow === Infinity) hLow = price;

    const holding = (s.fundHoldings||[]).find(h => h.code === code);
    const shares = holding ? holding.shares : 0;
    const pnl = holding ? (price - holding.avgCost) * shares : 0;
    const pnlPct = holding && holding.avgCost > 0 ? (price - holding.avgCost) / holding.avgCost : 0;

    app.innerHTML = `
      <div class="page">
        ${UI.navbar(f.name)}
        <div class="topbar">
          <div style="font-size:11px;color:var(--text-secondary);">${f.code} · ${f.type} · 风险等级：${f.risk}</div>
          <div style="font-size:28px;font-weight:600;margin-top:4px;" class="${change >= 0 ? 'text-up' : 'text-down'}">¥${price.toFixed(4)}</div>
          <div class="text-sm ${change >= 0 ? 'text-up' : 'text-down'}">${change >= 0 ? '+' : ''}${price - prev >= 0 ? '+' : ''}${(price-prev).toFixed(4)} (${State.formatPct(changePct)})</div>
        </div>

        <div class="section-title">净值走势（近 ${Math.min(hist.length, 30)} 日）</div>
        <div class="list-item" style="padding:8px;">
          ${this.lineChart(hist.slice(-30), price)}
        </div>

        <div class="section-title">基金数据</div>
        <div class="list-item">
          <div class="list-row"><span class="list-label">昨日净值</span><span class="list-value">¥${prev.toFixed(4)}</span></div>
          <div class="list-row"><span class="list-label">日涨幅</span><span class="list-value ${change >= 0 ? 'up' : 'down'}">${State.formatPct(changePct)}</span></div>
          <div class="list-row"><span class="list-label">历史最高</span><span class="list-value text-up">¥${hHigh.toFixed(4)}</span></div>
          <div class="list-row"><span class="list-label">历史最低</span><span class="list-value text-down">¥${hLow.toFixed(4)}</span></div>
          <div class="list-row"><span class="list-label">基金类型</span><span class="list-value">${f.type}</span></div>
          <div class="list-row"><span class="list-label">风险等级</span><span class="list-value">${f.risk}</span></div>
        </div>

        <div class="section-title">基金简介</div>
        <div class="list-item">
          <p class="text-sm" style="line-height:1.7;">${f.desc}</p>
          <div class="list-row mt-12">
            <span class="list-label">成立规模</span>
            <span class="list-value">${(Math.random()*50+5).toFixed(2)} 亿份</span>
          </div>
          <div class="list-row">
            <span class="list-label">基金经理</span>
            <span class="list-value">${['张明','李华','王志强','陈静','刘伟'][Math.floor(Math.random()*5)]}</span>
          </div>
        </div>

        ${shares > 0 ? `
          <div class="section-title">我的持仓</div>
          <div class="list-item">
            <div class="list-row"><span class="list-label">持仓</span><span class="list-value">${shares.toLocaleString('zh-CN')} 份</span></div>
            <div class="list-row"><span class="list-label">成本</span><span class="list-value">¥${holding.avgCost.toFixed(4)}</span></div>
            <div class="list-row"><span class="list-label">市值</span><span class="list-value">${State.formatMoney(shares*price)}</span></div>
            <div class="list-row"><span class="list-label">浮盈</span><span class="list-value ${pnl >= 0 ? 'up' : 'down'}">${pnl >= 0 ? '+' : ''}${State.formatMoney(pnl)} (${State.formatPct(pnlPct)})</span></div>
          </div>
        ` : ''}

        <div class="section-title">操作</div>
        <div class="flex gap-8">
          <button class="btn primary" style="flex:1;" onclick="Funds.showBuy('${code}')">申购</button>
          <button class="btn ${holding ? 'danger' : ''}" style="flex:1;" ${holding ? '' : 'disabled style="opacity:0.4;flex:1;"'} onclick="Funds.showSell('${code}')">赎回</button>
        </div>

        <div style="height:20px;"></div>
        ${UI.bottombar()}
      </div>
    `;
  },

  /* 折线图（基金净值走势） */
  lineChart(history, currentPrice) {
    if (history.length === 0) return '<div class="empty">暂无历史数据</div>';
    const W = 320, H = 140;
    const padL = 4, padR = 35, padT = 8, padB = 8;
    const chartW = W - padL - padR;
    const chartH = H - padT - padB;

    let pMin = Infinity, pMax = 0;
    history.forEach(h => {
      const v = h.close;
      if (v < pMin) pMin = v;
      if (v > pMax) pMax = v;
    });
    const pad = (pMax - pMin) * 0.15 || pMax * 0.01;
    pMin -= pad; pMax += pad;
    const range = pMax - pMin || 1;

    const n = history.length;
    const step = chartW / Math.max(1, n - 1);

    let pathD = '';
    let areaD = '';
    history.forEach((h, i) => {
      const x = padL + i * step;
      const y = padT + (1 - (h.close - pMin) / range) * chartH;
      pathD += (i === 0 ? 'M' : 'L') + x.toFixed(1) + ' ' + y.toFixed(1) + ' ';
      if (i === 0) areaD += 'M' + x.toFixed(1) + ' ' + (padT+chartH) + ' L' + x.toFixed(1) + ' ' + y.toFixed(1) + ' ';
      else areaD += 'L' + x.toFixed(1) + ' ' + y.toFixed(1) + ' ';
    });
    areaD += 'L' + (padL + (n-1)*step).toFixed(1) + ' ' + (padT+chartH) + ' Z';

    const isUp = history[history.length-1].close >= history[0].close;
    const color = isUp ? '#e24b4a' : '#1d9e75';

    return `
      <svg viewBox="0 0 ${W} ${H}" width="100%" style="max-width:${W}px;display:block;margin:0 auto;">
        <path d="${areaD}" fill="${color}" opacity="0.1"/>
        <path d="${pathD}" fill="none" stroke="${color}" stroke-width="1.5"/>
        <line x1="${padL}" y1="${padT}" x2="${padL+chartW}" y2="${padT}" stroke="#eee" stroke-width="0.5"/>
        <line x1="${padL}" y1="${padT+chartH/2}" x2="${padL+chartW}" y2="${padT+chartH/2}" stroke="#eee" stroke-width="0.5"/>
        <line x1="${padL}" y1="${padT+chartH}" x2="${padL+chartW}" y2="${padT+chartH}" stroke="#eee" stroke-width="0.5"/>
        <text x="${W - padR + 2}" y="${padT+4}" font-size="9" fill="#9a9a9f">${pMax.toFixed(4)}</text>
        <text x="${W - padR + 2}" y="${padT+chartH/2}" font-size="9" fill="#9a9a9f">${((pMax+pMin)/2).toFixed(4)}</text>
        <text x="${W - padR + 2}" y="${padT+chartH}" font-size="9" fill="#9a9a9f">${pMin.toFixed(4)}</text>
      </svg>
    `;
  }
};

const Funds = {
  showBuy(code) {
    const f = DATA.funds.find(x => x.code === code);
    const price = State.data.fundPrices[code] || f.basePrice;
    const unitCost = price * 1.0015;
    const maxShares = Math.floor(State.data.cash / unitCost);
    if (maxShares <= 0) { UI.toast('现金不足'); return; }

    UI.numberPicker({
      title: '申购 ' + f.name,
      unit: unitCost,
      unitName: '份',
      unitLabel: `¥${price.toFixed(4)}/份 · 申购费 0.15%`,
      max: maxShares,
      quickAdds: maxShares >= 10000 ? [100, 1000, 5000, 10000] : [10, 100, 500, 1000],
      onConfirm: (shares) => {
        if (shares <= 0) { UI.toast('请选择数量'); return; }
        const cost = shares * price;
        const fee = cost * 0.0015;
        const total = cost + fee;
        State.data.cash -= total;
        if (!State.data.fundHoldings) State.data.fundHoldings = [];
        const existing = State.data.fundHoldings.find(h => h.code === code);
        if (existing) {
          const totalShares = existing.shares + shares;
          existing.avgCost = (existing.shares * existing.avgCost + cost) / totalShares;
          existing.shares = totalShares;
        } else {
          State.data.fundHoldings.push({ code, shares, avgCost: price, buyDay: State.data.date.totalDays });
        }
        State.save();
        UI.toast(`申购 ${shares.toLocaleString('zh-CN')} 份 ${f.name}`);
        Router.refresh();
      }
    });
  },

  showSell(code) {
    const f = DATA.funds.find(x => x.code === code);
    if (!State.data.fundHoldings) { UI.toast('无持仓'); return; }
    const holding = State.data.fundHoldings.find(h => h.code === code);
    if (!holding) { UI.toast('无持仓'); return; }
    if (State.data.date.totalDays <= (holding.buyDay||0)) {
      UI.toast('T+1 限制：今日申购明日方可赎回');
      return;
    }
    const maxShares = holding.shares;
    const price = State.data.fundPrices[code] || f.basePrice;
    const held7 = State.data.date.totalDays - (holding.buyDay||0) >= 7;
    const feeRate = held7 ? 0 : 0.0025;
    const unitNet = price * (1 - feeRate);

    UI.numberPicker({
      title: '赎回 ' + f.name,
      unit: unitNet,
      unitName: '份',
      unitLabel: `¥${price.toFixed(4)}/份 · 赎回费 ${feeRate*100}% · 持有 ${maxShares.toLocaleString('zh-CN')} 份`,
      max: maxShares,
      quickAdds: maxShares >= 10000 ? [100, 1000, 5000, 10000] : [10, 100, 500, 1000],
      onConfirm: (shares) => {
        if (shares <= 0) { UI.toast('请选择数量'); return; }
        if (shares > holding.shares) { UI.toast('持仓不足'); return; }
        const revenue = shares * price;
        const fee = revenue * feeRate;
        const net = revenue - fee;
        State.data.cash += net;
        holding.shares -= shares;
        if (holding.shares <= 0) {
          State.data.fundHoldings = State.data.fundHoldings.filter(h => h.code !== code);
        }
        State.save();
        UI.toast(`赎回 ${shares.toLocaleString('zh-CN')} 份，到账 ${State.formatMoney(net)}`);
        Router.refresh();
      }
    });
  }
};

window.Pages = window.Pages || {};
window.Pages.funds = Pages.funds;
window.Pages.fundDetail = Pages.fundDetail;
window.Funds = Funds;
