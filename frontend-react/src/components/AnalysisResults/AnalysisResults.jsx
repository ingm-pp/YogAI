import React from 'react'
import './AnalysisResults.css'

export function AnalysisResults({ result, onNewAnalysis }) {
  if (!result) return null

  const formatPoseName = (poseName) => {
    if (!poseName) return 'Posture Inconnue'
    return poseName.replace(/_/g, ' ')
                  .split(' ')
                  .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                  .join(' ')
  }

  const getLevelClass = (level) => {
    const levelMap = {
      'Débutant': 'level-beginner',
      'Intermédiaire débutant': 'level-intermediate',
      'Intermédiaire': 'level-intermediate',
      'Avancé': 'level-advanced',
      'Expert': 'level-expert',
      'Beginner': 'level-beginner',
      'Intermediate': 'level-intermediate',
      'Advanced': 'level-advanced'
    }
    return levelMap[level] || 'level-beginner'
  }

  return (
    <div className="analysis-results">
      <div className="result-header">
        <div className="score-circle" style={{ '--score-percent': `${result.score || result.confidence * 100 || 0}%` }}>
          <div className="score-inner">
            {Math.round(result.score || result.confidence * 100 || 0)}%
          </div>
        </div>
        <h2 className="pose-name">
          {formatPoseName(result.pose_name)}
          <span className={`level-badge ${getLevelClass(result.level)}`}>
            {result.level || 'Débutant'}
          </span>
        </h2>
        <p className="confidence">
          Confiance: {((result.confidence || 0) * 100).toFixed(1)}%
        </p>
      </div>

      {/* Métriques de qualité */}
      {result.quality_metrics && (
        <div className="quality-metrics">
          <h3>📊 Analyse Détaillée</h3>
          <div className="metrics-grid">
            {Object.entries(result.quality_metrics).map(([metric, score]) => (
              <div key={metric} className="metric-item">
                <div className="metric-name">
                  {metric === 'alignment' && 'Alignement'}
                  {metric === 'stability' && 'Stabilité'}
                  {metric === 'symmetry' && 'Symétrie'}
                  {metric === 'range_of_motion' && 'Amplitude'}
                  {metric === 'technique' && 'Technique'}
                </div>
                <div className="metric-score">{Math.round(score)}%</div>
                <div className="metric-bar">
                  <div 
                    className="metric-fill" 
                    style={{ width: `${score}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Points forts et améliorations */}
      <div className="feedback-section">
        <div className="strengths">
          <h4>✅ Points Forts</h4>
          {result.strengths && result.strengths.length > 0 ? (
            result.strengths.map((strength, index) => (
              <div key={index} className="feedback-item strength-item">
                {strength}
              </div>
            ))
          ) : (
            <div className="feedback-item strength-item">
              Continuez à pratiquer pour développer vos points forts
            </div>
          )}
        </div>

        <div className="improvements">
          <h4>📝 Axes d'Amélioration</h4>
          {result.improvements && result.improvements.length > 0 ? (
            result.improvements.map((improvement, index) => (
              <div key={index} className="feedback-item improvement-item">
                {improvement}
              </div>
            ))
          ) : (
            <div className="feedback-item improvement-item">
              Posture globalement bien exécutée
            </div>
          )}
        </div>
      </div>

      {/* Feedback prioritaire */}
      {result.priority_feedback && result.priority_feedback.length > 0 && (
        <div className="priority-feedback">
          <h4>💡 Recommandation Prioritaire</h4>
          <p>{result.priority_feedback[0]}</p>
        </div>
      )}

      {/* Bouton nouvelle analyse */}
      <div className="result-actions">
        <button onClick={onNewAnalysis} className="btn-primary">
          🧘 Nouvelle Analyse
        </button>
      </div>
    </div>
  )
}

export default AnalysisResults