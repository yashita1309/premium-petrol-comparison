export interface IOCLStation {
  brand: string;
  fuelType: string;
  roCode: string;
  stationName: string;
  address: string | null;
  city: string;
  state: string | null;
  phone: string | null;
  latitude: number;
  longitude: number;
  openingHours: string | null;
  stationUrl: string | null;
  googleMapsUrl: string;
  xp95Price: number | null;
  xp100Price: number | null;
  petrolPrice: number | null;
  dieselPrice: number | null;
  lastUpdated?: string;
  stateOffice?: string | null;
  divisionalOffice?: string | null;
  salesArea?: string | null;
  distance?: number;
}

export interface HPCLStation {
  brand: string;
  fuelType: string;
  roCode: string;
  stationName: string;
  address: string;
  city: string;
  state: string;
  phone: string;
  latitude: number;
  longitude: number;
  openingHours: string;
  stationUrl: string;
  googleMapsUrl: string | null;
  power95Price: number | null;
  petrolPrice: number | null;
  dieselPrice: number | null;
  turboJetPrice: number | null;
  stateOffice?: string | null;
  divisionalOffice?: string | null;
  salesArea?: string | null;
  lastUpdated?: string;
  distance?: number;
}

export interface BPCLStation {
  brand: string;
  fuelType: string;
  roId: string;
  stationName: string;
  address: string | null;
  city: string;
  state: string;
  phone: string | null;
  latitude: number;
  longitude: number;
  openingHours: string | null;
  googleMapsUrl: string;
  speedPrice: number | null;
  petrolPrice: number | null;
  dieselPrice: number | null;
  lastUpdated?: string;
  distance?: number;
}

export interface ShellStation {
  brand: string;
  fuelType: string;
  stationId: string;
  stationName: string;
  address: string;
  city: string;
  state: string;
  postcode: string;
  phone: string;
  latitude: number;
  longitude: number;
  openingHours: string;
  fuels: string[];
  amenities: string[];
  googleMapsUrl: string;
  website: string;
  lastUpdated?: string;
  distance?: number;
  petrolPrice?: number | null;
  dieselPrice?: number | null;
  xp95Price?: number | null;
}

// Unified Station Card Type for mapping in UI components
export interface UnifiedStation {
  brand: 'IOCL' | 'HPCL' | 'BPCL' | 'Shell';
  fuelType: string;
  stationId: string; // roCode, roId, or stationId
  stationName: string;
  address: string;
  city: string;
  state: string;
  phone: string | null;
  latitude: number;
  longitude: number;
  distance?: number;
  googleMapsUrl: string;
  openingHours: string | null;
  
  // Fuel prices
  petrolPrice: number | null;
  dieselPrice: number | null;
  
  // Premium prices
  premiumFuelPrice?: number | null; // Unified premium price (xp95, power95, speedPrice, etc.)
  xp95Price?: number | null;
  xp100Price?: number | null;
  power95Price?: number | null;
  speedPrice?: number | null;
  turboJetPrice?: number | null;
  shellPremiumPrice?: number | null; // If Shell price is resolved
  
  // Additional metadata
  fuels?: string[];
  amenities?: string[];
  stateOffice?: string | null;
  divisionalOffice?: string | null;
  salesArea?: string | null;
  stationUrl?: string | null;
  
  // Frontend state
  isFavorite?: boolean;
}

export interface FilterParams {
  search: string;
  radius: number;
  city: string;
  state: string;
  sortBy: 'distance' | 'price' | 'name';
  order: 'asc' | 'desc';
}

export interface LocationState {
  latitude: number | null;
  longitude: number | null;
  city: string | null;
  permissionStatus: 'prompt' | 'granted' | 'denied' | 'unsupported';
  isLoading: boolean;
}
