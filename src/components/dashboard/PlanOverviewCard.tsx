import { getPlanBadgeColor, getPlanUsagePercentage } from '@/utils'

interface PlanOverviewCardProps {
  currentPlan: any
  subscription: any
  eventsCount: number
  onShowPlanSelector: () => void
  onManageBilling: () => void
  onCancelSubscription: () => void
  showPlanSelector: boolean
}

export default function PlanOverviewCard({
  currentPlan,
  subscription,
  eventsCount,
  onShowPlanSelector,
  onManageBilling,
  onCancelSubscription,
  showPlanSelector
}: PlanOverviewCardProps) {
  if (!currentPlan) return null

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <div className="flex items-center space-x-3">
            <h2 className="text-xl font-semibold text-gray-900">Current Plan: {currentPlan.name}</h2>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getPlanBadgeColor(currentPlan.name)}`}>
              {currentPlan.name} Plan
            </span>
          </div>
          <p className="text-gray-600 mt-1">
            {subscription?.billing_interval === 'year'
              ? `€${currentPlan.price_yearly}/year`
              : `€${currentPlan.price_monthly}/month`}
            {subscription?.discount_percent ? ` (${subscription.discount_percent}% off)` : ''}
          </p>
        </div>
        <div className="flex items-center space-x-4">
          {subscription?.plan_id === 'free' && (
            <button
              onClick={onShowPlanSelector}
              className="mt-4 md:mt-0 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
            >
              {showPlanSelector ? 'Hide Plans' : 'Change Plan'}
            </button>
          )}

          {subscription?.plan_id !== 'free' && (
            <button
              onClick={onManageBilling}
              className="mt-2 text-sm text-purple-600 hover:text-purple-800 transition"
            >
              Change Plan
            </button>
          )}
        </div>
      </div>

      {/* Plan Usage Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>Events Usage</span>
          <span>{eventsCount} / {currentPlan.plan_limits?.max_events} events</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-purple-600 rounded-full h-2 transition-all duration-300"
            style={{ width: `${Math.min(getPlanUsagePercentage(currentPlan, eventsCount), 100)}%` }}
          ></div>
        </div>
      </div>

      {/* Plan Features */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900">{currentPlan.plan_limits?.max_attendees_per_event}</p>
          <p className="text-xs text-gray-600">Max Attendees/Event</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900">{currentPlan.plan_limits?.max_team_members}</p>
          <p className="text-xs text-gray-600">Team Members</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900">
            {currentPlan.plan_limits?.allow_qr_codes ? '✓' : '✗'}
          </p>
          <p className="text-xs text-gray-600">QR Codes</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900">
            {currentPlan.plan_limits?.support_level === 'dedicated' ? '🌟' :
              currentPlan.plan_limits?.support_level === 'priority' ? '⭐' : '📧'}
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
              onClick={onCancelSubscription}
              className="mt-4 text-sm text-red-600 hover:text-red-800 transition"
            >
              Cancel Subscription
            </button>
          )}
        </div>
      )}
    </div>
  )
}