import React, { useState, useEffect } from 'react'
import { userAPI } from '../../services/api'
import './Dashboard.css'

export function Dashboard() {
  const [history, setHistory] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchUserData()
  }, [])

  const fetchUserData = async () => {
    try {
      setLoading(true)
      const [historyResponse, statsResponse] = await Promise.all([
        userAPI.getHistory(),
        userAPI.getDetailedStats()
      ])
      
      setHistory(historyResponse.data)
      setStats(statsResponse.data)
    } catch (err) {
      setError('Erreur lors du chargement des données')
      console.error('Erreur dashboard:', err)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getPoseIcon = (poseName) => {
    const icons = {
      'downdog': '🐕',
      'warrior2': '⚔️', 
      'tree': '🌳',
      'goddess': '👸',
      'plank': '💪'
    }
    return icons[poseName] || '🧘'
  }

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner">🔄</div>
        <p>Chargement de votre historique...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="dashboard-error">
        <p>❌ {error}</p>
        <button onClick={fetchUserData} className="btn-secondary">
          Réessayer
        </button>
      </div>
    )
  }

  return (
    <div className="dashboard">
      {/* En-tête avec statistiques */}
      {stats && (
        <div className="stats-header">
          <div className="stat-card">
            <h3>📊 Sessions Total</h3>
            <p className="stat-number">{stats.total_sessions || 0}</p>
          </div>
          <div className="stat-card">
            <h3>⭐ Score Moyen</h3>
            <p className="stat-number">{stats.average_score || 0}%</p>
          </div>
          <div className="stat-card">
            <h3>🔥 Série Actuelle</h3>
            <p className="stat-number">{stats.current_streak || 0} jours</p>
          </div>
          {stats.favorite_pose && (
            <div className="stat-card">
              <h3>❤️ Posture Favorite</h3>
              <p className="stat-number">{stats.favorite_pose}</p>
            </div>
          )}
        </div>
      )}

      {/* Historique des sessions */}
      <div className="history-section">
        <h2>📝 Historique des Sessions</h2>
        
        {history.length === 0 ? (
          <div className="empty-history">
            <div className="empty-icon">📋</div>
            <h3>Aucune session enregistrée</h3>
            <p>Effectuez votre première analyse de posture pour commencer votre historique !</p>
          </div>
        ) : (
          <div className="sessions-list">
            {history.map((session, index) => (
              <div key={index} className="session-card">
                <div className="session-header">
                  <div className="session-pose">
                    <span className="pose-icon">
                      {getPoseIcon(session.pose_name)}
                    </span>
                    <div>
                      <h4 className="pose-name">
                        {session.pose_name ? session.pose_name.replace(/_/g, ' ').toUpperCase() : 'Posture Inconnue'}
                      </h4>
                      <span className="session-date">
                        {formatDate(session.date)}
                      </span>
                    </div>
                  </div>
                  <div className="session-score">
                    <div className="score-circle">
                      {Math.round(session.score || 0)}%
                    </div>
                  </div>
                </div>

                <div className="session-details">
                  <div className="session-level">
                    <span className={`level-badge ${session.level?.toLowerCase() || 'beginner'}`}>
                      {session.level || 'Débutant'}
                    </span>
                  </div>
                  
                  {session.feedback && session.feedback.length > 0 && (
                    <div className="session-feedback">
                      <strong>Feedback :</strong> {session.feedback[0]}
                    </div>
                  )}

                  {session.quality_metrics && (
                    <div className="quality-metrics">
                      {Object.entries(session.quality_metrics).slice(0, 3).map(([metric, score]) => (
                        <div key={metric} className="metric-tag">
                          {metric === 'alignment' && '📍 Alignement'}
                          {metric === 'stability' && '⚖️ Stabilité'} 
                          {metric === 'symmetry' && '🔄 Symétrie'}
                          {metric === 'range_of_motion' && '📏 Amplitude'}
                          {metric === 'technique' && '🎯 Technique'}
                          : {Math.round(score)}%
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {session.image_url && (
                  <div className="session-image">
                    <img 
                      src={`http://localhost:5000${session.image_url}`} 
                      alt={`Posture ${session.pose_name}`}
                      className="pose-thumbnail"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}