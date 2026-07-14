export interface BPCLStation {
  brand: string;
  fuelType: string;
  roId: string;
  stationName: string;
  address: string;
  city: string;
  state: string;
  phone: string | null;
  latitude: number;
  longitude: number;
  amenities: string[];
  fuelAvailable: string[];
  speedPrice: number | null;
  petrolPrice: number | null;
  dieselPrice: number | null;
  googleMapsUrl: string;
  stationUrl: string | null;
  lastUpdated: string;
  stateOffice: string | null;
  divisionalOffice: string | null;
  salesArea: string | null;
}

export interface BPCLScraperStats {
  totalApiRequests: number;
  totalStationsFetched: number;
  totalSpeedStationsFound: number;
  totalDuplicatesRemoved: number;
  finalStationCount: number;
  timeTaken: string;
}

export interface NearbyStationResponse {
  roId: string;
  stationName: string;
  city: string;
  state: string;
  latitude: number;
  longitude: number;
  distance: number;
  speedPrice: number | null;
  petrolPrice: number | null;
  dieselPrice: number | null;
  googleMapsUrl: string;
}
