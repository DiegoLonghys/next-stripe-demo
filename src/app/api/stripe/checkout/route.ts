import { stripe } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { planId, interval } = await req.json()
    
    // Get plan details from database
    const { data: plan } = await supabase
      .from('plans')
      .select('*')
      .eq('id', planId)
      .single()
    
    // If it's the free plan, just update database directly
    if (plan.price_monthly === 0) {
      // End current subscription
      await supabase
        .from('subscriptions')
        .update({ status: 'expired', end_date: new Date().toISOString() })
        .eq('user_id', user.id)
        .eq('status', 'active')
      
      // Create new free subscription
      await supabase
        .from('subscriptions')
        .insert({
          user_id: user.id,
          plan_id: 'free',
          status: 'active',
          billing_interval: 'monthly',
          start_date: new Date().toISOString(),
          auto_renew: true
        })
      
      return NextResponse.json({ url: '/dashboard?upgraded=free' })
    }
    
    // For paid plans, proceed with Stripe checkout
    const priceId = interval === 'monthly' 
      ? plan.stripe_price_id_monthly 
      : plan.stripe_price_id_yearly
    
    // Get or create Stripe customer
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single()
    
    let customerId = profile?.stripe_customer_id
    
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { userId: user.id }
      })
      customerId = customer.id
      
      await supabase
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id)
    }
    
    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?canceled=true`,
      subscription_data: {
        metadata: {
          userId: user.id,
          planId: planId,
          interval: interval
        }
      },
      allow_promotion_codes: true,
      client_reference_id: user.id,
    })
    
    return NextResponse.json({ url: session.url })
    
  } catch (error) {
    console.error('Checkout error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}