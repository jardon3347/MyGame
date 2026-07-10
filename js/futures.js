/* futures.js — 期货贸易系统 */
import { DATA } from './data.js';
import { State } from './state.js';
import { UI, Router } from './ui.js';
import { Achievements } from './achievements.js';

export const Futures = {

  /* ===== 期货品种 ===== */
  contracts: [
    { id: "copper", name: "铜期货", materialCode: "copperR", contractSize: 5, leverage: 10, marginRate: 0.1 },
    { id: "steel", name: "螺纹钢期货", materialCode: "steel", contractSize: 10, leverage: 8, marginRate: 0.1 },
    { id: "wheat", name: "小麦期货", materialCode: "wheat", contractSize: 50, leverage: 6, marginRate: 0.1 },
    { id: "corn", name: "玉米期货", materialCode: "corn", contractSize: 50, leverage: 6, marginRate: 0.1 },
    { id: "iron", name: "铁矿石期货", materialCode: "iron", contractSize: 100, leverage: 8, marginRate: 0.1 },
    { id: "coal", name: "动力煤期货", materialCode: "coal", contractSize: 100, leverage: 8, marginRate: 0.1 },
    { id: "gold", name: "黄金期货", materialCode: "gold_ore", contractSize: 1, leverage: 15, marginRate: 0.1 },
  ],

  /* ===== 获取合约信息 ===== */
  getContract(contractId) {
    return this.contracts.find(c => c.id === contractId);
  },

  /* ===== 获取当前价格 ===== */
  getCurrentPrice(contractId) {
    const contract = this.getContract(contractId);
    if (!contract) return 0;
    const material = (DATA.rawMaterials || []).find(m => m.code === contract.materialCode);
    return material ? material.price : 0;
  },

  /* ===== 开仓 ===== */
  openPosition(contractId, direction, quantity) {
    const contract = this.getContract(contractId);
    if (!contract) { UI.toast("合约不存在"); return; }

    const price = this.getCurrentPrice(contractId);
    if (price <= 0) { UI.toast("当前无法交易"); return; }

    const margin = price * contract.contractSize * quantity * contract.marginRate;
    if (State.data.cash < margin) { UI.toast("保证金不足，需要 " + State.formatMoney(margin)); return; }

    // 扣除保证金
    State.data.cash -= margin;

    // 创建持仓
    const position = {
      id: "futures_" + Date.now(),
      contractId: contractId,
      contractName: contract.name,
      direction: direction, // "long" 或 "short"
      quantity: quantity,
      openPrice: price,
      margin: margin,
      leverage: contract.leverage,
      openDay: (State.data.date || {}).totalDays || 0,
      expiryDay: ((State.data.date || {}).totalDays || 0) + 30 // 30天到期
    };

    if (!State.data.futuresPositions) State.data.futuresPositions = [];
    State.data.futuresPositions.push(position);
    State.save();

    UI.toast("开仓成功: " + contract.name + (direction === "long" ? " 做多" : " 做空") + " " + quantity + " 手");
    Router.refresh();
  },

  /* ===== 平仓 ===== */
  closePosition(positionId) {
    const positions = State.data.futuresPositions || [];
    const pos = positions.find(p => p.id === positionId);
    if (!pos) { UI.toast("持仓不存在"); return; }

    const contract = this.getContract(pos.contractId);
    const currentPrice = this.getCurrentPrice(pos.contractId);
    
    // 计算盈亏
    let pnl = 0;
    if (pos.direction === "long") {
      pnl = (currentPrice - pos.openPrice) * contract.contractSize * pos.quantity;
    } else {
      pnl = (pos.openPrice - currentPrice) * contract.contractSize * pos.quantity;
    }

    // 返还保证金 + 盈亏
    State.data.cash += pos.margin + pnl;

    // 统计
    if (!State.data.futuresStats) State.data.futuresStats = { totalProfit: 0, totalLoss: 0 };
    if (pnl > 0) State.data.futuresStats.totalProfit += pnl;
    else State.data.futuresStats.totalLoss += Math.abs(pnl);

    // 移除持仓
    State.data.futuresPositions = positions.filter(p => p.id !== positionId);
    State.save();

    const emoji = pnl >= 0 ? "+" : "";
    UI.toast("平仓" + (pnl >= 0 ? "盈利" : "亏损") + ": " + emoji + State.formatMoney(pnl));
    Router.refresh();
  },

  /* ===== 获取当前持仓 ===== */
  getPositions() {
    return State.data.futuresPositions || [];
  },

  /* ===== 计算持仓盈亏 ===== */
  getUnrealizedPnL(position) {
    const contract = this.getContract(position.contractId);
    if (!contract) return 0;
    const currentPrice = this.getCurrentPrice(position.contractId);
    if (position.direction === "long") {
      return (currentPrice - position.openPrice) * contract.contractSize * position.quantity;
    } else {
      return (position.openPrice - currentPrice) * contract.contractSize * position.quantity;
    }
  },

  /* ===== 每日结算（到期强制平仓）===== */
  dailySettle() {
    const positions = State.data.futuresPositions || [];
    const now = (State.data.date || {}).totalDays || 0;
    const expired = positions.filter(p => now >= p.expiryDay);
    
    expired.forEach(pos => {
      this.closePosition(pos.id);
    });
  },

  /* ===== 检查是否可交易 ===== */
  isAvailable() {
    if (window.Achievements) {
      return Achievements.isUnlocked("futures_trade");
    }
    return true;
  }
};

window.Futures = Futures;
