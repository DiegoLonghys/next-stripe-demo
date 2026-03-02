interface DashboardHeaderProps {
  fullName?: string
  referralCode?: string
}

export default function DashboardHeader({ fullName, referralCode }: DashboardHeaderProps) {
  return (
    <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {fullName?.split(' ')[0] || 'there'}! 👋
        </h1>
        <p className="text-gray-600 mt-2">
          Here's what's happening with your events
        </p>
      </div>
      {referralCode && (
        <div className="mt-4 md:mt-0 bg-purple-50 border border-purple-200 rounded-lg px-4 py-2">
          <p className="text-sm text-purple-700">
            Your referral code: <span className="font-mono font-bold">{referralCode}</span>
          </p>
        </div>
      )}
    </div>
  )
}