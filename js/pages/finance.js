/* finance.js — 金融主页面（股票/基金/贵金属 Tab） */
import { Pages } from './home.js';
import { Router, UI } from '../ui.js';
import { Futures } from '../futures.js';

Pages.finance = {
  _activeTab: 'stocks', // 'stocks' | 'funds' | 'metals'

  render(app) {
    const futuresAvail = window.Futures && Futures.isAvailable();
    // 期货不可用时自动切回股票tab
    if (this._activeTab === 'futures' && !futuresAvail) this._activeTab = 'stocks';
    app.innerHTML = `
      <div class="page">
        ${UI.navbar('金融', false)}

        <div class="segmented" style="position:sticky;top:0;z-index:10;background:var(--bg-page);padding:8px 0;">
          <div class="tab-bar" style="margin:0;">
            <div class="tab${this._activeTab === 'stocks' ? ' active' : ''}" data-fintab="stocks" onclick="Pages.finance.switchTab('stocks')">📈 股票</div>
            <div class="tab${this._activeTab === 'funds' ? ' active' : ''}" data-fintab="funds" onclick="Pages.finance.switchTab('funds')">📊 基金</div>
            <div class="tab${this._activeTab === 'metals' ? ' active' : ''}" data-fintab="metals" onclick="Pages.finance.switchTab('metals')">🥇 贵金属</div>
            ${futuresAvail ? '<div class="tab' + (this._activeTab === 'futures' ? ' active' : '') + '" data-fintab="futures" onclick="Pages.finance.switchTab(\'futures\')">🥇 期货</div>' : ''}
          </div>
        </div>

        <div id="finance-tab-content">
          ${this._renderTabContent()}
        </div>

        ${UI.bottombar()}
      </div>
    `;
  },

  _renderTabContent() {
    if (this._activeTab === 'stocks') {
      return Pages.stocks.renderList();
    } else if (this._activeTab === 'funds') {
      return Pages.funds.renderList();
    } else if (this._activeTab === 'metals') {
      return Pages.metals.renderList();
    } else if (this._activeTab === 'futures') {
      return Pages.futures.renderList();
    }
    return '';
  },

  switchTab(tab) {
    // 期货未解锁时忽略切换
    if (tab === 'futures' && (!window.Futures || !Futures.isAvailable())) return;
    this._activeTab = tab;
    // 更新 tab 选中态
    document.querySelectorAll('[data-fintab]').forEach(t => {
      t.classList.toggle('active', t.getAttribute('data-fintab') === tab);
    });
    // 更新内容区
    const container = document.getElementById('finance-tab-content');
    if (container) {
      container.innerHTML = this._renderTabContent();
    }
  }
};

window.Pages = window.Pages || {};
window.Pages.finance = Pages.finance;
