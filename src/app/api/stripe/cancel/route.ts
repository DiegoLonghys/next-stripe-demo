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

    // Get user's active subscription
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    if (!subscription?.stripe_subscription_id) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 404 }
      )
    }

    // Cancel at period end (not immediately)
    const canceledSubscription = await stripe.subscriptions.update(
      subscription.stripe_subscription_id,
      {
        cancel_at_period_end: true,
        metadata: {
          canceledBy: user.id,
          canceledAt: new Date().toISOString()
        }
      }
    )

    // Update subscription in database
    const { error } = await supabase
      .from('subscriptions')
      .update({
        auto_renew: false,
        canceled_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', subscription.id)

    if (error) throw error

    return NextResponse.json({ 
      success: true,
      message: 'Subscription will be canceled at period end'
    })

  } catch (error) {
    console.error('Stripe cancel error:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}