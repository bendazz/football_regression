// Minimal Linear Regression Playground — generate and view data

let points = [];
let chart = null;
let baselineB = 50; // intercept b
let slopeM = 1;     // slope m

const el = (id) => document.getElementById(id);
const btnGenerate = el('btnGenerate');
const bSlider = el('bSlider');
const bValueEl = el('bValue');
const meanYEl = el('meanYValue');
const mSlider = el('mSlider');

// Random normal via Box-Muller
function rndNorm() {
  const u1 = Math.random();
  const u2 = Math.random();
  return Math.sqrt(-2.0 * Math.log(u1 + 1e-12)) * Math.cos(2 * Math.PI * u2);
}

function generateData(n = 50, slope = 1.2, intercept = 3, noise = 10) {
  const res = [];
  const xMin = 0, xMax = 100;
  for (let i = 0; i < n; i++) {
    const x = xMin + Math.random() * (xMax - xMin);
    const y = intercept + slope * x + rndNorm() * noise;
    res.push({ x, y });
  }
  return res;
}

// Random scenario with up/down trend and variable noise
function randomScenario() {
  const sign = Math.random() < 0.5 ? -1 : 1;
  const magnitude = 0.6 + Math.random() * 1.4; // [0.6, 2.0]
  const slope = sign * magnitude;
  const intercept = Math.random() * 20; // [0, 20]
  const largeNoise = Math.random() < 0.35;
  const noise = largeNoise ? 15 + Math.random() * 20 : 5 + Math.random() * 10;
  return { slope, intercept, noise };
}

function initChart() {
  const ctx = document.getElementById('regressionChart');
  if (typeof Chart === 'undefined') {
    console.error('Error: Chart library failed to load.');
    return;
  }

  const residualLinesPlugin = {
    id: 'residualLines',
    afterDatasetsDraw(chartInstance) {
      if (!points || points.length === 0) return;
      const xScale = chartInstance.scales.x;
      const yScale = chartInstance.scales.y;
      let maxIdx = 0, minIdx = 0;
      let maxVal = -Infinity, minVal = Infinity;
      for (let i = 0; i < points.length; i++) {
        const r = points[i].y - (baselineB + slopeM * points[i].x);
        if (r > maxVal) { maxVal = r; maxIdx = i; }
        if (r < minVal) { minVal = r; minIdx = i; }
      }
      const ctx2 = chartInstance.ctx;
      function drawDashed(p, color) {
        const x = xScale.getPixelForValue(p.x);
        const y1 = yScale.getPixelForValue(p.y);
        const y2 = yScale.getPixelForValue(baselineB + slopeM * p.x);
        ctx2.save();
        ctx2.strokeStyle = color;
        ctx2.setLineDash([6,4]);
        ctx2.lineWidth = 2;
        ctx2.beginPath();
        ctx2.moveTo(x, y1);
        ctx2.lineTo(x, y2);
        ctx2.stroke();
        ctx2.restore();
      }
      if (Number.isFinite(maxVal)) drawDashed(points[maxIdx], '#ef4444');
      if (Number.isFinite(minVal)) drawDashed(points[minIdx], '#8b5cf6');
    }
  };

  chart = new Chart(ctx, {
    type: 'scatter',
    data: {
      datasets: [
        { label: 'Sample data', data: [], pointBackgroundColor: '#2563eb', pointBorderColor: '#2563eb', pointRadius: 4, showLine: false },
  { label: 'y = b + m x', data: [], type: 'line', borderColor: '#059669', borderWidth: 2, pointRadius: 0, tension: 0 },
        { label: 'Max positive residual', data: [], backgroundColor: '#ef4444', pointBackgroundColor: '#ef4444', pointBorderColor: '#ef4444', pointBorderWidth: 0, pointRadius: 10, pointHoverRadius: 12, order: 10, showLine: false },
        { label: 'Max negative residual', data: [], backgroundColor: '#8b5cf6', pointBackgroundColor: '#8b5cf6', pointBorderColor: '#8b5cf6', pointBorderWidth: 0, pointRadius: 10, pointHoverRadius: 12, order: 11, showLine: false },
        { label: 'Projections on y-axis', data: [], backgroundColor: 'rgba(107,114,128,0.45)', pointBackgroundColor: 'rgba(107,114,128,0.45)', pointBorderColor: 'rgba(107,114,128,0.6)', pointBorderWidth: 0, pointRadius: 3, showLine: false, order: 1 },
        { label: 'Mean(y)', data: [], type: 'line', borderColor: 'rgba(17,24,39,0.7)', borderWidth: 2, borderDash: [6,4], pointRadius: 0, tension: 0, order: 0 },
        { label: 'Mean(y) marker', data: [], backgroundColor: '#111827', pointBackgroundColor: '#111827', pointBorderColor: '#111827', pointBorderWidth: 0, pointRadius: 5, showLine: false, order: 12 },
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: ctx => `(${ctx.parsed.x.toFixed(2)}, ${ctx.parsed.y.toFixed(2)})` } }
      },
      scales: {
        x: { grid: { color: 'rgba(0,0,0,0.06)' }, ticks: { color: '#111827' }, suggestedMin: 0, suggestedMax: 100 },
        y: { grid: { color: 'rgba(0,0,0,0.06)' }, ticks: { color: '#111827' }, suggestedMin: -50, suggestedMax: 150 },
      }
    },
    plugins: [residualLinesPlugin]
  });

  chart._idx = { data: 0, baseline: 1, maxPos: 2, maxNeg: 3, yProj: 4, meanLine: 5, meanMarker: 6 };
}

