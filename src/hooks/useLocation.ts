import { useCallback, useState } from 'react';
import * as Location from 'expo-location';

export interface AppLocation {
  latitude: number;
  longitude: number;
}

const LOCATION_OPTIONS: Location.LocationOptions = {
  accuracy: Location.Accuracy.Balanced,
};

const getLocationErrorMessage = (error: unknown) => {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }
  return 'Không thể lấy vị trí của bạn.';
};

export const useLocation = () => {
  const [location, setLocation] = useState<AppLocation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestLocation = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const permission = await Location.requestForegroundPermissionsAsync();

      if (permission.status !== 'granted') {
        setLocation(null);
        setError('Bạn đã từ chối quyền truy cập vị trí.');
        return null;
      }

      const position = await Location.getCurrentPositionAsync(LOCATION_OPTIONS);
      const nextLocation = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };

      setLocation(nextLocation);
      return nextLocation;
    } catch (nextError) {
      const message = getLocationErrorMessage(nextError);
      setLocation(null);
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    location,
    loading,
    error,
    requestLocation,
  };
};
