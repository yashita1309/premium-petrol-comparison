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
  stateOffice: string | null;
  divisionalOffice: string | null;
  salesArea: string | null;
  lastUpdated: string;
}

export interface HPCLScraperStats {
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
}
