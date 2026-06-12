export const categoryIcons: Record<string, string> = {
  manpower: 'hard-hat',
  machinery: 'crane',
  vehicle: 'truck',
  vehicles: 'truck',
  shipping: 'package-variant',
};

export const subcategoryIcons: Record<string, string> = {
  // Manpower
  mason: 'wall',
  electrician: 'flash',
  plumber: 'pipe-wrench',
  welder: 'torch',
  crane_operator: 'crane',
  scaffolder: 'ladder',
  painter: 'brush',
  carpenter: 'hammer-screwdriver',
  rigger: 'anchor',
  safety_officer: 'shield-check',
  surveyor: 'compass',
  hvac_tech: 'air-conditioner',

  // Machinery
  excavator: 'excavator',
  tower_crane: 'crane',
  mobile_crane: 'crane',
  loader: 'tractor',
  compressor: 'engine',
  generator: 'lightning-bolt',
  forklift: 'forklift',
  concrete_mixer: 'barrel',
  bulldozer: 'bulldozer',
  backhoe: 'excavator',

  // Vehicles
  sedan: 'car',
  suv: 'car-estate',
  pickup: 'car-pickup',
  van: 'van-passenger',
  minibus: 'bus',
  bus: 'bus',
  truck: 'truck',
  tanker: 'tanker-truck',
  flatbed: 'truck-flatbed',
  refrigerated_van: 'snowflake',

  // Shipping
  small_parcel: 'package',
  large_package: 'package-variant',
  pallet: 'pallet',
  bulk_cargo: 'weight-kilogram',
  cold_chain: 'snowflake',
  hazmat: 'biohazard',
  empty_return: 'truck-fast',
  oversized: 'truck',
};

// EJJAR Design System v1.0 — fixed category icon color pairs
export const categoryColors: Record<string, string> = {
  manpower: '#C9974A',  // gold — form icons only
  machinery: '#0369A1', // info blue
  vehicle:   '#0369A1',
  vehicles:  '#0369A1',
  shipping:  '#D97706', // amber
};

// EJJAR Design System v1.0 — fixed category icon backgrounds
export const categoryBgColors: Record<string, string> = {
  manpower: '#FFF0D6', // amber-50
  machinery: '#E0F2FE', // sky-100
  vehicle:   '#E0F2FE',
  vehicles:  '#E0F2FE',
  shipping:  '#FEF3C7', // yellow-100
};
