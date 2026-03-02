interface ReferralSectionProps {
  referralCode: string
}

export default function ReferralSection({ referralCode }: ReferralSectionProps) {
  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralCode)
  }

  return (
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
            {referralCode}
          </code>
          <button
            onClick={copyToClipboard}
            className="px-4 py-2 bg-white text-teal-600 rounded-lg hover:bg-gray-100 transition"
          >
            Copy
          </button>
        </div>
      </div>
    </div>
  )
}