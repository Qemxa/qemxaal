import { createClient } from '@supabase/supabase-js';
import { Vehicle, Chat, UserProfile, PartnerProfile, Database, DbChat, DbPartnerProfile, DbUserProfile } from '../types';
import { toast } from 'react-hot-toast';

// --- IMPORTANT ---
// Replace these placeholder values with your actual Supabase Project URL and Anon Key.
// It is highly recommended to use environment variables for this in a real project,
// but for this setup, you can replace them directly here.
// You can get these from your Supabase project's "Project Settings" > "API" section.
const supabaseUrl = 'https://ydygjkodmvxybkchlzzl.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlkeWdqa29kbXZ4eWJrY2hsenpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE5NTU2NTcsImV4cCI6MjA2NzUzMTY1N30.EHBZp1x5lCpkzoMbdNvMH5puprqqWbkD1gn3uxkr9AY';

let supabaseInstance: ReturnType<typeof createClient<Database>> | null = null;

// This check ensures that the app shows the configuration screen if placeholders are not replaced.
if (supabaseUrl.startsWith('YOUR_') || supabaseAnonKey.startsWith('YOUR_')) {
    console.warn("Supabase credentials are placeholders. Please update them in services/supabaseService.ts");
} else {
    try {
        supabaseInstance = createClient<Database>(supabaseUrl, supabaseAnonKey);
    } catch (error) {
        console.error("Failed to initialize Supabase client. Please check if the URL is valid.", error);
    }
}

export const supabase = supabaseInstance;


const handleError = (error: any, context: string) => {
    console.error(`Supabase error in ${context}:`, error);
    toast.error(`Error in ${context}: ${error.message}`);
    return null;
}

// --- User Profile ---
export const getUserProfile = async (userId: string): Promise<UserProfile> => {
    const defaultProfile: UserProfile = {
        id: userId,
        tier: 'free',
        dailyUsage: { date: new Date().toISOString().split('T')[0], count: 0 },
        stripe_customer_id: undefined
    };
    if (!supabase) {
        console.error("Supabase client not initialized. Returning temporary default profile.");
        return defaultProfile;
    }

    // 1. Try to fetch the profile
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
    
    // 2. If profile exists, return it
    if (data) {
        return data as UserProfile;
    }

    // 3. If profile doesn't exist, log any unexpected errors from the fetch attempt
    if (error && error.code !== 'PGRST116') { // PGRST116: single() found no rows
        handleError(error, 'getting user profile');
        // Fall through to attempt creation anyway, but log the weird state.
    }
    
    // 4. Create the profile since it doesn't exist
    console.log(`Profile not found for user ${userId}. Attempting to create one.`);
    const { data: newProfile, error: insertError } = await supabase
        .from('profiles')
        .insert(defaultProfile)
        .select()
        .single();
    
    // 5. Handle creation result
    if (insertError) {
        // This can happen if the RLS policies are wrong.
        handleError(insertError, 'creating default profile');
        // CRITICAL: Return the safe default object to prevent a crash.
        return defaultProfile;
    }
    
    // Creation was successful
    return newProfile as UserProfile;
};

export const updateUserProfile = async (userId: string, profileUpdate: Partial<UserProfile>): Promise<UserProfile | null> => {
    if (!supabase) return null;
    const { data, error } = await supabase
        .from('profiles')
        .update(profileUpdate) // Cast to Partial<DbUserProfile> for update
        .eq('id', userId)
        .select()
        .single();
    if(error) return handleError(error, 'updating profile');
    toast.success("პროფილი განახლდა");
    return data as UserProfile | null;
}

// --- Vehicles ---
export const getVehicles = async (userId: string): Promise<Vehicle[]> => {
    if (!supabase) return [];
    const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('user_id', userId);
    
    if (error) handleError(error, 'fetching vehicles');
    return data || [];
};

export const addVehicle = async (vehicle: Vehicle): Promise<Vehicle | null> => {
    if (!supabase) return null;
    const { data, error } = await supabase
        .from('vehicles')
        .insert(vehicle)
        .select()
        .single();
    if (error) return handleError(error, 'adding vehicle');
    toast.success(`${vehicle.brand} ${vehicle.model} დაემატა!`);
    return data;
};

export const updateVehicle = async (vehicle: Vehicle): Promise<boolean> => {
    if (!supabase) return false;
    const { error } = await supabase
        .from('vehicles')
        .update(vehicle)
        .eq('vin', vehicle.vin)
        .eq('user_id', vehicle.user_id);
    if(error) {
        handleError(error, 'updating vehicle');
        return false;
    }
    toast.success('მანქანის მონაცემები განახლდა.');
    return true;
};

export const deleteVehicle = async (vin: string, userId: string): Promise<boolean> => {
    if (!supabase) return false;
    const { error } = await supabase
        .from('vehicles')
        .delete()
        .eq('vin', vin)
        .eq('user_id', userId);
    if (error) {
        handleError(error, 'deleting vehicle');
        return false;
    }
    // Associated chat will be deleted via cascade in DB
    return true;
};


// --- Chats ---
export const getChat = async (vin: string, userId: string): Promise<Chat | null> => {
    if (!supabase) return null;
    const { data, error } = await supabase
        .from('chats')
        .select('*')
        .eq('vin', vin)
        .eq('user_id', userId)
        .single();

    if (error && error.code !== 'PGRST116') {
        handleError(error, 'fetching chat');
    }
    return data as Chat | null;
};

export const saveChat = async (chat: Chat): Promise<Chat | null> => {
    if (!supabase) return null;
    const { data, error } = await supabase
        .from('chats')
        .upsert(chat) // Cast to DbChat for upsert
        .select()
        .single();
    if (error) return handleError(error, 'saving chat');
    return data as Chat | null;
};

// --- Partner Profiles ---
export const getPartnerProfiles = async (userId: string): Promise<PartnerProfile[]> => {
    if (!supabase) return [];
    const { data, error } = await supabase
        .from('partner_profiles')
        .select('*')
        .eq('user_id', userId);
    
    if (error) handleError(error, 'fetching partner profiles');
    return (data as PartnerProfile[]) || [];
};

export const savePartnerProfile = async (profile: PartnerProfile): Promise<PartnerProfile | null> => {
    if (!supabase) return null;
    const { data, error } = await supabase
        .from('partner_profiles')
        .upsert(profile) // Cast to DbPartnerProfile for upsert
        .select()
        .single();
    if(error) return handleError(error, 'saving partner profile');
    return data as PartnerProfile | null;
}

export const deletePartnerProfile = async (profileId: string, userId: string): Promise<boolean> => {
    if (!supabase) return false;
    const { error } = await supabase
        .from('partner_profiles')
        .delete()
        .eq('id', profileId)
        .eq('user_id', userId);
    if (error) {
        handleError(error, 'deleting partner profile');
        return false;
    }
    return true;
};