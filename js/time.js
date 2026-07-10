/* time.js — 自然时间流逝：10 分钟/天，弹窗自动暂停 */
import { Engine } from './engine.js';
import { State } from './state.js';
import { UI, Router } from './ui.js';

export const TimeManager = {
  intervalId: null,
  factoryIntervalId: null,
  FACTORY_TICK_MS: 3000,  // 工厂每 3 秒生产一批
  totalSec: 180,           // 一天 = 3 分钟 = 180 秒
  remaining: 180,          // 当前天剩余秒数
  userPaused: false,       // 玩家手动暂停
  autoPaused: false,       // 自动暂停（弹窗/加速中）
  enabled: false,          // 是否启用（仅 home 页生效）

  /* 启动计时器 */
  start() {
    if (this.intervalId) return;
    this.intervalId = setInterval(() => this.tick(), 1000);
    this.startFactoryTimer();
  },

  /* 停止计时器（离开主页时） */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.stopFactoryTimer();
  },

  /* 工厂独立计时器（每 3 秒生产一批） */
  startFactoryTimer() {
    if (this.factoryIntervalId) return;
    this.factoryIntervalId = setInterval(() => this.factoryTick(), this.FACTORY_TICK_MS);
  },

  stopFactoryTimer() {
    if (this.factoryIntervalId) {
      clearInterval(this.factoryIntervalId);
      this.factoryIntervalId = null;
    }
  },

  /* 工厂 3 秒结算（由工厂计时器调用，独立于游戏日推进） */
  factoryTick() {
    if (!this.enabled) return;
    if (this.isPaused) return;
    if (window.Engine && window.State && State.data) {
      Engine.factoryTick();
    }
  },

  /* 玩家手动暂停/恢复 */
  togglePause() {
    this.userPaused = !this.userPaused;
    this.updateUI();
    UI.toast(this.userPaused ? '⏸ 已暂停时间' : '▶ 时间继续');
  },

  /* 自动暂停（弹窗打开、加速中） */
  autoPause() {
    this.autoPaused = true;
    this.updateUI();
  },

  autoResume() {
    this.autoPaused = false;
    this.updateUI();
  },

  get isPaused() {
    return this.userPaused || this.autoPaused;
  },

  /* 每秒触发 */
  tick() {
    if (!this.enabled) return;
    if (this.isPaused) {
      this.updateUI();
      return;
    }
    this.remaining--;
    if (this.remaining <= 0) {
      this.remaining = this.totalSec;
      this.advanceDay();
    }
    this.updateUI();
  },

  /* 自然推进一天 */
  advanceDay() {
    if (!State.data) return;
    const log = Engine.advanceOneDay();
    const news = Engine.rollNews();
    if (news) {
      Engine.applyNewsEffects(news);
      if (!State.data.news) State.data.news = [];
      State.data.news.unshift({
        id: news.id,
        title: news.title,
        desc: news.desc,
        type: news.type,
        effects: news.effects,
        date: Engine.dateString(),
        day: State.data.date.totalDays
      });
      State.save();
      // 新闻触发：暂停 + 弹窗提示
      this.autoPaused = true;
      const tags = Engine.getNewsTags(news);
      const typeClass = news.type === 'disaster' ? 'danger' : 'success';
      UI.modal('📰 突发新闻', `
        <div class="news-item ${typeClass}">
          <div class="news-title">${news.title}</div>
          <div class="news-desc">${news.desc}</div>
          <div class="news-tags">
            ${tags.map(t => `<span class="news-tag ${t.type}">${t.label}</span>`).join('')}
          </div>
        </div>
        <div class="list-row" style="margin-top:12px;">
          <span class="list-label">今日净收入</span>
          <span class="list-value ${log.net >= 0 ? 'up' : 'down'}">${log.net >= 0 ? '+' : ''}${State.formatMoney(log.net)}</span>
        </div>
      `, [
        { label: '继续', class: 'primary', onclick: 'UI.closeModal(); TimeManager.autoPaused = false; TimeManager.updateUI();' }
      ]);
      // 弹窗后刷新主页（如果当前在概览页/主页）
      if (Router.current === 'overview' || Router.current === 'home') Router.refresh();
    } else {
      // 无新闻：仅刷新主页数据
      State.save();
      if (Router.current === 'overview' || Router.current === 'home') Router.refresh();
    }
  },

  /* 更新顶部进度条 UI */
  updateUI() {
    const bar = document.getElementById('time-progress-bar');
    const text = document.getElementById('time-remaining');
    const pauseBtn = document.getElementById('time-pause-btn');
    if (!bar || !text) return;

    const pct = (1 - this.remaining / this.totalSec) * 100;
    bar.style.width = pct + '%';

    if (this.isPaused) {
      text.textContent = '⏸ 已暂停';
      text.style.color = 'var(--text-secondary)';
      if (pauseBtn) pauseBtn.textContent = '▶';
    } else {
      const min = Math.floor(this.remaining / 60);
      const sec = this.remaining % 60;
      text.textContent = `${min}:${sec.toString().padStart(2, '0')}`;
      text.style.color = 'var(--text-primary)';
      if (pauseBtn) pauseBtn.textContent = '⏸';
    }
  },

  /* 重置（新游戏/读档时） */
  reset() {
    this.remaining = this.totalSec;
    this.userPaused = false;
    this.autoPaused = false;
  }
};

window.TimeManager = TimeManager;
