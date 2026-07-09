/* competitors.js — 竞争对手与排名系统 */

const Competitors = {

  /* ===== 对手定义 ===== */
  definitions: [
    { 
      id: "huahai", name: "华海集团", style: "aggressive", 
      baseAssets: 800000, growthRate: 0.08, riskTolerance: 0.7,
      industries: ["mining", "metall", "factory"]
    },
    { 
      id: "xinsheng", name: "鑫盛资本", style: "steady", 
      baseAssets: 1000000, growthRate: 0.05, riskTolerance: 0.3,
      industries: ["farm", "estate", "logistics"]
    },
    { 
      id: "hongyuan", name: "鸿远实业", style: "focused", 
      baseAssets: 600000, growthRate: 0.06, riskTolerance: 0.5,
      industries: ["mining", "metall", "factory"]
    }
  ],

  /* ===== 初始化对手数据 ===== */
  init() {
    if (State.data.competitors && State.data.competitors.length > 0) return;
    const day = (State.data.date || {}).totalDays || 0;
    State.data.competitors = this.definitions.map(def => ({
      id: def.id,
      name: def.name,
      style: def.style,
      assets: def.baseAssets,
      dayAssets: def.baseAssets,
      growthRate: def.growthRate,
      riskTolerance: def.riskTolerance,
      industries: [...def.industries],
      history: [],
      lastChange: 0
    }));
  },

  /* ===== 每日更新对手资产 ===== */
  updateDaily() {
    this.init();
    const phase = (State.data.economicPhase || "stable");
    const phaseMult = {
      prosperity: 1.3,
      stable: 1.0,
      recession: 0.7,
      depression: 0.4
    }[phase] || 1.0;

    State.data.competitors.forEach(comp => {
      const prevAssets = comp.assets;
      
      // 基础增长
      let dailyGrowth = comp.growthRate / 365 * comp.assets;
      
      // 经济周期影响
      dailyGrowth *= phaseMult;
      
      // 随机波动 (-5% 到 +10%)
      const randomFactor = 0.95 + Math.random() * 0.15;
      dailyGrowth *= randomFactor;
      
      // 风格调整
      if (comp.style === "aggressive") {
        dailyGrowth *= 1.2; // 激进型增长更高但风险更大
        if (Math.random() < 0.05) dailyGrowth *= -0.5; // 5% 概率亏损
      } else if (comp.style === "steady") {
        dailyGrowth *= 0.9; // 稳健型增长略低但稳定
      }
      
      comp.assets = Math.max(100000, comp.assets + dailyGrowth);
      comp.dayAssets = comp.assets;
      comp.lastChange = comp.assets - prevAssets;
      
      // 记录历史（每10天记录一次）
      const day = (State.data.date || {}).totalDays || 0;
      if (day % 10 === 0) {
        comp.history.push({ day, assets: comp.assets });
        if (comp.history.length > 50) comp.history.shift();
      }
    });

    State.data.competitors = State.data.competitors;
  },

  /* ===== 获取排名 ===== */
  getRanking() {
    const playerAssets = (State.totalAssets && State.totalAssets()) || 0;
    const all = [
      { name: "你的集团", assets: playerAssets, isPlayer: true },
      ...(State.data.competitors || []).map(c => ({ name: c.name, assets: c.assets, style: c.style, lastChange: c.lastChange || 0 }))
    ];
    return all.sort((a, b) => b.assets - a.assets);
  },

  /* ===== 获取排名文字 ===== */
  getRankText() {
    const ranking = this.getRanking();
    const playerRank = ranking.findIndex(r => r.isPlayer) + 1;
    return "第 " + playerRank + " / " + ranking.length + " 名";
  },

  /* ===== 获取第N名对手 ===== */
  getOpponent(rank) {
    const ranking = this.getRanking();
    if (rank >= 1 && rank <= ranking.length) {
      return ranking[rank - 1];
    }
    return null;
  },

  /* ===== 获取玩家排名变化（与上次记录比较） ===== */
  getPlayerRankChange() {
    const currentRanking = this.getRanking();
    const currentPlayerRank = currentRanking.findIndex(r => r.isPlayer) + 1;
    if (State.data.lastPlayerRank == null) {
      State.data.lastPlayerRank = currentPlayerRank;
      return 0;
    }
    const change = State.data.lastPlayerRank - currentPlayerRank;
    State.data.lastPlayerRank = currentPlayerRank;
    return change;
  }
};

window.Competitors = Competitors;