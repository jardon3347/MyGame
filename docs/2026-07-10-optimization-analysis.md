# 项目整体优化方案与建议

> 分析日期：2026-07-10
> 分析范围：盛世集团 · 经营模拟（完整代码库）
> 目的：识别架构/性能/体验/可维护性问题，提出可落地的优化路径

---

## 一、架构层面问题（高优先级）

### 1.1 缺乏模块系统 — 全局污染严重

**现状：**
- 所有对象（`State`, `Engine`, `UI`, `Router`, `Pages` 等）全部挂在 `window` 上
- 依赖关系靠 `<script>` 标签顺序保证，任何顺序错位导致 `undefined` 崩溃
- 无法做按需加载、代码分割、懒加载

**建议方案：**
- **短期（低风险）**：引入 ES Module（`<script type="module">`），将每个文件改为 `export const` 写法。浏览器原生支持，无需构建工具
- **中期**：引入 Vite 作为开发服务器，支持热更新、自动分包、生产构建
- **长期**：如需打包 APK 前做代码压缩，可用 Vite 的 build 模式输出到 `dist/`，再用 Capacitor 打包

**预估影响：**
- 冷启动从 ~350KB 全量加载 → 按需加载首页 ~120KB
- 首屏时间缩短 30-40%
- 后续新增功能不会再产生"加载顺序"类 Bug

---

### 1.2 超大文件 — 单点维护困难

**现状文件行数：**
| 文件 | 行数 | 问题 |
|------|------|------|
| `industryDetail.js` | 1619 | 产业详情页，包含物流规则面板、工厂产品卡片、上下游弹窗、搜索筛选等 |
| `engine.js` | 841 | 核心引擎，包含所有价格波动、结算逻辑 |
| `data.js` | ~1200 | 静态数据，每个产业/股票/基金/新闻都堆在一起 |
| `employees.js` | 448 | 员工系统，招聘+分配+士气+产出+物流辅助 |
| `state.js` | 555 | 状态管理 + 庞大的 migrate() 函数 |

**建议方案：**
- `industryDetail.js` 拆分为：
  - `pages/industryDetail/base.js`（基础渲染 + Tab 切换）
  - `pages/industryDetail/factoryCard.js`（工厂产品卡片）
  - `pages/industryDetail/logisticsPanel.js`（物流规则面板）
  - `pages/industryDetail/supplyChain.js`（上下游弹窗）
- `engine.js` 拆分为：
  - `engine/advance.js`（advance + advanceOneDay）
  - `engine/prices.js`（所有价格波动逻辑）
  - `engine/settle.js`（结算相关辅助函数）
- `data.js` 拆分为：
  - `data/industries.js`、`data/stocks.js`、`data/funds.js`、`data/metals.js`、`data/news.js`

---

### 1.3 `Router.refresh()` 双次渲染 Bug

**现状代码（ui.js）：**
```javascript
refresh() {
    this.render();
    if (this.current) {
        this.scrollPositions[this.current] = window.scrollY;
    }
    this.render();  // ← 第二次渲染，完全重复
    // ...
}
```
- 首次 `render()` 获取的滚动位置永远是 0（刚渲染完页面还在顶部）
- 第二次 `render()` 重新渲染，滚动位置恢复逻辑形同虚设
- NFT 性能浪费：每次刷新都会全量重绘两次

**修复方案：**
```javascript
refresh() {
    const saved = this.scrollPositions[this.current] || 0;
    this.render();
    requestAnimationFrame(() => window.scrollTo(0, saved));
}
```

---

### 1.4 `UI.modal` 使用 `new Function()` — 安全风险

**现状代码（ui.js）：**
```javascript
btns.forEach((btn, i) => {
    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const fn = new Function(actions[i].onclick);  // ← 危险
        fn();
    });
});
```
问题：
- CSP（Content Security Security Policy）环境下会被拦截
- XSS 注入风险：如果 onclick 字符串来自用户输入可被利用
- 无法被 IDE 静态分析，debug 困难

