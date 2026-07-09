import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Restaurant } from '../types/restaurant.types';
import { ownerApi } from '../api/owner.api';
import { useAuth } from './useAuth';

interface OwnerRestaurantContextType {
  restaurants: Restaurant[];
  activeRestaurant: Restaurant | null;
  isLoadingRestaurants: boolean;
  setActiveRestaurant: (restaurant: Restaurant | null) => void;
  refreshRestaurants: () => Promise<void>;
}

const OwnerRestaurantContext = createContext<OwnerRestaurantContextType | undefined>(undefined);

export const OwnerRestaurantProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [activeRestaurant, setActiveRestaurantState] = useState<Restaurant | null>(null);
  const [isLoadingRestaurants, setIsLoadingRestaurants] = useState<boolean>(false);

  const fetchRestaurants = async () => {
    if (!user || user.role !== 'restaurant_owner') {
      setRestaurants([]);
      setActiveRestaurantState(null);
      return;
    }
    setIsLoadingRestaurants(true);
    try {
      const res = await ownerApi.getMyRestaurants();
      if (res.success && res.data?.restaurants) {
        const fetchedList = res.data.restaurants;
        setRestaurants(fetchedList);
        // Default to first restaurant if none is selected yet or selected one is not in the list
        if (fetchedList.length > 0) {
          setActiveRestaurantState((prev) => {
            if (prev && fetchedList.some((r: any) => r.id === prev.id)) {
              // Maintain previously selected restaurant
              return fetchedList.find((r: any) => r.id === prev.id) || fetchedList[0];
            }
            return fetchedList[0];
          });
        } else {
          setActiveRestaurantState(null);
        }
      }
    } catch (error) {
      console.error('Error fetching owner restaurants:', error);
      setRestaurants([]);
      setActiveRestaurantState(null);
    } finally {
      setIsLoadingRestaurants(false);
    }
  };

  useEffect(() => {
    fetchRestaurants();
  }, [user]);

  const setActiveRestaurant = (restaurant: Restaurant | null) => {
    setActiveRestaurantState(restaurant);
  };

  const refreshRestaurants = async () => {
    await fetchRestaurants();
  };

  return (
    <OwnerRestaurantContext.Provider
      value={{
        restaurants,
        activeRestaurant,
        isLoadingRestaurants,
        setActiveRestaurant,
        refreshRestaurants,
      }}
    >
      {children}
    </OwnerRestaurantContext.Provider>
  );
};

export const useOwnerRestaurant = () => {
  const context = useContext(OwnerRestaurantContext);
  if (!context) {
    throw new Error('useOwnerRestaurant must be used within an OwnerRestaurantProvider');
  }
  return context;
};
