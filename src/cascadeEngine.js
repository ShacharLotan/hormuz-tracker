// =============================================================================
// CASCADE ENGINE — The "if-then" computation core
// Calculates cascading impacts from commodity shortages through industries to economies
// =============================================================================

class CascadeEngine {
  constructor() {
    this.timeHorizon = 'short'; // 'short' or 'long'
    this.shortages = {};
    Object.keys(COMMODITIES).forEach(k => this.shortages[k] = 0);
    this.results = null;
  }

  setShortages(shortages) {
    this.shortages = { ...shortages };
    this.results = null;
  }

  setTimeHorizon(horizon) {
    this.timeHorizon = horizon;
    this.results = null;
  }

  // Main computation — called whenever inputs change
  compute() {
    const commodityImpacts = this._computeCommodityImpacts();
    const industryImpacts = this._computeIndustryImpacts(commodityImpacts);
    const countryImpacts = this._computeCountryImpacts(commodityImpacts, industryImpacts);
    const foodImpact = this._computeFoodImpact(commodityImpacts);
    const sankeyData = this._buildSankeyData(commodityImpacts, industryImpacts);

    this.results = {
      commodities: commodityImpacts,
      industries: industryImpacts,
      countries: countryImpacts,
      food: foodImpact,
      sankey: sankeyData,
      timestamp: new Date().toISOString()
    };

    return this.results;
  }

  // ── Commodity-level impacts ──────────────────────────────────────────────────
  _computeCommodityImpacts() {
    const impacts = {};

    for (const [key, commodity] of Object.entries(COMMODITIES)) {
      const shortagePct = (this.shortages[key] || 0) / 100;
      if (shortagePct === 0) {
        impacts[key] = {
          key,
          name: commodity.name,
          icon: commodity.icon,
          color: commodity.color,
          shortagePct: 0,
          effectiveShortage: 0,
          priceIncreasePct: 0,
          estimatedPrice: commodity.basePrice,
          severity: 'none'
        };
        continue;
      }

      // Effective shortage after Hormuz dependency and substitution
      const effectiveShortage = shortagePct * commodity.hormuzDependencyPct * (1 - commodity.substitutionFactor);

      // Time-adjusted multiplier
      const timeMult = this.timeHorizon === 'short'
        ? commodity.shortTermMultiplier
        : commodity.longTermAdaptation;

      // Price increase = shortage * (1/|elasticity|) * time multiplier
      // Capped at reasonable bounds
      const elasticity = Math.abs(commodity.priceElasticityMid);
      const rawPriceIncrease = effectiveShortage * (1 / elasticity) * timeMult;
      const priceIncreasePct = Math.min(rawPriceIncrease, 10); // cap at 1000%

      const estimatedPrice = commodity.basePrice * (1 + priceIncreasePct);

      // Severity classification
      let severity = 'none';
      if (priceIncreasePct > 2.0) severity = 'critical';
      else if (priceIncreasePct > 1.0) severity = 'severe';
      else if (priceIncreasePct > 0.5) severity = 'high';
      else if (priceIncreasePct > 0.2) severity = 'moderate';
      else if (priceIncreasePct > 0.05) severity = 'low';

      impacts[key] = {
        key,
        name: commodity.name,
        icon: commodity.icon,
        color: commodity.color,
        category: commodity.category,
        shortagePct: shortagePct * 100,
        effectiveShortage: effectiveShortage * 100,
        priceIncreasePct: priceIncreasePct * 100,
        estimatedPrice: Math.round(estimatedPrice * 100) / 100,
        basePrice: commodity.basePrice,
        unit: commodity.unit,
        severity,
        hormuzDep: commodity.hormuzDependencyPct * 100,
        substitution: commodity.substitutionFactor,
        elasticity: commodity.priceElasticityMid,
        timeMult
      };
    }

    return impacts;
  }

  // ── Industry-level impacts ──────────────────────────────────────────────────
  _computeIndustryImpacts(commodityImpacts) {
    const industryMap = {};

    for (const [commodityKey, commodity] of Object.entries(COMMODITIES)) {
      const commImpact = commodityImpacts[commodityKey];
      if (!commImpact || commImpact.effectiveShortage === 0) continue;

      for (const [industryName, industryData] of Object.entries(commodity.industries)) {
        if (!industryMap[industryName]) {
          industryMap[industryName] = {
            name: industryName,
            totalImpact: 0,
            sources: [],
            gdpWeight: industryData.gdpWeight
          };
        }

        const impactContribution = (commImpact.effectiveShortage / 100) * industryData.passThroughCoeff;
        industryMap[industryName].totalImpact += impactContribution * 100;
        industryMap[industryName].gdpWeight = Math.max(industryMap[industryName].gdpWeight, industryData.gdpWeight);

        industryMap[industryName].sources.push({
          commodity: commodityKey,
          commodityName: commImpact.name,
          commodityColor: commImpact.color,
          passThroughCoeff: industryData.passThroughCoeff,
          contribution: impactContribution * 100
        });
      }
    }

    // Sort by total impact
    return Object.values(industryMap).sort((a, b) => b.totalImpact - a.totalImpact);
  }

