// =============================================================================
// HORMUZ STRAIT BLOCKADE IMPACT PLATFORM — Core Data Model
// Research-backed commodity data, dependency matrices, and country profiles
// =============================================================================

const COMMODITIES = {
  oil: {
    name: 'Crude Oil',
    icon: '🛢️',
    color: '#F59E0B',
    category: 'energy',
    hormuzDependencyPct: 0.21,
    globalDailyVolume: '20M barrels/day',
    priceElasticityRange: [-0.15, -0.05],
    priceElasticityMid: -0.10,
    substitutionFactor: 0.50,
    shortTermMultiplier: 2.5,
    longTermAdaptation: 0.55,
    unit: '$/barrel',
    basePrice: 78,
    description: '~21% of global petroleum passes through Hormuz. Strategic reserves and alternative production can partially offset, but inelastic demand means prices spike fast.',
    keyExporters: ['Saudi Arabia', 'Iraq', 'UAE', 'Kuwait', 'Iran', 'Qatar'],
    industries: {
      'Energy & Power': { passThroughCoeff: 0.85, gdpWeight: 0.08 },
      'Transportation': { passThroughCoeff: 0.75, gdpWeight: 0.06 },
      'Petrochemicals': { passThroughCoeff: 0.80, gdpWeight: 0.04 },
      'Manufacturing': { passThroughCoeff: 0.40, gdpWeight: 0.12 },
      'Agriculture': { passThroughCoeff: 0.35, gdpWeight: 0.03 }
    }
  },
  lng: {
    name: 'LNG',
    icon: '🔥',
    color: '#3B82F6',
    category: 'energy',
    hormuzDependencyPct: 0.20,
    globalDailyVolume: '10.4 Bcf/day',
    priceElasticityRange: [-0.20, -0.10],
    priceElasticityMid: -0.15,
    substitutionFactor: 0.30,
    shortTermMultiplier: 3.0,
    longTermAdaptation: 0.50,
    unit: '$/MMBtu',
    basePrice: 12.5,
    description: '~20% of global LNG trade transits Hormuz. Limited pipeline alternatives and long-term contracts make short-term substitution difficult.',
    keyExporters: ['Qatar', 'UAE', 'Oman'],
    industries: {
      'Energy & Power': { passThroughCoeff: 0.90, gdpWeight: 0.08 },
      'Industrial Heating': { passThroughCoeff: 0.70, gdpWeight: 0.05 },
      'Chemicals': { passThroughCoeff: 0.55, gdpWeight: 0.03 },
      'Residential Heating': { passThroughCoeff: 0.60, gdpWeight: 0.02 }
    }
  },
  sulfur: {
    name: 'Sulfur',
    icon: '⚗️',
    color: '#EAB308',
    category: 'industrial',
    hormuzDependencyPct: 0.47,
    globalDailyVolume: '~80M tonnes/year',
    priceElasticityRange: [-0.10, -0.05],
    priceElasticityMid: -0.07,
    substitutionFactor: 0.15,
    shortTermMultiplier: 3.5,
    longTermAdaptation: 0.40,
    unit: '$/tonne',
    basePrice: 160,
    description: '~47% of global sulfur exports transit Hormuz. Sulfur is critical for fertilizers (60% of demand), semicon manufacturing, and mining. Almost no substitutes exist.',
    keyExporters: ['Qatar', 'Saudi Arabia', 'UAE', 'Kuwait', 'Iran'],
    industries: {
      'Fertilizer Production': { passThroughCoeff: 0.90, gdpWeight: 0.02 },
      'Semiconductor Manufacturing': { passThroughCoeff: 0.60, gdpWeight: 0.03 },
      'Mining & Metal Extraction': { passThroughCoeff: 0.70, gdpWeight: 0.03 },
      'Chemical Processing': { passThroughCoeff: 0.65, gdpWeight: 0.02 }
    }
  },
  helium: {
    name: 'Helium',
    icon: '🎈',
    color: '#A855F7',
    category: 'industrial',
    hormuzDependencyPct: 0.36,
    globalDailyVolume: '~6 Bcf/year',
    priceElasticityRange: [-0.08, -0.02],
    priceElasticityMid: -0.05,
    substitutionFactor: 0.10,
    shortTermMultiplier: 4.5,
    longTermAdaptation: 0.35,
    unit: '$/Mcf',
    basePrice: 400,
    description: 'Qatar produces ~36% of global helium. Almost no substitutes for semiconductor cooling, MRI machines, or aerospace. Storage limited to 35-48 days due to evaporation.',
    keyExporters: ['Qatar'],
    industries: {
      'Semiconductor Manufacturing': { passThroughCoeff: 0.85, gdpWeight: 0.03 },
      'Healthcare (MRI)': { passThroughCoeff: 0.70, gdpWeight: 0.04 },
      'Aerospace & Defense': { passThroughCoeff: 0.60, gdpWeight: 0.02 },
      'Fiber Optics & Telecom': { passThroughCoeff: 0.50, gdpWeight: 0.01 },
      'Scientific Research': { passThroughCoeff: 0.55, gdpWeight: 0.01 }
    }
  },
  aluminum: {
    name: 'Aluminum',
    icon: '🏗️',
    color: '#6B7280',
    category: 'industrial',
    hormuzDependencyPct: 0.085,
    globalDailyVolume: '~70M tonnes/year',
    priceElasticityRange: [-0.50, -0.30],
    priceElasticityMid: -0.40,
    substitutionFactor: 0.60,
    shortTermMultiplier: 1.75,
    longTermAdaptation: 0.65,
    unit: '$/tonne',
    basePrice: 2450,
    description: '~8.5% of global aluminum produced in ME, with ~80% exported through Hormuz. Moderate substitution with steel and other sources, but premiums spike quickly.',
    keyExporters: ['UAE', 'Bahrain', 'Qatar', 'Saudi Arabia'],
    industries: {
      'Construction': { passThroughCoeff: 0.55, gdpWeight: 0.06 },
      'Automotive': { passThroughCoeff: 0.50, gdpWeight: 0.04 },
      'Packaging': { passThroughCoeff: 0.40, gdpWeight: 0.02 },
      'Aerospace & Defense': { passThroughCoeff: 0.45, gdpWeight: 0.02 }
    }
  },
  ammonia: {
    name: 'Ammonia',
    icon: '🧪',
    color: '#10B981',
    category: 'agriculture',
    hormuzDependencyPct: 0.25,
    globalDailyVolume: '~190M tonnes/year',
    priceElasticityRange: [-0.15, -0.10],
    priceElasticityMid: -0.12,
    substitutionFactor: 0.25,
    shortTermMultiplier: 3.0,
    longTermAdaptation: 0.45,
    unit: '$/tonne',
    basePrice: 350,
    description: '~25% of seaborne ammonia transits Hormuz. Critical precursor for fertilizers. Limited local production capacity outside Gulf region.',
    keyExporters: ['Saudi Arabia', 'Qatar', 'Kuwait', 'Iran'],
    industries: {
      'Fertilizer Production': { passThroughCoeff: 0.85, gdpWeight: 0.02 },
      'Chemical Manufacturing': { passThroughCoeff: 0.60, gdpWeight: 0.02 },
      'Explosives & Mining': { passThroughCoeff: 0.50, gdpWeight: 0.01 }
    }
  },
  urea: {
    name: 'Urea',
    icon: '🌾',
    color: '#22C55E',
    category: 'agriculture',
    hormuzDependencyPct: 0.40,
    globalDailyVolume: '~200M tonnes/year',
    priceElasticityRange: [-0.12, -0.08],
    priceElasticityMid: -0.10,
    substitutionFactor: 0.25,
    shortTermMultiplier: 2.75,
    longTermAdaptation: 0.45,
    unit: '$/tonne',
    basePrice: 310,
    description: '~40% of global urea exports transit Hormuz. A single Qatar facility produces ~10% of global supply. Critical for agriculture — directly affects food prices.',
    keyExporters: ['Qatar', 'Iran', 'Saudi Arabia', 'UAE'],
    industries: {
      'Agriculture & Food': { passThroughCoeff: 0.80, gdpWeight: 0.03 },
      'Fertilizer Production': { passThroughCoeff: 0.90, gdpWeight: 0.02 },
      'Industrial Chemicals': { passThroughCoeff: 0.45, gdpWeight: 0.01 }
    }
  },
  nitrogen: {
    name: 'Nitrogen Fertilizers',
    icon: '🌱',
    color: '#16A34A',
    category: 'agriculture',
    hormuzDependencyPct: 0.28,
    globalDailyVolume: '~170M tonnes/year',
    priceElasticityRange: [-0.15, -0.10],
    priceElasticityMid: -0.12,
    substitutionFactor: 0.35,
    shortTermMultiplier: 2.5,
    longTermAdaptation: 0.50,
    unit: '$/tonne',
    basePrice: 280,
    description: '~28% of global nitrogen fertilizer exports transit Hormuz. Diverse sources exist but capacity is constrained. Shortages directly threaten food production.',
    keyExporters: ['Qatar', 'Saudi Arabia', 'Iran', 'UAE', 'Oman'],
    industries: {
      'Agriculture & Food': { passThroughCoeff: 0.85, gdpWeight: 0.03 },
      'Crop Production': { passThroughCoeff: 0.90, gdpWeight: 0.04 },
      'Food Processing': { passThroughCoeff: 0.50, gdpWeight: 0.03 }
    }
  }
};

