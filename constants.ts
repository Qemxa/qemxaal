import { UserTier } from './types';

interface TierConfig {
  vehicleLimit: number;
  queryLimit: number;
  queryCharLimit: number;
  features: string[];
}

export const TIER_LIMITS: Record<UserTier, TierConfig> = {
  free: {
    vehicleLimit: 1,
    queryLimit: 5,
    queryCharLimit: 250,
    features: ["1 მანქანის დამატება", "5 შეტყობინება დღეში", "250 სიმბოლოს ლიმიტი"],
  },
  premium: {
    vehicleLimit: 10,
    queryLimit: 25,
    queryCharLimit: 500,
    features: ["10 მანქანის დამატება", "25 შეტყობინება დღეში", "500 სიმბოლოს ლიმიტი"],
  },
  platinum: {
    vehicleLimit: 50,
    queryLimit: 150,
    queryCharLimit: 700,
    features: ["50 მანქანის დამატება", "150 შეტყობინება დღეში", "დიაგნოზი სურათით", "სერვისის ისტორია", "700 სიმბოლოს ლიმიტი"],
  },
};


export const PARTNER_TIER_LIMITS: Record<UserTier, { listingLimit: number; features: string[] }> = {
  free: {
    listingLimit: 15,
    features: ["15 პროდუქტის/სერვისის დამატება", "საბაზისო პროფილი", "ანალიტიკა (მალე)"],
  },
  premium: {
    listingLimit: 50,
    features: ["50 პროდუქტის/სერვისის დამატება", "გამორჩეული პროფილი", "AI რეკომენდაციებში მოხვედრა"],
  },
  platinum: {
    listingLimit: 150,
    features: ["150 პროდუქტის/სერვისის დამატება", "პრიორიტეტი AI რეკომენდაციებში", "სარეკლამო კამპანიები (მალე)"],
  },
};
