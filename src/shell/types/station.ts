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
  distance: number;
  website: string;
  openingHours: string;
  fuels: string[];
  amenities: string[];
  googleMapsUrl: string;
  lastUpdated: string;

  // Consistency fields
  roCode?: string;
  stateOffice?: string | null;
  divisionalOffice?: string | null;
  salesArea?: string | null;
}

export interface ShellScraperStats {
  totalRows: number;
  parsed: number;
  skipped: number;
  timeTaken: string;
}

export interface NearbyStationResponse {
  stationName: string;
  city: string;
  state: string;
  latitude: number;
  longitude: number;
  distance: number;
  power95Price: number | null;
  petrolPrice: number | null;
  dieselPrice: number | null;
  turboJetPrice: number | null;
  stationUrl: string;
  googleMapsUrl: string | null;

  // Consistency fields
  roCode?: string;
  stateOffice?: string | null;
  divisionalOffice?: string | null;
  salesArea?: string | null;
}
export type NearbyStationListResponse = NearbyStationResponse[];
