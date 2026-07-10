/* main.js — 入口模块：按依赖顺序 import 所有模块，保持 window 全局出口向后兼容 */

// === 数据层（无依赖） ===
import { DATA, NEWS_LIBRARY, NEWS_HISTORY, RANDOM_EVENT_TEMPLATES, getNewsPool } from './data.js';
import { FactoryProducts } from './factoryProducts.js';
import { LogisticsSystem } from './logistics.js';

// === 图表工具 ===
import { Charts } from './charts.js';

// === 期货 ===
import { Futures } from './futures.js';

// === 成就 ===
import { Achievements } from './achievements.js';

// === 竞争对手 ===
import { Competitors } from './competitors.js';

// === 核心层 ===
import { State } from './state.js';
import { DisasterEvents, EventSystem } from './events.js';
import { Engine } from './engine.js';
import { TimeManager } from './time.js';
import { Employees } from './employees.js';
import { Router, UI } from './ui.js';

// === 页面模块 ===
import { Pages, Home } from './pages/home.js';
import './pages/deposit.js';
import './pages/stocks.js';
import './pages/stockDetail.js';
import './pages/funds.js';
import './pages/metals.js';
import './pages/finance.js';
import './pages/industryDetail.js';
import './pages/industry.js';
import './pages/staff.js';
import './pages/warehouse.js';
import './pages/overview.js';
import './pages/futures.js';
import './pages/competitors.js';

/* ===== 启动游戏 ===== */
// ES Module 脚本是 deferred 的，此时 DOM 已就绪，#app 存在
State.init();
TimeManager.start();

// Service Worker（仅 http/https 环境）
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
