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

    const { planId, interval, currentPlanId, subscriptionId } = await req.json()

    // Get user profile for customer info
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    // Map plan IDs to Stripe price IDs
    const priceMap: Record<string, Record<string, string>> = {
      starter: {
        monthly: process.env.STRIPE_PRICE_STARTER_MONTHLY!,
        yearly: process.env.STRIPE_PRICE_STARTER_YEARLY!
      },
      pro: {
        monthly: process.env.STRIPE_PRICE_PRO_MONTHLY!,
        yearly: process.env.STRIPE_PRICE_PRO_YEARLY!
      },
      business: {
        monthly: process.env.STRIPE_PRICE_BUSINESS_MONTHLY!,
        yearly: process.env.STRIPE_PRICE_BUSINESS_YEARLY!
      }
    }

    // Get or create Stripe customer
    let customerId = profile?.stripe_customer_id

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: profile?.full_name,
        metadata: {
          userId: user.id
        }
      })
      customerId = customer.id

      // Save customer ID to profile
      await supabase
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id)
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price: priceMap[planId][interval],
          quantity: 1,
        },
      ],
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
    console.error('Stripe checkout error:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}