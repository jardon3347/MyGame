/* charts.js 鈥?杞婚噺 Canvas 瓒嬪娍鍥捐〃锛堟棤澶栭儴渚濊禆锛?*/
const Charts = {

  /** 杩蜂綘鎶樼嚎鍥撅紙sparkline锛夛細16-24px 楂橈紝鐢ㄤ簬浜т笟鍗＄墖
   *  @param {HTMLCanvasElement} canvas
   *  @param {Array}  data   - [{income: number}, ...]
   *  @param {Object} options - {width, height, lineColor, upColor, downColor}
   */
  sparkline(canvas, data, options) {
    const opt = Object.assign({
      width: canvas.clientWidth || 80,
      height: 16,
      lineColor: null,    // null = auto by trend
      upColor: '#e24b4a',
      downColor: '#1d9e75',
      flatColor: '#9a9a9f',
      lineWidth: 1.5,
      padding: 1
    }, options);

    const values = (data || []).map(d => d.income != null ? d.income : 0);
    if (values.length < 2) { this._clearCanvas(canvas, opt.width, opt.height); return; }

    const dpr = window.devicePixelRatio || 1;
    canvas.width = opt.width * dpr;
    canvas.height = opt.height * dpr;
    canvas.style.width = opt.width + 'px';
    canvas.style.height = opt.height + 'px';
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;

    const pad = opt.padding;
    const w = opt.width - pad * 2;
    const h = opt.height - pad * 2;

    // 颜色：按均值正负判断
    const last = values[values.length - 1];
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    let color = opt.flatColor;
    if (opt.lineColor) {
      color = opt.lineColor;
    } else if (avg > 0) {
      color = opt.upColor;
    } else if (avg < 0) {
      color = opt.downColor;
    }

    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = opt.lineWidth;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    for (let i = 0; i < values.length; i++) {
      const x = pad + (i / (values.length - 1)) * w;
      const y = pad + h - ((values[i] - min) / range) * h;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // 末端小圆点
    const lastX = pad + w;
    const lastY = pad + h - ((last - min) / range) * h;
    ctx.beginPath();
    ctx.arc(lastX, lastY, 2, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  },

  /** 瀹屾暣鎶樼嚎鍥撅細甯?X 杞达紙鏃ユ湡锛夈€乊 杞达紙閲戦锛夈€侀浂绾胯櫄绾?   *  @param {HTMLCanvasElement} canvas
   *  @param {Array}  data   - [{day, netIncome, revenue, expenses}, ...]
   *  @param {Object} options - {width, height}
   */
  lineChart(canvas, data, options) {
    const opt = Object.assign({
      width: canvas.clientWidth || 320,
      height: 80,
      showAxes: true,
      zeroLine: true,
      upColor: '#e24b4a',
      downColor: '#1d9e75',
      areaOpacity: 0.08,
      lineWidth: 2,
      labelColor: '#9a9a9f',
      gridColor: 'rgba(255,255,255,0.06)',
      textSize: 9,
      paddingTop: 10,
      paddingBottom: 16,
      paddingLeft: 4,
      paddingRight: 4
    }, options);

    const values = (data || []).map(d => d.netIncome != null ? d.netIncome : 0);
    if (values.length < 2) { this._clearCanvas(canvas, opt.width, opt.height); return; }

    const dpr = window.devicePixelRatio || 1;
    canvas.width = opt.width * dpr;
    canvas.height = opt.height * dpr;
    canvas.style.width = opt.width + 'px';
    canvas.style.height = opt.height + 'px';
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    const min = Math.min(...values, 0);
    const max = Math.max(...values, 0);
    const range = max - min || 1;
    const w = opt.width - opt.paddingLeft - opt.paddingRight;
    const h = opt.height - opt.paddingTop - opt.paddingBottom;

    const toX = (i) => opt.paddingLeft + (i / Math.max(values.length - 1, 1)) * w;
    const toY = (v) => opt.paddingTop + h - ((v - min) / range) * h;

    // === 缃戞牸绾?===
    if (opt.showAxes) {
      const gridLines = 4;
      ctx.strokeStyle = opt.gridColor;
      ctx.lineWidth = 0.5;
      for (let i = 0; i <= gridLines; i++) {
        const y = opt.paddingTop + (h / gridLines) * i;
        ctx.beginPath();
        ctx.moveTo(opt.paddingLeft, y);
        ctx.lineTo(opt.width - opt.paddingRight, y);
        ctx.stroke();
      }
    }

    // === 闆剁嚎锛堣櫄绾匡級 ===
    if (opt.zeroLine && min < 0 && max > 0) {
      const zeroY = toY(0);
      ctx.beginPath();
      ctx.strokeStyle = opt.labelColor;
      ctx.lineWidth = 0.5;
      ctx.setLineDash([3, 3]);
      ctx.moveTo(opt.paddingLeft, zeroY);
      ctx.lineTo(opt.width - opt.paddingRight, zeroY);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // === 闈㈢Н濉厖 ===
    const zeroY = toY(0);
    ctx.beginPath();
    for (let i = 0; i < values.length; i++) {
      const x = toX(i), y = toY(values[i]);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    // 闭合到零线
    ctx.lineTo(toX(values.length - 1), zeroY);
    ctx.lineTo(toX(0), zeroY);
    ctx.closePath();
    const avgLine = values.reduce((a, b) => a + b, 0) / values.length;
    const areaColor = avgLine >= 0 ? opt.upColor : opt.downColor;
    ctx.fillStyle = this._hexToRgba(areaColor, opt.areaOpacity);
    ctx.fill();

    // === 鎶樼嚎 ===
    ctx.beginPath();
    ctx.strokeStyle = areaColor;
    ctx.lineWidth = opt.lineWidth;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    for (let i = 0; i < values.length; i++) {
      const x = toX(i), y = toY(values[i]);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // === 鏈€鏂板€煎渾鐐?===
    const lastX = toX(values.length - 1);
    const lastY = toY(values[values.length - 1]);
    ctx.beginPath();
    ctx.arc(lastX, lastY, 3, 0, Math.PI * 2);
    ctx.fillStyle = areaColor;
    ctx.fill();

    // === Y 杞存爣绛撅紙min/max/0锛?===
    if (opt.showAxes) {
      ctx.fillStyle = opt.labelColor;
      ctx.font = opt.textSize + 'px system-ui, sans-serif';
      ctx.textAlign = 'left';
      // 顶部（max）
      ctx.fillText(State.formatMoney(max), 2, opt.paddingTop + opt.textSize);
      // 闆剁嚎
      if (min < 0 && max > 0) {
        ctx.fillText('楼0', 2, zeroY + opt.textSize / 2 - 1);
      }
      // 底部（min）
      ctx.fillText(State.formatMoney(min), 2, opt.height - opt.paddingBottom + opt.textSize);
    }
  },

  /* 杈呭姪锛氭竻绌虹敾甯?*/
  _clearCanvas(canvas, w, h) {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, w * dpr, h * dpr);
  },

  /* 杈呭姪锛歨ex 杞?rgba */
  _hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }
};

window.Charts = Charts;