**修复方案：**
改为传函数引用而非字符串：
```javascript
// 调用方改为
UI.modal('标题', '内容', [
    { label: '确认', class: 'primary', action: () => { /* 具体逻辑 */ } }
]);
// modal 内部
btn.addEventListener('click', (e) => {
    e.stopPropagation();
    actions[i].action();
});
```

---

### 1.5 `State.migrate()` 持续膨胀 — 维护噩梦

**现状：**
- 已有 ~200+ 行，每次新增存档字段都要追加兼容逻辑
- 多种数据格式共存（对象→数组、分组→个体等），旧玩家存档经过 10+ 次迁移后性能下降
- 缺乏版本号机制，无法批量跳过旧迁移

**建议方案：**
```javascript
migrate() {
    const d = this.data;
    const currentVersion = d._schemaVersion || 0;
    if (currentVersion >= LATEST_VERSION) return;
    
    // 按版本号顺序执行迁移，每批版本一个函数
    const migrations = [
        [1, migrateV1ToV2],
        [2, migrateV2ToV3],
        // ...
    ];
    for (const [ver, fn] of migrations) {
        if (currentVersion < ver) fn.call(this, d);
    }
    d._schemaVersion = LATEST_VERSION;
}
```

---

## 二、性能层面问题（中优先级）

### 2.1 Factory 3秒 Tick 每次都存盘

**现状（time.js）：**
```javascript
factoryTick() {
    if (!this.enabled) return;
    if (this.isPaused) return;
    if (window.Engine && window.State && State.data) {
        Engine.factoryTick();  // 内部每次 batchIncome > 0 都调 State.save()
    }
}
```
- 工厂产出每次 >0 就触发 `localStorage.setItem`
- 一天约 360/3 × 60分钟 / 10秒 = 720次 tick
- localStorage 写入虽然异步但频繁触发会导致 UI 帧率波动（尤其是低端安卓机）

**优化方案：**
- 工厂 tick 中积攒产出，每 30 秒（10个tick）或页面隐藏时再统一存盘
- 使用 `requestIdleCallback` 或 `visibilitychange` 触发保存
- 利用防抖机制：`clearTimeout(saveTimer); saveTimer = setTimeout(() => State.save(), 3000)`

---

### 2.2 全量 innerHTML 重绘 — 页面闪烁

**现状：**
- 每次路由跳转 `app.innerHTML = "..."` 会销毁所有 DOM 重建
- 即使数据未变（如从子页返回列表页），也会完全重绘
- 无法保留滚动位置、输入焦点、动画状态

**优化方案：**
- 引入虚拟 DOM 库（如 `petite-vue`, `million.js`, `@preact/signals`）或手写差量更新
- 至少核心列表区做"是否需要重新渲染"的判断：
  ```javascript
  if (this._lastPage !== targetPage) {
      app.innerHTML = html;
      this._lastPage = targetPage;
  } else {
      // 只更新变化的元素
      this._patchDOM(diff);
  }
  ```

---

### 2.3 Canvas 图表每次 render 都重绘

**现状：**
- `Pages.overview._renderTrendChart()` 在每次 `render()` 后调用
- 如果数据未变（如切换到非概览页再切回来），图表数据完全相同但仍全量重绘
- 产业卡片 sparkline 每次进入详情页都要对所有产业遍历 `_renderSparklines`

**优化方案：**
- 图表缓存：在数据层加 `dirty` 标志，只在数据变化时重绘
- 使用离屏 canvas 缓存静态图表
- 对 sparkline 使用 `Intersection Observer`，只渲染可见区域内的 canvas

---

## 三、代码质量层面问题（中优先级）

### 3.1 事件绑定混乱 — `onclick` 内联 vs `addEventListener`

**现状混合使用：**
- HTML 模板中大量 `onclick="Industry.buy('farm','rice')"` — 难以追踪，全局命名空间污染
- 部分地方又用 `addEventListener`（如 modal 内部）
- 同一操作在多处复制同样字符串（如 `UI.closeModal()` 出现 20+ 次）

**统一方案：**
- 所有动态元素统一用 `data-action` + `data-params` 属性
- 在渲染容器上委托监听：
  ```javascript
  app.addEventListener('click', (e) => {
      const action = e.target.closest('[data-action]');
      if (!action) return;
      const fn = actionHandlers[action.dataset.action];
      fn?.(action.dataset.params);
  });
  ```

