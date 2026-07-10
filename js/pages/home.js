/* home.js — 主界面入口（已迁移到 overview）
 *
 * 本次重构把主页打散为四个独立主模块（概览/银行/金融/实业），
 * 原 home.js 的卡片生成函数已提取到 UI 对象（UI.industryCard / UI.staffCard / UI.warehouseCard）。
 * Pages.home 现在仅作为兜底：访问 'home' 路由时直接渲染概览页。
 * Home.advance（时间推进 + 结算弹窗逻辑）保留在此文件，由概览页调用。
 */
import { Engine } from '../engine.js';
import { TimeManager } from '../time.js';
import { State } from '../state.js';
import { UI, Router } from '../ui.js';
import { DisasterEvents } from '../events.js';

export const Pages = {};

Pages.home = {
  /* 兜底：home → overview */
  render(app) {
    Pages.overview.render(app);
  }
};

export const Home = {
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

    // 补足当天剩余工厂产出
    Engine.produceRemainingBatches(TimeManager.remaining);

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

    // 天敌事件弹窗（结算弹窗关闭后弹出）
    if (window.DisasterEvents && DisasterEvents._pendingEvents && DisasterEvents._pendingEvents.length > 0) {
      setTimeout(() => {
        DisasterEvents.showResponse(DisasterEvents._pendingEvents);
      }, 300);
    }

    // 破产自救弹窗（第5天强制选择）
    if (State.data && State.data.cash < 0 && (State.data.bankruptcyDays || 0) === 5) {
      setTimeout(() => {
        this._showBankruptcyRescue();
      }, 600);
    }
  },

  _dismissAdvanceModal() {
    try { UI.closeModal(); Router.refresh(); }
    finally {
      this._advancing = false;
      TimeManager.autoResume();
      TimeManager.updateUI();
    }
  },

  /* 破产自救弹窗 */
  _showBankruptcyRescue() {
    const html = `
      <div style="margin-bottom:12px;">
        <div style="font-size:24px;margin-bottom:8px;">\u26A0\uFE0F \u7834\u4EA7\u5371\u673A</div>
        <p style="font-size:14px;color:var(--text-secondary);line-height:1.6;">
          \u516C\u53F8\u5DF2\u8FDE\u7EED 5 \u5929\u73B0\u91D1\u4E3A\u8D1F\uFF0C<br>
          \u5FC5\u987B\u7ACB\u5373\u91C7\u53D6\u884C\u52A8\uFF01
        </p>
      </div>
      <div class="card-grid">
        <button class="card full" style="margin-bottom:8px;" onclick="Home._doBankruptcyOption('layoff')">
          <div class="card-title">\u88C1\u5458 50%</div>
          <div class="card-sub">\u4FDD\u7559\u4E00\u534A\u5458\u5DE5\uFF0C\u58EB\u6C14\u5F52\u96F6</div>
        </button>
        <button class="card full" style="margin-bottom:8px;" onclick="Home._doBankruptcyOption('sell')">
          <div class="card-title">\u53D8\u5356\u4EA7\u4E1A</div>
          <div class="card-sub">\u968F\u673A\u5356\u6389\u4E00\u5957\u6700\u4F4E\u7EA7\u4EA7\u4E1A\uFF08\u83B7\u5F97\u90E8\u5206\u8D44\u91D1\uFF09</div>
        </button>
        <button class="card full" style="margin-bottom:8px;" onclick="Home._doBankruptcyOption('loan_shark')">
          <div class="card-title">\u501F\u9AD8\u5229\u8D37 \u00A510\u4E07</div>
          <div class="card-sub">\u5229\u606F 5%/\u5929\uFF0C30 \u5929\u4E0D\u8FD8\u5219\u5F3A\u5236\u6E05\u7B97</div>
        </button>
      </div>`;

    UI.modal('\u26A0\uFE0F \u7834\u4EA7\u5371\u673A', html, [
      { label: '\u5173\u95ED', onclick: 'UI.closeModal()' }
    ]);
  },

  /* 执行破产自救选项 */
  _doBankruptcyOption(option) {
    const s = State.data;
    UI.closeModal();
    this._advancing = false;

    if (option === 'layoff') {
      const emps = s.employees || [];
      const half = Math.floor(emps.length / 2);
      if (half > 0) {
        const sorted = [...emps].sort((a, b) => (a.morale || 100) - (b.morale || 100));
        const toFire = sorted.slice(0, half);
        toFire.forEach(e => { s.employees = s.employees.filter(x => x.id !== e.id); });
        // 保留员工士气归零
        s.employees.forEach(e => { e.morale = 0; });
        UI.toast('\u88C1\u5458 ' + half + ' \u4EBA\uFF0C\u4FDD\u7559\u5458\u5DE5\u58EB\u6C14\u5F52\u96F6');
      } else {
        UI.toast('\u65E0\u53EF\u88C1\u5458\u7684\u5458\u5DE5');
      }
    } else if (option === 'sell') {
      // 找一套最低级、有成本的产业卖掉
      const sellable = s.industries.filter(i => {
        const cat = State.findIndustryCategory(i.type, i.category);
        return cat && cat.cost;
      });
      if (sellable.length > 0) {
        // 按 cost 排序，卖最便宜的
        sellable.sort((a, b) => {
          const ca = State.findIndustryCategory(a.type, a.category);
          const cb = State.findIndustryCategory(b.type, b.category);
          return (ca ? ca.cost : 0) - (cb ? cb.cost : 0);
        });
        const target = sellable[0];
        const cat = State.findIndustryCategory(target.type, target.category);
        const refund = Math.floor((cat ? cat.cost : 0) * 0.5);
        s.cash += refund;
        // 撤回分配到此产业的员工
        if (s.employees) {
          s.employees.forEach(e => {
            if (e.assign && e.assign.type === target.type && e.assign.category === target.category) {
              e.assign = null;
            }
          });
        }
        s.industries = s.industries.filter(i => !(i.type === target.type && i.category === target.category));
        UI.toast('\u53D8\u5356 ' + (cat ? cat.name : '') + ' \uFF0C\u83B7\u5F97 \u00A5' + refund.toLocaleString('zh-CN'));
      } else {
        UI.toast('\u65E0\u53EF\u53D8\u5356\u7684\u4EA7\u4E1A');
      }
    } else if (option === 'loan_shark') {
      s.cash += 100000;
      s.loan = (s.loan || 0) + 100000;
      s._sharkLoanDay = State.data.date.totalDays;
      s._sharkLoanRate = 0.05;
      UI.toast('\u501F\u5165 \u00A510\u4E07\uFF0C\u5229\u606F 5%/\u5929');
    }

    State.save();
    Router.refresh();
  }
};

window.Pages = Pages;
window.Home = Home;