// Country profiles with import dependency on Hormuz-transit commodities
// dependency = fraction (0-1) of country's imports of that commodity coming through Hormuz
const COUNTRIES = {
  'Japan': {
    flag: '🇯🇵', region: 'Asia-Pacific', gdpTrillions: 4.2, pinned: false,
    dependencies: { oil: 0.85, lng: 0.75, sulfur: 0.40, helium: 0.45, aluminum: 0.20, ammonia: 0.30, urea: 0.25, nitrogen: 0.20 },
    gdpSectors: { energy: 0.06, manufacturing: 0.20, agriculture: 0.01, tech: 0.08, services: 0.65 }
  },
  'South Korea': {
    flag: '🇰🇷', region: 'Asia-Pacific', gdpTrillions: 1.7, pinned: false,
    dependencies: { oil: 0.72, lng: 0.55, sulfur: 0.35, helium: 0.65, aluminum: 0.15, ammonia: 0.25, urea: 0.30, nitrogen: 0.22 },
    gdpSectors: { energy: 0.04, manufacturing: 0.25, agriculture: 0.02, tech: 0.12, services: 0.57 }
  },
  'India': {
    flag: '🇮🇳', region: 'South Asia', gdpTrillions: 3.7, pinned: true,
    dependencies: { oil: 0.65, lng: 0.50, sulfur: 0.55, helium: 0.30, aluminum: 0.10, ammonia: 0.45, urea: 0.50, nitrogen: 0.45 },
    gdpSectors: { energy: 0.04, manufacturing: 0.14, agriculture: 0.17, tech: 0.08, services: 0.57 }
  },
  'China': {
    flag: '🇨🇳', region: 'Asia-Pacific', gdpTrillions: 17.8, pinned: true,
    dependencies: { oil: 0.45, lng: 0.35, sulfur: 0.25, helium: 0.20, aluminum: 0.05, ammonia: 0.15, urea: 0.20, nitrogen: 0.15 },
    gdpSectors: { energy: 0.05, manufacturing: 0.28, agriculture: 0.07, tech: 0.10, services: 0.50 }
  },
  'United States': {
    flag: '🇺🇸', region: 'North America', gdpTrillions: 27.4, pinned: true,
    dependencies: { oil: 0.12, lng: 0.05, sulfur: 0.08, helium: 0.05, aluminum: 0.15, ammonia: 0.08, urea: 0.10, nitrogen: 0.08 },
    gdpSectors: { energy: 0.06, manufacturing: 0.11, agriculture: 0.01, tech: 0.10, services: 0.72 }
  },
  'European Union': {
    flag: '🇪🇺', region: 'Europe', gdpTrillions: 18.3, pinned: true,
    dependencies: { oil: 0.20, lng: 0.07, sulfur: 0.30, helium: 0.25, aluminum: 0.20, ammonia: 0.20, urea: 0.15, nitrogen: 0.18 },
    gdpSectors: { energy: 0.04, manufacturing: 0.15, agriculture: 0.02, tech: 0.07, services: 0.72 }
  },
  'Israel': {
    flag: '🇮🇱', region: 'Middle East', gdpTrillions: 0.53, pinned: true,
    dependencies: { oil: 0.35, lng: 0.10, sulfur: 0.20, helium: 0.30, aluminum: 0.15, ammonia: 0.15, urea: 0.12, nitrogen: 0.10 },
    gdpSectors: { energy: 0.03, manufacturing: 0.12, agriculture: 0.01, tech: 0.18, services: 0.66 }
  },
  'Saudi Arabia': {
    flag: '🇸🇦', region: 'Gulf States', gdpTrillions: 1.1, pinned: true,
    dependencies: { oil: 0.02, lng: 0.02, sulfur: 0.05, helium: 0.05, aluminum: 0.05, ammonia: 0.03, urea: 0.03, nitrogen: 0.03 },
    gdpSectors: { energy: 0.42, manufacturing: 0.12, agriculture: 0.02, tech: 0.03, services: 0.41 },
    isExporter: true, exportRevenueLossPct: 0.35
  },
  'UAE': {
    flag: '🇦🇪', region: 'Gulf States', gdpTrillions: 0.51, pinned: true,
    dependencies: { oil: 0.02, lng: 0.03, sulfur: 0.05, helium: 0.05, aluminum: 0.03, ammonia: 0.03, urea: 0.03, nitrogen: 0.03 },
    gdpSectors: { energy: 0.30, manufacturing: 0.10, agriculture: 0.01, tech: 0.05, services: 0.54 },
    isExporter: true, exportRevenueLossPct: 0.40
  },
  'Qatar': {
    flag: '🇶🇦', region: 'Gulf States', gdpTrillions: 0.22, pinned: true,
    dependencies: { oil: 0.02, lng: 0.01, sulfur: 0.02, helium: 0.01, aluminum: 0.02, ammonia: 0.02, urea: 0.02, nitrogen: 0.02 },
    gdpSectors: { energy: 0.50, manufacturing: 0.08, agriculture: 0.00, tech: 0.02, services: 0.40 },
    isExporter: true, exportRevenueLossPct: 0.65
  },
  'Kuwait': {
    flag: '🇰🇼', region: 'Gulf States', gdpTrillions: 0.16, pinned: true,
    dependencies: { oil: 0.02, lng: 0.02, sulfur: 0.03, helium: 0.03, aluminum: 0.03, ammonia: 0.03, urea: 0.03, nitrogen: 0.03 },
    gdpSectors: { energy: 0.50, manufacturing: 0.06, agriculture: 0.01, tech: 0.01, services: 0.42 },
    isExporter: true, exportRevenueLossPct: 0.55
  },
  'Bahrain': {
    flag: '🇧🇭', region: 'Gulf States', gdpTrillions: 0.044, pinned: true,
    dependencies: { oil: 0.05, lng: 0.05, sulfur: 0.05, helium: 0.05, aluminum: 0.03, ammonia: 0.05, urea: 0.05, nitrogen: 0.05 },
    gdpSectors: { energy: 0.18, manufacturing: 0.14, agriculture: 0.00, tech: 0.03, services: 0.65 },
    isExporter: true, exportRevenueLossPct: 0.30
  },
  'Oman': {
    flag: '🇴🇲', region: 'Gulf States', gdpTrillions: 0.11, pinned: true,
    dependencies: { oil: 0.03, lng: 0.02, sulfur: 0.05, helium: 0.05, aluminum: 0.05, ammonia: 0.04, urea: 0.04, nitrogen: 0.04 },
    gdpSectors: { energy: 0.36, manufacturing: 0.10, agriculture: 0.02, tech: 0.02, services: 0.50 },
    isExporter: true, exportRevenueLossPct: 0.25
  },
  'Iran': {
    flag: '🇮🇷', region: 'Gulf States', gdpTrillions: 0.40, pinned: true,
    dependencies: { oil: 0.01, lng: 0.01, sulfur: 0.02, helium: 0.02, aluminum: 0.02, ammonia: 0.01, urea: 0.01, nitrogen: 0.01 },
    gdpSectors: { energy: 0.25, manufacturing: 0.12, agriculture: 0.12, tech: 0.02, services: 0.49 },
    isExporter: true, exportRevenueLossPct: 0.50
  },
  'Turkey': {
    flag: '🇹🇷', region: 'Europe', gdpTrillions: 1.1, pinned: false,
    dependencies: { oil: 0.30, lng: 0.20, sulfur: 0.25, helium: 0.20, aluminum: 0.10, ammonia: 0.20, urea: 0.18, nitrogen: 0.15 },
    gdpSectors: { energy: 0.04, manufacturing: 0.20, agriculture: 0.07, tech: 0.04, services: 0.65 }
  },
  'Indonesia': {
    flag: '🇮🇩', region: 'Southeast Asia', gdpTrillions: 1.4, pinned: false,
    dependencies: { oil: 0.35, lng: 0.10, sulfur: 0.75, helium: 0.15, aluminum: 0.10, ammonia: 0.30, urea: 0.35, nitrogen: 0.30 },
    gdpSectors: { energy: 0.05, manufacturing: 0.20, agriculture: 0.13, tech: 0.04, services: 0.58 }
  },
  'Thailand': {
    flag: '🇹🇭', region: 'Southeast Asia', gdpTrillions: 0.51, pinned: false,
    dependencies: { oil: 0.55, lng: 0.30, sulfur: 0.35, helium: 0.20, aluminum: 0.10, ammonia: 0.25, urea: 0.30, nitrogen: 0.25 },
    gdpSectors: { energy: 0.04, manufacturing: 0.25, agriculture: 0.08, tech: 0.05, services: 0.58 }
  },
  'Brazil': {
    flag: '🇧🇷', region: 'South America', gdpTrillions: 2.1, pinned: false,
    dependencies: { oil: 0.10, lng: 0.05, sulfur: 0.20, helium: 0.10, aluminum: 0.05, ammonia: 0.15, urea: 0.25, nitrogen: 0.20 },
    gdpSectors: { energy: 0.05, manufacturing: 0.10, agriculture: 0.07, tech: 0.03, services: 0.75 }
  },
  'Pakistan': {
    flag: '🇵🇰', region: 'South Asia', gdpTrillions: 0.34, pinned: false,
    dependencies: { oil: 0.55, lng: 0.40, sulfur: 0.50, helium: 0.10, aluminum: 0.10, ammonia: 0.40, urea: 0.45, nitrogen: 0.40 },
    gdpSectors: { energy: 0.04, manufacturing: 0.12, agriculture: 0.23, tech: 0.02, services: 0.59 }
  },
  'Singapore': {
    flag: '🇸🇬', region: 'Southeast Asia', gdpTrillions: 0.50, pinned: false,
    dependencies: { oil: 0.70, lng: 0.60, sulfur: 0.20, helium: 0.25, aluminum: 0.10, ammonia: 0.15, urea: 0.10, nitrogen: 0.10 },
    gdpSectors: { energy: 0.05, manufacturing: 0.20, agriculture: 0.00, tech: 0.12, services: 0.63 }
  },
  'Australia': {
    flag: '🇦🇺', region: 'Oceania', gdpTrillions: 1.7, pinned: false,
    dependencies: { oil: 0.15, lng: 0.03, sulfur: 0.10, helium: 0.10, aluminum: 0.05, ammonia: 0.08, urea: 0.15, nitrogen: 0.10 },
    gdpSectors: { energy: 0.08, manufacturing: 0.06, agriculture: 0.02, tech: 0.05, services: 0.79 }
  }
};