---

### 3.2 魔法数字/魔法字符串散落

**现状示例：**
```javascript
// engine.js
const drift = (Math.random() - 0.5) * 2 * (DATA.bank.rateDriftPerDay || 0.0003);
// time.js
totalSec: 180,  // 一天 3 分钟
FACTORY_TICK_MS: 3000,
// 多处出现 0.03、365、0.0001 等字面量
```
建议提取为命名常量：
```javascript
const GAME_DAY_SECONDS = 180;
const FACTORY_BATCH_MS = 3000;
const MAINTENANCE_RATE = 0.0001;
const DAYS_PER_YEAR = 365;
```

---

### 3.3 `window.FeatureName` 存在性检查冗余

**现状代码充斥：**
```javascript
if (window.EventSystem && EventSystem.isShutdown(...))
if (window.DisasterEvents) { ... }
if (window.Employees && Employees.updateMorale) { ... }
```
- 15+ 处 `if (window.X)` 检查，暗示加载时序依赖脆弱
- 换成 ES Module 后可以 `import` 保证依赖
- 短期方案：在启动时做一次依赖检查并报错

---

### 3.4 备份文件残留

**现状：**
- `js/engine.js.bak`、`js/pages/home.js.bak`、`js/pages/home.js.backup`
- `js/pages/staff.js.backup`、`js/pages/warehouse.js.backup`
- `js/industryDetail.js.bak`

**建议：**
- 加入 `.gitignore`
- 转为使用 Git 历史记录（`git log` 可回溯任意版本）
- 生产环境删除这些文件

---

## 四、游戏体验层面问题

### 4.1 难度差异不足

**现状：**
| 难度 | 初始资金 | 差异 |
|------|---------|------|
| 简单 | 50万 | 基准 |
| 中等 | 50万 | 与简单完全相同 |
| 困难 | 25万 | 仅资金减半 |

缺乏真正意义上的差异化。

**建议方案：**
| 难度 | 资金 | 事件频率 | 员工薪水 | 特殊规则 |
|------|------|---------|---------|---------|
| 简单 | 80万 | 30% 降低 | -20% | 天敌事件有 50% 概率自动解决 |
| 中等 | 50万 | 标准 | 标准 | - |
| 困难 | 25万 | +30% | +30% | 信用评级初始为 C |
| 地狱 | 10万 | +50% | +50% | 破产阈值从 -5万 → -1万 |

- 新增 `difficultyConfig` 全局参数
- 影响：Engine 阶段0天敌判定、Employees 招聘费用/产出、破产判定阈值
- 给予选择地狱难度的玩家专属成就

---

### 4.2 信用评级系统可刷

**现状：**
- 玩家可以"借1元 → 第二天还清 → 重复"快速升级
- 降级也只是30天，无实质惩罚
- 贷款额度 = 总资产 × 比例，无债务收入比考量

**建议方案：**
- 增加"信用历史"计数器：每次完成一笔贷款周期（借+还）才计一次有效升级进度
- 升级需要"完成 N 个完整贷款周期 + 连续 90 天无贷款余额"
- 降级改为：任何一笔贷款逾期 >7 天直接降一级
- 增加"贷款用途追踪"：贷款资金必须用于购买产业/金融产品才计入良好信用

---

### 4.3 竞争对手 AI 行为单一

**现状：**
- 每个对手只有 `growthRate` + `riskTolerance` 两个参数
- 资产变化 = 固定增长 × 周期倍率 × 随机数
- 与玩家零互动（不落子、不抢资源、不打价格战）
- `competitors.js` 对手详情页读取 `comp.portfolio`、`comp.desc`、`comp.lastAction` 但未在核心逻辑中填充

**建议方案：**
- **基础增强**：对手的 `portfolio` 随时间增长（自动买入产业），`portfolio` 影响其日收入
- **互动机制**：对手大量买入/卖出股票时，影响该股价（-1% ~ +1%），给玩家带来外部市场波动
- **行为差异**：
  - 激进型：大规模产业扩张 + 高风险投资，波动大
  - 稳健型：定期分红（资产 -X%，但增长更持续）
  - 专注型：只投 1-2 个产业，但该产业产出 +50%
