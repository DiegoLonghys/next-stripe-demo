'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Plan {
  id: string
  name: string
  price_monthly: number
  price_yearly: number
  plan_limits: {
    max_events: number
    max_attendees_per_event: number
    max_team_members: number
    allow_qr_codes: boolean
    allow_custom_branding: boolean
    allow_api_access: boolean
    allow_advanced_analytics: boolean
    allow_export_data: boolean
    allow_payment_integration: boolean
    allow_team_collaboration: boolean
    support_level: string
  }
}

interface Subscription {
  id: string
  plan_id: string
  status: string
  billing_interval: 'monthly' | 'yearly'
  start_date: string
  end_date: string | null
  trial_end: string | null
  auto_renew: boolean
  next_billing_date: string | null
  discount_code: string | null
  discount_percent: number
}

export default function Dashboard() {
  const supabase = createClient()
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [events, setEvents] = useState<any[]>([])
  const [currentPlan, setCurrentPlan] = useState<Plan | null>(null)
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [availablePlans, setAvailablePlans] = useState<Plan[]>([])
  const [showPlanSelector, setShowPlanSelector] = useState(false)
  const [eventsCount, setEventsCount] = useState(0)

  useEffect(() => {
    fetchUserData()
  }, [supabase, router])

  const fetchUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/auth/login')
        return
      }

      // Fetch profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      setProfile(profileData)

      // Fetch current subscription with plan details
      const { data: subscriptionData } = await supabase
        .from('subscriptions')
        .select(`
          *,
          plan:plan_id (
            id,
            name,
            price_monthly,
            price_yearly,
            plan_limits (*)
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single()

      if (subscriptionData) {
        setSubscription(subscriptionData)
        setCurrentPlan(subscriptionData.plan)
      }

      // Fetch all available plans for upgrade/downgrade
      const { data: plansData } = await supabase
        .from('plans')
        .select(`
          *,
          plan_limits (*)
        `)
        .eq('is_active', true)
        .order('sort_order')

      setAvailablePlans(plansData || [])

      // Count user's events
      const { count } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)

      setEventsCount(count || 0)

      // Fetch recent events
      const { data: eventsData } = await supabase
        .from('events')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5)

      setEvents(eventsData || [])

    } catch (error) {
      console.error('Error fetching user data:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const handlePlanChange = async (planId: string, interval: 'monthly' | 'yearly') => {
    try {
      setLoading(true)

      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, interval })
      })

      const { url } = await res.json()

      if (url.startsWith('/dashboard')) {
        // Free plan - redirect directly
        router.push(url)
        router.refresh()
      } else {
        // Paid plan - redirect to Stripe
        window.location.href = url
      }
    } catch (error) {
      console.error('Error changing plan:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleManageBilling = async () => {
    try {
      const res = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })
      const { url } = await res.json()
      window.location.href = url
    } catch (error) {
      console.error('Error opening billing portal:', error)
    }
  }

  const handleCancelSubscription = async () => {
    if (!confirm('Are you sure you want to cancel your subscription? You will lose access to premium features at the end of your billing period.')) {
      return
    }

    try {
      setLoading(true)

      const res = await fetch('/api/stripe/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      if (res.ok) {
        await fetchUserData() // Refresh data
      }
    } catch (error) {
      console.error('Error canceling subscription:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const getPlanUsagePercentage = () => {
    if (!currentPlan?.plan_limits?.max_events) return 0
    return (eventsCount / currentPlan.plan_limits.max_events) * 100
  }

  const getPlanBadgeColor = (planName: string) => {
    switch (planName?.toLowerCase()) {
      case 'free': return 'bg-gray-100 text-gray-800'
      case 'starter': return 'bg-blue-100 text-blue-800'
      case 'pro': return 'bg-purple-100 text-purple-800'
      case 'business': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                EventCreator
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              {/* Plan Badge */}
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getPlanBadgeColor(currentPlan!.name)}`}>
                {currentPlan?.name || 'Free'} Plan
              </span>
              <span className="text-sm text-gray-600">
                {profile?.full_name || profile?.email || 'User'}
              </span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Header with Referral Code */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome back, {profile?.full_name?.split(' ')[0] || 'there'}! 👋
            </h1>
            <p className="text-gray-600 mt-2">
              Here's what's happening with your events
            </p>
          </div>
          {profile?.referral_code && (
            <div className="mt-4 md:mt-0 bg-purple-50 border border-purple-200 rounded-lg px-4 py-2">
              <p className="text-sm text-purple-700">
                Your referral code: <span className="font-mono font-bold">{profile.referral_code}</span>
              </p>
            </div>
          )}
        </div>

        {/* Plan Overview Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Current Plan: {currentPlan?.name}</h2>
              <p className="text-gray-600 mt-1">
                {subscription?.billing_interval === 'yearly'
                  ? `€${currentPlan?.price_yearly}/year`
                  : `€${currentPlan?.price_monthly}/month`}
                {subscription?.discount_percent ? ` (${subscription.discount_percent}% off)` : ''}
              </p>
            </div>
            <button
              onClick={() => setShowPlanSelector(!showPlanSelector)}
              className="mt-4 md:mt-0 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
            >
              {showPlanSelector ? 'Hide Plans' : 'Change Plan'}
            </button>

            {subscription?.plan_id !== 'free' && (
              <button
                onClick={handleManageBilling}
                className="mt-2 text-sm text-purple-600 hover:text-purple-800 transition"
              >
                Manage Billing
              </button>
            )}
          </div>

          {/* Plan Usage Bar */}
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>Events Usage</span>
              <span>{eventsCount} / {currentPlan?.plan_limits?.max_events} events</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-purple-600 rounded-full h-2 transition-all duration-300"
                style={{ width: `${Math.min(getPlanUsagePercentage(), 100)}%` }}
              ></div>
            </div>
          </div>

          {/* Plan Features */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{currentPlan?.plan_limits?.max_attendees_per_event}</p>
              <p className="text-xs text-gray-600">Max Attendees/Event</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{currentPlan?.plan_limits?.max_team_members}</p>
              <p className="text-xs text-gray-600">Team Members</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">
                {currentPlan?.plan_limits?.allow_qr_codes ? '✓' : '✗'}
              </p>
              <p className="text-xs text-gray-600">QR Codes</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">
                {currentPlan?.plan_limits?.support_level === 'dedicated' ? '🌟' :
                  currentPlan?.plan_limits?.support_level === 'priority' ? '⭐' : '📧'}
              </p>
              <p className="text-xs text-gray-600">Support Level</p>
            </div>
          </div>

          {/* Subscription Details */}
          {subscription && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Status</p>
                  <p className="font-semibold text-gray-900 capitalize">{subscription.status}</p>
                </div>
                <div>
                  <p className="text-gray-600">Started</p>
                  <p className="font-semibold text-gray-900">
                    {new Date(subscription.start_date).toLocaleDateString()}
                  </p>
                </div>
                {subscription.next_billing_date && (
                  <div>
                    <p className="text-gray-600">Next Billing</p>
                    <p className="font-semibold text-gray-900">
                      {new Date(subscription.next_billing_date).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>

              {subscription.plan_id !== 'free' && (
                <button
                  onClick={handleCancelSubscription}
                  className="mt-4 text-sm text-red-600 hover:text-red-800 transition"
                >
                  Cancel Subscription
                </button>
              )}
            </div>
          )}
        </div>

        {/* Plan Selector (shown when clicking Change Plan) */}
        {showPlanSelector && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Choose a Plan</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {availablePlans.map((plan) => (
                <div
                  key={plan.id}
                  className={`border rounded-lg p-4 ${plan.id === currentPlan?.id
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 hover:border-purple-300'
                    }`}
                >
                  <h4 className="font-bold text-gray-900">{plan.name}</h4>
                  <p className="text-2xl font-bold text-gray-900 mt-2">
                    €{plan.price_monthly}
                    <span className="text-sm font-normal text-gray-600">/mo</span>
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    or €{plan.price_yearly}/year
                  </p>

                  <ul className="mt-4 space-y-2 text-sm">
                    <li className="flex items-center">
                      <span className="text-green-500 mr-2">✓</span>
                      {plan.plan_limits.max_events} events max
                    </li>
                    <li className="flex items-center">
                      <span className="text-green-500 mr-2">✓</span>
                      {plan.plan_limits.max_attendees_per_event} attendees/event
                    </li>
                    {plan.plan_limits.allow_qr_codes && (
                      <li className="flex items-center">
                        <span className="text-green-500 mr-2">✓</span>
                        QR Codes
                      </li>
                    )}
                    {plan.plan_limits.allow_advanced_analytics && (
                      <li className="flex items-center">
                        <span className="text-green-500 mr-2">✓</span>
                        Advanced Analytics
                      </li>
                    )}
                  </ul>

                  {plan.id !== currentPlan?.id && (
                    <div className="mt-4 space-y-2">
                      <button
                        onClick={() => handlePlanChange(plan.id, 'monthly')}
                        className="w-full px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-sm"
                      >
                        Select Monthly
                      </button>
                      <button
                        onClick={() => handlePlanChange(plan.id, 'yearly')}
                        className="w-full px-3 py-2 border border-purple-600 text-purple-600 rounded-lg hover:bg-purple-50 transition text-sm"
                      >
                        Select Yearly (Save 17%)
                      </button>
                    </div>
                  )}

                  {plan.id === currentPlan?.id && (
                    <div className="mt-4 px-3 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm text-center">
                      Current Plan
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upgrade Banner for Free Users */}
        {currentPlan?.id === 'free' && !showPlanSelector && (
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl shadow-xl p-8 mb-8 text-white">
            <div className="flex flex-col md:flex-row items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-2">Upgrade to unlock more features! 🚀</h2>
                <p className="text-white/90 mb-4 md:mb-0">
                  Get more events, advanced analytics, QR codes, and priority support
                </p>
              </div>
              <button
                onClick={() => setShowPlanSelector(true)}
                className="px-8 py-3 bg-white text-purple-600 rounded-full font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
              >
                View Plans
              </button>
            </div>
          </div>
        )}

        {/* Recent Events */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Recent Events</h2>
            <Link
              href="/events/new"
              className={`px-4 py-2 rounded-lg transition text-sm flex items-center ${eventsCount >= (currentPlan?.plan_limits?.max_events || 3)
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-purple-600 text-white hover:bg-purple-700'
                }`}
              onClick={(e) => {
                if (eventsCount >= (currentPlan?.plan_limits?.max_events || 3)) {
                  e.preventDefault()
                  alert(`You've reached the limit of ${currentPlan?.plan_limits?.max_events} events on your current plan. Please upgrade to create more.`)
                }
              }}
            >
              + New Event
              {eventsCount >= (currentPlan?.plan_limits?.max_events || 3) && (
                <span className="ml-2 text-xs">(limit reached)</span>
              )}
            </Link>
          </div>

          {events.length > 0 ? (
            <div className="space-y-4">
              {events.map((event) => (
                <div key={event.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                  <div>
                    <h3 className="font-semibold text-gray-900">{event.title}</h3>
                    <p className="text-sm text-gray-600">
                      {new Date(event.date).toLocaleDateString()} • {event.attendees || 0} attendees
                    </p>
                  </div>
                  <div className="flex items-center space-x-3">
                    {currentPlan?.plan_limits?.allow_qr_codes && (
                      <button className="text-purple-600 hover:text-purple-800">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                        </svg>
                      </button>
                    )}
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold
                      ${event.status === 'active' ? 'bg-green-100 text-green-800' :
                        event.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                          'bg-yellow-100 text-yellow-800'}`}>
                      {event.status || 'Draft'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No events yet</h3>
              <p className="text-gray-600 mb-4">Create your first event to get started</p>
              {eventsCount < (currentPlan?.plan_limits?.max_events || 3) && (
                <Link
                  href="/events/new"
                  className="inline-flex items-center px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                >
                  Create Your First Event
                  <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Referral Section */}
        {profile?.referral_code && (
          <div className="mt-8 bg-gradient-to-r from-green-500 to-teal-500 rounded-xl shadow-sm p-6 text-white">
            <div className="flex flex-col md:flex-row items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold mb-2">Invite Friends, Get Rewards! 🎁</h3>
                <p className="text-white/90 mb-4 md:mb-0">
                  Share your referral code and get 1 month free for each friend who upgrades
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <code className="px-4 py-2 bg-white/20 rounded-lg font-mono text-lg">
                  {profile.referral_code}
                </code>
                <button
                  onClick={() => navigator.clipboard.writeText(profile.referral_code)}
                  className="px-4 py-2 bg-white text-teal-600 rounded-lg hover:bg-gray-100 transition"
                >
                  Copy
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}