import Stripe from 'stripe';
import { supabase } from '../config/supabase.js';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing Stripe secret key');
}

if (!process.env.STRIPE_WEBHOOK_SECRET) {
  throw new Error('Missing Stripe webhook secret');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16'
});

export class SubscriptionService {
  async getCurrentSubscription(userId: string) {
    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) throw error;
    return subscription;
  }

  async createCheckoutSession(userId: string, priceId: string) {
    // Get user data
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('email')
      .eq('id', userId)
      .single();

    if (userError) throw userError;

    // Get or create Stripe customer
    const { data: subscription, error: subscriptionError } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .maybeSingle();

    if (subscriptionError) throw subscriptionError;

    let customerId = subscription?.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          supabase_user_id: userId
        }
      });
      customerId = customer.id;
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price: priceId,
          quantity: 1
        }
      ],
      mode: 'subscription',
      success_url: `${process.env.CLIENT_URL}/dashboard?success=true`,
      cancel_url: `${process.env.CLIENT_URL}/dashboard?canceled=true`,
      metadata: {
        user_id: userId
      }
    });

    return session;
  }

  async createPortalSession(userId: string) {
    // Get customer ID
    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .single();

    if (error) throw error;
    if (!subscription?.stripe_customer_id) {
      throw new Error('No Stripe customer found');
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: subscription.stripe_customer_id,
      return_url: `${process.env.CLIENT_URL}/dashboard`
    });

    return { url: portalSession.url };
  }

  async handleWebhook(payload: any, sig: string) {
    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        payload,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
    } catch (err) {
      throw new Error(`Webhook Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }

    // Handle the event
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        const subscription = event.data.object as Stripe.Subscription;
        await this.handleSubscriptionChange(subscription);
        break;

      case 'customer.subscription.deleted':
        const deletedSubscription = event.data.object as Stripe.Subscription;
        await this.handleSubscriptionDeletion(deletedSubscription);
        break;

      default:
        console.log(`Unhandled event type ${event.type}`);
    }
  }

  private async handleSubscriptionChange(subscription: Stripe.Subscription) {
    const customerId = subscription.customer as string;
    
    // Get user ID from customer metadata
    const customer: any = await stripe.customers.retrieve(customerId);
    const userId = customer.metadata.supabase_user_id;

    if (!userId) {
      throw new Error('No user ID found in customer metadata');
    }

    // Update subscription in database
    const { error } = await supabase
      .from('subscriptions')
      .upsert({
        user_id: userId,
        stripe_customer_id: customerId,
        stripe_subscription_id: subscription.id,
        status: subscription.status,
        plan_id: subscription.items.data[0].price.id,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        cancel_at: subscription.cancel_at ? new Date(subscription.cancel_at * 1000).toISOString() : null,
        canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null
      });

    if (error) throw error;
  }

  private async handleSubscriptionDeletion(subscription: Stripe.Subscription) {
    const customerId = subscription.customer as string;
    
    // Get user ID from customer metadata
    const customer: any = await stripe.customers.retrieve(customerId);
    const userId = customer.metadata.supabase_user_id;

    if (!userId) {
      throw new Error('No user ID found in customer metadata');
    }

    // Update subscription status in database
    const { error } = await supabase
      .from('subscriptions')
      .update({
        status: 'canceled',
        canceled_at: new Date().toISOString()
      })
      .eq('stripe_subscription_id', subscription.id);

    if (error) throw error;
  }
}