- **排行榜变化可视化**：在排行榜页面显示近 30 天排名趋势折线

---

### 4.4 新手引导缺失

**现状：**
- 玩家首次进入游戏只看到难度选择 → 直接跳概览页
- 系统极其复杂（产业链、许可证、配方、物流规则、期货……）
- 无任务指引、无教程提示、无目标分解

**建议方案：**
- 新增"新手指引模式"（简单难度自动开启，其他难度可关闭）
  - 第一步：购买住宅 → 弹窗"招聘员工后产业才能有产出"
  - 第二步：招聘员工 → 弹窗"员工需要分配到具体产业"
  - 第三步：购买农业 → 弹窗"农业产出进入仓库"
  - 第四步：购买冶炼 → 弹窗"上游农业→冶金→工厂形成产业链"
- 每个 Tab 添加"?"帮助按钮，点击显示该页面功能说明
- 重要功能首次出现时给予弹窗高亮（不是全教程，而是"刚好此刻"的提示）

---

### 4.5 仓库页信息过载

**现状：**
- 仓库页 6 个 Tab（库存/矿石/农产品/金属/成品/说明）
- 每个 Tab 列出该分类所有材料（50+ 行）
- 矿石+农产品+金属三 Tab 存在大量材料重叠（同一种矿石在"库存"和"矿石市场"都出现）

**建议方案：**
- 合并为 3 个 Tab：「库存一览」「快速买卖」「说明」
- 库存一览：按原料分类的树形列表，点击展开子类
- 快速买卖：搜索框 + 只显示"有库存 或 已设置规则"的材料
- 已购入原料折叠显示，"查看全部"才展开

---

## 五、UI/UX 层面问题

### 5.1 文字密度与间距不足

**现状问题：**
- `font-size: 14px` 但很多信息行只用 `12px`、`11px`
- 列表项 `padding: 12px 14px` 视觉偏挤
- 缺少视觉层级（钞票数字和产业名一样大小）

**建议：**
- 数字 vs 文字分层：金额用 `font-weight: 600; font-size: 15px`，说明用 `12px` 灰色
- 卡片内行间距从 `margin-top: 6px` 提升到 `8px`
- 重要按钮（如"买入""卖出"）给予最小高度 44px 保证触摸区域

---

### 5.2 缺乏触觉反馈

**现状：**
- 所有按钮点击只有视觉变化（颜色变深）
- 关键操作（买入成功、解锁成就、晋升评级）无震动反馈

**建议方案：**
```javascript
// 工具函数
const Haptic = {
    light() { if (navigator.vibrate) navigator.vibrate(10); },
    medium() { if (navigator.vibrate) navigator.vibrate(25); },
    success() { if (navigator.vibrate) navigator.vibrate([10, 50, 10]); }
};
// 使用
button.addEventListener('click', () => { Haptic.light(); /* 原逻辑 */ });
// 成就解锁
Achievements.unlock = () => { Haptic.success(); UI.modal(...); }
```

---

### 5.3 暗色模式不完整

**现状：**
- CSS 变量覆盖不全面
- 部分硬编码颜色（如 `#f5f5f7`、`rgba(0,0,0,0.08)`）未走变量
- Canvas 图表暗色模式未适配（仍是黑字在深色背景）

**建议：**
- 所有颜色统一走 CSS 变量
- 图表颜色通过 `getComputedStyle` 读取当前主题变量：
  ```javascript
  const style = getComputedStyle(document.documentElement);
  const upColor = style.getPropertyValue('--up').trim();
  ```

---

### 5.4 Toast 弹窗寿命过短

**现状：**
- Toast 默认 `2000ms` 消失，对于"已解雇""已购买"等重要操作过短
- 多条 Toast 同时出现时会重叠堆叠

**建议：**
- 关键操作（交易、升级）Toast 延长至 3500ms 且带成功图标 ✓
- 实现 Toast 队列：新 Toast 在旧 Toast 下方叠加，最多保留 3 条

---

## 六、数据完整性层面

### 6.1 存档损坏无恢复机制

