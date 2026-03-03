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
  billing_interval: 'month' | 'year'
  start_date: string
  end_date: string | null
  trial_end: string | null
  auto_renew: boolean
  next_billing_date: string | null
  discount_code: string | null
  discount_percent: number
}