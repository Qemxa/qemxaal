import { User as SupabaseUser } from '@supabase/supabase-js';

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Vehicle {
  vin: string;
  brand: string;
  model: string;
  year: number;
  user_id: string;
}

export enum MessageRole {
  USER = "user",
  AI = "ai"
}

export interface GroundingSource {
  uri: string;
  title: string;
}

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  imageUrl?: string; 
  createdAt: string;
  groundingSources?: GroundingSource[];
}

export interface ServiceRecord {
  id: string;
  date: string; // YYYY-MM-DD
  mileage: number;
  serviceType: string;
  notes?: string;
  cost?: number;
}

export interface Chat {
  vin: string;
  user_id: string;
  messages: Message[];
  serviceHistory: ServiceRecord[];
}

export type UserTier = 'free' | 'premium' | 'platinum';

// This extends the Supabase user object with our custom profile data
export type User = SupabaseUser & {
  profile: UserProfile;
};

export interface UserProfile {
  id: string; // This will be the same as the Supabase user ID
  tier: UserTier;
  dailyUsage: {
    date: string; // YYYY-MM-DD
    count: number;
  };
  stripe_customer_id?: string;
}


// B2B Partner Portal Types
export interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  imageUrl?: string;
  oemNumber: string;
  condition: 'new' | 'used';
  compatibleModels: string; 
  crossReferenceCodes: string;
}

export interface ListedService {
  id: string;
  name: string;
  description: string;
  estimatedPrice?: string;
}

export interface PartnerProfile {
  id: string;
  user_id: string;
  name: string;
  type: 'service' | 'parts';
  tier: UserTier;
  description: string;
  address?: string;
  phone?: string;
  products: Product[];
  services: ListedService[];
  stripe_customer_id?: string;
}

// DB-specific types for Supabase client
// These interfaces are defined explicitly to avoid "Type instantiation is excessively deep" errors with Omit.
export interface DbUserProfile {
    id: string;
    tier: UserTier;
    dailyUsage: any; // Using `any` to avoid TS type instantiation depth error with Supabase generics
    stripe_customer_id?: string;
}
export interface DbChat {
    vin: string;
    user_id: string;
    messages: any; // Using `any` to avoid TS type instantiation depth error
    serviceHistory: any; // Using `any` to avoid TS type instantiation depth error
}
export interface DbPartnerProfile {
    id: string;
    user_id: string;
    name: string;
    type: 'service' | 'parts';
    tier: UserTier;
    description: string;
    address?: string;
    phone?: string;
    products: any; // Using `any` to avoid TS type instantiation depth error
    services: any; // Using `any` to avoid TS type instantiation depth error
    stripe_customer_id?: string;
}

// --- Database Schema for Strong Typing ---
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: DbUserProfile; 
        Insert: DbUserProfile;
        Update: Partial<DbUserProfile>;
      };
      vehicles: {
        Row: Vehicle;
        Insert: Vehicle;
        Update: Partial<Vehicle>;
      };
      chats: {
        Row: DbChat;
        Insert: DbChat;
        Update: Partial<DbChat>;
      };
      partner_profiles: {
        Row: DbPartnerProfile;
        Insert: DbPartnerProfile;
        Update: Partial<DbPartnerProfile>;
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
  };
}