// Industry definitions with their relationships across commodities
const INDUSTRIES = {
  'Energy & Power': { color: '#F59E0B', icon: '⚡' },
  'Transportation': { color: '#EF4444', icon: '🚛' },
  'Petrochemicals': { color: '#EC4899', icon: '🏭' },
  'Manufacturing': { color: '#8B5CF6', icon: '🔧' },
  'Agriculture & Food': { color: '#22C55E', icon: '🌾' },
  'Fertilizer Production': { color: '#16A34A', icon: '🧫' },
  'Semiconductor Manufacturing': { color: '#6366F1', icon: '💾' },
  'Healthcare (MRI)': { color: '#06B6D4', icon: '🏥' },
  'Aerospace & Defense': { color: '#475569', icon: '✈️' },
  'Construction': { color: '#78716C', icon: '🏗️' },
  'Automotive': { color: '#DC2626', icon: '🚗' },
  'Mining & Metal Extraction': { color: '#A16207', icon: '⛏️' },
  'Chemical Processing': { color: '#7C3AED', icon: '⚗️' },
  'Crop Production': { color: '#4ADE80', icon: '🌽' },
  'Food Processing': { color: '#FB923C', icon: '🍞' },
  'Packaging': { color: '#94A3B8', icon: '📦' },
  'Industrial Heating': { color: '#F97316', icon: '🔥' },
  'Chemicals': { color: '#A855F7', icon: '🧪' },
  'Residential Heating': { color: '#FBBF24', icon: '🏠' },
  'Fiber Optics & Telecom': { color: '#2563EB', icon: '📡' },
  'Scientific Research': { color: '#0EA5E9', icon: '🔬' },
  'Chemical Manufacturing': { color: '#D946EF', icon: '🏭' },
  'Explosives & Mining': { color: '#B91C1C', icon: '💥' },
  'Industrial Chemicals': { color: '#7C3AED', icon: '🧪' }
};

