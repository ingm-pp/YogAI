import React, { useState } from 'react'
import { useAuth } from './hooks/useAuth.jsx' // Import depuis useAuth.jsx
import { PoseAnalyzer } from './components/PoseAnalyzer/PoseAnalyzer'
import { Login } from './components/Auth/Login'
import { Register } from './components/Auth/Register'
import './App.css'

function App() {
  const { user, loading } = useAuth()
  const [authMode, setAuthMode] = useState('login') // 'login' or 'register'

  if (loading) {
    return (
      <div className="app-loading">
        <div className="loading-spinner">🔄</div>
        <p>Chargement...</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="app">
        <header className="app-header">
          <h1>🧘 Yoga Pose Analyzer</h1>
          <p>Rejoignez notre communauté et améliorez votre pratique du yoga</p>
        </header>
        
        <main className="app-main">
          {authMode === 'login' ? (
            <Login onToggleMode={() => setAuthMode('register')} />
          ) : (
            <Register onToggleMode={() => setAuthMode('login')} />
          )}
        </main>
      </div>
    )
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <div>
            <h1>🧘 Yoga Pose Analyzer</h1>
            <p>Upload your yoga pose photo and get instant AI-powered feedback</p>
          </div>
          <div className="user-menu">
            <span>Bienvenue, {user.firstName || user.email}!</span>
            <button 
              onClick={() => {
                localStorage.removeItem('auth_token')
                localStorage.removeItem('user_data')
                window.location.reload()
              }}
              className="btn-secondary"
            >
              Déconnexion
            </button>
          </div>
        </div>
      </header>
      
      <main className="app-main">
        <PoseAnalyzer />
      </main>
    </div>
  )
}

export default App




// import React from 'react' 
// import { PoseAnalyzer } from './components/PoseAnalyzer/PoseAnalyzer'
// import './App.css'

// function App() {
//   return (
//     <div className="app">
//       <header className="app-header">
//         <h1>🧘 Yoga Pose Analyzer</h1>
//         <p>Upload your yoga pose photo and get instant AI-powered feedback</p>
//       </header>
      
//       <main className="app-main">
//         <PoseAnalyzer />
//       </main>
//     </div>
//   )
// }

// export default App