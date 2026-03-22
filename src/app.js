// =============================================================================
// HORMUZ STRAIT IMPACT TRACKER — Main Application
// Wires together: data model, cascade engine, and all UI components
// =============================================================================

// Data and CascadeEngine loaded via separate script tags

// ── Global State ────────────────────────────────────────────────────────────
const engine = new CascadeEngine();
let currentPreset = null;
let leafletMap = null;
let geoJsonLayer = null;
let countrySortField = 'overallScore';
let countrySortDir = 'desc';
let autoRefreshInterval = null;

window.initApp = function() {
  setupWelcomeScreen();
};

function setupWelcomeScreen() {
  const btn = document.getElementById('welcome-enter-btn');
  const input = document.getElementById('welcome-password');
  const error = document.getElementById('welcome-error');

  const checkPassword = () => {
    if (input.value === 'alenu') {
      document.getElementById('welcome-screen').classList.add('hidden');
      document.getElementById('app-wrapper').style.display = 'flex';
      
      // Initialize main app
      renderPresets();
      renderSliders();
      initMap();
      setupDurationSlider();
      setupRefreshButton();
      startAutoRefresh();

      // Start with Current Blockade
      applyPreset('Current Blockade');
    } else {
      error.textContent = 'Incorrect password. Please try again.';
      input.value = '';
      input.focus();
    }
  };

  btn.addEventListener('click', checkPassword);
  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') checkPassword();
  });
}

// ── PRESETS ──────────────────────────────────────────────────────────────────
function renderPresets() {
  const container = document.getElementById('presets-container');
  container.innerHTML = '';

  for (const [name, preset] of Object.entries(PRESETS)) {
    const btn = document.createElement('button');
    btn.className = 'preset-btn';
    btn.textContent = name;
    btn.title = preset.description;
    btn.addEventListener('click', () => applyPreset(name));
    container.appendChild(btn);
  }
}

function applyPreset(name) {
  const preset = PRESETS[name];
  if (!preset) return;

  currentPreset = name;

  // Update slider values
  for (const [key, val] of Object.entries(preset.shortages)) {
    const slider = document.getElementById(`slider-${key}`);
    const input = document.getElementById(`input-${key}`);
    if (slider) slider.value = val;
    if (input) input.value = val;
    updateSliderVisual(key, val);
  }

  // Update active preset button
  document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.classList.toggle('active', btn.textContent === name);
  });

  engine.setShortages(preset.shortages);
  recompute();
}

// ── SLIDERS ─────────────────────────────────────────────────────────────────
function renderSliders() {
  const container = document.getElementById('sliders-container');
  container.innerHTML = '';

  for (const [key, commodity] of Object.entries(COMMODITIES)) {
    const group = document.createElement('div');
    group.className = 'slider-group';
    group.innerHTML = `
      <div class="slider-header">
        <span class="slider-label">
          <span>${commodity.icon}</span>
          <span>${commodity.name}</span>
        </span>
        <div class="slider-value-container">
          <input type="number" id="input-${key}" class="slider-value-input" min="0" max="100" value="0" />
          <span class="slider-pct-sign">%</span>
        </div>
      </div>
      <input type="range" id="slider-${key}" class="slider-track" min="0" max="100" value="0"
        style="background: linear-gradient(to right, ${commodity.color}33 0%, ${commodity.color}33 0%, rgba(255,255,255,0.05) 0%)" />
      <div class="slider-meta">
        <span>Hormuz dep: ${Math.round(commodity.hormuzDependencyPct * 100)}%</span>
        <span>Elasticity: ${commodity.priceElasticityMid}</span>
      </div>
    `;

    const slider = group.querySelector(`#slider-${key}`);
    const input = group.querySelector(`#input-${key}`);

    slider.addEventListener('input', (e) => {
      const val = parseInt(e.target.value);
      input.value = val;
      updateSliderVisual(key, val);
      onSliderChange();
    });

    input.addEventListener('change', (e) => {
      let val = Math.max(0, Math.min(100, parseInt(e.target.value) || 0));
      e.target.value = val;
      slider.value = val;
      updateSliderVisual(key, val);
      onSliderChange();
    });

    container.appendChild(group);
  }
}