function updateBaselineLine() {
  if (!chart) return;
  const ds = chart.data.datasets[chart._idx.baseline];
  let xMin = 0, xMax = 100;
  if (points.length > 0) {
    const xs = points.map(p => p.x);
    xMin = Math.min(...xs);
    xMax = Math.max(...xs);
  }
  ds.data = [ { x: xMin, y: baselineB + slopeM * xMin }, { x: xMax, y: baselineB + slopeM * xMax } ];
}

function updateResidualExtremaDatasets() {
  if (!chart) return;
  const maxDs = chart.data.datasets[chart._idx.maxPos];
  const minDs = chart.data.datasets[chart._idx.maxNeg];
  maxDs.data = [];
  minDs.data = [];
  if (!points || points.length === 0) return;
  let maxIdx = 0, minIdx = 0;
  let maxVal = -Infinity, minVal = Infinity;
  for (let i = 0; i < points.length; i++) {
    const r = points[i].y - (baselineB + slopeM * points[i].x);
    if (r > maxVal) { maxVal = r; maxIdx = i; }
    if (r < minVal) { minVal = r; minIdx = i; }
  }
  if (Number.isFinite(maxVal)) maxDs.data = [ points[maxIdx] ];
  if (Number.isFinite(minVal) && minIdx !== maxIdx) minDs.data = [ points[minIdx] ];
}

function meanY() {
  if (!points || points.length === 0) return null;
  let s = 0;
  for (const p of points) s += p.y;
  return s / points.length;
}

function updateYAxisProjections() {
  if (!chart) return;
  const ds = chart.data.datasets[chart._idx.yProj];
  if (!points || points.length === 0) { ds.data = []; return; }
  ds.data = points.map(p => ({ x: 0, y: p.y }));
}

function updateMeanYArtifacts() {
  if (!chart) return;
  const m = meanY();
  const lineDs = chart.data.datasets[chart._idx.meanLine];
  const markerDs = chart.data.datasets[chart._idx.meanMarker];
  if (m == null) { lineDs.data = []; markerDs.data = []; if (meanYEl) meanYEl.textContent = '—'; return; }
  let xMin = 0, xMax = 100;
  if (points.length > 0) {
    const xs = points.map(p => p.x);
    xMin = Math.min(...xs);
    xMax = Math.max(...xs);
  }
  lineDs.data = [ { x: xMin, y: m }, { x: xMax, y: m } ];
  markerDs.data = [ { x: 0, y: m } ];
  if (meanYEl) meanYEl.textContent = m.toFixed(2);
}

function render() {
  chart.data.datasets[chart._idx.data].data = points.map(p => ({ x: p.x, y: p.y }));
  updateBaselineLine();
  updateResidualExtremaDatasets();
  updateYAxisProjections();
  updateMeanYArtifacts();
  chart.update();
}

function updateSliderRangeFromData() {
  if (!bSlider) return;
  if (!points || points.length === 0) {
    bSlider.min = String(-50);
    bSlider.max = String(150);
    baselineB = Math.max(parseFloat(bSlider.min), Math.min(parseFloat(bSlider.max), baselineB));
    bSlider.value = String(baselineB);
    return;
  }
  let minY = Infinity, maxY = -Infinity;
  for (const p of points) { if (p.y < minY) minY = p.y; if (p.y > maxY) maxY = p.y; }
  let span = maxY - minY; if (!Number.isFinite(span) || span < 1) span = 20;
  const pad = Math.max(10, 0.2 * span);
  const newMin = Math.floor(minY - pad);
  const newMax = Math.ceil(maxY + pad);
  if (newMin < newMax) { bSlider.min = String(newMin); bSlider.max = String(newMax); }
  const minVal = parseFloat(bSlider.min), maxVal = parseFloat(bSlider.max);
  baselineB = Math.max(minVal, Math.min(maxVal, baselineB));
  bSlider.value = String(baselineB);
}

btnGenerate.addEventListener('click', () => {
  const { slope, intercept, noise } = randomScenario();
  points = generateData(50, slope, intercept, noise);
  updateSliderRangeFromData();
  render();
  const trend = slope < 0 ? 'trending down' : 'trending up';
  console.log(`Plotted ${points.length} points — ${trend} (slope ${slope.toFixed(2)}, noise ${noise.toFixed(1)}).`);
});

if (bSlider) {
  bSlider.addEventListener('input', () => {
    baselineB = parseFloat(bSlider.value);
    if (chart) render();
  });
}

if (mSlider) {
  mSlider.addEventListener('input', () => {
    slopeM = parseFloat(mSlider.value);
    if (chart) render();
  });
}

// Initialize
initChart();
updateBaselineLine();
updateSliderRangeFromData();
