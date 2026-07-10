/* pages/competitors.js — 竞争对手与排行榜页面 v2 */
import { Pages } from './home.js';
import { State } from '../state.js';
import { Competitors } from '../competitors.js';
import { Router, UI } from '../ui.js';

Pages.competitors = {

  render(app) {
    if (window.Competitors) Competitors.init();
    const ranking = (window.Competitors ? Competitors.getRanking() : []);
    const competitors = (State.data.competitors || []);

    let html = '<div class="page">' + UI.navbar('排行榜', false);

    // 玩家卡片
    const playerAssets = (State.totalAssets && State.totalAssets()) || 0;
    const playerRank = ranking.findIndex(r => r.isPlayer) + 1;
    html += '<div class="card" style="margin-bottom:12px;">';
    html += '<div class="card-title">你的集团</div>';
    html += '<div class="card-sub">总资产: ' + State.formatMoney(playerAssets) + ' | 排名: 第 ' + playerRank + ' / ' + ranking.length + ' 名</div>';
    html += '</div>';

    // 排行榜
    html += '<div class="section-title">排行榜</div>';
    html += '<div class="list-item">';
    ranking.forEach((r, i) => {
      const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '';
      const highlight = r.isPlayer ? ' style="background:var(--bg-soft);margin:0 -14px;padding:8px 14px;border-radius:6px;"' : '';
      const changeColor = (r.lastChange || 0) >= 0 ? 'var(--up)' : 'var(--down)';
      const changeIcon = (r.lastChange || 0) >= 0 ? '↑' : '↓';
      let trend = '';
      if (r.lastChange !== undefined && r.lastChange !== 0) {
        trend = '<span style="font-size:10px;color:' + changeColor + ';margin-left:4px;">' + changeIcon + State.formatMoney(Math.abs(r.lastChange || 0)) + '</span>';
      }
      html += '<div class="list-row"' + highlight + '>';
      html += '<span class="list-label">' + medal + ' ' + (i + 1) + '. ' + r.name + (r.isPlayer ? ' (你)' : '') + trend + '</span>';
      html += '<span class="list-value ' + (r.isPlayer ? 'up' : '') + '">' + State.formatMoney(r.assets) + '</span>';
      html += '</div>';
    });
    html += '</div>';

    // 对手详情卡片
    html += '<div class="section-title" style="margin-top:16px;">对手详情</div>';
    competitors.forEach(comp => {
      const styleText = comp.style === 'aggressive' ? '激进扩张' : comp.style === 'steady' ? '稳健经营' : '专注深耕';
      const styleIcon = comp.style === 'aggressive' ? '🔥' : comp.style === 'steady' ? '🛡️' : '🎯';
      const styleColor = comp.style === 'aggressive' ? 'var(--up)' : comp.style === 'steady' ? 'var(--info)' : 'var(--warning)';

      // 组合摘要
      const typeCount = {};
      (comp.portfolio || []).forEach(p => {
        const t = p.type;
        typeCount[t] = (typeCount[t] || 0) + (p.qty || 1);
      });
      const typeLabels = { farm: '🌾', mining: '⛏️', metall: '🔥', factory: '🏭', estate: '🏢', logistics: '🚛' };
      const portfolioSummary = Object.entries(typeCount)
        .map(([t, n]) => (typeLabels[t] || '') + n + '份')
        .join(' ');
      const cashLabel = '💰 ¥' + (comp.cash || 0).toLocaleString('zh-CN');

      html += '<div class="list-item">';
      html += '<div class="list-row">';
      html += '<span class="list-label" style="font-size:14px;font-weight:600;">' + comp.name + '</span>';
      html += '<span class="list-value">' + State.formatMoney(comp.assets) + '</span>';
      html += '</div>';
      html += '<div class="text-sm text-muted" style="margin-top:4px;">';
      html += '<span style="color:' + styleColor + ';">' + styleIcon + ' ' + styleText + '</span>';
      html += ' · ' + (comp.desc || '');
      html += '</div>';
      html += '<div class="text-sm" style="margin-top:6px;">';
      html += '持仓: ' + (portfolioSummary || '无') + ' | ' + cashLabel;
      html += '</div>';
      html += '<div class="text-sm text-muted" style="margin-top:4px;">';
      html += '今日: ' + (comp.lastAction || '—');
      const ch = comp.lastChange || 0;
      if (ch !== 0) {
        const color = ch > 0 ? 'var(--up)' : 'var(--down)';
        html += ' <span style="color:' + color + ';">' + (ch > 0 ? '+' : '') + State.formatMoney(ch) + '</span>';
      }
      html += '</div>';

      // 与玩家差距
      const diff = comp.assets - playerAssets;
      if (diff > 0) {
        html += '<div class="text-sm" style="margin-top:4px;color:var(--up);">领先你 ' + State.formatMoney(diff) + '</div>';
      } else if (diff < 0) {
        html += '<div class="text-sm" style="margin-top:4px;color:var(--down);">落后你 ' + State.formatMoney(Math.abs(diff)) + '</div>';
      }
      html += '</div>';
    });

    html += '<button class="btn full" style="margin-top:16px;" onclick="Router.back()">返回概览</button>';
    html += UI.bottombar() + '</div>';
    app.innerHTML = html;
  }
};

window.Pages = window.Pages || {};
window.Pages.competitors = Pages.competitors;