  // ── Country-level impacts ───────────────────────────────────────────────────
  _computeCountryImpacts(commodityImpacts, industryImpacts) {
    const countryResults = [];

    for (const [countryName, country] of Object.entries(COUNTRIES)) {
      let overallScore = 0;
      let gdpDragPct = 0;
      const vulnerableSectors = [];
      const commodityExposures = {};

      // Calculate impact from each commodity
      for (const [commodityKey, dep] of Object.entries(country.dependencies)) {
        const commImpact = commodityImpacts[commodityKey];
        if (!commImpact || commImpact.effectiveShortage === 0) continue;

        // Country exposure = commodity effective shortage * country's dependency on Hormuz for that commodity
        const countryExposure = (commImpact.effectiveShortage / 100) * dep;
        commodityExposures[commodityKey] = {
          name: commImpact.name,
          exposure: countryExposure * 100,
          priceImpact: commImpact.priceIncreasePct * dep,
          color: commImpact.color
        };

        overallScore += countryExposure * 100;
      }

      // GDP drag estimation from industry impacts
      for (const industry of industryImpacts) {
        const sectorMap = {
          'Energy & Power': 'energy', 'Transportation': 'energy',
          'Manufacturing': 'manufacturing', 'Petrochemicals': 'manufacturing',
          'Agriculture & Food': 'agriculture', 'Fertilizer Production': 'agriculture',
          'Crop Production': 'agriculture', 'Food Processing': 'agriculture',
          'Semiconductor Manufacturing': 'tech', 'Aerospace & Defense': 'manufacturing',
          'Healthcare (MRI)': 'services', 'Construction': 'manufacturing',
          'Automotive': 'manufacturing'
        };

        const sector = sectorMap[industry.name] || 'services';
        const sectorWeight = country.gdpSectors[sector] || 0.05;
        const ioMultiplier = (typeof INDUSTRIES !== 'undefined' && INDUSTRIES[industry.name] && INDUSTRIES[industry.name].ioMultiplier) ? INDUSTRIES[industry.name].ioMultiplier : 1.5;
        const industryDrag = (industry.totalImpact / 100) * sectorWeight * ioMultiplier;
        gdpDragPct += industryDrag;

        if (industryDrag > 0.001) { // 0.1% drag
          vulnerableSectors.push({
            name: industry.name,
            impact: industryDrag
          });
        }
      }

      // Gulf exporters have additional revenue loss impact
      if (country.isExporter) {
        const avgShortage = Object.values(this.shortages).reduce((a, b) => a + b, 0) / Object.keys(this.shortages).length;
        const revenueLoss = (avgShortage / 100) * (country.exportRevenueLossPct || 0) * 100;
        overallScore += revenueLoss * 0.3;
        gdpDragPct += revenueLoss * 0.15;
      }

      // Normalize overall score (0-100)
      const normalizedScore = Math.min(overallScore, 100);

      // Dependency index (0-1)
      const depValues = Object.values(country.dependencies);
      const avgDependency = depValues.reduce((a, b) => a + b, 0) / depValues.length;

      countryResults.push({
        name: countryName,
        flag: country.flag,
        region: country.region,
        gdpTrillions: country.gdpTrillions,
        pinned: country.pinned || false,
        isExporter: country.isExporter || false,
        overallScore: Math.round(normalizedScore * 10) / 10,
        gdpDragPct: Math.round(gdpDragPct * 100) / 100,
        dependencyIndex: Math.round(avgDependency * 100) / 100,
        vulnerableSectors: vulnerableSectors.sort((a, b) => b.impact - a.impact).slice(0, 4),
        commodityExposures
      });
    }

    // Sort: pinned first, then by overall score descending
    countryResults.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return b.overallScore - a.overallScore;
    });

    return countryResults;
  }

  // ── Food supply impact ──────────────────────────────────────────────────────
  _computeFoodImpact(commodityImpacts) {
    const fertCommodities = ['sulfur', 'ammonia', 'urea', 'nitrogen'];
    let fertShortageIndex = 0;

    for (const key of fertCommodities) {
      const impact = commodityImpacts[key];
      if (impact && impact.effectiveShortage > 0) {
        fertShortageIndex += impact.effectiveShortage * (key === 'urea' ? 0.35 : key === 'nitrogen' ? 0.25 : key === 'ammonia' ? 0.25 : 0.15);
      }
    }

    fertShortageIndex /= 100;

    // Food CPI pass-through (0.3-0.7 range)
    const passThroughCoeff = this.timeHorizon === 'short' ? 0.5 : 0.7;
    const foodPriceIncrease = fertShortageIndex * passThroughCoeff * 100;

    // Crop yield reduction estimate
    const yieldReduction = fertShortageIndex * 0.4 * 100;

    // Energy cost contribution to food
    const oilImpact = commodityImpacts.oil ? commodityImpacts.oil.effectiveShortage / 100 : 0;
    const lngImpact = commodityImpacts.lng ? commodityImpacts.lng.effectiveShortage / 100 : 0;
    const energyCostOnFood = (oilImpact * 0.15 + lngImpact * 0.10) * 100;

    return {
      fertShortageIndex: Math.round(fertShortageIndex * 10000) / 100,
      foodPriceIncreasePct: Math.round((foodPriceIncrease + energyCostOnFood) * 100) / 100,
      cropYieldReductionPct: Math.round(yieldReduction * 100) / 100,
      energyCostContribution: Math.round(energyCostOnFood * 100) / 100,
      severity: foodPriceIncrease + energyCostOnFood > 20 ? 'critical' :
               foodPriceIncrease + energyCostOnFood > 10 ? 'severe' :
               foodPriceIncrease + energyCostOnFood > 5 ? 'high' :
               foodPriceIncrease + energyCostOnFood > 2 ? 'moderate' : 'low'
    };
  }

  // ── Sankey diagram data ─────────────────────────────────────────────────────
  _buildSankeyData(commodityImpacts, industryImpacts) {
    const nodes = [];
    const links = [];
    const nodeIndex = {};
    let idx = 0;

    function addNode(name, type, color) {
      if (nodeIndex[name] === undefined) {
        nodeIndex[name] = idx;
        nodes.push({ name, type, color });
        idx++;
      }
      return nodeIndex[name];
    }

    // Add commodity nodes (level 0)
    for (const [key, impact] of Object.entries(commodityImpacts)) {
      if (impact.effectiveShortage > 0) {
        addNode(impact.name, 'commodity', impact.color);
      }
    }

    // Add industry nodes (level 1) and links from commodities
    for (const industry of industryImpacts) {
      if (industry.totalImpact < 0.5) continue;
      const indNode = addNode(industry.name, 'industry', '#64748B');

      for (const source of industry.sources) {
        const commNode = nodeIndex[commodityImpacts[source.commodity]?.name];
        if (commNode !== undefined && source.contribution > 0.1) {
          links.push({
            source: commNode,
            target: indNode,
            value: Math.max(source.contribution, 1),
            color: source.commodityColor
          });
        }
      }
    }

    // Add economy impact nodes (level 2) and links from industries
    const economyCategories = {
      'GDP Growth': { color: '#EF4444', industries: ['Energy & Power', 'Manufacturing', 'Transportation', 'Construction', 'Automotive'] },
      'Food Prices': { color: '#F59E0B', industries: ['Agriculture & Food', 'Fertilizer Production', 'Crop Production', 'Food Processing'] },
      'Tech Sector': { color: '#6366F1', industries: ['Semiconductor Manufacturing', 'Fiber Optics & Telecom', 'Scientific Research'] },
      'Healthcare': { color: '#06B6D4', industries: ['Healthcare (MRI)'] },
      'Defense': { color: '#475569', industries: ['Aerospace & Defense', 'Explosives & Mining'] },
      'Inflation': { color: '#DC2626', industries: ['Energy & Power', 'Transportation', 'Petrochemicals', 'Chemical Processing', 'Chemicals'] }
    };

    for (const [econName, econData] of Object.entries(economyCategories)) {
      let totalFlow = 0;
      const econNode = addNode(econName, 'economy', econData.color);

      for (const industry of industryImpacts) {
        if (econData.industries.includes(industry.name) && industry.totalImpact > 0.5) {
          const indNode = nodeIndex[industry.name];
          if (indNode !== undefined) {
            const flowValue = Math.max(industry.totalImpact * 0.3, 1);
            links.push({
              source: indNode,
              target: econNode,
              value: flowValue,
              color: econData.color + '80'
            });
            totalFlow += flowValue;
          }
        }
      }

      // Remove economy nodes with no inflow
      if (totalFlow === 0) {
        nodes.pop();
        delete nodeIndex[econName];
        idx--;
      }
    }

    return { nodes, links };
  }
}
