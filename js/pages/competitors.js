/* pages/competitors.js — 竞争对手与排行榜页面 */

Pages.competitors = {
  
  render(app) {
    // 确保对手已初始化
    if (window.Competitors) Competitors.init();
    const ranking = (window.Competitors ? Competitors.getRanking() : []);
    const competitors = (State.data.competitors || []);

    let html = '<div class="page">' + UI.navbar('排行榜', false);

    // 玩家自己的数据
    const playerAssets = (State.totalAssets && State.totalAssets()) || 0;
    const playerRank = ranking.findIndex(r => r.isPlayer) + 1;
    html += '<div class="card" style="margin-bottom:12px;">';
    html += '<div class="card-title">你的集团</div>';
    html += '<div class="card-sub">总资产: ' + State.formatMoney(playerAssets) + ' | 排名: 第 ' + playerRank + ' / ' + ranking.length + ' 名</div>';
    html += '</div>';

    // 排行榜（完整显示所有参与者）
    html += '<div class="section-title">📊 排行榜</div>';
    html += '<div class="list-item">';
    ranking.forEach((r, i) => {
      const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '';
      const highlight = r.isPlayer ? ' style="background:var(--bg-soft);margin:0 -14px;padding:8px 14px;border-radius:6px;"' : '';
      html += '<div class="list-row"' + highlight + '>';
      html += '<span class="list-label">' + medal + ' ' + (i + 1) + '. ' + r.name + (r.isPlayer ? ' (你)' : '') + '</span>';
      html += '<span class="list-value ' + (r.isPlayer ? 'up' : '') + '">' + State.formatMoney(r.assets) + '</span>';
      html += '</div>';
    });
    html += '</div>';

    // 对手详细信息卡片
    html += '<div class="section-title" style="margin-top:16px;">🎯 对手详情</div>';
    competitors.forEach(comp => {
      const styleText = comp.style === 'aggressive' ? '激进型' : comp.style === 'steady' ? '稳健型' : '专注型';
      const styleIcon = comp.style === 'aggressive' ? '🔥' : comp.style === 'steady' ? '🛡️' : '🎯';
      const styleColor = comp.style === 'aggressive' ? 'var(--up)' : comp.style === 'steady' ? 'var(--info)' : 'var(--warning)';
      html += '<div class="list-item">';
      html += '<div class="list-row">';
      html += '<span class="list-label" style="font-size:14px;font-weight:600;">' + comp.name + '</span>';
      html += '<span class="list-value">' + State.formatMoney(comp.assets) + '</span>';
      html += '</div>';
      html += '<div class="text-sm text-muted" style="margin-top:6px;">';
      html += '<span style="color:' + styleColor + ';">' + styleIcon + ' ' + styleText + '</span>';
      html += '</div>';
      html += '<div class="text-sm text-muted" style="margin-top:4px;">';
      html += '持股产业: ' + (comp.industries || []).map(t => ({farm: '🌾农业', mining: '⛏️矿业', metall: '🔥冶金', factory: '🏭工厂', estate: '🏢地产', logistics: '🚛物流'}[t] || t)).join('、');
      html += '</div>';
      html += '<div class="text-sm" style="margin-top:4px;">';
      html += '增长率: <span class="' + ((comp.growthRate || 0) > 0.06 ? 'up' : 'down') + '">' + ((comp.growthRate || 0) * 100).toFixed(1) + '%/年</span>';
      html += ' | 风险承受: ' + ((comp.riskTolerance || 0) * 100).toFixed(0) + '%';
      html += '</div>';
      // 显示与玩家的资产差距
      const diff = comp.assets - playerAssets;
      if (diff > 0) {
        html += '<div class="text-sm" style="margin-top:4px;color:var(--up);">领先你 ' + State.formatMoney(diff) + '</div>';
      } else if (diff < 0) {
        html += '<div class="text-sm" style="margin-top:4px;color:var(--down);">落后你 ' + State.formatMoney(Math.abs(diff)) + '</div>';
      } else {
        html += '<div class="text-sm" style="margin-top:4px;color:var(--info);">与你持平</div>';
      }
      html += '</div>';
    });

    // 返回按钮
    html += '<button class="btn full" style="margin-top:16px;" onclick="Router.back()">返回概览</button>';

    html += UI.bottombar() + '</div>';
    app.innerHTML = html;
  }
};

window.Pages = window.Pages || {};
window.Pages.competitors = Pages.competitors;