function updateSliderVisual(key, value) {
  const slider = document.getElementById(`slider-${key}`);
  if (!slider) return;
  const color = COMMODITIES[key]?.color || '#3B82F6';
  slider.style.background = `linear-gradient(to right, ${color} 0%, ${color} ${value}%, rgba(255,255,255,0.05) ${value}%)`;

  // Also update slider thumb color
  const style = document.getElementById(`thumb-style-${key}`);
  if (style) style.remove();
  const newStyle = document.createElement('style');
  newStyle.id = `thumb-style-${key}`;
  newStyle.textContent = `#slider-${key}::-webkit-slider-thumb { background: ${color}; } #slider-${key}::-moz-range-thumb { background: ${color}; }`;
  document.head.appendChild(newStyle);
}

let recomputeTimeout = null;
function onSliderChange() {
  // Debounce recompute
  clearTimeout(recomputeTimeout);
  recomputeTimeout = setTimeout(() => {
    const shortages = {};
    for (const key of Object.keys(COMMODITIES)) {
      shortages[key] = parseInt(document.getElementById(`slider-${key}`)?.value || 0);
    }
    engine.setShortages(shortages);

    // Check if matches a preset
    currentPreset = null;
    for (const [name, preset] of Object.entries(PRESETS)) {
      if (name === 'Custom') continue;
      const matches = Object.entries(preset.shortages).every(([k, v]) => shortages[k] === v);
      if (matches) { currentPreset = name; break; }
    }
    document.querySelectorAll('.preset-btn').forEach(btn => {
      btn.classList.toggle('active', btn.textContent === (currentPreset || 'Custom'));
    });

    recompute();
  }, 80);
}

// ── RECOMPUTE & RENDER ALL ──────────────────────────────────────────────────
function recompute() {
  const results = engine.compute();
  renderCommodityCards(results.commodities);
  renderSankey(results.sankey);
  renderCountryTable(results.countries);
  renderFoodImpact(results.food);
  updateMap(results.countries);
}

// ── COMMODITY CARDS ─────────────────────────────────────────────────────────
function renderCommodityCards(commodityImpacts) {
  const container = document.getElementById('commodity-cards');
  container.innerHTML = '';

  for (const [key, impact] of Object.entries(commodityImpacts)) {
    const commodity = COMMODITIES[key];
    const card = document.createElement('div');
    card.className = 'commodity-card';
    card.style.setProperty('--card-color', commodity.color);
    card.querySelector?.('::before')?.style?.setProperty('background', commodity.color);

    const priceChangeStr = impact.priceIncreasePct > 0
      ? `+${impact.priceIncreasePct.toFixed(1)}%`
      : '—';

    card.innerHTML = `
      <style>.commodity-card[data-key="${key}"]::before { background: ${commodity.color}; }</style>
      <div class="card-header">
        <span class="card-icon">${commodity.icon}</span>
        <span class="card-name">${commodity.name}</span>
      </div>
      <span class="card-severity severity-${impact.severity}">${impact.severity}</span>
      <div class="card-stats">
        <div class="card-stat-row">
          <span class="card-stat-label">Shortage</span>
          <span class="card-stat-value">${impact.shortagePct.toFixed(0)}%</span>
        </div>
        <div class="card-stat-row">
          <span class="card-stat-label">Effective loss</span>
          <span class="card-stat-value">${impact.effectiveShortage.toFixed(1)}%</span>
        </div>
        <div class="card-stat-row">
          <span class="card-stat-label">Price impact</span>
          <span class="card-stat-value price-change-positive">${priceChangeStr}</span>
        </div>
        <div class="card-stat-row">
          <span class="card-stat-label">Est. price</span>
          <span class="card-stat-value">${impact.estimatedPrice.toLocaleString()} ${commodity.unit}</span>
        </div>
      </div>
    `;
    card.setAttribute('data-key', key);
    container.appendChild(card);
  }
}

