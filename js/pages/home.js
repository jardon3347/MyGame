/* home.js — 主界面入口（已迁移到 overview）
 *
 * 本次重构把主页打散为四个独立主模块（概览/银行/金融/实业），
 * 原 home.js 的卡片生成函数已提取到 UI 对象（UI.industryCard / UI.staffCard / UI.warehouseCard）。
 * Pages.home 现在仅作为兜底：访问 'home' 路由时直接渲染概览页。
 * Home.advance（时间推进 + 结算弹窗逻辑）保留在此文件，由概览页调用。
 */

const Pages = window.Pages || {};

Pages.home = {
  /* 兜底：home → overview */
  render(app) {
    Pages.overview.render(app);
  }
};

const Home = {
  _advancing: false,
  advance(days) {
    // 僵尸锁自愈：若上次模态框被非正常途径关闭（页面导航/刷新/浏览器后退），
    // _advancing 可能残留为 true，导致后续所有推进都被吞掉。检测并清理。
    if (this._advancing && !document.querySelector('.modal-mask')) {
      console.warn('Home.advance: 检测到残留的 _advancing 锁，已自动清理');
      this._advancing = false;
      TimeManager.autoResume();
    }
    if (this._advancing) return; // 真正在推进中，忽略重复点击
    this._advancing = true;
    // 加速期间暂停自然流逝，避免叠加
    TimeManager.autoPause();

    let result;
    try {
      result = Engine.advance(days);
    } catch (e) {
      console.error('推进失败:', e);
      this._advancing = false;
      TimeManager.remaining = TimeManager.totalSec;
      TimeManager.autoResume();
      TimeManager.updateUI();
      UI.toast('推进出错: ' + e.message);
      if (Router.current === 'overview' || Router.current === 'home') Router.refresh();
      return;
    }
    // 加速完成：重置倒计时，恢复自然流逝
    TimeManager.remaining = TimeManager.totalSec;
    TimeManager.autoResume();

    // 显示结算弹窗（用 try/finally 确保 _advancing 必定被重置）
    try {
      let content = '';
      if (result.summaries.length === 1) {
        const log = result.summaries[0];
        // 净收入摘要置顶，一眼看到关键数字
        const totalIncome = log.details.filter(d => d.type === 'income').reduce((s, d) => s + d.amount, 0);
        const totalExpense = log.details.filter(d => d.type === 'expense').reduce((s, d) => s + d.amount, 0);
        content = `
          <div class="settle-summary">
            <div class="settle-summary-row">
              <span>总收入</span>
              <span class="up">+${State.formatMoney(totalIncome)}</span>
            </div>
            <div class="settle-summary-row">
              <span>总支出</span>
              <span class="down">-${State.formatMoney(totalExpense)}</span>
            </div>
            <div class="settle-summary-row settle-net">
              <span>净收入</span>
              <span class="${log.net >= 0 ? 'up' : 'down'}">${log.net >= 0 ? '+' : ''}${State.formatMoney(log.net)}</span>
            </div>
          </div>
          <div class="settle-details-toggle" onclick="this.nextElementSibling.style.display = this.nextElementSibling.style.display === 'none' ? 'block' : 'none'; this.textContent = this.textContent.includes('展开') ? '▼ 收起明细' : '▲ 展开明细';">
            ▲ 展开明细
          </div>
          <div class="settle-details" style="display:none;">
            ${log.details.length ? log.details.map(d => `
              <div class="list-row">
                <span class="list-label">${d.label}</span>
                ${d.type === 'info' ? `<span class="list-value" style="color:var(--text-secondary);">—</span>` :
                  `<span class="list-value ${d.type === 'income' ? 'up' : 'down'}">${d.type === 'income' ? '+' : '-'}${State.formatMoney(Math.abs(d.amount))}</span>`}
              </div>
            `).join('') : '<div class="empty">今日无收支</div>'}
          </div>
        `;
      } else {
        let totalIncome = 0;
        result.summaries.forEach(l => totalIncome += l.net);
        content = `
          <p style="font-size:13px; color:var(--text-secondary); margin-bottom:10px;">
            已推进 ${result.summaries.length} 天
          </p>
          <div class="list-row">
            <span class="list-label">累计净收入</span>
            <span class="list-value ${totalIncome >= 0 ? 'up' : 'down'}">${totalIncome >= 0 ? '+' : ''}${State.formatMoney(totalIncome)}</span>
          </div>
        `;
      }

      // 新闻合并到结算弹窗
      if (result.events.length > 0) {
        const news = result.events[0];
        const tags = Engine.getNewsTags(news);
        const typeClass = news.type === 'disaster' ? 'danger' : 'success';
        content = `
          <div class="news-item ${typeClass}" style="margin-bottom:12px;">
            <div class="news-title">📰 ${news.title}</div>
            <div class="news-desc">${news.desc}</div>
            <div class="news-tags">
              ${tags.map(t => `<span class="news-tag ${t.type}">${t.label}</span>`).join('')}
            </div>
          </div>
          ${content}
        `;
      }

      const mask = UI.modal(days === 1 ? '当日结算' : `推进 ${result.summaries.length} 天`, content, [
        { label: '关闭', class: 'primary', onclick: 'Home._dismissAdvanceModal()' }
      ]);
      // 结算弹窗不可通过点击外面关闭，确保 _advancing 被正确重置
      if (mask) {
        const modalEl = mask.querySelector('.modal');
        if (modalEl) modalEl.dataset.dismissable = 'false';
      }
    } catch (e) {
      console.error('结算弹窗渲染失败:', e);
      UI.toast('结算弹窗渲染失败: ' + e.message);
    } finally {
      // 无论成功还是失败，都要重置 _advancing，避免死锁
      this._advancing = false;
      TimeManager.autoResume();
      TimeManager.updateUI();
      if (Router.current === 'overview' || Router.current === 'home') Router.refresh();
    }
  },

  _dismissAdvanceModal() {
    try { UI.closeModal(); Router.refresh(); }
    finally {
      this._advancing = false;
      TimeManager.autoResume();
      TimeManager.updateUI();
    }
  }
};

window.Pages = Pages;
window.Home = Home;
