import Link from 'next/link'

interface RecentEventsProps {
  events: any[]
  currentPlan: any
  eventsCount: number
}

export default function RecentEvents({ events, currentPlan, eventsCount }: RecentEventsProps) {
  const hasReachedLimit = eventsCount >= (currentPlan?.plan_limits?.max_events || 3)

  const handleNewEventClick = (e: React.MouseEvent) => {
    if (hasReachedLimit) {
      e.preventDefault()
      alert(`You've reached the limit of ${currentPlan?.plan_limits?.max_events} events on your current plan. Please upgrade to create more.`)
    }
  }

  const getStatusBadgeColor = (status: string) => {
    switch(status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'draft':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-yellow-100 text-yellow-800'
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Recent Events</h2>
        <Link
          href="/events/new"
          className={`px-4 py-2 rounded-lg transition text-sm flex items-center ${
            hasReachedLimit
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-purple-600 text-white hover:bg-purple-700'
          }`}
          onClick={handleNewEventClick}
        >
          + New Event
          {hasReachedLimit && (
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
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeColor(event.status)}`}>
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
          {!hasReachedLimit && (
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
  )
}