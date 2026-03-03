interface PlanSelectorProps {
  availablePlans: any[]
  currentPlanId?: string
  onPlanChange: (planId: string, interval: 'month' | 'year') => void
}

export default function PlanSelector({ availablePlans, currentPlanId, onPlanChange }: PlanSelectorProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Choose a Plan</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {availablePlans.map((plan) => (
          <div
            key={plan.id}
            className={`border rounded-lg p-4 ${
              plan.id === currentPlanId
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

            {plan.id !== currentPlanId ? (
              <div className="mt-4 space-y-2">
                <button
                  onClick={() => onPlanChange(plan.id, 'month')}
                  className="w-full px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-sm"
                >
                  Select Monthly
                </button>
                <button
                  onClick={() => onPlanChange(plan.id, 'year')}
                  className="w-full px-3 py-2 border border-purple-600 text-purple-600 rounded-lg hover:bg-purple-50 transition text-sm"
                >
                  Select Yearly (Save 17%)
                </button>
              </div>
            ) : (
              <div className="mt-4 px-3 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm text-center">
                Current Plan
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}