// ── SANKEY DIAGRAM ──────────────────────────────────────────────────────────
function renderSankey(sankeyData) {
  const container = document.getElementById('sankey-container');

  if (!sankeyData || sankeyData.nodes.length === 0 || sankeyData.links.length === 0) {
    container.innerHTML = '<div class="sankey-placeholder">Adjust shortage sliders to see the cascade flow</div>';
    return;
  }

  container.innerHTML = `
    <div class="sankey-label-group">
      <span class="sankey-label">Commodities</span>
      <span class="sankey-label">Industries</span>
      <span class="sankey-label">Economic Impact</span>
    </div>
  `;

  const width = container.clientWidth - 32;
  const height = 380;

  const svg = d3.select(container)
    .append('svg')
    .attr('width', width)
    .attr('height', height);

  // Build sankey layout
  const sankey = d3.sankey()
    .nodeId(d => d.index)
    .nodeWidth(18)
    .nodePadding(12)
    .nodeAlign(d3.sankeyLeft)
    .extent([[16, 16], [width - 16, height - 16]]);

  // Deep copy data (d3-sankey mutates)
  const graph = {
    nodes: sankeyData.nodes.map((d, i) => ({ ...d, index: i })),
    links: sankeyData.links.map(d => ({ ...d }))
  };

  try {
    sankey(graph);
  } catch (e) {
    container.innerHTML = '<div class="sankey-placeholder">Unable to render cascade flow — try adjusting shortage levels</div>';
    return;
  }

  // Links
  svg.append('g')
    .selectAll('.link')
    .data(graph.links)
    .join('path')
    .attr('class', 'link')
    .attr('d', d3.sankeyLinkHorizontal())
    .attr('fill', 'none')
    .attr('stroke', d => d.color || '#64748B')
    .attr('stroke-width', d => Math.max(2, d.width))
    .append('title')
    .text(d => {
      const src = graph.nodes[d.source.index] || d.source;
      const tgt = graph.nodes[d.target.index] || d.target;
      return `${src.name} → ${tgt.name}\nImpact: ${d.value.toFixed(1)}`;
    });

  // Nodes
  const node = svg.append('g')
    .selectAll('.node')
    .data(graph.nodes)
    .join('g')
    .attr('class', 'node');

  node.append('rect')
    .attr('x', d => d.x0)
    .attr('y', d => d.y0)
    .attr('width', d => d.x1 - d.x0)
    .attr('height', d => Math.max(4, d.y1 - d.y0))
    .attr('fill', d => d.color || '#64748B')
    .attr('rx', 3)
    .attr('opacity', 0.85);

  // Labels
  node.append('text')
    .attr('x', d => d.x0 < width / 2 ? d.x1 + 8 : d.x0 - 8)
    .attr('y', d => (d.y0 + d.y1) / 2)
    .attr('dy', '0.35em')
    .attr('text-anchor', d => d.x0 < width / 2 ? 'start' : 'end')
    .text(d => {
      const maxLen = 22;
      return d.name.length > maxLen ? d.name.slice(0, maxLen - 1) + '…' : d.name;
    })
    .attr('fill', '#E2E8F0')
    .attr('font-size', '11px')
    .attr('font-family', 'Inter, sans-serif')
    .attr('font-weight', 600);
}

// ── COUNTRY TABLE ───────────────────────────────────────────────────────────
function renderCountryTable(countryImpacts) {
  const container = document.getElementById('country-table-container');

  // Sort
  const sorted = [...countryImpacts].sort((a, b) => {
    // Pinned always first
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;

    const va = a[countrySortField] || 0;
    const vb = b[countrySortField] || 0;
    return countrySortDir === 'desc' ? vb - va : va - vb;
  });

  const sortIcon = (field) => {
    if (countrySortField !== field) return '';
    return countrySortDir === 'desc' ? ' sorted-desc' : ' sorted-asc';
  };

  let html = `
    <table class="country-table">
      <thead>
        <tr>
          <th data-sort="name" class="${sortIcon('name')}">Country</th>
          <th data-sort="overallScore" class="${sortIcon('overallScore')}">Impact Score</th>
          <th data-sort="gdpDragPct" class="${sortIcon('gdpDragPct')}">GDP Drag</th>
          <th>Top Vulnerable Sectors</th>
          <th data-sort="dependencyIndex" class="${sortIcon('dependencyIndex')}">Dep. Index</th>
        </tr>
      </thead>
      <tbody>
  `;

  for (const country of sorted) {
    const scoreColor = getScoreColor(country.overallScore);
    const gdpColor = getGdpDragColor(country.gdpDragPct);
    const depColor = getDepColor(country.dependencyIndex);
    const sectors = country.vulnerableSectors.slice(0, 3)
      .map(s => `<span class="sector-tag">${s.name}</span>`).join('');
    const exporterBadge = country.isExporter ? '<span class="exporter-label">Exporter</span>' : '';

    html += `
      <tr class="${country.pinned ? 'pinned-row' : ''}">
        <td>
          <div class="country-name-cell">
            <span class="country-flag">${country.flag}</span>
            <span>${country.name}</span>
            ${exporterBadge}
          </div>
        </td>
        <td>
          <div class="impact-score-bar">
            <div class="score-bar-track">
              <div class="score-bar-fill" style="width: ${Math.min(country.overallScore, 100)}%; background: ${scoreColor};"></div>
            </div>
            <span class="score-bar-value" style="color: ${scoreColor}">${country.overallScore.toFixed(1)}</span>
          </div>
        </td>
        <td><span class="gdp-drag-value" style="color: ${gdpColor}">${country.gdpDragPct > 0 ? '-' : ''}${country.gdpDragPct.toFixed(2)}%</span></td>
        <td><div class="vulnerable-sectors">${sectors || '<span class="sector-tag">—</span>'}</div></td>
        <td><span class="dep-index" style="color: ${depColor}">${country.dependencyIndex.toFixed(2)}</span></td>
      </tr>
    `;
  }

  html += '</tbody></table>';
  container.innerHTML = html;

  // Sort click handlers
  container.querySelectorAll('th[data-sort]').forEach(th => {
    th.addEventListener('click', () => {
      const field = th.dataset.sort;
      if (countrySortField === field) {
        countrySortDir = countrySortDir === 'desc' ? 'asc' : 'desc';
      } else {
        countrySortField = field;
        countrySortDir = 'desc';
      }
      renderCountryTable(countryImpacts);
    });
  });
}

