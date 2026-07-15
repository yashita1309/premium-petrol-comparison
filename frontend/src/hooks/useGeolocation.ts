import { useState, useEffect, useCallback } from 'react';
import type { LocationState } from '../types';

export function useGeolocation() {
  const [state, setState] = useState<LocationState>({
    latitude: null,
    longitude: null,
    city: null,
    permissionStatus: 'prompt',
    isLoading: true,
  });

  const getCoordinates = useCallback(() => {
    if (!navigator.geolocation) {
      setState((prev) => ({
        ...prev,
        permissionStatus: 'unsupported',
        isLoading: false,
      }));
      return;
    }

    setState((prev) => ({ ...prev, isLoading: true }));

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          city: null, // Reverse-geocoding can be set later by search
          permissionStatus: 'granted',
          isLoading: false,
        });
      },
      (error) => {
        console.warn('[Geolocation] Error details:', error.code, error.message);
        // Only set status to 'denied' if user explicitly blocked permission (error.code === 1)
        const isExplicitDenial = error.code === 1; // error.PERMISSION_DENIED
        setState((prev) => ({
          ...prev,
          permissionStatus: isExplicitDenial ? 'denied' : 'prompt',
          isLoading: false,
        }));
      },
      { enableHighAccuracy: false, timeout: 6000, maximumAge: 30000 }
    );
  }, []);

  useEffect(() => {
    // Check permission status if API is available
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions
        .query({ name: 'geolocation' })
        .then((permission) => {
          setState((prev) => ({
            ...prev,
            permissionStatus: permission.state as any,
          }));

          permission.onchange = () => {
            setState((prev) => ({
              ...prev,
              permissionStatus: permission.state as any,
            }));
            if (permission.state === 'granted') {
              getCoordinates();
            }
          };
        })
        .catch((err) => console.warn('[Geolocation] Permissions query error:', err));
    }

    getCoordinates();
  }, [getCoordinates]);

  return {
    ...state,
    retry: getCoordinates,
    setCustomLocation: (lat: number, lng: number, city: string) => {
      setState({
        latitude: lat,
        longitude: lng,
        city: city,
        permissionStatus: 'granted',
        isLoading: false,
      });
    },
  };
}
