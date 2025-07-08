import type { Handler } from "@netlify/functions";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

// --- START: Self-contained types (Updated) ---
type UserTier = 'free' | 'premium' | 'platinum';

type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

interface UserProfile {
  id: string;
  tier: UserTier;
  dailyUsage: { date: string; count: number; };
  stripe_customer_id?: string;
}

interface PartnerProfile {
  id: string;
  user_id: string;
  name: string;
  type: 'service' | 'parts';
  tier: UserTier;
  description: string;
  address?: string;
  phone?: string;
  products: any[]; // simplified for webhook
  services: any[]; // simplified for webhook
  stripe_customer_id?: string;
}

interface Vehicle {
    vin: string;
    brand: string;
    model: string;
    year: number;
    user_id: string;
}

interface Chat {
    vin: string;
    user_id: string;
    messages: any[]; // simplified for webhook
    serviceHistory: any[]; // simplified for webhook
}

// DB-specific types for Supabase client (explicit interfaces)
interface DbUserProfile {
    id: string;
    tier: UserTier;
    dailyUsage: any; // Using `any` to avoid TS type instantiation depth error with Supabase generics
    stripe_customer_id?: string;
}
interface DbPartnerProfile {
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
interface DbChat {
    vin: string;
    user_id: string;
    messages: any; // Using `any` to avoid TS type instantiation depth error
    serviceHistory: any; // Using `any` to avoid TS type instantiation depth error
}


interface Database {
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
// --- END: Self-contained types ---


// Initialize Supabase Admin Client
// This uses a service role key to bypass RLS for backend operations.
const supabaseAdmin = createClient<Database>(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2025-06-30.basil",
});

const handler: Handler = async (event) => {
  const sig = event.headers['stripe-signature'] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET as string;

  if (!sig || !webhookSecret) {
    console.error("Stripe signature or webhook secret is not configured.");
    return { statusCode: 400, body: "Webhook secret not configured." };
  }
  
  let stripeEvent: Stripe.Event;
  
  try {
    stripeEvent = stripe.webhooks.constructEvent(event.body!, sig, webhookSecret);
  } catch (err: any) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return { statusCode: 400, body: `Webhook Error: ${err.message}` };
  }

  // Handle the event
  switch (stripeEvent.type) {
    case 'checkout.session.completed': {
      const session = stripeEvent.data.object as Stripe.Checkout.Session;
      
      // The subscription is sometimes delayed, so we retrieve it directly
      if (typeof session.subscription !== 'string') {
          console.error('Subscription ID not found in checkout session.');
          return { statusCode: 400, body: 'Subscription ID missing.' };
      }
      const subscription = await stripe.subscriptions.retrieve(session.subscription);
      
      const { userId, profileId, type, tier } = subscription.metadata;
      const customerId = session.customer as string;

      if (!userId || !type || !tier) {
          console.error("Webhook metadata is missing required fields.", subscription.metadata);
          return { statusCode: 400, body: "Webhook metadata missing." };
      }

      console.log(`Processing successful checkout for userId: ${userId}, type: ${type}, tier: ${tier}`);

      if (type === 'user') {
          const { error } = await supabaseAdmin
              .from('profiles')
              .update({ tier: tier as UserTier, stripe_customer_id: customerId })
              .eq('id', userId);
          if (error) {
              console.error(`Failed to update user profile for ${userId}:`, error);
              return { statusCode: 500, body: `Supabase Error: ${error.message}` };
          }
      } else if (type === 'partner') {
          const { error } = await supabaseAdmin
              .from('partner_profiles')
              .update({ tier: tier as UserTier, stripe_customer_id: customerId })
              .eq('id', profileId);
          if (error) {
              console.error(`Failed to update partner profile for ${profileId}:`, error);
              return { statusCode: 500, body: `Supabase Error: ${error.message}` };
          }
      }
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = stripeEvent.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;
      const { type } = subscription.metadata;

      console.log(`Processing subscription deletion for customerId: ${customerId}`);
      
      if(type === 'user') {
          const { error } = await supabaseAdmin
              .from('profiles')
              .update({ tier: 'free' })
              .eq('stripe_customer_id', customerId);
          if (error) {
              console.error(`Failed to downgrade user profile for customer ${customerId}:`, error);
          }
      } else if (type === 'partner') {
          const { error } = await supabaseAdmin
              .from('partner_profiles')
              .update({ tier: 'free' })
              .eq('stripe_customer_id', customerId);
          if (error) {
              console.error(`Failed to downgrade partner profile for customer ${customerId}:`, error);
          }
      }
      break;
    }

    default:
      console.log(`Unhandled event type ${stripeEvent.type}`);
  }

  return { statusCode: 200, body: JSON.stringify({ received: true }) };
};

export { handler };