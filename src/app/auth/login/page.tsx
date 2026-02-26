'use client'

import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import Link from 'next/link'

export default function LoginPage() {
  const supabase = createClient()
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [isSignUp, setIsSignUp] = useState(false)

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          }
        })

        if (error) throw error

        if (data.user) {
          setMessage('Check your email for confirmation link!')
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (error) throw error

        if (data.user) {
          router.push('/dashboard')
          router.refresh()
        }
      }
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  // const handleFastLogin = async () => {
  //   setLoading(true)
  //   setError(null)

  //   try {
  //     const fakeEmail = `test-${Math.floor(Math.random() * 1000)}@event.com`
  //     const fakePassword = 'password123'

  //     // First try to sign in
  //     let { data, error } = await supabase.auth.signInWithPassword({
  //       email: fakeEmail,
  //       password: fakePassword,
  //     })

  //     // If sign in fails, try to sign up
  //     if (error) {
  //       const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
  //         email: fakeEmail,
  //         password: fakePassword,
  //       })

  //       if (signUpError) throw signUpError

  //       // Auto sign in after signup
  //       const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
  //         email: fakeEmail,
  //         password: fakePassword,
  //       })

  //       if (signInError) throw signInError
  //       data = signInData
  //     }

  //     if (data?.user) {
  //       router.push('/dashboard')
  //       router.refresh()
  //     }
  //   } catch (error: any) {
  //     setError(error.message)
  //   } finally {
  //     setLoading(false)
  //   }
  // }



  const handleFastLogin = async () => {
    setLoading(true)
    setError(null)

    try {
      const fakeEmail = `test-${Math.floor(Math.random() * 1000)}@event.com`
      const fakePassword = 'password123'

      // First try to sign in
      let { data, error } = await supabase.auth.signInWithPassword({
        email: fakeEmail,
        password: fakePassword,
      })

      let isNewUser = false

      // If sign in fails, try to sign up
      if (error) {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: fakeEmail,
          password: fakePassword,
        })

        if (signUpError) throw signUpError
        isNewUser = true

        // Auto sign in after signup
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: fakeEmail,
          password: fakePassword,
        })

        if (signInError) throw signInError
        data = signInData
      }

      if (data?.user) {
        // If this is a new user, create their profile with FREE plan
        if (isNewUser) {
          await createNewUserProfile(data.user.id, fakeEmail)
        }

        router.push('/dashboard')
        router.refresh()
      }
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  // Generate random Italian names
  const generateRandomName = (): string => {
    const firstNames = ['Mario', 'Luigi', 'Giovanni', 'Paolo', 'Sofia', 'Giulia', 'Alessia', 'Martina']
    const lastNames = ['Rossi', 'Bianchi', 'Russo', 'Ferrari', 'Esposito', 'Romano', 'Gallo', 'Conti']

    return `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`
  }

  // Generate unique referral code
  const generateReferralCode = (fullName: string): string => {
    const initials = fullName
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
    const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
    return `${initials}${randomNum}`
  }

  // Create new user profile (always starts with FREE plan)
  const createNewUserProfile = async (userId: string, email: string) => {
    try {
      const fullName = generateRandomName()
      const referralCode = generateReferralCode(fullName)

      // 30% chance of having a referrer (for testing referral system)
      let referredBy = null
      if (Math.random() < 0.3) {
        // Get a random existing user's referral code
        const { data: randomUser } = await supabase
          .from('profiles')
          .select('referral_code')
          .limit(1)
          .maybeSingle()

        if (randomUser) {
          referredBy = randomUser.referral_code
        }
      }

      // Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([
          {
            id: userId,
            email: email,
            full_name: fullName,
            avatar_url: `https://i.pravatar.cc/150?u=${userId}`,
            phone: `+39 ${Math.floor(Math.random() * 1000000000)}`.slice(0, 13),
            company: ['Tech Corp', 'Design Studio', 'Event Masters', null][Math.floor(Math.random() * 4)],
            position: ['Event Manager', 'Marketing Director', 'Founder', null][Math.floor(Math.random() * 4)],
            preferred_language: 'it',
            timezone: 'Europe/Rome',
            marketing_consent: Math.random() < 0.5,
            referral_code: referralCode,
            referred_by: referredBy,
            metadata: {
              signup_source: 'fast_login',
              signup_ip: '192.168.' + Math.floor(Math.random() * 255) + '.' + Math.floor(Math.random() * 255),
              user_agent: 'Mozilla/5.0 (Test Mode)'
            }
          }
        ])

      if (profileError) throw profileError

      // Create free subscription
      const now = new Date()
      const { error: subscriptionError } = await supabase
        .from('subscriptions')
        .insert([
          {
            user_id: userId,
            plan_id: 'free',
            status: 'active',
            billing_interval: 'monthly',
            start_date: now.toISOString(),
            auto_renew: true,
            created_at: now.toISOString(),
            updated_at: now.toISOString()
          }
        ])

      if (subscriptionError) throw subscriptionError

      // If user was referred, create referral record
      if (referredBy) {
        const { data: referrer } = await supabase
          .from('profiles')
          .select('id')
          .eq('referral_code', referredBy)
          .single()

        if (referrer) {
          await supabase
            .from('referrals')
            .insert([
              {
                referrer_id: referrer.id,
                referred_id: userId,
                referred_email: email,
                status: 'pending',
                created_at: now.toISOString()
              }
            ])
        }
      }

      // Create sample events (up to free plan limit)
      await createSampleEvents(userId, 2) // Create 2 sample events for new users

      console.log('Profile created successfully for:', fullName, 'with referral code:', referralCode)

    } catch (error) {
      console.error('Error in createNewUserProfile:', error)
      throw error
    }
  }

  // Create sample events
  const createSampleEvents = async (userId: string, count: number) => {
    const eventTemplates = [
      {
        title: 'Team Building Workshop',
        description: 'Fun activities for team bonding',
        attendees: 25,
        status: 'active',
        category: 'Workshop',
        location: 'Milan'
      },
      {
        title: 'Product Demo Day',
        description: 'Showcase our latest features',
        attendees: 45,
        status: 'draft',
        category: 'Product',
        location: 'Online'
      },
      {
        title: 'Networking Aperitivo',
        description: 'Connect with industry professionals',
        attendees: 30,
        status: 'active',
        category: 'Networking',
        location: 'Rome'
      }
    ]

    const events = []
    for (let i = 0; i < count; i++) {
      const template = eventTemplates[i % eventTemplates.length]
      const eventDate = new Date()
      eventDate.setDate(eventDate.getDate() + Math.floor(Math.random() * 20) + 5)

      events.push({
        user_id: userId,
        title: template.title,
        description: template.description,
        date: eventDate.toISOString(),
        location: template.location,
        attendees: Math.floor(Math.random() * template.attendees),
        max_attendees: 50, // Free plan limit
        status: template.status,
        category: template.category,
        price: 0, // Free events for sample
        currency: 'EUR',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
    }

    const { error } = await supabase
      .from('events')
      .insert(events)

    if (error) {
      console.error('Error creating sample events:', error)
    }
  }

  // Helper function to get user's current plan with limits
  const getUserPlanWithLimits = async (userId: string) => {
    const { data, error } = await supabase
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
      .eq('user_id', userId)
      .eq('status', 'active')
      .single()

    if (error) {
      console.error('Error fetching user plan:', error)
      return null
    }

    return data
  }

  // Helper function to check if user can create more events
  const canCreateEvent = async (userId: string): Promise<boolean> => {
    const plan = await getUserPlanWithLimits(userId)
    if (!plan) return false

    const { count, error } = await supabase
      .from('events')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    if (error) return false

    return (count || 0) < plan.plan.plan_limits.max_events
  }

  const handlePasswordReset = async () => {
    if (!email) {
      setError('Please enter your email address')
      return
    }

    setLoading(true)
    setError(null)
    setMessage(null)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })

      if (error) throw error

      setMessage('Check your email for password reset instructions')
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-purple-500 to-pink-500 flex items-center justify-center p-4">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-300/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Login Card */}
      <div className="relative bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl w-full max-w-md p-8 border border-white/20">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <span className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              EventCreator
            </span>
          </Link>
          <h2 className="text-2xl font-bold text-gray-900 mt-6">
            {isSignUp ? 'Create an account' : 'Welcome back'}
          </h2>
          <p className="text-gray-600 mt-2">
            {isSignUp
              ? 'Start creating amazing events today'
              : 'Sign in to manage your events'}
          </p>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {message && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-600 text-sm">{message}</p>
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleAuth} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent transition"
              placeholder="you@example.com"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent transition"
              placeholder="••••••••"
              required
              minLength={6}
              disabled={loading}
            />
          </div>

          {/* Forgot password link */}
          {!isSignUp && (
            <div className="text-right">
              <button
                type="button"
                onClick={handlePasswordReset}
                className="text-sm text-purple-600 hover:text-purple-800 transition"
                disabled={loading}
              >
                Forgot password?
              </button>
            </div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Processing...' : (isSignUp ? 'Sign Up' : 'Sign In')}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Or continue with</span>
          </div>
        </div>

        {/* Fast login button (development only) */}
        {process.env.NODE_ENV === 'development' && (
          <button
            onClick={handleFastLogin}
            disabled={loading}
            className="w-full py-3 px-4 border-2 border-purple-600 text-purple-600 font-semibold rounded-lg hover:bg-purple-50 transition mb-4 disabled:opacity-50"
          >
            🚀 Fast Test Login (Dev Mode)
          </button>
        )}

        {/* Toggle between login/signup */}
        <div className="text-center mt-6">
          <p className="text-gray-600">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              onClick={() => {
                setIsSignUp(!isSignUp)
                setError(null)
                setMessage(null)
              }}
              className="text-purple-600 hover:text-purple-800 font-semibold transition"
            >
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </button>
          </p>
        </div>

        {/* Test credentials hint */}
        {!isSignUp && process.env.NODE_ENV === 'development' && (
          <p className="text-xs text-gray-400 text-center mt-4">
            Test: any email with password (min 6 chars)
          </p>
        )}
      </div>
    </div>
  )
}