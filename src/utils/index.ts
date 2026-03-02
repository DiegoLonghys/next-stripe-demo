export const getPlanUsagePercentage = (currentPlan: Plan | null, eventsCount: number) => {
  if (!currentPlan?.plan_limits?.max_events) return 0
  return (eventsCount / currentPlan.plan_limits.max_events) * 100
}

export const getPlanBadgeColor = (planName: string) => {
  switch (planName?.toLowerCase()) {
    case 'free': return 'bg-gray-100 text-gray-800'
    case 'starter': return 'bg-blue-100 text-blue-800'
    case 'pro': return 'bg-purple-100 text-purple-800'
    case 'business': return 'bg-yellow-100 text-yellow-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}