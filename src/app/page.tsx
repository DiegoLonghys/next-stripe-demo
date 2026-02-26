export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed w-full bg-white/80 backdrop-blur-md z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                EventCreator
              </span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-600 hover:text-gray-900 transition">Caratteristiche</a>
              <a href="#how-it-works" className="text-gray-600 hover:text-gray-900 transition">Come Funziona</a>
              <a href="#pricing" className="text-gray-600 hover:text-gray-900 transition">Prezzi</a>
              <a 
                href="/auth/login" 
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition shadow-lg hover:shadow-xl"
              >
                Accedi
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-purple-600 via-purple-500 to-pink-500">
        {/* Animated background elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-white rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-300 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        {/* Hero content */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 md:py-40">
          <div className="text-center">
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-8 leading-tight">
              Crea Eventi
              <span className="block text-yellow-300">Indimenticabili</span>
            </h1>
            <p className="text-xl md:text-2xl text-white/90 mb-12 max-w-3xl mx-auto">
              La piattaforma tutto-in-uno per creare, gestire e promuovere i tuoi eventi. 
              Da piccoli meeting a grandi conferenze.
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <a 
                href="/auth/login"
                className="group px-8 py-4 bg-white text-purple-600 rounded-full font-semibold text-lg shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300 flex items-center gap-2"
              >
                Inizia Gratis
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </a>
              <a 
                href="#demo"
                className="px-8 py-4 border-2 border-white text-white rounded-full font-semibold text-lg hover:bg-white/10 transition backdrop-blur-sm"
              >
                Guarda Demo
              </a>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20 max-w-4xl mx-auto">
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6">
                <div className="text-3xl font-bold text-white">10K+</div>
                <div className="text-white/80">Eventi Creati</div>
              </div>
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6">
                <div className="text-3xl font-bold text-white">50K+</div>
                <div className="text-white/80">Partecipanti</div>
              </div>
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6">
                <div className="text-3xl font-bold text-white">98%</div>
                <div className="text-white/80">Clienti Soddisfatti</div>
              </div>
            </div>
          </div>
        </div>

        {/* Wave divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg className="w-full h-auto" viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="white"/>
          </svg>
        </div>
      </div>

      {/* Features Section */}
      <div id="features" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Tutto ciò che ti serve in un'unica piattaforma
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Strumenti potenti e intuitivi per gestire ogni aspetto del tuo evento
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="group p-8 bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100">
                <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 py-16">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Pronto a creare il tuo prossimo evento?
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Unisciti a migliaia di organizzatori che già utilizzano EventCreator
          </p>
          <a 
            href="/auth/login"
            className="inline-flex items-center px-8 py-4 bg-white text-purple-600 rounded-full font-semibold text-lg shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300"
          >
            Inizia Ora - È Gratis!
            <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </a>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">EventCreator</h3>
              <p className="text-gray-400">Crea eventi indimenticabili con facilità.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Prodotto</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#features" className="hover:text-white transition">Caratteristiche</a></li>
                <li><a href="#pricing" className="hover:text-white transition">Prezzi</a></li>
                <li><a href="#faq" className="hover:text-white transition">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Azienda</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#about" className="hover:text-white transition">Chi siamo</a></li>
                <li><a href="#blog" className="hover:text-white transition">Blog</a></li>
                <li><a href="#contact" className="hover:text-white transition">Contatti</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legale</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#privacy" className="hover:text-white transition">Privacy</a></li>
                <li><a href="#terms" className="hover:text-white transition">Termini</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 EventCreator. Tutti i diritti riservati.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

// Features data
const features = [
  {
    icon: (
      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    title: "Calendario Intelligente",
    description: "Gestisci date, scadenze e promemoria con il nostro calendario integrato e ricevi notifiche automatiche."
  },
  {
    icon: (
      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    title: "Gestione Partecipanti",
    description: "Registrazioni, check-in, e comunicazioni con i partecipanti, tutto centralizzato in un'unica dashboard."
  },
  {
    icon: (
      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    title: "Analisi e Report",
    description: "Monitora le performance dei tuoi eventi con statistiche dettagliate e report personalizzabili."
  }
]