/**
 * One Acre Intelligent Farm - High Performance Canvas Visualizations
 * Zero dependencies, retina sharp, interactive tooltips, timeframe switching,
 * auto-resizing observers, and dashboard historical telemetry widgets.
 */

const FarmCharts = {
  activeTimeframe: "today", // "today" | "week" | "month"
  observer: null,
  resizeObserver: null,
  tooltips: {},
  _initialized: false,

  init() {
    if (this._initialized) {
      this.renderAllCharts();
      return;
    }
    this._initialized = true;
    this.bindTimeframeButtons();
    this.setupObservers();
    
    // Initial render with fallbacks for DOM layout settling
    this.renderAllCharts();
    if (typeof requestAnimationFrame !== "undefined") {
      requestAnimationFrame(() => this.renderAllCharts());
    }
    setTimeout(() => this.renderAllCharts(), 150);
    setTimeout(() => this.renderAllCharts(), 600);
    setTimeout(() => this.renderAllCharts(), 1500);
  },

  setupObservers() {
    // 1. Intersection Observer to render when scrolled into view
    if ("IntersectionObserver" in window) {
      const analyticsSection = document.getElementById("analytics");
      if (analyticsSection) {
        this.observer = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              this.renderAllCharts();
            }
          });
        }, { threshold: 0.1 });
        this.observer.observe(analyticsSection);
      }
    }

    // 2. ResizeObserver on canvas containers
    if ("ResizeObserver" in window) {
      this.resizeObserver = new ResizeObserver(() => {
        this.renderAllCharts();
      });
      document.querySelectorAll(".canvas-container, .dash-sparkline-canvas-box").forEach(el => {
        this.resizeObserver.observe(el);
      });
    }

    // 3. Window resize and orientation change
    window.addEventListener("resize", () => this.renderAllCharts(), { passive: true });
    window.addEventListener("orientationchange", () => setTimeout(() => this.renderAllCharts(), 200));

    // 4. Tab visibility changes
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) {
        setTimeout(() => this.renderAllCharts(), 100);
      }
    });
  },

  bindTimeframeButtons() {
    const buttons = document.querySelectorAll(".timeframe-btn");
    buttons.forEach(btn => {
      btn.addEventListener("click", () => {
        buttons.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        this.activeTimeframe = btn.getAttribute("data-timeframe") || "today";
        this.renderAllCharts();
      });
    });
  },

  renderAllCharts() {
    const farmAnalytics = (window.ONE_ACRE_FARM && window.ONE_ACRE_FARM.analytics) ? window.ONE_ACRE_FARM.analytics : null;
    if (!farmAnalytics) return;

    const data = farmAnalytics[this.activeTimeframe] || farmAnalytics.today;
    if (!data) return;

    // 1. Soil Moisture Over Time
    this.drawLineChart("chart-moisture", data.labels, [
      { label: "Avg Soil Moisture (%)", data: data.soilMoisture, color: "#16a34a", fill: "rgba(22, 163, 74, 0.22)" }
    ], { unit: "%", min: 10, max: 70 });

    // 2. Water Consumption Over Time
    this.drawLineChart("chart-water", data.labels, [
      { label: "Water Used (L)", data: data.waterUsage, color: "#0284c7", fill: "rgba(2, 132, 199, 0.24)" }
    ], { unit: " L", min: 0 });

    // 3. Temperature Over Time
    this.drawLineChart("chart-temp", data.labels, [
      { label: "Ambient Temp (°C)", data: data.temperature, color: "#f59e0b", fill: "rgba(245, 158, 11, 0.2)" }
    ], { unit: "°C", min: 15, max: 40 });

    // 4. Humidity Over Time
    this.drawLineChart("chart-humidity", data.labels, [
      { label: "Relative Humidity (%)", data: data.humidity, color: "#059669", fill: "rgba(5, 150, 105, 0.2)" }
    ], { unit: "%", min: 30, max: 95 });

    // 5. Zone-Wise Water Usage (Bar chart: Zones 01 - 08)
    const zoneLabels = ["Z01", "Z02", "Z03", "Z04", "Z05", "Z06", "Z07", "Z08"];
    this.drawBarChart("chart-zone-water", zoneLabels, farmAnalytics.zoneWaterUsage || [210, 230, 180, 295, 250, 190, 170, 185], {
      unit: " L",
      color: "#0284c7",
      highlightIndex: 3 // Zone 04 is actively pumping
    });

    // 6. Zone-Wise Estimated Yield (Bar chart: kg per zone)
    this.drawBarChart("chart-zone-yield", zoneLabels, farmAnalytics.zoneYields || [1850, 2100, 950, 1550, 2400, 1250, 2800, 1150], {
      unit: " kg",
      color: "#16a34a"
    });

    // 7. Render Dashboard Mini Historical Sparklines (if present)
    this.renderDashboardSparklines(data);
  },

  renderDashboardSparklines(data) {
    // Soil Moisture Sparkline on Dashboard
    this.drawMiniSparkline("dash-spark-moisture", data.soilMoisture, "#16a34a", "rgba(22, 163, 74, 0.2)");
    // Water Usage Sparkline on Dashboard
    this.drawMiniSparkline("dash-spark-water", data.waterUsage, "#0284c7", "rgba(2, 132, 199, 0.2)");
    // Temperature Sparkline on Dashboard
    this.drawMiniSparkline("dash-spark-temp", data.temperature, "#f59e0b", "rgba(245, 158, 11, 0.2)");
    // Humidity Sparkline on Dashboard
    this.drawMiniSparkline("dash-spark-humidity", data.humidity, "#059669", "rgba(5, 150, 105, 0.2)");
  },

  drawMiniSparkline(canvasId, dataPoints, strokeColor, fillColor) {
    const canvas = document.getElementById(canvasId);
    if (!canvas || !dataPoints || !dataPoints.length) return;

    const ctx = canvas.getContext("2d");
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const parent = canvas.parentElement;
    const width = Math.max(parent ? parent.clientWidth : 0, canvas.clientWidth, 120);
    const height = Math.max(parent ? parent.clientHeight : 0, canvas.clientHeight, 44);

    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    ctx.clearRect(0, 0, width, height);

    const pad = 4;
    const w = width - pad * 2;
    const h = height - pad * 2;
    const min = Math.min(...dataPoints);
    const max = Math.max(...dataPoints);
    const range = (max - min) || 1;

    const pts = dataPoints.map((v, i) => ({
      x: pad + (w / Math.max(1, dataPoints.length - 1)) * i,
      y: pad + h - ((v - min) / range) * h
    }));

    // Area
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 0; i < pts.length - 1; i++) {
      const cx = (pts[i].x + pts[i + 1].x) / 2;
      ctx.bezierCurveTo(cx, pts[i].y, cx, pts[i + 1].y, pts[i + 1].x, pts[i + 1].y);
    }
    ctx.lineTo(pts[pts.length - 1].x, height);
    ctx.lineTo(pts[0].x, height);
    ctx.closePath();
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, fillColor);
    grad.addColorStop(1, "rgba(255, 255, 255, 0)");
    ctx.fillStyle = grad;
    ctx.fill();

    // Line
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 0; i < pts.length - 1; i++) {
      const cx = (pts[i].x + pts[i + 1].x) / 2;
      ctx.bezierCurveTo(cx, pts[i].y, cx, pts[i + 1].y, pts[i + 1].x, pts[i + 1].y);
    }
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2;
    ctx.stroke();

    // End point dot
    const last = pts[pts.length - 1];
    ctx.beginPath();
    ctx.arc(last.x, last.y, 3.5, 0, Math.PI * 2);
    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2;
    ctx.fill();
    ctx.stroke();
  },

  drawLineChart(canvasId, labels, datasets, options = {}) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const parent = canvas.parentElement;
    const width = Math.max(parent ? parent.clientWidth : 0, canvas.clientWidth, 320);
    const height = Math.max(parent ? parent.clientHeight : 0, canvas.clientHeight, 160);

    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const padding = { top: 22, right: 18, bottom: 28, left: 42 };
    const chartW = Math.max(10, width - padding.left - padding.right);
    const chartH = Math.max(10, height - padding.top - padding.bottom);

    ctx.clearRect(0, 0, width, height);

    const allValues = (datasets && datasets.length) ? datasets.flatMap(d => d.data || [0]) : [0];
    let minVal = options.min !== undefined ? options.min : Math.min(...allValues) * 0.85;
    let maxVal = options.max !== undefined ? options.max : Math.max(...allValues) * 1.15;
    const range = (maxVal - minVal) || 1;

    // Draw horizontal dashed grid lines & Y labels
    ctx.strokeStyle = "rgba(100, 116, 139, 0.16)";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);

    const steps = 3;
    for (let i = 0; i <= steps; i++) {
      const y = padding.top + (chartH / steps) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();

      const labelVal = Math.round(maxVal - (range / steps) * i);
      ctx.fillStyle = "#64748b";
      ctx.font = "600 10px 'Inter', sans-serif";
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
      ctx.fillText(`${labelVal}${options.unit || ""}`, padding.left - 8, y);
    }
    ctx.setLineDash([]);

    // Draw datasets
    datasets.forEach(ds => {
      if (!ds.data || !ds.data.length) return;

      const numPts = Math.max(1, labels.length - 1);
      const points = ds.data.map((val, idx) => {
        const x = padding.left + (chartW / numPts) * idx;
        const y = padding.top + chartH - ((val - minVal) / range) * chartH;
        return { x, y, val };
      });

      // Fill area under curve with lush gradient
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 0; i < points.length - 1; i++) {
        const p0 = points[i];
        const p1 = points[i + 1];
        const cpX = (p0.x + p1.x) / 2;
        ctx.bezierCurveTo(cpX, p0.y, cpX, p1.y, p1.x, p1.y);
      }
      ctx.lineTo(points[points.length - 1].x, height - padding.bottom);
      ctx.lineTo(points[0].x, height - padding.bottom);
      ctx.closePath();

      const gradient = ctx.createLinearGradient(0, padding.top, 0, height - padding.bottom);
      gradient.addColorStop(0, ds.fill || "rgba(22, 163, 74, 0.25)");
      gradient.addColorStop(1, "rgba(255, 255, 255, 0.0)");
      ctx.fillStyle = gradient;
      ctx.fill();

      // Stroke curve with glowing shadow
      ctx.save();
      ctx.shadowColor = ds.color || "#16a34a";
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 0; i < points.length - 1; i++) {
        const p0 = points[i];
        const p1 = points[i + 1];
        const cpX = (p0.x + p1.x) / 2;
        ctx.bezierCurveTo(cpX, p0.y, cpX, p1.y, p1.x, p1.y);
      }
      ctx.strokeStyle = ds.color || "#16a34a";
      ctx.lineWidth = 2.6;
      ctx.stroke();
      ctx.restore();

      // Points and X-axis labels
      points.forEach((pt, idx) => {
        ctx.beginPath();
        const isLast = idx === points.length - 1;
        ctx.arc(pt.x, pt.y, isLast ? 4.5 : 3, 0, Math.PI * 2);
        ctx.fillStyle = isLast ? ds.color : "#ffffff";
        ctx.strokeStyle = ds.color;
        ctx.lineWidth = 2;
        ctx.fill();
        ctx.stroke();

        if (labels[idx]) {
          ctx.fillStyle = "#64748b";
          ctx.font = "500 10px 'Inter', sans-serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "top";
          ctx.fillText(labels[idx], pt.x, height - padding.bottom + 8);
        }
      });
    });
  },

  drawBarChart(canvasId, labels, data, options = {}) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const parent = canvas.parentElement;
    const width = Math.max(parent ? parent.clientWidth : 0, canvas.clientWidth, 320);
    const height = Math.max(parent ? parent.clientHeight : 0, canvas.clientHeight, 160);

    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const padding = { top: 22, right: 18, bottom: 28, left: 44 };
    const chartW = Math.max(10, width - padding.left - padding.right);
    const chartH = Math.max(10, height - padding.top - padding.bottom);

    ctx.clearRect(0, 0, width, height);

    const validData = (data && data.length) ? data : [10];
    const maxVal = Math.max(...validData) * 1.15 || 10;
    const barWidth = Math.min(26, Math.max(8, (chartW / Math.max(1, labels.length)) * 0.62));
    const gap = chartW / Math.max(1, labels.length);

    // Grid lines
    ctx.strokeStyle = "rgba(100, 116, 139, 0.14)";
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    for (let i = 0; i <= 3; i++) {
      const y = padding.top + (chartH / 3) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();

      const labelVal = Math.round(maxVal - (maxVal / 3) * i);
      ctx.fillStyle = "#64748b";
      ctx.font = "600 9px 'Inter', sans-serif";
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
      ctx.fillText(`${labelVal}${options.unit || ""}`, padding.left - 7, y);
    }
    ctx.setLineDash([]);

    // Draw Bars with rounded top & gradient
    labels.forEach((label, idx) => {
      const val = validData[idx] || 0;
      const barH = Math.max(4, (val / maxVal) * chartH);
      const x = padding.left + gap * idx + (gap - barWidth) / 2;
      const y = padding.top + chartH - barH;
      const isHighlighted = options.highlightIndex === idx;

      // Gradient bar fill
      const grad = ctx.createLinearGradient(0, y, 0, y + barH);
      if (isHighlighted) {
        grad.addColorStop(0, "#f59e0b");
        grad.addColorStop(1, "#d97706");
      } else {
        const baseColor = options.color || "#16a34a";
        grad.addColorStop(0, baseColor);
        grad.addColorStop(1, baseColor === "#16a34a" ? "#064e3b" : "#0369a1");
      }

      ctx.fillStyle = grad;
      this.roundRect(ctx, x, y, barWidth, barH, 4, true);

      // Value label on top of bar
      ctx.fillStyle = isHighlighted ? "#d97706" : "#475569";
      ctx.font = "600 8.5px 'JetBrains Mono', monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";
      ctx.fillText(`${val}`, x + barWidth / 2, y - 2);

      // Label below bar
      ctx.fillStyle = isHighlighted ? "#d97706" : "#64748b";
      ctx.font = isHighlighted ? "700 10px 'Inter', sans-serif" : "500 10px 'Inter', sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillText(label, x + barWidth / 2, height - padding.bottom + 8);
    });
  },

  roundRect(ctx, x, y, width, height, radius, fill) {
    if (height < 2) return;
    const r = Math.min(radius, width / 2, height / 2);
    ctx.beginPath();
    ctx.moveTo(x, y + r);
    ctx.lineTo(x, y + height);
    ctx.lineTo(x + width, y + height);
    ctx.lineTo(x + width, y + r);
    ctx.quadraticCurveTo(x + width, y, x + width - r, y);
    ctx.lineTo(x + r, y);
    ctx.quadraticCurveTo(x, y, x, y + r);
    ctx.closePath();
    if (fill) ctx.fill();
  }
};

window.FarmCharts = FarmCharts;

// Auto-initialize when DOM is loaded or if already ready
if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      FarmCharts.init();
    });
  } else {
    FarmCharts.init();
  }
}
