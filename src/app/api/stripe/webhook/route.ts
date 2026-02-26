import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'

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

    console.log(`Webhook received: ${event.type}`)
    
    // Log the full event data for debugging
    if (event.type === 'invoice.paid' || event.type === 'invoice.payment_succeeded') {
      const invoice = event.data.object as Stripe.Invoice
      console.log('Invoice details:', {
        id: invoice.id,
        subscription: invoice.parent?.type, // This might be null
        parent: invoice.parent, // Check this structure
        lines: invoice.lines?.data[0] // Check line items
      })
    }

    const supabase = await createClient()

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        await handleCheckoutCompleted(session, supabase)
        break
      }

      case 'invoice.paid':
      case 'invoice.payment_succeeded': {
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
    return NextResponse.json({ 
      received: true, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    })
  }
}

async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session, 
  supabase: any
) {
  try {
    const userId = session.client_reference_id || session.metadata?.userId
    const planId = session.metadata?.planId
    const interval = session.metadata?.interval

    if (!userId || !planId || !interval) {
      console.error('Missing metadata in session:', { 
        sessionId: session.id, 
        client_reference_id: session.client_reference_id,
        metadata: session.metadata 
      })
      return
    }

    if (!session.subscription) {
      console.error('No subscription ID in session:', session.id)
      return
    }

    // Check if subscription already exists in database
    const { data: existingSub } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('stripe_subscription_id', session.subscription)
      .maybeSingle()

    if (existingSub) {
      console.log('Subscription already exists in DB, skipping insert')
      return
    }

    // Get subscription details from Stripe
    const subscription: Stripe.Subscription = await stripe.subscriptions.retrieve(
      session.subscription as string
    )
    
    // Safe date handling
    const startDate = subscription.items.data[0].current_period_start
      ? new Date(subscription.items.data[0].current_period_end * 1000) 
      : new Date()
    
    const endDate = subscription.items.data[0].current_period_end 
      ? new Date(subscription.items.data[0].current_period_end * 1000) 
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

    // Validate dates
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      console.error('Invalid dates from Stripe:', {
        current_period_start: subscription.items.data[0].current_period_start,
        current_period_end: subscription.items.data[0].current_period_end
      })
      return
    }

    // End current subscription if exists
    await supabase
      .from('subscriptions')
      .update({ 
        status: 'expired', 
        end_date: new Date().toISOString() 
      })
      .eq('user_id', userId)
      .eq('status', 'active')

    // Create new subscription
    const { error: insertError } = await supabase
      .from('subscriptions')
      .insert({
        user_id: userId,
        plan_id: planId,
        status: 'active',
        billing_interval: interval,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        stripe_subscription_id: session.subscription,
        stripe_customer_id: session.customer,
        stripe_price_id: subscription.items?.data[0]?.price?.id,
        auto_renew: true,
        next_billing_date: endDate.toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

    if (insertError) {
      console.error('Error inserting subscription:', insertError)
      return
    }

    console.log('Subscription created successfully for user:', userId)

    // Update profile with customer ID if not exists
    if (session.customer) {
      await supabase
        .from('profiles')
        .update({ stripe_customer_id: session.customer as string })
        .eq('id', userId)
    }

  } catch (error) {
    console.error('Error in handleCheckoutCompleted:', error)
  }
}

async function handleInvoicePaid(
  invoice: Stripe.Invoice, 
  supabase: any
) {
  try {
    let subscriptionId = invoice.parent!.subscription_details?.subscription as string

    if (!subscriptionId) {
      console.log('Could not find subscription ID in invoice:', invoice.id)
      console.log('Invoice structure:', JSON.stringify(invoice, null, 2))
      return
    }

    console.log('Found subscription ID:', subscriptionId)

    // Check if subscription exists in database
    const { data: existingSub } = await supabase
      .from('subscriptions')
      .select('id, user_id')
      .eq('stripe_subscription_id', subscriptionId)
      .maybeSingle()

    if (!existingSub) {
      console.log('Subscription not found in DB, fetching from Stripe...')
      
      // Try to get subscription from Stripe
      try {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId)
        const userId = subscription.metadata?.userId
        
        if (userId) {
          // Create the subscription record
          const { error: insertError } = await supabase
            .from('subscriptions')
            .insert({
              user_id: userId,
              plan_id: subscription.metadata?.planId || 'starter',
              status: subscription.status,
              billing_interval: subscription.metadata?.interval || 'monthly',
              start_date: new Date(subscription.items.data[0].current_period_start * 1000).toISOString(),
              end_date: new Date(subscription.items.data[0].current_period_end * 1000).toISOString(),
              stripe_subscription_id: subscriptionId,
              stripe_customer_id: invoice.customer,
              stripe_price_id: subscription.items?.data[0]?.price?.id,
              auto_renew: !subscription.cancel_at_period_end,
              next_billing_date: new Date(subscription.items.data[0].current_period_end * 1000).toISOString(),
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })

          if (insertError) {
            console.error('Error creating missing subscription:', insertError)
            return
          }

          console.log('Created missing subscription from invoice webhook')
          
          // Update profile with customer ID
          if (invoice.customer) {
            await supabase
              .from('profiles')
              .update({ stripe_customer_id: invoice.customer as string })
              .eq('id', userId)
          }
        }
      } catch (stripeError) {
        console.error('Could not retrieve subscription from Stripe:', stripeError)
      }
      return
    }

    // Update subscription in database
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({
        status: 'active',
        last_payment_date: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('stripe_subscription_id', subscriptionId)

    if (updateError) {
      console.error('Error updating subscription:', updateError)
      return
    }

    // Store invoice record
    const { error: invoiceError } = await supabase
      .from('invoices')
      .insert({
        user_id: existingSub.user_id,
        subscription_id: existingSub.id,
        stripe_invoice_id: invoice.id,
        amount: invoice.amount_paid / 100,
        currency: invoice.currency,
        status: invoice.status,
        billing_reason: invoice.billing_reason,
        invoice_pdf: invoice.invoice_pdf,
        period_start: invoice.period_start 
          ? new Date(invoice.period_start * 1000).toISOString() 
          : null,
        period_end: invoice.period_end 
          ? new Date(invoice.period_end * 1000).toISOString() 
          : null,
        paid_at: invoice.status === 'paid' ? new Date().toISOString() : null,
        created_at: new Date().toISOString()
      })

    if (invoiceError) {
      console.error('Error inserting invoice:', invoiceError)
    } else {
      console.log('Invoice processed successfully:', invoice.id)
    }

  } catch (error) {
    console.error('Error in handleInvoicePaid:', error)
  }
}

async function handlePaymentFailed(
  invoice: Stripe.Invoice, 
  supabase: any
) {
  try {
    let subscriptionId = invoice.parent!.subscription_details?.subscription as string

    if (!subscriptionId) {
      console.log('No subscription ID found in payment failed invoice:', invoice.id)
      return
    }

    const { error } = await supabase
      .from('subscriptions')
      .update({
        status: 'past_due',
        updated_at: new Date().toISOString()
      })
      .eq('stripe_subscription_id', subscriptionId)

    if (error) {
      console.error('Error updating subscription payment status:', error)
    } else {
      console.log('Payment failed for subscription:', subscriptionId)
    }

  } catch (error) {
    console.error('Error in handlePaymentFailed:', error)
  }
}

async function handleSubscriptionUpdated(
  subscription: Stripe.Subscription, 
  supabase: any
) {
  try {
    const status = subscription.status

    const priceId = subscription.items?.data[0]?.price?.id

    // Check if subscription exists
    const { data: existingSub } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('stripe_subscription_id', subscription.id)
      .maybeSingle()

    if (!existingSub) {
      console.log('Subscription not found in DB during update, creating...')
      
      // Create the subscription if it doesn't exist
      const { error: insertError } = await supabase
        .from('subscriptions')
        .insert({
          user_id: subscription.metadata?.userId,
          plan_id: subscription.metadata?.planId || 'starter',
          status: status,
          billing_interval: subscription.metadata?.interval || 'monthly',
          start_date: new Date(subscription.items.data[0].current_period_start * 1000).toISOString(),
          end_date: new Date(subscription.items.data[0].current_period_end * 1000).toISOString(),
          stripe_subscription_id: subscription.id,
          stripe_customer_id: subscription.customer,
          stripe_price_id: priceId,
          auto_renew: !subscription.cancel_at_period_end,
          next_billing_date: new Date(subscription.items.data[0].current_period_end * 1000).toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })

      if (insertError) {
        console.error('Error creating missing subscription:', insertError)
      } else {
        console.log('Created missing subscription from update webhook')
      }
      return
    }

    const { error } = await supabase
      .from('subscriptions')
      .update({
        status: status,
        end_date: subscription.items.data[0].current_period_end 
          ? new Date(subscription.items.data[0].current_period_end * 1000).toISOString() 
          : null,
        next_billing_date: subscription.items.data[0].current_period_end 
          ? new Date(subscription.items.data[0].current_period_end * 1000).toISOString() 
          : null,
        auto_renew: !subscription.cancel_at_period_end,
        stripe_price_id: priceId,
        updated_at: new Date().toISOString()
      })
      .eq('stripe_subscription_id', subscription.id)

    if (error) {
      console.error('Error updating subscription:', error)
    } else {
      console.log('Subscription updated:', subscription.id)
    }

  } catch (error) {
    console.error('Error in handleSubscriptionUpdated:', error)
  }
}

async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription, 
  supabase: any
) {
  try {
    // Check if subscription exists
    const { data: existingSub } = await supabase
      .from('subscriptions')
      .select('id, user_id')
      .eq('stripe_subscription_id', subscription.id)
      .maybeSingle()

    if (existingSub) {
      // Mark old subscription as expired
      const { error } = await supabase
        .from('subscriptions')
        .update({ 
          status: 'expired', 
          end_date: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('stripe_subscription_id', subscription.id)

      if (error) {
        console.error('Error updating subscription status:', error)
      } else {
        console.log('Subscription marked as expired:', subscription.id)
      }
    }

    // Check if user already has a free subscription
    const userId = existingSub?.user_id || subscription.metadata?.userId
    
    if (userId) {
      const { data: freeSub } = await supabase
        .from('subscriptions')
        .select('id')
        .eq('user_id', userId)
        .eq('plan_id', 'free')
        .eq('status', 'active')
        .maybeSingle()

      if (!freeSub) {
        // Create new free subscription
        const { error: insertError } = await supabase
          .from('subscriptions')
          .insert({
            user_id: userId,
            plan_id: 'free',
            status: 'active',
            billing_interval: 'monthly',
            start_date: new Date().toISOString(),
            auto_renew: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })

        if (insertError) {
          console.error('Error creating free subscription:', insertError)
        } else {
          console.log('Free plan assigned to user:', userId)
        }
      }
    }

  } catch (error) {
    console.error('Error in handleSubscriptionDeleted:', error)
  }
}