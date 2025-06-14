import { loadStripe } from '@stripe/stripe-js';
import { supabase } from './supabase';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

export async function createCheckoutSession(priceId: string) {
  try {
    const { data: { session } } = await supabase.functions.invoke('create-checkout-session', {
      body: { priceId },
    });

    const stripe = await stripePromise;
    if (!stripe) throw new Error('Failed to load Stripe');

    const { error } = await stripe.redirectToCheckout({
      sessionId: session.id,
    });

    if (error) throw error;
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw error;
  }
}

export async function createPortalSession() {
  try {
    const { data: { url } } = await supabase.functions.invoke('create-portal-session', {
      body: {},
    });

    window.location.href = url;
  } catch (error) {
    console.error('Error creating portal session:', error);
    throw error;
  }
}