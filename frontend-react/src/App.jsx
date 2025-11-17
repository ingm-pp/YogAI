import React, { useState } from 'react'
import { useAuth } from './hooks/useAuth.jsx'
import { PoseAnalyzer } from './components/PoseAnalyzer/PoseAnalyzer'
import { Dashboard } from './components/Dashboard/Dashboard'
import { Login } from './components/Auth/Login'
import { Register } from './components/Auth/Register'
import './App.css'

function App() {
  const { user, loading } = useAuth()
  const [authMode, setAuthMode] = useState('login')
  const [currentView, setCurrentView] = useState('analyzer')

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
        <div className="header-top">
          <div className="app-title">
            <h1>🧘 Yoga Pose Analyzer</h1>
            <p>Améliorez votre pratique du yoga avec l'IA</p>
          </div>
          <div className="user-info">
            <div className="user-welcome">
              <span>Bienvenue, {user.first_name}!</span>
              {user.profile.level && (
                <div className="user-level">
                  Niveau: <span className="level-badge">
                  {user.profile.level === 'beginner' ? 'Débutant' : 
                   user.profile.level === 'intermediate' ? 'Intermédiaire' :
                   user.profile.level === 'advanced' ? 'Avancé' : user.profile.level}
                   </span>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="header-controls">
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
          <button 
            onClick={() => {
              localStorage.removeItem('auth_token')
              localStorage.removeItem('user_data')
              window.location.reload()
            }} 
            className="btn-secondary logout-btn"
          >
            Déconnexion
          </button>
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