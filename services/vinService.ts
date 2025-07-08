

import { Vehicle } from '../types';

/**
 * This is a mock service. In a real application, this would call an external VIN decoding API.
 * This version uses a timeout to simulate the network delay without making a real fetch call.
 */
export const decodeVin = (vin: string): Promise<Omit<Vehicle, 'vin' | 'user_id'>> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (vin && vin.trim().length > 10) {
        // Simple mock logic based on VIN prefix
        if (vin.toUpperCase().startsWith('1G')) {
          resolve({ brand: 'Chevrolet', model: 'Silverado', year: 2021 });
        } else if (vin.toUpperCase().startsWith('2G')) {
           resolve({ brand: 'Pontiac', model: 'GTO', year: 2006 });
        } else if (vin.toUpperCase().startsWith('JA')) {
            resolve({ brand: 'Toyota', model: 'Camry', year: 2023 });
        } else if (vin.toUpperCase().startsWith('WBA')) {
            resolve({ brand: 'BMW', model: '3 Series', year: 2020 });
        } else {
           resolve({ brand: 'Generic Motors', model: 'Sedan', year: 2022 });
        }
      } else {
        reject(new Error('Invalid VIN provided.'));
      }
    }, 1000); // Simulate network delay
  });
};