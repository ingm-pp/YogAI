import React, { useState } from 'react'
import { useAuth } from './hooks/useAuth.jsx' // Import depuis useAuth.jsx
import { PoseAnalyzer } from './components/PoseAnalyzer/PoseAnalyzer'
import { Dashboard } from './components/Dashboard/Dashboard' // ← Nouveau import
import { Login } from './components/Auth/Login'
import { Register } from './components/Auth/Register'
import './App.css'

function App() {
  const { user, loading } = useAuth()
  const [authMode, setAuthMode] = useState('login')
  const [currentView, setCurrentView] = useState('analyzer') // 'analyzer' ou 'dashboard'

  if (loading) {
    return <div className="app-loading">🔄 Chargement...</div>
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
            <p>Améliorez votre pratique du yoga avec l'IA</p>
          </div>
          <div className="user-menu">
            <span>Bienvenue, {user.first_name}!</span>
            <div className="view-switcher">
              <button 
                onClick={() => setCurrentView('analyzer')}
                className={currentView === 'analyzer' ? 'btn-primary' : 'btn-secondary'}
              >
                🎯 Analyser
              </button>
              <button 
                onClick={() => setCurrentView('dashboard')}
                className={currentView === 'dashboard' ? 'btn-primary' : 'btn-secondary'}
              >
                📊 Dashboard
              </button>
            </div>
            <button onClick={() => {
              localStorage.removeItem('auth_token')
              localStorage.removeItem('user_data')
              window.location.reload()
            }} className="btn-secondary">
              Déconnexion
            </button>
          </div>
        </div>
      </header>
      
      <main className="app-main">
        {currentView === 'analyzer' ? (
          <PoseAnalyzer />
        ) : (
          <Dashboard />
        )}
      </main>
    </div>
  )
}

export default App