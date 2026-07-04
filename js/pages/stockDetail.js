/* stockDetail.js — 股票详情页（K线 + 简介 + 交易） */

Pages.stockDetail = {
  render(app, params) {
    const code = params.code;
    const stock = DATA.stocks.find(s => s.code === code);
    if (!stock) { Router.back(); return; }
    const s = State.data;
    const price = s.stockPrices[code] || 0;
    const hist = (s.stockHistory && s.stockHistory[code]) || [];
    const prevClose = hist.length >= 2 ? hist[hist.length-2].close : stock.basePrice;
    const change = price - prevClose;
    const changePct = prevClose > 0 ? change / prevClose : 0;

    // 历史最高最低
    let histHigh = 0, histLow = Infinity;
    hist.forEach(h => {
      if (h.high > histHigh) histHigh = h.high;
      if (h.low < histLow) histLow = h.low;
    });
    if (histHigh === 0) histHigh = price;
    if (histLow === Infinity) histLow = price;

    // 持仓
    const holding = s.stocks.find(st => st.code === code);
    const shares = holding ? holding.shares : 0;
    const pnl = holding ? (price - holding.avgCost) * shares : 0;
    const pnlPct = holding && holding.avgCost > 0 ? (price - holding.avgCost) / holding.avgCost : 0;

    app.innerHTML = `
      <div class="page">
        ${UI.navbar(stock.name)}
        <div class="topbar">
          <div class="list-row">
            <div>
              <div style="font-size:11px;color:var(--text-secondary);">${stock.code} · ${DATA.sectorNames[stock.sector]||stock.sector} · ${stock.industry}</div>
              <div style="font-size:28px;font-weight:600;margin-top:4px;" class="${change >= 0 ? 'text-up' : 'text-down'}">¥${price.toFixed(2)}</div>
              <div class="text-sm ${change >= 0 ? 'text-up' : 'text-down'}">${change >= 0 ? '+' : ''}${change.toFixed(2)} (${State.formatPct(changePct)})</div>
            </div>
          </div>
        </div>

        <div class="section-title">K线图（近 ${Math.min(hist.length, 30)} 日）</div>
        <div class="list-item" style="padding:8px;">
          ${this.klineSVG(hist.slice(-30), price)}
        </div>

        <div class="section-title">行情数据</div>
        <div class="list-item">
          <div class="list-row"><span class="list-label">今开</span><span class="list-value">¥${hist.length ? hist[hist.length-1].open.toFixed(2) : price.toFixed(2)}</span></div>
          <div class="list-row"><span class="list-label">昨收</span><span class="list-value">¥${prevClose.toFixed(2)}</span></div>
          <div class="list-row"><span class="list-label">最高</span><span class="list-value text-up">¥${hist.length ? hist[hist.length-1].high.toFixed(2) : price.toFixed(2)}</span></div>
          <div class="list-row"><span class="list-label">最低</span><span class="list-value text-down">¥${hist.length ? hist[hist.length-1].low.toFixed(2) : price.toFixed(2)}</span></div>
          <div class="list-row"><span class="list-label">成交量</span><span class="list-value">${hist.length ? (hist[hist.length-1].volume/10000).toFixed(1)+'万手' : '—'}</span></div>
          <div class="list-row"><span class="list-label">历史最高</span><span class="list-value text-up">¥${histHigh.toFixed(2)}</span></div>
          <div class="list-row"><span class="list-label">历史最低</span><span class="list-value text-down">¥${histLow.toFixed(2)}</span></div>
        </div>

        <div class="section-title">公司简介</div>
        <div class="list-item">
          <p class="text-sm" style="line-height:1.7;color:var(--text-primary);">${stock.desc}</p>
          <div class="list-row mt-12">
            <span class="list-label">所属行业</span>
            <span class="list-value">${stock.industry}</span>
          </div>
          <div class="list-row">
            <span class="list-label">总股本</span>
            <span class="list-value">${(Math.floor(Math.random()*50)+10).toFixed(0)} 亿股</span>
          </div>
          <div class="list-row">
            <span class="list-label">市值</span>
            <span class="list-value">${State.formatMoney(price * 50000000)}</span>
          </div>
        </div>

        ${shares > 0 ? `
          <div class="section-title">我的持仓</div>
          <div class="list-item">
            <div class="list-row"><span class="list-label">持仓</span><span class="list-value">${shares.toLocaleString('zh-CN')} 股</span></div>
            <div class="list-row"><span class="list-label">成本</span><span class="list-value">¥${holding.avgCost.toFixed(2)}</span></div>
            <div class="list-row"><span class="list-label">市值</span><span class="list-value">${State.formatMoney(shares*price)}</span></div>
            <div class="list-row"><span class="list-label">浮盈</span><span class="list-value ${pnl >= 0 ? 'up' : 'down'}">${pnl >= 0 ? '+' : ''}${State.formatMoney(pnl)} (${State.formatPct(pnlPct)})</span></div>
          </div>
        ` : ''}

        <div class="section-title">操作</div>
        <div class="flex gap-8">
          <button class="btn primary" style="flex:1;" onclick="Stocks.showBuy('${code}')">买入</button>
          <button class="btn ${holding ? 'danger' : ''}" style="flex:1;" ${holding && s.date.totalDays > (holding.buyDay||0) ? '' : 'disabled style="opacity:0.4;flex:1;"'} onclick="Stocks.showSell('${code}')">卖出</button>
        </div>

        <div style="height:20px;"></div>
        ${UI.bottombar()}
      </div>
    `;
  },

  /* 生成 K 线 SVG */
  klineSVG(history, currentPrice) {
    if (history.length === 0) {
      return '<div class="empty">暂无历史数据，多推进几天</div>';
    }
    const W = 320, H = 160;
    const padL = 4, padR = 30, padT = 8, padB = 8;
    const chartW = W - padL - padR;
    const chartH = H - padT - padB;

    // 计算价格范围
    let pMin = Infinity, pMax = 0;
    history.forEach(h => {
      if (h.low < pMin) pMin = h.low;
      if (h.high > pMax) pMax = h.high;
    });
    const pad = (pMax - pMin) * 0.1;
    pMin -= pad; pMax += pad;
    const range = pMax - pMin || 1;

    const n = history.length;
    const barW = Math.max(2, chartW / n - 1);
    const step = chartW / n;

    let bars = '';
    history.forEach((h, i) => {
      const x = padL + i * step + step/2;
      const yHigh = padT + (1 - (h.high - pMin) / range) * chartH;
      const yLow = padT + (1 - (h.low - pMin) / range) * chartH;
      const yOpen = padT + (1 - (h.open - pMin) / range) * chartH;
      const yClose = padT + (1 - (h.close - pMin) / range) * chartH;
      const isUp = h.close >= h.open;
      const color = isUp ? '#e24b4a' : '#1d9e75';
      const top = Math.min(yOpen, yClose);
      const bh = Math.max(1, Math.abs(yClose - yOpen));
      bars += `
        <line x1="${x}" y1="${yHigh}" x2="${x}" y2="${yLow}" stroke="${color}" stroke-width="1"/>
        <rect x="${x - barW/2}" y="${top}" width="${barW}" height="${bh}" fill="${color}"/>
      `;
    });

    // 价格刻度
    const lines = '';
    const labels = `
      <text x="${W - padR + 2}" y="${padT+4}" font-size="9" fill="#9a9a9f">${pMax.toFixed(2)}</text>
      <text x="${W - padR + 2}" y="${padT + chartH/2}" font-size="9" fill="#9a9a9f">${((pMax+pMin)/2).toFixed(2)}</text>
      <text x="${W - padR + 2}" y="${padT + chartH}" font-size="9" fill="#9a9a9f">${pMin.toFixed(2)}</text>
    `;

    return `
      <svg viewBox="0 0 ${W} ${H}" width="100%" style="max-width:${W}px;display:block;margin:0 auto;">
        <line x1="${padL}" y1="${padT}" x2="${padL+chartW}" y2="${padT}" stroke="#eee" stroke-width="0.5"/>
        <line x1="${padL}" y1="${padT+chartH/2}" x2="${padL+chartW}" y2="${padT+chartH/2}" stroke="#eee" stroke-width="0.5"/>
        <line x1="${padL}" y1="${padT+chartH}" x2="${padL+chartW}" y2="${padT+chartH}" stroke="#eee" stroke-width="0.5"/>
        ${bars}
        ${labels}
      </svg>
    `;
  }
};

window.Pages = window.Pages || {};
window.Pages.stockDetail = Pages.stockDetail;