function getScoreColor(score) {
  if (score >= 60) return '#EF4444';
  if (score >= 40) return '#F97316';
  if (score >= 20) return '#F59E0B';
  if (score >= 5) return '#22C55E';
  return '#64748B';
}

function getGdpDragColor(drag) {
  if (drag >= 3) return '#EF4444';
  if (drag >= 1.5) return '#F97316';
  if (drag >= 0.5) return '#F59E0B';
  if (drag > 0) return '#22C55E';
  return '#64748B';
}

function getDepColor(dep) {
  if (dep >= 0.5) return '#EF4444';
  if (dep >= 0.3) return '#F97316';
  if (dep >= 0.15) return '#F59E0B';
  return '#64748B';
}

// ── FOOD IMPACT ─────────────────────────────────────────────────────────────
function renderFoodImpact(food) {
  const container = document.getElementById('food-impact');
  const sevColor = {
    critical: '#EF4444', severe: '#F97316', high: '#F59E0B', moderate: '#22C55E', low: '#64748B'
  };
  const color = sevColor[food.severity] || '#64748B';

  container.innerHTML = `
    <div class="food-stat">
      <span class="food-stat-label">Fertilizer Shortage Index</span>
      <span class="food-stat-value" style="color: ${color}">${food.fertShortageIndex.toFixed(1)}%</span>
    </div>
    <div class="food-stat">
      <span class="food-stat-label">Food Price Increase</span>
      <span class="food-stat-value" style="color: ${color}">+${food.foodPriceIncreasePct.toFixed(1)}%</span>
    </div>
    <div class="food-stat">
      <span class="food-stat-label">Crop Yield Reduction</span>
      <span class="food-stat-value" style="color: ${color}">-${food.cropYieldReductionPct.toFixed(1)}%</span>
    </div>
    <div class="food-stat">
      <span class="food-stat-label">Energy → Food Cost</span>
      <span class="food-stat-value" style="color: var(--text-secondary)">+${food.energyCostContribution.toFixed(1)}%</span>
    </div>
  `;
}

// ── MAP ─────────────────────────────────────────────────────────────────────
const COUNTRY_COORDS = {
  'Japan': [36.2, 138.3], 'South Korea': [35.9, 127.8], 'India': [20.6, 79.0],
  'China': [35.9, 104.2], 'United States': [37.1, -95.7], 'European Union': [50.1, 10.5],
  'Israel': [31.0, 34.8], 'Saudi Arabia': [23.9, 45.1], 'UAE': [23.4, 53.8],
  'Qatar': [25.4, 51.2], 'Kuwait': [29.3, 47.5], 'Bahrain': [26.0, 50.6],
  'Oman': [21.5, 55.9], 'Iran': [32.4, 53.7], 'Turkey': [39.9, 32.9],
  'Indonesia': [-0.8, 113.9], 'Thailand': [15.9, 101.0], 'Brazil': [-14.2, -51.9],
  'Pakistan': [30.4, 69.3], 'Singapore': [1.4, 103.8], 'Australia': [-25.3, 133.8]
};

