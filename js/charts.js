/**
 * PlantDr AgroPalm - Custom Canvas Visualizations
 * High-performance, retina-sharp, zero-dependency charts for mobile and desktop screens.
 */

const AgroCharts = {
  // Renders a smooth bezier line chart with gradient fill
  renderTrendChart(canvasId, labels, data, options = {}) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    const width = rect.width || canvas.parentElement.clientWidth || 320;
    const height = rect.height || 140;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const padding = { top: 20, right: 18, bottom: 26, left: 34 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    if (!data || data.length === 0) return;

    const strokeColor = options.color || "#10b981";
    const gradientTop = options.gradientTop || "rgba(16, 185, 129, 0.35)";
    const gradientBottom = options.gradientBottom || "rgba(16, 185, 129, 0.0)";
    const unit = options.unit || "";
    
    const minVal = options.min !== undefined ? options.min : Math.min(...data) * 0.9;
    const maxVal = options.max !== undefined ? options.max : Math.max(...data) * 1.1;
    const valRange = (maxVal - minVal) || 1;

    // Draw grid lines
    ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);

    const gridSteps = 3;
    for (let i = 0; i <= gridSteps; i++) {
      const y = padding.top + (chartHeight / gridSteps) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();

      // Y-axis label
      const val = Math.round(maxVal - (valRange / gridSteps) * i);
      ctx.fillStyle = "rgba(160, 175, 195, 0.7)";
      ctx.font = "10px Inter, sans-serif";
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
      ctx.fillText(`${val}${unit}`, padding.left - 6, y);
    }
    ctx.setLineDash([]); // Reset line dash

    // Calculate point coordinates
    const points = data.map((val, idx) => {
      const x = padding.left + (chartWidth / (data.length - 1)) * idx;
      const y = padding.top + chartHeight - ((val - minVal) / valRange) * chartHeight;
      return { x, y, val, label: labels[idx] };
    });

    // Draw Smooth Line Path
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);

    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const cpX = (p0.x + p1.x) / 2;
      ctx.bezierCurveTo(cpX, p0.y, cpX, p1.y, p1.x, p1.y);
    }

    // Gradient fill under curve
    ctx.save();
    ctx.lineTo(points[points.length - 1].x, height - padding.bottom);
    ctx.lineTo(points[0].x, height - padding.bottom);
    ctx.closePath();

    const gradient = ctx.createLinearGradient(0, padding.top, 0, height - padding.bottom);
    gradient.addColorStop(0, gradientTop);
    gradient.addColorStop(1, gradientBottom);
    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.restore();

    // Redraw stroke
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const cpX = (p0.x + p1.x) / 2;
      ctx.bezierCurveTo(cpX, p0.y, cpX, p1.y, p1.x, p1.y);
    }
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Draw points & x labels
    points.forEach((pt, idx) => {
      // Highlight last and peak points
      const isLast = idx === points.length - 1;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, isLast ? 4.5 : 2.5, 0, Math.PI * 2);
      ctx.fillStyle = isLast ? "#ffffff" : strokeColor;
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 2;
      ctx.fill();
      ctx.stroke();

      // Show alternating or key labels
      if (idx % 2 === 0 || isLast) {
        ctx.fillStyle = "rgba(160, 175, 195, 0.7)";
        ctx.font = "9px Inter, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        ctx.fillText(pt.label, pt.x, height - padding.bottom + 6);
      }
    });
  },

  // Renders a radial circular progress gauge with glowing edge
  renderCircularGauge(canvasId, value, min, max, options = {}) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const size = Math.min(rect.width || 120, rect.height || 120);

    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const center = size / 2;
    const radius = center - 12;
    const lineWidth = options.lineWidth || 10;
    const startAngle = 0.75 * Math.PI;
    const endAngle = 2.25 * Math.PI;
    const totalAngle = endAngle - startAngle;

    const ratio = Math.max(0, Math.min(1, (value - min) / (max - min)));
    const currentAngle = startAngle + totalAngle * ratio;

    ctx.clearRect(0, 0, size, size);

    // Track background
    ctx.beginPath();
    ctx.arc(center, center, radius, startAngle, endAngle);
    ctx.strokeStyle = options.trackColor || "rgba(255, 255, 255, 0.08)";
    ctx.lineWidth = lineWidth;
    ctx.lineCap = "round";
    ctx.stroke();

    // Progress arc
    ctx.beginPath();
    ctx.arc(center, center, radius, startAngle, currentAngle);
    const strokeGrad = ctx.createLinearGradient(0, size, size, 0);
    strokeGrad.addColorStop(0, options.colorStart || "#10b981");
    strokeGrad.addColorStop(1, options.colorEnd || "#34d399");
    ctx.strokeStyle = strokeGrad;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = "round";
    ctx.stroke();

    // Center Value
    ctx.fillStyle = options.textColor || "#ffffff";
    ctx.font = `bold ${Math.round(size * 0.22)}px Outfit, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`${Math.round(value)}${options.unit || "%"}`, center, center - 2);

    // Label below value
    if (options.label) {
      ctx.fillStyle = "rgba(160, 175, 195, 0.8)";
      ctx.font = `500 ${Math.round(size * 0.09)}px Inter, sans-serif`;
      ctx.fillText(options.label, center, center + size * 0.18);
    }
  },

  // Renders a multi-depth soil moisture vertical profile
  renderDepthProfile(containerId, depth10, depth30, depth60) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const depths = [
      { label: "10 cm (Topsoil)", val: depth10, desc: "Evaporation Zone", color: depth10 < 30 ? "#f59e0b" : "#10b981" },
      { label: "30 cm (Root Core)", val: depth30, desc: "Active Feeder Roots", color: depth30 < 30 ? "#ef4444" : "#10b981" },
      { label: "60 cm (Subsoil Reserve)", val: depth60, desc: "Deep Moisture Storage", color: depth60 < 25 ? "#f59e0b" : "#0ea5e9" }
    ];

    container.innerHTML = depths.map(d => `
      <div class="depth-bar-row">
        <div class="depth-header">
          <span class="depth-name">${d.label}</span>
          <span class="depth-val" style="color: ${d.color}; font-weight:700;">${d.val}%</span>
        </div>
        <div class="depth-track">
          <div class="depth-fill" style="width: ${Math.min(100, d.val)}%; background: ${d.color};"></div>
        </div>
        <div class="depth-subtext">${d.desc}</div>
      </div>
    `).join("");
  }
};

window.AgroCharts = AgroCharts;
