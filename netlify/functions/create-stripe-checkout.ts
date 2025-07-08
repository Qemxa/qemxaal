import type { Handler } from "@netlify/functions";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2025-06-30.basil",
});

// IMPORTANT: Replace these placeholder IDs with your actual Stripe Price IDs
// You can find them in your Stripe Dashboard under Products > (Your Product) > Pricing
const USER_PRICE_IDS = {
  premium: 'price_YOUR_USER_PREMIUM_ID', // Price ID for User - Premium (55.00 GEL)
  platinum: 'price_YOUR_USER_PLATINUM_ID', // Price ID for User - Platinum (100.00 GEL)
};

const PARTNER_PRICE_IDS = {
  premium: 'price_YOUR_PARTNER_PREMIUM_ID', // Price ID for Partner - Premium (150.00 GEL)
  platinum: 'price_YOUR_PARTNER_PLATINUM_ID', // Price ID for Partner - Platinum (250.00 GEL)
};

const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { tierId, type, userId, profileId, email } = JSON.parse(event.body || '{}');

    if (!tierId || !type || !userId || !['user', 'partner'].includes(type)) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing required parameters.' }) };
    }
    
    if (type === 'partner' && !profileId) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Missing profileId for partner checkout.' }) };
    }

    const priceIds = type === 'user' ? USER_PRICE_IDS : PARTNER_PRICE_IDS;
    const priceId = priceIds[tierId as 'premium' | 'platinum'];

    if (!priceId || priceId.includes('YOUR_')) {
      console.error(`Stripe Price ID for tier '${tierId}' and type '${type}' is not configured.`);
      return { statusCode: 500, body: JSON.stringify({ error: 'Server payment configuration error.' }) };
    }
    
    const successUrl = event.headers.referer || 'https://your-app.com/success';
    const cancelUrl = event.headers.referer || 'https://your-app.com/cancel';

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      customer_email: email,
      success_url: successUrl,
      cancel_url: cancelUrl,
      subscription_data: {
        metadata: {
            userId,
            profileId: type === 'partner' ? profileId : '',
            type,
            tier: tierId,
        }
      },
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ url: session.url }),
    };
  } catch (error: any) {
    console.error('Stripe checkout session creation failed:', error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};

export { handler };