function initMap() {
  leafletMap = L.map('map-container', {
    center: [25, 55],
    zoom: 3,
    minZoom: 2,
    maxZoom: 6,
    attributionControl: false
  });

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap'
  }).addTo(leafletMap);

  // Hormuz Strait marker
  const hormuzIcon = L.divIcon({
    className: 'hormuz-marker',
    html: '<div class="hormuz-pulse"></div>',
    iconSize: [20, 20]
  });

  L.marker([26.56, 56.25], { icon: hormuzIcon })
    .addTo(leafletMap)
    .bindPopup(`
      <div style="font-family: Inter, sans-serif; font-size: 13px; padding: 4px;">
        <strong style="color: #EF4444;">⚓ Strait of Hormuz</strong><br/>
        <span style="color: #94A3B8;">~21% of global oil, ~20% LNG,<br/>~47% sulfur, ~36% helium transit here</span>
      </div>
    `);

  // Force resize after init
  setTimeout(() => leafletMap.invalidateSize(), 200);
}

function updateMap(countryImpacts) {
  if (!leafletMap) return;

  // Remove old markers
  if (geoJsonLayer) {
    leafletMap.removeLayer(geoJsonLayer);
  }

  const markers = L.layerGroup();

  for (const country of countryImpacts) {
    const coords = COUNTRY_COORDS[country.name];
    if (!coords) continue;

    const color = getScoreColor(country.overallScore);
    const radius = Math.max(8, Math.min(30, country.overallScore * 0.4 + 5));

    const circle = L.circleMarker(coords, {
      radius: radius,
      fillColor: color,
      fillOpacity: 0.45,
      color: color,
      weight: 2,
      opacity: 0.8
    });

    const topExposures = Object.entries(country.commodityExposures || {})
      .filter(([, v]) => v.exposure > 0)
      .sort(([, a], [, b]) => b.exposure - a.exposure)
      .slice(0, 3)
      .map(([, v]) => `${v.name}: ${v.exposure.toFixed(1)}%`)
      .join('<br/>');

    circle.bindPopup(`
      <div style="font-family: Inter, sans-serif; font-size: 12px; min-width: 150px;">
        <strong style="font-size: 14px;">${country.flag} ${country.name}</strong>
        ${country.isExporter ? '<span style="color:#FBBF24;font-size:10px;"> EXPORTER</span>' : ''}
        <hr style="border: none; border-top: 1px solid rgba(255,255,255,0.1); margin: 6px 0;"/>
        <div style="color: #94A3B8;">
          Impact Score: <strong style="color: ${color}">${country.overallScore.toFixed(1)}</strong><br/>
          GDP Drag: <strong style="color: ${getGdpDragColor(country.gdpDragPct)}">-${country.gdpDragPct.toFixed(2)}%</strong><br/>
          ${topExposures ? '<br/><strong style="color:#E2E8F0;">Top exposures:</strong><br/>' + topExposures : ''}
        </div>
      </div>
    `);

    markers.addLayer(circle);
  }

  geoJsonLayer = markers;
  markers.addTo(leafletMap);
}

// ── DURATION SLIDER ─────────────────────────────────────────────────────────
function setupDurationSlider() {
  const slider = document.getElementById('duration-slider');
  const display = document.getElementById('duration-display');
  
  if (slider && display) {
    slider.addEventListener('input', (e) => {
      display.textContent = e.target.value;
    });

    slider.addEventListener('change', (e) => {
      engine.setDurationWeeks(parseInt(e.target.value));
      recompute();
    });
  }
}

// ── REFRESH ─────────────────────────────────────────────────────────────────
function setupRefreshButton() {
  const btn = document.getElementById('refresh-btn');
  btn.addEventListener('click', () => refreshData());
}

function refreshData() {
  const btn = document.getElementById('refresh-btn');
  btn.classList.add('loading');

  // Simulate data refresh (in a real deployment, this would fetch from APIs)
  updateLastRefreshTime();

  setTimeout(() => {
    btn.classList.remove('loading');
    recompute();
  }, 1500);
}

function updateLastRefreshTime() {
  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const dateStr = now.toLocaleDateString([], { month: 'short', day: 'numeric' });
  document.getElementById('last-update').textContent = `Last update: ${dateStr}, ${timeStr}`;
}

function startAutoRefresh() {
  updateLastRefreshTime();
  // Auto-refresh every 12 hours (43200000 ms)
  autoRefreshInterval = setInterval(() => {
    refreshData();
  }, 12 * 60 * 60 * 1000);
}
