'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import DashboardHeader from '@/components/dashboard/DashboardHeader'
import PlanOverviewCard from '@/components/dashboard/PlanOverviewCard'
import PlanSelector from '@/components/dashboard/PlanSelector'
import UpgradeBanner from '@/components/dashboard/UpgradeBanner'
import RecentEvents from '@/components/dashboard/RecentEvents'
import ReferralSection from '@/components/dashboard/ReferralSection'
import LoadingSpinner from '@/components/common/LoadingSpinner'

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

      const updated = subscriptionData?.pop()
      if (updated) {
        setSubscription(updated)
        setCurrentPlan(updated.plan)
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

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <DashboardLayout onLogout={handleLogout} userEmail={profile?.email} userName={profile?.full_name}>
      <DashboardHeader
        fullName={profile?.full_name}
        referralCode={profile?.referral_code}
      />

      <PlanOverviewCard
        currentPlan={currentPlan}
        subscription={subscription}
        eventsCount={eventsCount}
        onShowPlanSelector={() => setShowPlanSelector(!showPlanSelector)}
        onManageBilling={handleManageBilling}
        onCancelSubscription={handleCancelSubscription}
        showPlanSelector={showPlanSelector}
      />

      {showPlanSelector && (
        <PlanSelector
          availablePlans={availablePlans}
          currentPlanId={currentPlan?.id}
          onPlanChange={handlePlanChange}
        />
      )}

      {currentPlan?.id === 'free' && !showPlanSelector && (
        <UpgradeBanner onShowPlans={() => setShowPlanSelector(true)} />
      )}

      <RecentEvents
        events={events}
        currentPlan={currentPlan}
        eventsCount={eventsCount}
      />

      {profile?.referral_code && (
        <ReferralSection referralCode={profile.referral_code} />
      )}
    </DashboardLayout>
  )
}