**现状：**
- `localStorage` 存储被用户清除/隐私模式/容量超限→ 直接丢失所有进度
- 崩溃时 `_advancing` 锁未释放 → 后续所有推进被吞（已通过僵尸锁自愈解决，但属于补丁式修复）

**建议：**
- 实现"存档备份槽位"：每次存档同时在 `sessionStorage` 备份最后一次状态
- 导出/导入存档：生成分享码（Base64 JSON），玩家可复制保存
- 崩溃恢复：启动时检测 `_advancing` 锁状态，自动执行 rollback

---

### 6.2 无离线收益计算

**现状：**
- 玩家关闭页面再打开，时间不会流逝（游戏完全在内存中计时）
- 玩家连续离线 7 天，回来发现什么都没发生

**建议：**
- 记录 `lastActiveTimestamp` 在 localStorage
- 重新打开时计算离线时长（最多算 72 小时）
- 给予离线收益弹窗："您离线了 X 天，获得被动收入 ¥XXX"
- 离线收益按存款利息 + 产业基础收益的 50% 计算

---

## 七、开发效率层面

### 7.1 无热更新 / 开发服务器

**现状：**
- 修改代码后需手动 F5 刷新浏览器
- localStorage 存档在刷新时可能保留旧数据导致 Bug 难以复现

**建议：**
- 引入 Vite：`npm create vite@latest` 初始化，配置 PWA 插件
- 或使用 `live-server` / `browser-sync` 提供基础自动刷新
- 开发模式添加 `[DEV]` 标签，方便清理测试存档

---

### 7.2 缺乏测试覆盖

**现状：**
- 无任何单元测试
- 每次改动后需手动全流程测试（30+ 页面、数百种交互）

**建议优先补充：**
- `engine.js` 结算逻辑：单产业收益计算、工厂产出公式
- `state.js` 迁移函数：用 v1/v2/v3 存档数据验证 migrate 后格式正确
- `employees.js`：招聘产出倍率、薪水计算
- 测试工具推荐：Vitest（可与 Vite 共用配置）

---

## 八、优化优先级总结

### P0（立即修复 — 影响核心体验）
1. 修复 `Router.refresh()` 双次渲染 Bug
2. 修复 `UI.modal` 的 `new Function()` — 改为回调函数
3. 工厂 tick 存入防抖/节流
4. 移除备份文件、清理 `.gitignore`

### P1（短期可执行 — 提升可维护性）
1. 模块系统迁移（ES Module 或 Vite）
2. 拆分 `industryDetail.js`（1619行 → 4个文件）
3. 统一事件绑定方式（data-action 委托）
4. 提取魔法数字为命名常量
5. 图表缓存 + 懒渲染

### P2（中期规划 — 提升游戏深度）
1. 难度差异化设计
2. 对手 AI 增强
3. 新手引导系统
4. 存档版本号机制
5. 离线收益

### P3（长期演进 — 技术债务清理）
1. 引擎结算逻辑单元测试
2. 引入状态管理库（如 Pinia 的轻量替代品）
3. CSS 变量全面覆盖
4. 开发服务器 + 热更新
5. 插件化架构（金融/实业/成就作为独立插件）

---

## 九、预估工时与风险

| 优化项 | 工时预估 | 风险等级 | 备注 |
|--------|---------|---------|------|
| P0 四项修复 | 2-4 小时 | 低 | 主要是 bugfix，不影响功能 |
| ES Module 迁移 | 1-2 天 | 中 | 需重写所有 script 标签，需全量回归测试 |
| industryDetail.js 拆分 | 0.5-1 天 | 低 | 机械性工作，测试成本可控 |
| 工厂 tick 防抖 | 2-4 小时 | 低 | 加 setInterval 锁即可 |
| 新手引导 | 2-3 天 | 中 | 涉及 UI 改动和文本打磨 |
| 对手 AI 增强 | 3-5 天 | 高 | 需要平衡性调试 |
| 日常测试覆盖 | 持续投入 | 低 | 从核心公式开始，逐步推进 |

---

> 以上建议可按优先级分批实施。如需针对某一类别深入讨论或生成具体实现 prompt，请告知。
