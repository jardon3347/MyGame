/* pages/futures.js - 期货交易页面 */
import { Pages } from './home.js';
import { State } from '../state.js';
import { Futures } from '../futures.js';
import { Router, UI } from '../ui.js';

Pages.futures = {
  
  render(app) {
    if (!Futures.isAvailable()) {
      app.innerHTML = '<div class="page">' + UI.navbar('期货贸易') + '<div class="card"><div class="card-title">未解锁</div><div class="card-sub">需要达到中小企业评级（总资产 500万）</div></div>' + UI.bottombar() + '</div>';
      return;
    }

    const positions = Futures.getPositions();
    const stats = State.data.futuresStats || { totalProfit: 0, totalLoss: 0 };

    let html = '<div class="page">' + UI.navbar('期货贸易');
    
    html += '<div class="card-grid" style="margin-bottom:12px;">';
    html += '<div class="card"><div class="card-title">累计盈利</div><div class="card-value up">+' + State.formatMoney(stats.totalProfit) + '</div></div>';
    html += '<div class="card"><div class="card-title">累计亏损</div><div class="card-value down">-' + State.formatMoney(stats.totalLoss) + '</div></div>';
    html += '<div class="card"><div class="card-title">当前持仓</div><div class="card-value">' + positions.length + ' 手</div></div>';
    html += '</div>';

    html += '<div class="section-title">当前持仓</div>';
    if (positions.length === 0) {
      html += '<div class="empty">暂无持仓</div>';
    } else {
      positions.forEach(pos => {
        const pnl = Futures.getUnrealizedPnL(pos);
        const pnlClass = pnl >= 0 ? 'up' : 'down';
        const pnlSign = pnl >= 0 ? '+' : '';
        html += '<div class="list-item"><div class="list-row"><div><div class="font-medium">' + pos.contractName + '</div>';
        html += '<div class="text-sm text-muted">' + (pos.direction === 'long' ? '做多' : '做空') + ' ' + pos.quantity + ' 手 | 开仓价 ' + pos.openPrice.toFixed(2) + ' | ' + (pos.expiryDay - State.data.date.totalDays) + ' 天后到期</div></div>';
        html += '<div style="text-align:right;"><div class="list-value ' + pnlClass + '">' + pnlSign + State.formatMoney(pnl) + '</div>';
        html += '<button class="btn sm danger" onclick="Futures.closePosition(\'' + pos.id + '\')">平仓</button></div></div></div>';
      });
    }

    html += '<div class="section-title" style="margin-top:16px;">开仓交易</div>';
    Futures.contracts.forEach(contract => {
      const price = Futures.getCurrentPrice(contract.id);
      const margin = price * contract.contractSize * contract.marginRate;
      html += '<div class="list-item"><div class="list-row"><div><div class="font-medium">' + contract.name + '</div>';
      html += '<div class="text-sm text-muted">现价 ' + price.toFixed(2) + ' | ' + contract.contractSize + '吨/手 | ' + contract.leverage + '倍杠杆 | 保证金 ' + State.formatMoney(margin) + '</div></div></div>';
      html += '<div class="flex gap-8" style="margin-top:8px;">';
      html += '<button class="btn sm" style="flex:1;color:var(--up);border-color:var(--up);" onclick="Futures.openPosition(\'' + contract.id + '\', \'long\', 1)">做多 1 手</button>';
      html += '<button class="btn sm" style="flex:1;color:var(--down);border-color:var(--down);" onclick="Futures.openPosition(\'' + contract.id + '\', \'short\', 1)">做空 1 手</button>';
      html += '</div></div>';
    });

    html += UI.bottombar() + '</div>';
    app.innerHTML = html;
  },

  /* 供 finance tab 使用的列表渲染 */
  renderList() {
    if (!Futures.isAvailable()) {
      return '<div class="card"><div class="card-title">🔒 未解锁</div><div class="card-sub">需要达到"中小企业"评级（总资产 ¥500万）</div></div>';
    }

    const positions = Futures.getPositions();
    const stats = State.data.futuresStats || { totalProfit: 0, totalLoss: 0 };

    let html = '<div class="card-grid" style="margin-bottom:12px;">';
    html += '<div class="card"><div class="card-title">累计盈利</div><div class="card-value up">+' + State.formatMoney(stats.totalProfit) + '</div></div>';
    html += '<div class="card"><div class="card-title">累计亏损</div><div class="card-value down">-' + State.formatMoney(stats.totalLoss) + '</div></div>';
    html += '<div class="card"><div class="card-title">当前持仓</div><div class="card-value">' + positions.length + ' 手</div></div>';
    html += '</div>';

    html += '<div class="section-title">当前持仓</div>';
    if (positions.length === 0) {
      html += '<div class="empty">暂无持仓</div>';
    } else {
      positions.forEach(pos => {
        const pnl = Futures.getUnrealizedPnL(pos);
        const pnlClass = pnl >= 0 ? 'up' : 'down';
        const pnlSign = pnl >= 0 ? '+' : '';
        html += '<div class="list-item"><div class="list-row"><div><div class="font-medium">' + pos.contractName + '</div>';
        html += '<div class="text-sm text-muted">' + (pos.direction === 'long' ? '做多' : '做空') + ' ' + pos.quantity + ' 手 | 开仓价 ' + pos.openPrice.toFixed(2) + ' | ' + (pos.expiryDay - State.data.date.totalDays) + ' 天后到期</div></div>';
        html += '<div style="text-align:right;"><div class="list-value ' + pnlClass + '">' + pnlSign + State.formatMoney(pnl) + '</div>';
        html += '<button class="btn sm danger" onclick="Futures.closePosition(\'' + pos.id + '\')">平仓</button></div></div></div>';
      });
    }

    html += '<div class="section-title" style="margin-top:16px;">开仓交易</div>';
    Futures.contracts.forEach(contract => {
      const price = Futures.getCurrentPrice(contract.id);
      const margin = price * contract.contractSize * contract.marginRate;
      html += '<div class="list-item"><div class="list-row"><div><div class="font-medium">' + contract.name + '</div>';
      html += '<div class="text-sm text-muted">现价 ' + price.toFixed(2) + ' | ' + contract.contractSize + '吨/手 | ' + contract.leverage + '倍杠杆 | 保证金 ' + State.formatMoney(margin) + '</div></div></div>';
      html += '<div class="flex gap-8" style="margin-top:8px;">';
      html += '<button class="btn sm" style="flex:1;color:var(--up);border-color:var(--up);" onclick="Futures.openPosition(\'' + contract.id + '\', \'long\', 1)">做多 1 手</button>';
      html += '<button class="btn sm" style="flex:1;color:var(--down);border-color:var(--down);" onclick="Futures.openPosition(\'' + contract.id + '\', \'short\', 1)">做空 1 手</button>';
      html += '</div></div>';
    });

    return html;
  }
};
