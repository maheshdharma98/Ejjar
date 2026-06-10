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

export const categoryColors: Record<string, string> = {
  manpower: '#192433',
  machinery: '#F59E0B',
  vehicle: '#22C55E',
  vehicles: '#22C55E',
  shipping: '#8B5CF6',
};

export const categoryBgColors: Record<string, string> = {
  manpower: '#E8EDF2',
  machinery: '#FEF3C7',
  vehicle: '#DCFCE7',
  vehicles: '#DCFCE7',
  shipping: '#F3E8FF',
};
