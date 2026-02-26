import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(req: Request) {
  try {
    const body = await req.text()
    const signature = req.headers.get('stripe-signature')!

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err) {
      console.error(`Webhook signature verification failed:`, err)
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      )
    }

    const supabase = createClient()

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        await handleCheckoutCompleted(session, supabase)
        break
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice
        await handleInvoicePaid(invoice, supabase)
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        await handlePaymentFailed(invoice, supabase)
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionUpdated(subscription, supabase)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionDeleted(subscription, supabase)
        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}

// Handle successful checkout
async function handleCheckoutCompleted(session: Stripe.Checkout.Session, supabase: any) {
  const userId = session.metadata?.userId
  const planId = session.metadata?.planId
  const interval = session.metadata?.interval
  
  const subscription: any = await stripe.subscriptions.retrieve(session.subscription as string)
  
  // End current subscription
  await supabase
    .from('subscriptions')
    .update({ status: 'expired', end_date: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('status', 'active')
  
  // Create new paid subscription
  await supabase.from('subscriptions').insert({
    user_id: userId,
    plan_id: planId,
    status: 'active',
    billing_interval: interval,
    start_date: new Date(subscription.current_period_start * 1000).toISOString(),
    end_date: new Date(subscription.current_period_end * 1000).toISOString(),
    stripe_subscription_id: subscription.id,
    stripe_customer_id: session.customer,
    stripe_price_id: subscription.items.data[0].price.id,
    auto_renew: true,
    next_billing_date: new Date(subscription.current_period_end * 1000).toISOString()
  })
}

// Handle successful invoice payment
async function handleInvoicePaid(invoice: Stripe.Invoice | any, supabase: any) {
  const subscriptionId = invoice.subscription as string
  const customerId = invoice.customer as string

  // Get subscription details
  const subscription: any = await stripe.subscriptions.retrieve(subscriptionId)

  // Update subscription in database
  await supabase
    .from('subscriptions')
    .update({
      status: 'active',
      last_payment_date: new Date().toISOString(),
      next_billing_date: new Date(subscription.current_period_end * 1000).toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('stripe_subscription_id', subscriptionId)

  // Create invoice record
  await supabase.from('invoices').insert({
    user_id: subscription.metadata.userId,
    subscription_id: subscriptionId,
    stripe_invoice_id: invoice.id,
    amount: invoice.amount_paid / 100,
    currency: invoice.currency,
    status: 'paid',
    billing_reason: invoice.billing_reason,
    invoice_pdf: invoice.invoice_pdf,
    period_start: new Date(invoice.period_start * 1000).toISOString(),
    period_end: new Date(invoice.period_end * 1000).toISOString(),
    paid_at: new Date().toISOString(),
    created_at: new Date().toISOString()
  })
}

// Handle payment failure
async function handlePaymentFailed(invoice: Stripe.Invoice | any, supabase: any) {
  const subscriptionId = invoice.subscription as string

  await supabase
    .from('subscriptions')
    .update({
      status: 'past_due',
      updated_at: new Date().toISOString()
    })
    .eq('stripe_subscription_id', subscriptionId)
}

// Handle subscription updates
async function handleSubscriptionUpdated(subscription: Stripe.Subscription | any, supabase: any) {
  const status = subscription.status === 'active' ? 'active' :
                 subscription.status === 'past_due' ? 'past_due' :
                 subscription.status === 'canceled' ? 'canceled' : 
                 subscription.status === 'trialing' ? 'trialing' : 'expired'

  const priceId = subscription.items.data[0].price.id
  const planId = getPlanIdFromPrice(priceId)

  await supabase
    .from('subscriptions')
    .update({
      status: status,
      plan_id: planId,
      end_date: new Date(subscription.current_period_end * 1000).toISOString(),
      next_billing_date: new Date(subscription.current_period_end * 1000).toISOString(),
      auto_renew: !subscription.cancel_at_period_end,
      updated_at: new Date().toISOString()
    })
    .eq('stripe_subscription_id', subscription.id)
}

// Handle subscription deletion/cancellation
async function handleSubscriptionDeleted(subscription: Stripe.Subscription, supabase: any) {
  // Mark old subscription as expired
  await supabase
    .from('subscriptions')
    .update({ status: 'expired', end_date: new Date().toISOString() })
    .eq('stripe_subscription_id', subscription.id)
  
  // Create new free subscription
  await supabase.from('subscriptions').insert({
    user_id: subscription.metadata.userId,
    plan_id: 'free',
    status: 'active',
    billing_interval: 'monthly',
    start_date: new Date().toISOString(),
    auto_renew: true
  })
}

// Helper function to map Stripe price IDs to your plan IDs
function getPlanIdFromPrice(priceId: string): string {
  const priceMap: Record<string, string> = {
    [process.env.STRIPE_PRICE_STARTER_MONTHLY!]: 'starter',
    [process.env.STRIPE_PRICE_STARTER_YEARLY!]: 'starter',
    [process.env.STRIPE_PRICE_PRO_MONTHLY!]: 'pro',
    [process.env.STRIPE_PRICE_PRO_YEARLY!]: 'pro',
    [process.env.STRIPE_PRICE_BUSINESS_MONTHLY!]: 'business',
    [process.env.STRIPE_PRICE_BUSINESS_YEARLY!]: 'business',
  }

  return priceMap[priceId] || 'free'
}