// Scenario presets
const PRESETS = {
  'Full Blockade': {
    description: 'Complete closure — no maritime traffic through Hormuz',
    shortages: { oil: 100, lng: 100, sulfur: 100, helium: 100, aluminum: 100, ammonia: 100, urea: 100, nitrogen: 100 }
  },
  'Partial Disruption (50%)': {
    description: 'Significant disruption — half of normal traffic blocked',
    shortages: { oil: 50, lng: 50, sulfur: 50, helium: 50, aluminum: 50, ammonia: 50, urea: 50, nitrogen: 50 }
  },
  'Oil & Energy Only': {
    description: 'Targeted disruption of energy exports only',
    shortages: { oil: 80, lng: 80, sulfur: 20, helium: 10, aluminum: 10, ammonia: 15, urea: 15, nitrogen: 15 }
  },
  'Agriculture Crisis': {
    description: 'Focus on fertilizer supply chain disruption',
    shortages: { oil: 30, lng: 30, sulfur: 80, helium: 10, aluminum: 10, ammonia: 90, urea: 90, nitrogen: 85 }
  },
  'Tech Supply Shock': {
    description: 'Helium + semiconductor supply chain disruption',
    shortages: { oil: 20, lng: 20, sulfur: 60, helium: 100, aluminum: 30, ammonia: 20, urea: 20, nitrogen: 20 }
  },
  'Custom': {
    description: 'Set your own shortage percentages',
    shortages: { oil: 0, lng: 0, sulfur: 0, helium: 0, aluminum: 0, ammonia: 0, urea: 0, nitrogen: 0 }
  }
};
