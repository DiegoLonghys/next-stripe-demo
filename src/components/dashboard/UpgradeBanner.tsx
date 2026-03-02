interface UpgradeBannerProps {
  onShowPlans: () => void
}

export default function UpgradeBanner({ onShowPlans }: UpgradeBannerProps) {
  return (
    <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl shadow-xl p-8 mb-8 text-white">
      <div className="flex flex-col md:flex-row items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-2">Upgrade to unlock more features! 🚀</h2>
          <p className="text-white/90 mb-4 md:mb-0">
            Get more events, advanced analytics, QR codes, and priority support
          </p>
        </div>
        <button
          onClick={onShowPlans}
          className="px-8 py-3 bg-white text-purple-600 rounded-full font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
        >
          View Plans
        </button>
      </div>
    </div>
  )
}